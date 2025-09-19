/**
 * Environment data models and validation for SwitchBot Dashboard
 */

/**
 * Raw environment data from SwitchBot Hub 2
 */
export interface RawEnvironmentData {
  temperature?: number;
  humidity?: number;
  lightLevel?: number;
}

/**
 * Validated environment data with timestamp
 */
export interface EnvironmentData {
  temperature: number;    // Temperature in Celsius
  humidity: number;       // Humidity percentage (0-100)
  light: number;         // Light level in lux
  timestamp: Date;       // Data acquisition timestamp
}

/**
 * Environment data validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  data?: EnvironmentData;
}

/**
 * Environment data validation class
 */
export class EnvironmentDataValidator {
  private static readonly TEMPERATURE_MIN = -40;
  private static readonly TEMPERATURE_MAX = 80;
  private static readonly HUMIDITY_MIN = 0;
  private static readonly HUMIDITY_MAX = 100;
  private static readonly LIGHT_MIN = 0;
  private static readonly LIGHT_MAX = 100000; // Maximum reasonable lux value

  /**
   * Validate raw environment data from SwitchBot API
   */
  static validate(rawData: RawEnvironmentData): ValidationResult {
    const errors: string[] = [];

    // Check if data exists
    if (!rawData || typeof rawData !== 'object') {
      return {
        isValid: false,
        errors: ['Invalid data format: expected object']
      };
    }

    // Validate temperature
    const temperature = this.validateTemperature(rawData.temperature);
    if (temperature.error) {
      errors.push(temperature.error);
    }

    // Validate humidity
    const humidity = this.validateHumidity(rawData.humidity);
    if (humidity.error) {
      errors.push(humidity.error);
    }

    // Validate light level
    const light = this.validateLight(rawData.lightLevel);
    if (light.error) {
      errors.push(light.error);
    }

    // If there are validation errors, return them
    if (errors.length > 0) {
      return {
        isValid: false,
        errors
      };
    }

    // Create validated environment data
    const environmentData: EnvironmentData = {
      temperature: temperature.value!,
      humidity: humidity.value!,
      light: light.value!,
      timestamp: new Date()
    };

    return {
      isValid: true,
      errors: [],
      data: environmentData
    };
  }

  /**
   * Validate temperature value
   */
  private static validateTemperature(value: any): { value?: number; error?: string } {
    if (value === undefined || value === null) {
      return { error: 'Temperature is required' };
    }

    const numValue = Number(value);
    if (isNaN(numValue)) {
      return { error: 'Temperature must be a valid number' };
    }

    if (numValue < this.TEMPERATURE_MIN || numValue > this.TEMPERATURE_MAX) {
      return { 
        error: `Temperature must be between ${this.TEMPERATURE_MIN}°C and ${this.TEMPERATURE_MAX}°C` 
      };
    }

    return { value: numValue };
  }

  /**
   * Validate humidity value
   */
  private static validateHumidity(value: any): { value?: number; error?: string } {
    if (value === undefined || value === null) {
      return { error: 'Humidity is required' };
    }

    const numValue = Number(value);
    if (isNaN(numValue)) {
      return { error: 'Humidity must be a valid number' };
    }

    if (numValue < this.HUMIDITY_MIN || numValue > this.HUMIDITY_MAX) {
      return { 
        error: `Humidity must be between ${this.HUMIDITY_MIN}% and ${this.HUMIDITY_MAX}%` 
      };
    }

    return { value: numValue };
  }

  /**
   * Validate light level value
   */
  private static validateLight(value: any): { value?: number; error?: string } {
    if (value === undefined || value === null) {
      return { error: 'Light level is required' };
    }

    const numValue = Number(value);
    if (isNaN(numValue)) {
      return { error: 'Light level must be a valid number' };
    }

    if (numValue < this.LIGHT_MIN || numValue > this.LIGHT_MAX) {
      return { 
        error: `Light level must be between ${this.LIGHT_MIN} and ${this.LIGHT_MAX} lux` 
      };
    }

    return { value: numValue };
  }

  /**
   * Check if environment data is within reasonable ranges
   */
  static isReasonableData(data: EnvironmentData): boolean {
    // Check for reasonable indoor temperature range
    const reasonableTemp = data.temperature >= 10 && data.temperature <= 40;
    
    // Check for reasonable humidity range
    const reasonableHumidity = data.humidity >= 20 && data.humidity <= 90;
    
    // Check for reasonable light level (indoor lighting typically 100-1000 lux)
    const reasonableLight = data.light >= 0 && data.light <= 10000;

    return reasonableTemp && reasonableHumidity && reasonableLight;
  }
}