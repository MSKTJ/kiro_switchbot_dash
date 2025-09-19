/**
 * Device service for managing SwitchBot devices
 */

import { switchBotAPI, SwitchBotAPIError } from '../utils/switchbot-api';
import { 
  Device, 
  DeviceValidator, 
  DeviceUtils, 
  DeviceFilterOptions,
  DeviceType,
  DeviceStatus,
  LightProperties,
  AirConditionerProperties,
  HubProperties
} from '../models/device';

/**
 * Device service error types
 */
export type DeviceServiceErrorCode = 
  | 'API_ERROR'
  | 'DEVICE_NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONTROL_ERROR'
  | 'STATUS_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Device service error class
 */
export class DeviceServiceError extends Error {
  constructor(
    message: string,
    public code: DeviceServiceErrorCode,
    public originalError?: any
  ) {
    super(message);
    this.name = 'DeviceServiceError';
  }
}

/**
 * Device service class
 */
export class DeviceService {
  private devices: Device[] = [];
  private lastFetchTime: Date | null = null;
  private readonly CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Get all devices from SwitchBot API
   */
  async getAllDevices(forceRefresh: boolean = false): Promise<Device[]> {
    try {
      // Check if we need to refresh the cache
      if (!forceRefresh && this.isCacheValid()) {
        return this.devices;
      }

      console.log('Fetching devices from SwitchBot API...');
      const response = await switchBotAPI.getDevices();
      
      const devices: Device[] = [];
      const validationErrors: string[] = [];

      // Process regular devices
      for (const rawDevice of response.body.deviceList) {
        const validation = DeviceValidator.validateSwitchBotDevice(rawDevice);
        if (validation.isValid && validation.device) {
          devices.push(validation.device);
        } else {
          validationErrors.push(`Device ${rawDevice.deviceId}: ${validation.errors.join(', ')}`);
        }
      }

      // Process infrared remote devices
      for (const rawDevice of response.body.infraredRemoteList) {
        const validation = DeviceValidator.validateInfraredRemoteDevice(rawDevice);
        if (validation.isValid && validation.device) {
          devices.push(validation.device);
        } else {
          validationErrors.push(`IR Device ${rawDevice.deviceId}: ${validation.errors.join(', ')}`);
        }
      }

      // Log validation errors if any
      if (validationErrors.length > 0) {
        console.warn('Device validation errors:', validationErrors);
      }

      // Update cache
      this.devices = devices;
      this.lastFetchTime = new Date();

      console.log(`Successfully fetched ${devices.length} devices`);
      return devices;

    } catch (error) {
      console.error('Failed to fetch devices:', error);
      
      if (error instanceof SwitchBotAPIError) {
        throw new DeviceServiceError(
          `Failed to fetch devices from SwitchBot API: ${error.message}`,
          'API_ERROR',
          error
        );
      }
      
      throw new DeviceServiceError(
        'Unknown error occurred while fetching devices',
        'UNKNOWN_ERROR',
        error
      );
    }
  }

  /**
   * Get devices filtered by criteria
   */
  async getFilteredDevices(options: DeviceFilterOptions): Promise<Device[]> {
    const allDevices = await this.getAllDevices();
    return DeviceUtils.filterDevices(allDevices, options);
  }

  /**
   * Get device by ID
   */
  async getDeviceById(deviceId: string): Promise<Device> {
    const devices = await this.getAllDevices();
    const device = devices.find(d => d.deviceId === deviceId);
    
    if (!device) {
      throw new DeviceServiceError(
        `Device with ID ${deviceId} not found`,
        'DEVICE_NOT_FOUND'
      );
    }
    
    return device;
  }

  /**
   * Get devices grouped by type
   */
  async getDevicesGroupedByType(): Promise<Record<DeviceType, Device[]>> {
    const devices = await this.getAllDevices();
    return DeviceUtils.groupDevicesByType(devices);
  }

  /**
   * Get controllable devices only
   */
  async getControllableDevices(): Promise<Device[]> {
    return this.getFilteredDevices({ controllableOnly: true });
  }

  /**
   * Get environment devices (Hubs) only
   */
  async getEnvironmentDevices(): Promise<Device[]> {
    return this.getFilteredDevices({ environmentOnly: true });
  }

  /**
   * Update device status
   */
  async updateDeviceStatus(deviceId: string): Promise<Device> {
    try {
      const device = await this.getDeviceById(deviceId);
      
      console.log(`Updating status for device: ${device.deviceName} (${deviceId})`);
      const statusResponse = await switchBotAPI.getDeviceStatus(deviceId);
      
      // Update device properties based on type
      device.properties = this.parseDeviceProperties(device.deviceType, statusResponse.body);
      device.status = 'online';
      device.lastUpdated = new Date();
      
      // Update device in cache
      const deviceIndex = this.devices.findIndex(d => d.deviceId === deviceId);
      if (deviceIndex >= 0) {
        this.devices[deviceIndex] = device;
      }
      
      return device;
      
    } catch (error) {
      console.error(`Failed to update device status for ${deviceId}:`, error);
      
      // Mark device as offline if status update fails
      const device = await this.getDeviceById(deviceId);
      device.status = 'offline';
      device.lastUpdated = new Date();
      
      if (error instanceof SwitchBotAPIError) {
        throw new DeviceServiceError(
          `Failed to update device status: ${error.message}`,
          'STATUS_ERROR',
          error
        );
      }
      
      throw new DeviceServiceError(
        `Unknown error occurred while updating device status for ${deviceId}`,
        'UNKNOWN_ERROR',
        error
      );
    }
  }

