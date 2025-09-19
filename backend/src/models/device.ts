/**
 * Device models and validation for SwitchBot Dashboard
 */

/**
 * Device types supported by the dashboard
 */
export type DeviceType = 'Light' | 'Air Conditioner' | 'Hub' | 'Bot' | 'Curtain' | 'Plug' | 'Unknown';

/**
 * Device status
 */
export type DeviceStatus = 'online' | 'offline' | 'unknown';

/**
 * Base device interface
 */
export interface Device {
  deviceId: string;
  deviceName: string;
  deviceType: DeviceType;
  status: DeviceStatus;
  hubDeviceId?: string;
  enableCloudService?: boolean;
  isInfraredRemote?: boolean;
  remoteType?: string;
  properties?: DeviceProperties;
  lastUpdated: Date;
}

/**
 * Device properties union type
 */
export type DeviceProperties = LightProperties | AirConditionerProperties | HubProperties | BotProperties | CurtainProperties | PlugProperties;

/**
 * Light device properties
 */
export interface LightProperties {
  power: 'on' | 'off';
  brightness?: number;   // 0-100
  colorTemperature?: number;
  color?: {
    red: number;
    green: number;
    blue: number;
  };
}

/**
 * Air conditioner device properties
 */
export interface AirConditionerProperties {
  power: 'on' | 'off';
  mode: 'cool' | 'heat' | 'dry' | 'auto' | 'fan';
  temperature: number;   // Target temperature
  fanSpeed: 'auto' | 'low' | 'medium' | 'high';
}

/**
 * Hub device properties
 */
export interface HubProperties {
  temperature?: number;
  humidity?: number;
  lightLevel?: number;
  version?: string;
}

/**
 * Bot device properties
 */
export interface BotProperties {
  power: 'on' | 'off';
  battery?: number;
}

/**
 * Curtain device properties
 */
export interface CurtainProperties {
  position: number;      // 0-100 (0 = closed, 100 = open)
  battery?: number;
  calibrate?: boolean;
}

/**
 * Plug device properties
 */
export interface PlugProperties {
  power: 'on' | 'off';
  voltage?: number;
  current?: number;
  power_consumption?: number;
}

/**
 * Raw device data from SwitchBot API
 */
export interface RawSwitchBotDevice {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  enableCloudService: boolean;
  hubDeviceId: string;
}

/**
 * Raw infrared remote device data from SwitchBot API
 */
export interface RawInfraredRemoteDevice {
  deviceId: string;
  deviceName: string;
  remoteType: string;
  hubDeviceId: string;
}

/**
 * Device list response from SwitchBot API
 */
export interface DeviceListResponse {
  statusCode: number;
  body: {
    deviceList: RawSwitchBotDevice[];
    infraredRemoteList: RawInfraredRemoteDevice[];
  };
  message: string;
}

/**
 * Device validation result
 */
export interface DeviceValidationResult {
  isValid: boolean;
  errors: string[];
  device?: Device;
}

/**
 * Device data validator
 */
