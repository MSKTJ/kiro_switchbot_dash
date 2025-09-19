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