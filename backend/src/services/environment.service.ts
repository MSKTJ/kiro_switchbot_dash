/**
 * Environment data service for SwitchBot Dashboard
 */

import { switchBotAPI, SwitchBotAPIError } from '../utils/switchbot-api';
import { EnvironmentData, EnvironmentDataValidator, RawEnvironmentData } from '../models/environment';

/**
 * Service error class
 */
export class EnvironmentServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'EnvironmentServiceError';
  }
}

/**
 * Environment data service
 */
export class EnvironmentService {
  private hubDeviceId: string | null = null;

  /**
   * Find and cache Hub 2 device ID
   */
  private async findHubDevice(): Promise<string> {
    if (this.hubDeviceId) {
      return this.hubDeviceId;
    }

    try {
      const deviceList = await switchBotAPI.getDevices();
      
      // Look for Hub 2 device
      const hubDevice = deviceList.body.deviceList.find(
        device => device.deviceType === 'Hub 2' || device.deviceType === 'Hub'
      );

      if (!hubDevice) {
        throw new EnvironmentServiceError(
          'No SwitchBot Hub 2 device found. Please ensure your Hub 2 is properly connected.',
          'HUB_NOT_FOUND'
        );
      }

      this.hubDeviceId = hubDevice.deviceId;
      return this.hubDeviceId;
    } catch (error) {
      if (error instanceof SwitchBotAPIError) {
        throw new EnvironmentServiceError(
          'Failed to retrieve device list from SwitchBot API',
          'API_ERROR',
          error
        );
      }
      throw error;
    }
  }

  /**
   * Get current environment data from Hub 2
   */
  async getCurrentEnvironmentData(): Promise<EnvironmentData> {
    try {
      // Find Hub device if not cached
      const hubDeviceId = await this.findHubDevice();

      // Get device status from SwitchBot API
      const statusResponse = await switchBotAPI.getDeviceStatus(hubDeviceId);
      
      // Extract raw environment data
      const rawData: RawEnvironmentData = {
        temperature: statusResponse.body.temperature,
        humidity: statusResponse.body.humidity,
        lightLevel: statusResponse.body.lightLevel
      };

      // Validate the data
      const validationResult = EnvironmentDataValidator.validate(rawData);
      
      if (!validationResult.isValid) {
        throw new EnvironmentServiceError(
          `Invalid environment data: ${validationResult.errors.join(', ')}`,
          'VALIDATION_ERROR'
        );
      }

      return validationResult.data!;
    } catch (error) {
      if (error instanceof EnvironmentServiceError) {
        throw error;
      }
      
      if (error instanceof SwitchBotAPIError) {
        throw new EnvironmentServiceError(
          'Failed to retrieve environment data from SwitchBot Hub',
          'API_ERROR',
          error
        );
      }

      throw new EnvironmentServiceError(
        'Unexpected error while retrieving environment data',
        'UNKNOWN_ERROR',
        error
      );
    }
  }

  /**
   * Generate mock environment data for development
   */
  generateMockData(): EnvironmentData {
    const now = new Date();
    const timeOfDay = now.getHours() + now.getMinutes() / 60;
    
    // Simulate realistic temperature variation throughout the day
    const baseTemp = 22 + Math.sin((timeOfDay - 6) * Math.PI / 12) * 4; // Peak at 2 PM
    const temperature = baseTemp + (Math.random() - 0.5) * 2;
    
    // Simulate humidity (inverse correlation with temperature)
    const baseHumidity = 65 - (temperature - 20) * 2;
    const humidity = Math.max(30, Math.min(80, baseHumidity + (Math.random() - 0.5) * 10));
    
    // Simulate light levels (higher during day, lower at night)
    let baseLight = 100;
    if (timeOfDay >= 6 && timeOfDay <= 18) {
      baseLight = 300 + Math.sin((timeOfDay - 6) * Math.PI / 12) * 400; // Peak at noon
    }
    const light = Math.max(0, baseLight + (Math.random() - 0.5) * 100);
    
    return {
      temperature: Math.round(temperature * 10) / 10,
      humidity: Math.round(humidity),
      light: Math.round(light),
      timestamp: now
    };
  }

  /**
   * Test if environment service is working properly
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getCurrentEnvironmentData();
      return true;
    } catch (error) {
      console.error('Environment service test failed:', error);
      return false;
    }
  }

  /**
   * Reset cached hub device ID (useful for testing or when devices change)
   */
  resetHubCache(): void {
    this.hubDeviceId = null;
  }
}

// Export singleton instance
export const environmentService = new EnvironmentService();