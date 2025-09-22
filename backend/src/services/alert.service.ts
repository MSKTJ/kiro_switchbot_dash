/**
 * Alert service for SwitchBot Dashboard
 */

import { Alert, AlertThresholds, AlertGenerator, AlertThresholdValidator, DEFAULT_ALERT_THRESHOLDS } from '../models/alert';
import { EnvironmentData } from '../models/environment';
import { settingsService } from './settings.service';

/**
 * Alert service error class
 */
export class AlertServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'AlertServiceError';
  }
}

/**
 * Alert service class
 */
export class AlertService {
  private thresholds: AlertThresholds = DEFAULT_ALERT_THRESHOLDS;
  private activeAlerts: Map<string, Alert> = new Map();
  private alertHistory: Alert[] = [];
  private readonly MAX_HISTORY_SIZE = 100;

  /**
   * Get current alert thresholds from settings
   */
  private getCurrentThresholdsFromSettings(): AlertThresholds {
    const settings = settingsService.getSettings();
    return {
      temperature: {
        min: settings.alertThresholds.temperature.min,
        max: settings.alertThresholds.temperature.max
      },
      humidity: {
        min: settings.alertThresholds.humidity.min,
        max: settings.alertThresholds.humidity.max
      }
    };
  }

  /**
   * Get current alert thresholds
   */
  getThresholds(): AlertThresholds {
    return this.getCurrentThresholdsFromSettings();
  }

  /**
   * Update alert thresholds
   */
  updateThresholds(newThresholds: AlertThresholds): void {
    const validation = AlertThresholdValidator.validate(newThresholds);
    
    if (!validation.isValid) {
      throw new AlertServiceError(
        `Invalid thresholds: ${validation.errors.join(', ')}`,
        'VALIDATION_ERROR'
      );
    }

    this.thresholds = { ...newThresholds };
  }

  /**
   * Check environment data against thresholds and generate alerts
   */
  checkEnvironmentData(environmentData: EnvironmentData): Alert[] {
    try {
      // Get current thresholds from settings
      const currentThresholds = this.getCurrentThresholdsFromSettings();
      
      // Generate new alerts based on current data
      const newAlerts = AlertGenerator.generateAlerts(environmentData, currentThresholds);
      
      // Update active alerts
      this.updateActiveAlerts(newAlerts, environmentData);
      
      return Array.from(this.activeAlerts.values());
    } catch (error) {
      throw new AlertServiceError(
        'Failed to check environment data for alerts',
        'CHECK_ERROR',
        error
      );
    }
  }

  /**
   * Get all active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values()).filter(alert => alert.isActive);
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit?: number): Alert[] {
    const history = [...this.alertHistory].reverse(); // Most recent first
    return limit ? history.slice(0, limit) : history;
  }

  /**
   * Dismiss an active alert
   */
  dismissAlert(alertId: string): boolean {
    // Try to find alert by ID first
    for (const [key, alert] of this.activeAlerts.entries()) {
      if (alert.id === alertId) {
        alert.isActive = false;
        this.addToHistory(alert);
        this.activeAlerts.delete(key);
        return true;
      }
    }
    
    // Fallback: try to find by key (for backward compatibility)
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.isActive = false;
      this.addToHistory(alert);
      this.activeAlerts.delete(alertId);
      return true;
    }
    
    return false;
  }

  /**
   * Clear all active alerts
   */
  clearAllAlerts(): void {
    for (const alert of this.activeAlerts.values()) {
      alert.isActive = false;
      this.addToHistory(alert);
    }
    this.activeAlerts.clear();
  }

  /**
   * Get alert statistics
   */
  getAlertStatistics(): {
    activeCount: number;
    totalToday: number;
    temperatureAlerts: number;
    humidityAlerts: number;
  } {
    const activeCount = this.activeAlerts.size;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayAlerts = this.alertHistory.filter(alert => 
      alert.timestamp >= today
    );

    return {
      activeCount,
      totalToday: todayAlerts.length,
      temperatureAlerts: todayAlerts.filter(alert => alert.type === 'temperature').length,
      humidityAlerts: todayAlerts.filter(alert => alert.type === 'humidity').length
    };
  }

  /**
   * Update active alerts based on new alerts and current environment data
   */
  private updateActiveAlerts(newAlerts: Alert[], environmentData: EnvironmentData): void {
    // Create a set of current alert types for quick lookup
    const currentAlertTypes = new Set(newAlerts.map(alert => `${alert.type}-${alert.condition}`));
    
    // Deactivate alerts that are no longer triggered
    for (const [alertKey, existingAlert] of this.activeAlerts.entries()) {
      const alertTypeKey = `${existingAlert.type}-${existingAlert.condition}`;
      
      if (!currentAlertTypes.has(alertTypeKey)) {
        // Alert condition is no longer met, deactivate it
        existingAlert.isActive = false;
        this.addToHistory(existingAlert);
        this.activeAlerts.delete(alertKey);
      }
    }
    
    // Add new alerts
    for (const newAlert of newAlerts) {
      const alertKey = `${newAlert.type}-${newAlert.condition}`;
      
      // Only add if we don't already have an active alert of this type
      if (!this.activeAlerts.has(alertKey)) {
        this.activeAlerts.set(alertKey, newAlert);
        this.addToHistory(newAlert);
      } else {
        // Update existing alert with new values
        const existingAlert = this.activeAlerts.get(alertKey)!;
        existingAlert.value = newAlert.value;
        existingAlert.timestamp = newAlert.timestamp;
        existingAlert.message = newAlert.message;
        existingAlert.severity = newAlert.severity;
      }
    }
  }

  /**
   * Add alert to history
   */
  private addToHistory(alert: Alert): void {
    this.alertHistory.push({ ...alert });
    
    // Maintain history size limit
    if (this.alertHistory.length > this.MAX_HISTORY_SIZE) {
      this.alertHistory = this.alertHistory.slice(-this.MAX_HISTORY_SIZE);
    }
  }

  /**
   * Reset service state (useful for testing)
   */
  reset(): void {
    this.thresholds = DEFAULT_ALERT_THRESHOLDS;
    this.activeAlerts.clear();
    this.alertHistory = [];
  }
}

// Export singleton instance
export const alertService = new AlertService();