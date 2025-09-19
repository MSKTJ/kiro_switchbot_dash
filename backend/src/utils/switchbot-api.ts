import { switchBotClient } from './switchbot-client';

/**
 * SwitchBot API error class
 */
export class SwitchBotAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorCode?: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'SwitchBotAPIError';
  }
}

/**
 * SwitchBot API response interfaces
 */
export interface SwitchBotDevice {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  enableCloudService: boolean;
  hubDeviceId: string;
}

export interface SwitchBotInfraredRemoteDevice {
  deviceId: string;
  deviceName: string;
  remoteType: string;
  hubDeviceId: string;
}

export interface DeviceListResponse {
  statusCode: number;
  body: {
    deviceList: SwitchBotDevice[];
    infraredRemoteList: SwitchBotInfraredRemoteDevice[];
  };
  message: string;
}

export interface DeviceStatusResponse {
  statusCode: number;
  body: any;
  message: string;
}

export interface DeviceCommandResponse {
  statusCode: number;
  body: any;
  message: string;
}

/**
 * Environment data from Hub 2
 */
export interface EnvironmentData {
  temperature: number;
  humidity: number;
  lightLevel: number;
}

/**
 * SwitchBot API service for device management and control
 */
export class SwitchBotAPI {
  /**
   * Get all devices connected to SwitchBot account
   */
  async getDevices(): Promise<DeviceListResponse> {
    try {
      const response = await switchBotClient.get<DeviceListResponse>('/devices');
      
      if (response.statusCode !== 100) {
        throw new SwitchBotAPIError(
          `Failed to get devices: ${response.message}`,
          response.statusCode
        );
      }
      
      return response;
    } catch (error) {
      if (error instanceof SwitchBotAPIError) {
        throw error;
      }
      throw new SwitchBotAPIError('Failed to retrieve device list', undefined, undefined, error);
    }
  }

  /**
   * Get device status by device ID
   */
  async getDeviceStatus(deviceId: string): Promise<DeviceStatusResponse> {
    try {
      const response = await switchBotClient.get<DeviceStatusResponse>(`/devices/${deviceId}/status`);
      
      if (response.statusCode !== 100) {
        throw new SwitchBotAPIError(
          `Failed to get device status: ${response.message}`,
          response.statusCode
        );
      }
      
      return response;
    } catch (error) {
      if (error instanceof SwitchBotAPIError) {
        throw error;
      }
      throw new SwitchBotAPIError(
        `Failed to get status for device ${deviceId}`,
        undefined,
        undefined,
        error
      );
    }
  }

  /**
   * Send command to device
   */
  async sendDeviceCommand(
    deviceId: string,
    command: string,
    parameter?: string | object
  ): Promise<DeviceCommandResponse> {
    try {
      const payload: any = { command };
      if (parameter !== undefined) {
        payload.parameter = parameter;
      }

      const response = await switchBotClient.post<DeviceCommandResponse>(
        `/devices/${deviceId}/commands`,
        payload
      );
      
      if (response.statusCode !== 100) {
        throw new SwitchBotAPIError(
          `Failed to send command: ${response.message}`,
          response.statusCode
        );
      }
      
      return response;
    } catch (error) {
      if (error instanceof SwitchBotAPIError) {
        throw error;
      }
      throw new SwitchBotAPIError(
        `Failed to send command to device ${deviceId}`,
        undefined,
        undefined,
        error
      );
    }
  }

  /**
   * Get environment data from Hub 2
   */
  async getEnvironmentData(hubDeviceId: string): Promise<EnvironmentData> {
    try {
      const response = await this.getDeviceStatus(hubDeviceId);
      
      const { body } = response;
      
      // Extract environment data from Hub 2 response
      const environmentData: EnvironmentData = {
        temperature: body.temperature || 0,
        humidity: body.humidity || 0,
        lightLevel: body.lightLevel || 0
      };
      
      return environmentData;
    } catch (error) {
      if (error instanceof SwitchBotAPIError) {
        throw error;
      }
      throw new SwitchBotAPIError(
        `Failed to get environment data from hub ${hubDeviceId}`,
        undefined,
        undefined,
        error
      );
    }
  }

  /**
   * Control light device
   */
  async controlLight(deviceId: string, action: 'turnOn' | 'turnOff' | 'setBrightness', brightness?: number): Promise<DeviceCommandResponse> {
    try {
      let command: string;
      let parameter: string | undefined;

      switch (action) {
        case 'turnOn':
          command = 'turnOn';
          break;
        case 'turnOff':
          command = 'turnOff';
          break;
        case 'setBrightness':
          if (brightness === undefined || brightness < 0 || brightness > 100) {
            throw new SwitchBotAPIError('Brightness must be between 0 and 100');
          }
          command = 'setBrightness';
          parameter = brightness.toString();
          break;
        default:
          throw new SwitchBotAPIError(`Unknown light action: ${action}`);
      }

      return await this.sendDeviceCommand(deviceId, command, parameter);
    } catch (error) {
      if (error instanceof SwitchBotAPIError) {
        throw error;
      }
      throw new SwitchBotAPIError(
        `Failed to control light ${deviceId}`,
        undefined,
        undefined,
        error
      );
    }
  }

  /**
   * Control air conditioner
   */
  async controlAirConditioner(
    deviceId: string,
    action: 'turnOn' | 'turnOff' | 'setMode' | 'setTemperature',
    options?: {
      mode?: 'cool' | 'heat' | 'dry' | 'auto';
      temperature?: number;
    }
  ): Promise<DeviceCommandResponse> {
    try {
      let command: string;
      let parameter: string | object | undefined;

      switch (action) {
        case 'turnOn':
          command = 'turnOn';
          break;
        case 'turnOff':
          command = 'turnOff';
          break;
        case 'setMode':
          if (!options?.mode) {
            throw new SwitchBotAPIError('Mode is required for setMode action');
          }
          command = 'setAll';
          parameter = {
            temperature: options.temperature || 25,
            mode: options.mode,
            fanSpeed: 'auto',
            power: 'on'
          };
          break;
        case 'setTemperature':
          if (!options?.temperature || options.temperature < 16 || options.temperature > 30) {
            throw new SwitchBotAPIError('Temperature must be between 16 and 30 degrees');
          }
          command = 'setAll';
          parameter = {
            temperature: options.temperature,
            mode: options.mode || 'auto',
            fanSpeed: 'auto',
            power: 'on'
          };
          break;
        default:
          throw new SwitchBotAPIError(`Unknown air conditioner action: ${action}`);
      }

      return await this.sendDeviceCommand(deviceId, command, parameter);
    } catch (error) {
      if (error instanceof SwitchBotAPIError) {
        throw error;
      }
      throw new SwitchBotAPIError(
        `Failed to control air conditioner ${deviceId}`,
        undefined,
        undefined,
        error
      );
    }
  }

  /**
   * Test API connectivity
   */
  async testConnection(): Promise<boolean> {
    return await switchBotClient.healthCheck();
  }
}

// Export singleton instance
export const switchBotAPI = new SwitchBotAPI();