export class DeviceValidator {
  /**
   * Validate and transform raw SwitchBot device data
   */
  static validateSwitchBotDevice(rawDevice: RawSwitchBotDevice): DeviceValidationResult {
    const errors: string[] = [];

    // Validate required fields
    if (!rawDevice.deviceId || typeof rawDevice.deviceId !== 'string') {
      errors.push('Device ID is required and must be a string');
    }

    if (!rawDevice.deviceName || typeof rawDevice.deviceName !== 'string') {
      errors.push('Device name is required and must be a string');
    }

    if (!rawDevice.deviceType || typeof rawDevice.deviceType !== 'string') {
      errors.push('Device type is required and must be a string');
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // Map device type
    const deviceType = this.mapDeviceType(rawDevice.deviceType);

    // Create device object
    const device: Device = {
      deviceId: rawDevice.deviceId,
      deviceName: rawDevice.deviceName,
      deviceType,
      status: 'unknown',
      hubDeviceId: rawDevice.hubDeviceId,
      enableCloudService: rawDevice.enableCloudService,
      isInfraredRemote: false,
      lastUpdated: new Date()
    };

    return {
      isValid: true,
      errors: [],
      device
    };
  }

  /**
   * Validate and transform raw infrared remote device data
   */
  static validateInfraredRemoteDevice(rawDevice: RawInfraredRemoteDevice): DeviceValidationResult {
    const errors: string[] = [];

    // Validate required fields
    if (!rawDevice.deviceId || typeof rawDevice.deviceId !== 'string') {
      errors.push('Device ID is required and must be a string');
    }

    if (!rawDevice.deviceName || typeof rawDevice.deviceName !== 'string') {
      errors.push('Device name is required and must be a string');
    }

    if (!rawDevice.remoteType || typeof rawDevice.remoteType !== 'string') {
      errors.push('Remote type is required and must be a string');
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // Map remote type to device type
    const deviceType = this.mapRemoteTypeToDeviceType(rawDevice.remoteType);

    // Create device object
    const device: Device = {
      deviceId: rawDevice.deviceId,
      deviceName: rawDevice.deviceName,
      deviceType,
      status: 'unknown',
      hubDeviceId: rawDevice.hubDeviceId,
      isInfraredRemote: true,
      remoteType: rawDevice.remoteType,
      lastUpdated: new Date()
    };

    return {
      isValid: true,
      errors: [],
      device
    };
  }

  /**
   * Map SwitchBot device type to our device type
   */
  private static mapDeviceType(switchBotType: string): DeviceType {
    const typeMap: Record<string, DeviceType> = {
      'Hub 2': 'Hub',
      'Hub Mini': 'Hub',
      'Hub Plus': 'Hub',
      'Bot': 'Bot',
      'Curtain': 'Curtain',
      'Plug': 'Plug',
      'Light': 'Light',
      'Color Bulb': 'Light',
      'Strip Light': 'Light'
    };

    return typeMap[switchBotType] || 'Unknown';
  }

  /**
   * Map infrared remote type to device type
   */
  private static mapRemoteTypeToDeviceType(remoteType: string): DeviceType {
    const typeMap: Record<string, DeviceType> = {
      'Air Conditioner': 'Air Conditioner',
      'TV': 'Unknown',
      'Light': 'Light',
      'IPTV/Streamer': 'Unknown',
      'Set Top Box': 'Unknown',
      'DVD': 'Unknown',
      'Fan': 'Unknown',
      'Projector': 'Unknown',
      'Camera': 'Unknown',
      'Air Purifier': 'Unknown',
      'Speaker': 'Unknown',
      'Water Heater': 'Unknown',
      'Vacuum Cleaner': 'Unknown',
      'Others': 'Unknown'
    };

    return typeMap[remoteType] || 'Unknown';
  }

  /**
   * Check if device type is controllable by the dashboard
   */
  static isControllableDevice(deviceType: DeviceType): boolean {
    return ['Light', 'Air Conditioner', 'Bot', 'Curtain', 'Plug'].includes(deviceType);
  }

  /**
   * Check if device type provides environment data
   */
  static isEnvironmentDevice(deviceType: DeviceType): boolean {
    return deviceType === 'Hub';
  }
}

/**
 * Device filter options
 */
export interface DeviceFilterOptions {
  deviceType?: DeviceType;
  status?: DeviceStatus;
  controllableOnly?: boolean;
  environmentOnly?: boolean;
}

/**
 * Device utility functions
 */
export class DeviceUtils {
  /**
   * Filter devices based on criteria
   */
  static filterDevices(devices: Device[], options: DeviceFilterOptions): Device[] {
    return devices.filter(device => {
      // Filter by device type
      if (options.deviceType && device.deviceType !== options.deviceType) {
        return false;
      }

      // Filter by status
      if (options.status && device.status !== options.status) {
        return false;
      }

      // Filter controllable devices only
      if (options.controllableOnly && !DeviceValidator.isControllableDevice(device.deviceType)) {
        return false;
      }

      // Filter environment devices only
      if (options.environmentOnly && !DeviceValidator.isEnvironmentDevice(device.deviceType)) {
        return false;
      }

      return true;
    });
  }

  /**
   * Group devices by type
   */
  static groupDevicesByType(devices: Device[]): Record<DeviceType, Device[]> {
    const grouped: Record<DeviceType, Device[]> = {
      'Light': [],
      'Air Conditioner': [],
      'Hub': [],
      'Bot': [],
      'Curtain': [],
      'Plug': [],
      'Unknown': []
    };

    devices.forEach(device => {
      grouped[device.deviceType].push(device);
    });

    return grouped;
  }

  /**
   * Get device display name with type
   */
  static getDeviceDisplayName(device: Device): string {
    const typeLabel = device.isInfraredRemote ? `${device.remoteType} (IR)` : device.deviceType;
    return `${device.deviceName} (${typeLabel})`;
  }

  /**
   * Check if device was recently updated
   */
  static isRecentlyUpdated(device: Device, maxAgeMinutes: number = 5): boolean {
    const now = new Date();
    const ageMs = now.getTime() - device.lastUpdated.getTime();
    const ageMinutes = ageMs / (1000 * 60);
    return ageMinutes <= maxAgeMinutes;
  }
}