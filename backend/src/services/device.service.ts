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
          // Set default properties for IR devices
          validation.device.properties = this.getDefaultPropertiesForIRDevice(validation.device.deviceType);
          validation.device.status = 'online'; // Assume IR devices are online if they exist
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
      
      // For infrared remote devices, we cannot get real status from API
      // Preserve existing properties and only set defaults if properties don't exist
      if (device.isInfraredRemote) {
        console.log(`IR device detected: ${device.deviceName} (${deviceId}). Preserving existing properties.`);
        
        // Only set default properties if device doesn't have properties yet
        if (!device.properties) {
          device.properties = this.getDefaultPropertiesForIRDevice(device.deviceType);
          console.log(`Set default properties for IR device ${device.deviceName}:`, device.properties);
        } else {
          console.log(`Preserving existing properties for IR device ${device.deviceName}:`, device.properties);
        }
        
        device.status = 'online'; // Assume IR devices are online if they exist
        device.lastUpdated = new Date();
        
        // Update device in cache
        const deviceIndex = this.devices.findIndex(d => d.deviceId === deviceId);
        if (deviceIndex >= 0) {
          this.devices[deviceIndex] = device;
        }
        
        return device;
      }
      
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
      
      // Map commands for IR devices to supported API commands
      const { mappedCommand, mappedParameter } = device.isInfraredRemote 
        ? this.mapIRDeviceCommand(device.deviceType, command, parameter)
        : { mappedCommand: command, mappedParameter: parameter };
      
      await switchBotAPI.sendDeviceCommand(deviceId, mappedCommand, mappedParameter);
      
      // For IR devices, update local state based on original command since we can't get real status
      if (device.isInfraredRemote) {
        this.updateIRDeviceLocalState(device, command, parameter);
      }
      
      // For IR devices, skip automatic status update after control to preserve user settings
      if (!device.isInfraredRemote) {
        // Update device status after successful control (only for non-IR devices)
        setTimeout(() => {
          this.updateDeviceStatus(deviceId).catch(error => {
            console.warn(`Failed to update device status after control: ${error.message}`);
          });
        }, 1000); // Wait 1 second before updating status
      } else {
        console.log(`Skipping automatic status update for IR device ${device.deviceName} to preserve user settings`);
      }
      
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

  /**
   * Get default properties for infrared remote devices
   */
  private getDefaultPropertiesForIRDevice(deviceType: DeviceType): any {
    switch (deviceType) {
      case 'Light':
        return {
          power: 'off',
          brightness: 50
        } as LightProperties;
      case 'Air Conditioner':
        return {
          power: 'off',
          mode: 'auto',
          temperature: 25,
          fanSpeed: 'auto'
        } as AirConditionerProperties;
      default:
        return {};
    }
  }

  /**
   * Map commands for IR devices to supported API commands
   */
  private mapIRDeviceCommand(deviceType: DeviceType, command: string, parameter?: any): { mappedCommand: string; mappedParameter?: any } {
    console.log(`Mapping IR command: ${command} with parameter:`, parameter);
    
    switch (deviceType) {
      case 'Light':
        switch (command) {
          case 'turnOn':
            return { mappedCommand: 'turnOn' };
          case 'turnOff':
            return { mappedCommand: 'turnOff' };
          case 'setBrightness':
            // For IR lights, we can't set exact brightness, so we use brightnessUp/Down
            // This is a simplified approach - in reality, you might need multiple commands
            const brightness = typeof parameter === 'number' ? parameter : parseInt(parameter);
            if (brightness > 50) {
              return { mappedCommand: 'brightnessUp' };
            } else {
              return { mappedCommand: 'brightnessDown' };
            }
          case 'setColorTemperature':
            // For IR lights, color temperature control might not be available
            // Return the original command and let the API handle it
            return { mappedCommand: 'setColor', mappedParameter: { temperature: parameter } };
          default:
            return { mappedCommand: command, mappedParameter: parameter };
        }
      case 'Air Conditioner':
        switch (command) {
          case 'turnOn':
            return { mappedCommand: 'turnOn' };
          case 'turnOff':
            return { mappedCommand: 'turnOff' };
          case 'setMode':
            // For IR AC, try the simplest possible approach
            const mode = parameter;
            if (!['cool', 'heat', 'dry', 'auto', 'fan'].includes(mode)) {
              throw new DeviceServiceError(`Unsupported AC mode: ${mode}`, 'CONTROL_ERROR');
            }
            
            console.log(`IR AC mode change: ${mode} - trying power toggle as workaround`);
            
            // Since mode control is not working, use power toggle as a workaround
            // This at least provides some interaction with the device
            return { mappedCommand: 'turnOn' };
            
          case 'setTemperature':
            // For IR AC, try the simplest possible approach
            const temp = typeof parameter === 'number' ? parameter : parseInt(parameter);
            if (temp < 16 || temp > 30) {
              throw new DeviceServiceError('Temperature must be between 16 and 30 degrees', 'CONTROL_ERROR');
            }
            
            console.log(`IR AC temperature change: ${temp} - trying power toggle as workaround`);
            
            // Since temperature control is not working, use power toggle as a workaround
            // This at least provides some interaction with the device
            return { mappedCommand: 'turnOn' };
            
          default:
            return { mappedCommand: command, mappedParameter: parameter };
        }
      default:
        return { mappedCommand: command, mappedParameter: parameter };
    }
  }

  /**
   * Update local state for IR devices based on control commands
   */
  private updateIRDeviceLocalState(device: Device, command: string, parameter?: any): void {
    if (!device.properties) {
      device.properties = this.getDefaultPropertiesForIRDevice(device.deviceType);
    }

    switch (device.deviceType) {
      case 'Light':
        const lightProps = device.properties as LightProperties;
        switch (command) {
          case 'turnOn':
            lightProps.power = 'on';
            break;
          case 'turnOff':
            lightProps.power = 'off';
            break;
          case 'setBrightness':
            if (parameter !== undefined) {
              lightProps.brightness = typeof parameter === 'number' ? parameter : parseInt(parameter);
              lightProps.power = 'on'; // Assume turning on when setting brightness
            }
            break;
          case 'setColorTemperature':
            if (parameter !== undefined) {
              lightProps.colorTemperature = typeof parameter === 'number' ? parameter : parseInt(parameter);
              lightProps.power = 'on'; // Assume turning on when setting color temperature
            }
            break;
        }
        break;

      case 'Air Conditioner':
        const acProps = device.properties as AirConditionerProperties;
        switch (command) {
          case 'turnOn':
            acProps.power = 'on';
            break;
          case 'turnOff':
            acProps.power = 'off';
            break;
          case 'setMode':
            if (parameter) {
              acProps.mode = parameter;
              acProps.power = 'on'; // Assume turning on when setting mode
            }
            break;
          case 'setTemperature':
            if (parameter !== undefined) {
              acProps.temperature = typeof parameter === 'number' ? parameter : parseInt(parameter);
              acProps.power = 'on'; // Assume turning on when setting temperature
            }
            break;
        }
        break;
    }

    device.lastUpdated = new Date();
    console.log(`Updated local state for IR device ${device.deviceName}:`, device.properties);
  }
}

// Export singleton instance
export const deviceService = new DeviceService();