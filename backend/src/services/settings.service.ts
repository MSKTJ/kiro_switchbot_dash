/**
 * Settings service for managing application settings (memory-based)
 */

import { AppSettings, DEFAULT_SETTINGS, SettingsValidator } from '../models/settings';

/**
 * Settings service error types
 */
export type SettingsServiceErrorCode = 
  | 'VALIDATION_ERROR'
  | 'FILE_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Settings service error class
 */
export class SettingsServiceError extends Error {
  constructor(
    message: string,
    public code: SettingsServiceErrorCode,
    public originalError?: any
  ) {
    super(message);
    this.name = 'SettingsServiceError';
  }
}

/**
 * Settings service class (memory-based)
 */
export class SettingsService {
  private settings: AppSettings = { ...DEFAULT_SETTINGS };

  constructor() {
    console.log('Settings service initialized with default values');
  }

  /**
   * Get current settings
   */
  getSettings(): AppSettings {
    return { ...this.settings };
  }

  /**
   * Update settings (partial update)
   */
  updateSettings(updates: Partial<AppSettings>): AppSettings {
    // Validate the updates
    const validation = SettingsValidator.validateSettings(updates);
    if (!validation.isValid) {
      throw new SettingsServiceError(
        `Settings validation failed: ${validation.errors.join(', ')}`,
        'VALIDATION_ERROR'
      );
    }

    // Merge updates with current settings
    this.settings = {
      ...this.settings,
      ...updates,
      alertThresholds: {
        ...this.settings.alertThresholds,
        ...updates.alertThresholds,
        temperature: {
          ...this.settings.alertThresholds.temperature,
          ...updates.alertThresholds?.temperature
        },
        humidity: {
          ...this.settings.alertThresholds.humidity,
          ...updates.alertThresholds?.humidity
        }
      },
      notifications: {
        ...this.settings.notifications,
        ...updates.notifications
      }
    };

    console.log('Settings updated successfully:', this.settings);
    return { ...this.settings };
  }

  /**
   * Reset settings to defaults
   */
  resetSettings(): AppSettings {
    this.settings = { ...DEFAULT_SETTINGS };
    console.log('Settings reset to defaults');
    return { ...this.settings };
  }

  /**
   * Get data update interval
   */
  getDataUpdateInterval(): number {
    return this.settings.dataUpdateInterval;
  }

  /**
   * Get alert thresholds
   */
  getAlertThresholds() {
    return { ...this.settings.alertThresholds };
  }


}

// Export singleton instance
export const settingsService = new SettingsService();