  /**
   * Control device
   */
  async controlDevice(deviceId: string, command: string, parameter?: any): Promise<void> {
    try {
      const device = await this.getDeviceById(deviceId);
      
      console.log(`Controlling device: ${device.deviceName} (${deviceId}) - Command: ${command}`);
      
      // Validate that device is controllable
      if (!DeviceValidator.isControllableDevice(device.deviceType)) {
        throw new DeviceServiceError(
          `Device type ${device.deviceType} is not controllable`,
          'CONTROL_ERROR'
        );
      }
      
      await switchBotAPI.sendDeviceCommand(deviceId, command, parameter);
      
      // Update device status after successful control
      setTimeout(() => {
        this.updateDeviceStatus(deviceId).catch(error => {
          console.warn(`Failed to update device status after control: ${error.message}`);
        });
      }, 1000); // Wait 1 second before updating status
      
    } catch (error) {
      console.error(`Failed to control device ${deviceId}:`, error);
      
      if (error instanceof DeviceServiceError) {
        throw error;
      }
      
      if (error instanceof SwitchBotAPIError) {
        throw new DeviceServiceError(
          `Failed to control device: ${error.message}`,
          'CONTROL_ERROR',
          error
        );
      }
      
      throw new DeviceServiceError(
        `Unknown error occurred while controlling device ${deviceId}`,
        'UNKNOWN_ERROR',
        error
      );
    }
  }

  /**
   * Test device connectivity
   */
  async testDeviceConnectivity(deviceId: string): Promise<boolean> {
    try {
      await this.updateDeviceStatus(deviceId);
      return true;
    } catch (error) {
      console.warn(`Device connectivity test failed for ${deviceId}:`, error);
      return false;
    }
  }

  /**
   * Get device statistics
   */
  async getDeviceStatistics(): Promise<{
    total: number;
    online: number;
    offline: number;
    unknown: number;
    controllable: number;
    byType: Record<DeviceType, number>;
  }> {
    const devices = await this.getAllDevices();
    
    const stats = {
      total: devices.length,
      online: devices.filter(d => d.status === 'online').length,
      offline: devices.filter(d => d.status === 'offline').length,
      unknown: devices.filter(d => d.status === 'unknown').length,
      controllable: devices.filter(d => DeviceValidator.isControllableDevice(d.deviceType)).length,
      byType: {} as Record<DeviceType, number>
    };
    
    // Count devices by type
    const deviceTypes: DeviceType[] = ['Light', 'Air Conditioner', 'Hub', 'Bot', 'Curtain', 'Plug', 'Unknown'];
    deviceTypes.forEach(type => {
      stats.byType[type] = devices.filter(d => d.deviceType === type).length;
    });
    
    return stats;
  }

  /**
   * Clear device cache
   */
  clearCache(): void {
    this.devices = [];
    this.lastFetchTime = null;
    console.log('Device cache cleared');
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(): boolean {
    if (!this.lastFetchTime || this.devices.length === 0) {
      return false;
    }
    
    const now = new Date();
    const cacheAge = now.getTime() - this.lastFetchTime.getTime();
    return cacheAge < this.CACHE_DURATION_MS;
  }

  /**
   * Parse device properties from status response
   */
  private parseDeviceProperties(deviceType: DeviceType, statusBody: any): any {
    switch (deviceType) {
      case 'Light':
        return this.parseLightProperties(statusBody);
      case 'Air Conditioner':
        return this.parseAirConditionerProperties(statusBody);
      case 'Hub':
        return this.parseHubProperties(statusBody);
      default:
        return statusBody;
    }
  }

  /**
   * Parse light device properties
   */
  private parseLightProperties(statusBody: any): LightProperties {
    return {
      power: statusBody.power === 'on' ? 'on' : 'off',
      brightness: statusBody.brightness || undefined,
      colorTemperature: statusBody.colorTemperature || undefined,
      color: statusBody.color ? {
        red: statusBody.color.red || 0,
        green: statusBody.color.green || 0,
        blue: statusBody.color.blue || 0
      } : undefined
    };
  }

  /**
   * Parse air conditioner device properties
   */
  private parseAirConditionerProperties(statusBody: any): AirConditionerProperties {
    return {
      power: statusBody.power === 'on' ? 'on' : 'off',
      mode: statusBody.mode || 'auto',
      temperature: statusBody.temperature || 25,
      fanSpeed: statusBody.fanSpeed || 'auto'
    };
  }

  /**
   * Parse hub device properties
   */
  private parseHubProperties(statusBody: any): HubProperties {
    return {
      temperature: statusBody.temperature || undefined,
      humidity: statusBody.humidity || undefined,
      lightLevel: statusBody.lightLevel || undefined,
      version: statusBody.version || undefined
    };
  }
}

// Export singleton instance
export const deviceService = new DeviceService();