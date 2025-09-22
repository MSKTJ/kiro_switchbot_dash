/**
 * Settings data models and validation
 */

/**
 * Application settings interface
 */
export interface AppSettings {
  dataUpdateInterval: number; // seconds
  alertThresholds: {
    temperature: {
      min: number;
      max: number;
    };
    humidity: {
      min: number;
      max: number;
    };
  };
  notifications: {
    enabled: boolean;
    sound: boolean;
  };
}

/**
 * Default application settings
 */
export const DEFAULT_SETTINGS: AppSettings = {
  dataUpdateInterval: 60, // 60 seconds (1 minute)
  alertThresholds: {
    temperature: {
      min: 18,
      max: 28
    },
    humidity: {
      min: 30,
      max: 70
    }
  },
  notifications: {
    enabled: true,
    sound: true
  }
};

/**
 * Settings validation functions
 */
export class SettingsValidator {
  /**
   * Validate data update interval
   */
  static validateDataUpdateInterval(interval: number): { isValid: boolean; error?: string } {
    if (typeof interval !== 'number') {
      return { isValid: false, error: 'Data update interval must be a number' };
    }
    
    if (interval < 5) {
      return { isValid: false, error: 'Data update interval must be at least 5 seconds' };
    }
    
    if (interval > 300) {
      return { isValid: false, error: 'Data update interval must be at most 300 seconds (5 minutes)' };
    }
    
    return { isValid: true };
  }

  /**
   * Validate temperature thresholds
   */
  static validateTemperatureThresholds(min: number, max: number): { isValid: boolean; error?: string } {
    if (typeof min !== 'number' || typeof max !== 'number') {
      return { isValid: false, error: 'Temperature thresholds must be numbers' };
    }
    
    if (min >= max) {
      return { isValid: false, error: 'Minimum temperature must be less than maximum temperature' };
    }
    
    if (min < -20 || max > 50) {
      return { isValid: false, error: 'Temperature thresholds must be between -20°C and 50°C' };
    }
    
    return { isValid: true };
  }

  /**
   * Validate humidity thresholds
   */
  static validateHumidityThresholds(min: number, max: number): { isValid: boolean; error?: string } {
    if (typeof min !== 'number' || typeof max !== 'number') {
      return { isValid: false, error: 'Humidity thresholds must be numbers' };
    }
    
    if (min >= max) {
      return { isValid: false, error: 'Minimum humidity must be less than maximum humidity' };
    }
    
    if (min < 0 || max > 100) {
      return { isValid: false, error: 'Humidity thresholds must be between 0% and 100%' };
    }
    
    return { isValid: true };
  }

  /**
   * Validate complete settings object
   */
  static validateSettings(settings: Partial<AppSettings>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (settings.dataUpdateInterval !== undefined) {
      const intervalValidation = this.validateDataUpdateInterval(settings.dataUpdateInterval);
      if (!intervalValidation.isValid) {
        errors.push(intervalValidation.error!);
      }
    }

    if (settings.alertThresholds?.temperature) {
      const { min, max } = settings.alertThresholds.temperature;
      const tempValidation = this.validateTemperatureThresholds(min, max);
      if (!tempValidation.isValid) {
        errors.push(tempValidation.error!);
      }
    }

    if (settings.alertThresholds?.humidity) {
      const { min, max } = settings.alertThresholds.humidity;
      const humidityValidation = this.validateHumidityThresholds(min, max);
      if (!humidityValidation.isValid) {
        errors.push(humidityValidation.error!);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}