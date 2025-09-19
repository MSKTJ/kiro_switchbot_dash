/**
 * Alert models and validation for SwitchBot Dashboard
 */

import { EnvironmentData } from './environment';

/**
 * Alert severity levels
 */
export type AlertSeverity = 'warning' | 'critical';

/**
 * Alert types
 */
export type AlertType = 'temperature' | 'humidity';

/**
 * Alert interface
 */
export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  timestamp: Date;
  isActive: boolean;
  value: number;
  threshold: number;
  condition: 'above' | 'below';
}

/**
 * Alert threshold settings
 */
export interface AlertThresholds {
  temperature: {
    min: number;
    max: number;
  };
  humidity: {
    min: number;
    max: number;
  };
}

/**
 * Default alert thresholds
 */
export const DEFAULT_ALERT_THRESHOLDS: AlertThresholds = {
  temperature: {
    min: 18,  // 18°C
    max: 28   // 28°C
  },
  humidity: {
    min: 30,  // 30%
    max: 70   // 70%
  }
};

/**
 * Alert threshold validation
 */
export class AlertThresholdValidator {
  private static readonly TEMPERATURE_MIN = -40;
  private static readonly TEMPERATURE_MAX = 80;
  private static readonly HUMIDITY_MIN = 0;
  private static readonly HUMIDITY_MAX = 100;

  /**
   * Validate alert thresholds
   */
  static validate(thresholds: AlertThresholds): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate temperature thresholds
    if (thresholds.temperature.min < this.TEMPERATURE_MIN || 
        thresholds.temperature.min > this.TEMPERATURE_MAX) {
      errors.push(`Temperature minimum must be between ${this.TEMPERATURE_MIN}°C and ${this.TEMPERATURE_MAX}°C`);
    }

    if (thresholds.temperature.max < this.TEMPERATURE_MIN || 
        thresholds.temperature.max > this.TEMPERATURE_MAX) {
      errors.push(`Temperature maximum must be between ${this.TEMPERATURE_MIN}°C and ${this.TEMPERATURE_MAX}°C`);
    }

    if (thresholds.temperature.min >= thresholds.temperature.max) {
      errors.push('Temperature minimum must be less than maximum');
    }

    // Validate humidity thresholds
    if (thresholds.humidity.min < this.HUMIDITY_MIN || 
        thresholds.humidity.min > this.HUMIDITY_MAX) {
      errors.push(`Humidity minimum must be between ${this.HUMIDITY_MIN}% and ${this.HUMIDITY_MAX}%`);
    }

    if (thresholds.humidity.max < this.HUMIDITY_MIN || 
        thresholds.humidity.max > this.HUMIDITY_MAX) {
      errors.push(`Humidity maximum must be between ${this.HUMIDITY_MIN}% and ${this.HUMIDITY_MAX}%`);
    }

    if (thresholds.humidity.min >= thresholds.humidity.max) {
      errors.push('Humidity minimum must be less than maximum');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Alert generator utility
 */
export class AlertGenerator {
  /**
   * Generate alerts based on environment data and thresholds
   */
  static generateAlerts(
    environmentData: EnvironmentData,
    thresholds: AlertThresholds
  ): Alert[] {
    const alerts: Alert[] = [];

    // Check temperature alerts
    if (environmentData.temperature < thresholds.temperature.min) {
      alerts.push({
        id: `temp-low-${Date.now()}`,
        type: 'temperature',
        severity: environmentData.temperature < thresholds.temperature.min - 5 ? 'critical' : 'warning',
        message: `温度が低すぎます: ${environmentData.temperature.toFixed(1)}°C (最低: ${thresholds.temperature.min}°C)`,
        timestamp: environmentData.timestamp,
        isActive: true,
        value: environmentData.temperature,
        threshold: thresholds.temperature.min,
        condition: 'below'
      });
    } else if (environmentData.temperature > thresholds.temperature.max) {
      alerts.push({
        id: `temp-high-${Date.now()}`,
        type: 'temperature',
        severity: environmentData.temperature > thresholds.temperature.max + 5 ? 'critical' : 'warning',
        message: `温度が高すぎます: ${environmentData.temperature.toFixed(1)}°C (最高: ${thresholds.temperature.max}°C)`,
        timestamp: environmentData.timestamp,
        isActive: true,
        value: environmentData.temperature,
        threshold: thresholds.temperature.max,
        condition: 'above'
      });
    }

    // Check humidity alerts
    if (environmentData.humidity < thresholds.humidity.min) {
      alerts.push({
        id: `humidity-low-${Date.now()}`,
        type: 'humidity',
        severity: environmentData.humidity < thresholds.humidity.min - 10 ? 'critical' : 'warning',
        message: `湿度が低すぎます: ${environmentData.humidity.toFixed(1)}% (最低: ${thresholds.humidity.min}%)`,
        timestamp: environmentData.timestamp,
        isActive: true,
        value: environmentData.humidity,
        threshold: thresholds.humidity.min,
        condition: 'below'
      });
    } else if (environmentData.humidity > thresholds.humidity.max) {
      alerts.push({
        id: `humidity-high-${Date.now()}`,
        type: 'humidity',
        severity: environmentData.humidity > thresholds.humidity.max + 10 ? 'critical' : 'warning',
        message: `湿度が高すぎます: ${environmentData.humidity.toFixed(1)}% (最高: ${thresholds.humidity.max}%)`,
        timestamp: environmentData.timestamp,
        isActive: true,
        value: environmentData.humidity,
        threshold: thresholds.humidity.max,
        condition: 'above'
      });
    }

    return alerts;
  }
}