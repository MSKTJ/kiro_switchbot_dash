import { SwitchBotAPI, SwitchBotAPIError } from '../switchbot-api';
import { switchBotClient } from '../switchbot-client';

// Mock the switchbot-client
jest.mock('../switchbot-client', () => ({
  switchBotClient: {
    get: jest.fn(),
    post: jest.fn(),
    healthCheck: jest.fn()
  },
  SwitchBotAPIError: class extends Error {
    constructor(message: string, public statusCode?: number, public errorCode?: string, public originalError?: any) {
      super(message);
      this.name = 'SwitchBotAPIError';
    }
  }
}));

const mockSwitchBotClient = switchBotClient as jest.Mocked<typeof switchBotClient>;

describe('SwitchBotAPI', () => {
  let api: SwitchBotAPI;

  beforeEach(() => {
    jest.clearAllMocks();
    api = new SwitchBotAPI();
  });

  describe('getDevices', () => {
    it('should return device list successfully', async () => {
      const mockResponse = {
        statusCode: 100,
        body: {
          deviceList: [
            {
              deviceId: 'device1',
              deviceName: 'Test Device',
              deviceType: 'Hub 2',
              enableCloudService: true,
              hubDeviceId: 'hub1'
            }
          ],
          infraredRemoteList: []
        },
        message: 'success'
      };

      mockSwitchBotClient.get.mockResolvedValue(mockResponse);

      const result = await api.getDevices();

      expect(mockSwitchBotClient.get).toHaveBeenCalledWith('/devices');
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when API returns non-success status', async () => {
      const mockResponse = {
        statusCode: 190,
        body: {},
        message: 'Device internal error due to device states not synchronized with server'
      };

      mockSwitchBotClient.get.mockResolvedValue(mockResponse);

      await expect(api.getDevices()).rejects.toThrow(SwitchBotAPIError);
      await expect(api.getDevices()).rejects.toThrow('Failed to get devices');
    });
  });

  describe('getDeviceStatus', () => {
    it('should return device status successfully', async () => {
      const mockResponse = {
        statusCode: 100,
        body: {
          temperature: 25.5,
          humidity: 60,
          lightLevel: 800
        },
        message: 'success'
      };

      mockSwitchBotClient.get.mockResolvedValue(mockResponse);

      const result = await api.getDeviceStatus('device1');

      expect(mockSwitchBotClient.get).toHaveBeenCalledWith('/devices/device1/status');
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when device status request fails', async () => {
      const mockResponse = {
        statusCode: 160,
        body: {},
        message: 'Device offline'
      };

      mockSwitchBotClient.get.mockResolvedValue(mockResponse);

      await expect(api.getDeviceStatus('device1')).rejects.toThrow(SwitchBotAPIError);
      await expect(api.getDeviceStatus('device1')).rejects.toThrow('Failed to get device status');
    });
  });

  describe('sendDeviceCommand', () => {
    it('should send command successfully', async () => {
      const mockResponse = {
        statusCode: 100,
        body: {},
        message: 'success'
      };

      mockSwitchBotClient.post.mockResolvedValue(mockResponse);

      const result = await api.sendDeviceCommand('device1', 'turnOn');

      expect(mockSwitchBotClient.post).toHaveBeenCalledWith('/devices/device1/commands', {
        command: 'turnOn'
      });
      expect(result).toEqual(mockResponse);
    });

    it('should send command with parameter successfully', async () => {
      const mockResponse = {
        statusCode: 100,
        body: {},
        message: 'success'
      };

      mockSwitchBotClient.post.mockResolvedValue(mockResponse);

      const result = await api.sendDeviceCommand('device1', 'setBrightness', '80');

      expect(mockSwitchBotClient.post).toHaveBeenCalledWith('/devices/device1/commands', {
        command: 'setBrightness',
        parameter: '80'
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getEnvironmentData', () => {
    it('should return environment data from Hub 2', async () => {
      const mockResponse = {
        statusCode: 100,
        body: {
          temperature: 25.5,
          humidity: 60,
          lightLevel: 800
        },
        message: 'success'
      };

      mockSwitchBotClient.get.mockResolvedValue(mockResponse);

      const result = await api.getEnvironmentData('hub1');

      expect(result).toEqual({
        temperature: 25.5,
        humidity: 60,
        lightLevel: 800
      });
    });

    it('should return default values when data is missing', async () => {
      const mockResponse = {
        statusCode: 100,
        body: {},
        message: 'success'
      };

      mockSwitchBotClient.get.mockResolvedValue(mockResponse);

      const result = await api.getEnvironmentData('hub1');

      expect(result).toEqual({
        temperature: 0,
        humidity: 0,
        lightLevel: 0
      });
    });
  });

  describe('controlLight', () => {
    beforeEach(() => {
      const mockResponse = {
        statusCode: 100,
        body: {},
        message: 'success'
      };
      mockSwitchBotClient.post.mockResolvedValue(mockResponse);
    });

    it('should turn on light', async () => {
      await api.controlLight('light1', 'turnOn');

      expect(mockSwitchBotClient.post).toHaveBeenCalledWith('/devices/light1/commands', {
        command: 'turnOn'
      });
    });

    it('should turn off light', async () => {
      await api.controlLight('light1', 'turnOff');

      expect(mockSwitchBotClient.post).toHaveBeenCalledWith('/devices/light1/commands', {
        command: 'turnOff'
      });
    });

    it('should set brightness', async () => {
      await api.controlLight('light1', 'setBrightness', 75);

      expect(mockSwitchBotClient.post).toHaveBeenCalledWith('/devices/light1/commands', {
        command: 'setBrightness',
        parameter: '75'
      });
    });

    it('should throw error for invalid brightness', async () => {
      await expect(api.controlLight('light1', 'setBrightness', 150)).rejects.toThrow(
        'Brightness must be between 0 and 100'
      );
    });

    it('should throw error for unknown action', async () => {
      await expect(api.controlLight('light1', 'invalidAction' as any)).rejects.toThrow(
        'Unknown light action: invalidAction'
      );
    });
  });

  describe('controlAirConditioner', () => {
    beforeEach(() => {
      const mockResponse = {
        statusCode: 100,
        body: {},
        message: 'success'
      };
      mockSwitchBotClient.post.mockResolvedValue(mockResponse);
    });

    it('should turn on air conditioner', async () => {
      await api.controlAirConditioner('ac1', 'turnOn');

      expect(mockSwitchBotClient.post).toHaveBeenCalledWith('/devices/ac1/commands', {
        command: 'turnOn'
      });
    });

    it('should turn off air conditioner', async () => {
      await api.controlAirConditioner('ac1', 'turnOff');

      expect(mockSwitchBotClient.post).toHaveBeenCalledWith('/devices/ac1/commands', {
        command: 'turnOff'
      });
    });

    it('should set mode', async () => {
      await api.controlAirConditioner('ac1', 'setMode', { mode: 'cool', temperature: 22 });

      expect(mockSwitchBotClient.post).toHaveBeenCalledWith('/devices/ac1/commands', {
        command: 'setAll',
        parameter: {
          temperature: 22,
          mode: 'cool',
          fanSpeed: 'auto',
          power: 'on'
        }
      });
    });

    it('should set temperature', async () => {
      await api.controlAirConditioner('ac1', 'setTemperature', { temperature: 24 });

      expect(mockSwitchBotClient.post).toHaveBeenCalledWith('/devices/ac1/commands', {
        command: 'setAll',
        parameter: {
          temperature: 24,
          mode: 'auto',
          fanSpeed: 'auto',
          power: 'on'
        }
      });
    });

    it('should throw error for invalid temperature', async () => {
      await expect(
        api.controlAirConditioner('ac1', 'setTemperature', { temperature: 35 })
      ).rejects.toThrow('Temperature must be between 16 and 30 degrees');
    });

    it('should throw error for setMode without mode', async () => {
      await expect(api.controlAirConditioner('ac1', 'setMode')).rejects.toThrow(
        'Mode is required for setMode action'
      );
    });
  });

  describe('testConnection', () => {
    it('should return true when connection is successful', async () => {
      mockSwitchBotClient.healthCheck.mockResolvedValue(true);

      const result = await api.testConnection();

      expect(result).toBe(true);
      expect(mockSwitchBotClient.healthCheck).toHaveBeenCalled();
    });

    it('should return false when connection fails', async () => {
      mockSwitchBotClient.healthCheck.mockResolvedValue(false);

      const result = await api.testConnection();

      expect(result).toBe(false);
    });
  });
});