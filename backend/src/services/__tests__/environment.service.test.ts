/**
 * Unit tests for environment service
 */

import { EnvironmentService, EnvironmentServiceError } from '../environment.service';
import { switchBotAPI, SwitchBotAPIError } from '../../utils/switchbot-api';
import { EnvironmentData } from '../../models/environment';

// Mock the switchBotAPI
jest.mock('../../utils/switchbot-api');
const mockSwitchBotAPI = switchBotAPI as jest.Mocked<typeof switchBotAPI>;

describe('EnvironmentService', () => {
  let environmentService: EnvironmentService;

  beforeEach(() => {
    environmentService = new EnvironmentService();
    jest.clearAllMocks();
  });

  describe('getCurrentEnvironmentData', () => {
    it('should return valid environment data', async () => {
      // Mock device list response
      mockSwitchBotAPI.getDevices.mockResolvedValue({
        statusCode: 100,
        body: {
          deviceList: [
            {
              deviceId: 'hub-123',
              deviceName: 'Living Room Hub',
              deviceType: 'Hub 2',
              enableCloudService: true,
              hubDeviceId: 'hub-123'
            }
          ],
          infraredRemoteList: []
        },
        message: 'success'
      });

      // Mock device status response
      mockSwitchBotAPI.getDeviceStatus.mockResolvedValue({
        statusCode: 100,
        body: {
          temperature: 25.5,
          humidity: 60,
          lightLevel: 500
        },
        message: 'success'
      });

      const result = await environmentService.getCurrentEnvironmentData();

      expect(result).toBeDefined();
      expect(result.temperature).toBe(25.5);
      expect(result.humidity).toBe(60);
      expect(result.light).toBe(500);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(mockSwitchBotAPI.getDevices).toHaveBeenCalledTimes(1);
      expect(mockSwitchBotAPI.getDeviceStatus).toHaveBeenCalledWith('hub-123');
    });

    it('should cache hub device ID for subsequent calls', async () => {
      // Mock device list response
      mockSwitchBotAPI.getDevices.mockResolvedValue({
        statusCode: 100,
        body: {
          deviceList: [
            {
              deviceId: 'hub-123',
              deviceName: 'Living Room Hub',
              deviceType: 'Hub 2',
              enableCloudService: true,
              hubDeviceId: 'hub-123'
            }
          ],
          infraredRemoteList: []
        },
        message: 'success'
      });

      // Mock device status response
      mockSwitchBotAPI.getDeviceStatus.mockResolvedValue({
        statusCode: 100,
        body: {
          temperature: 25.5,
          humidity: 60,
          lightLevel: 500
        },
        message: 'success'
      });

      // First call
      await environmentService.getCurrentEnvironmentData();
      
      // Second call
      await environmentService.getCurrentEnvironmentData();

      // getDevices should only be called once (cached)
      expect(mockSwitchBotAPI.getDevices).toHaveBeenCalledTimes(1);
      expect(mockSwitchBotAPI.getDeviceStatus).toHaveBeenCalledTimes(2);
    });

    it('should throw error when no Hub 2 device is found', async () => {
      // Mock device list response with no Hub 2
      mockSwitchBotAPI.getDevices.mockResolvedValue({
        statusCode: 100,
        body: {
          deviceList: [
            {
              deviceId: 'light-123',
              deviceName: 'Living Room Light',
              deviceType: 'Color Bulb',
              enableCloudService: true,
              hubDeviceId: 'hub-123'
            }
          ],
          infraredRemoteList: []
        },
        message: 'success'
      });

      await expect(environmentService.getCurrentEnvironmentData())
        .rejects
        .toThrow(EnvironmentServiceError);

      await expect(environmentService.getCurrentEnvironmentData())
        .rejects
        .toThrow('No SwitchBot Hub 2 device found');
    });

    it('should handle SwitchBot API errors when getting devices', async () => {
      mockSwitchBotAPI.getDevices.mockRejectedValue(
        new SwitchBotAPIError('API rate limit exceeded', 429)
      );

      await expect(environmentService.getCurrentEnvironmentData())
        .rejects
        .toThrow(EnvironmentServiceError);

      await expect(environmentService.getCurrentEnvironmentData())
        .rejects
        .toThrow('Failed to retrieve device list from SwitchBot API');
    });

    it('should handle SwitchBot API errors when getting device status', async () => {
      // Mock successful device list response
      mockSwitchBotAPI.getDevices.mockResolvedValue({
        statusCode: 100,
        body: {
          deviceList: [
            {
              deviceId: 'hub-123',
              deviceName: 'Living Room Hub',
              deviceType: 'Hub 2',
              enableCloudService: true,
              hubDeviceId: 'hub-123'
            }
          ],
          infraredRemoteList: []
        },
        message: 'success'
      });

      // Mock failed device status response
      mockSwitchBotAPI.getDeviceStatus.mockRejectedValue(
        new SwitchBotAPIError('Device not responding', 500)
      );

      await expect(environmentService.getCurrentEnvironmentData())
        .rejects
        .toThrow(EnvironmentServiceError);

      await expect(environmentService.getCurrentEnvironmentData())
        .rejects
        .toThrow('Failed to retrieve environment data from SwitchBot Hub');
    });

    it('should handle validation errors', async () => {
      // Mock device list response
      mockSwitchBotAPI.getDevices.mockResolvedValue({
        statusCode: 100,
        body: {
          deviceList: [
            {
              deviceId: 'hub-123',
              deviceName: 'Living Room Hub',
              deviceType: 'Hub 2',
              enableCloudService: true,
              hubDeviceId: 'hub-123'
            }
          ],
          infraredRemoteList: []
        },
        message: 'success'
      });

      // Mock device status response with invalid data
      mockSwitchBotAPI.getDeviceStatus.mockResolvedValue({
        statusCode: 100,
        body: {
          temperature: 'invalid',
          humidity: -50,
          lightLevel: null
        },
        message: 'success'
      });

      await expect(environmentService.getCurrentEnvironmentData())
        .rejects
        .toThrow(EnvironmentServiceError);

      await expect(environmentService.getCurrentEnvironmentData())
        .rejects
        .toThrow('Invalid environment data');
    });

    it('should handle unexpected errors', async () => {
      mockSwitchBotAPI.getDevices.mockRejectedValue(new Error('Unexpected error'));

      await expect(environmentService.getCurrentEnvironmentData())
        .rejects
        .toThrow(EnvironmentServiceError);

      await expect(environmentService.getCurrentEnvironmentData())
        .rejects
        .toThrow('Unexpected error while retrieving environment data');
    });
  });

  describe('testConnection', () => {
    it('should return true when connection is successful', async () => {
      // Mock successful responses
      mockSwitchBotAPI.getDevices.mockResolvedValue({
        statusCode: 100,
        body: {
          deviceList: [
            {
              deviceId: 'hub-123',
              deviceName: 'Living Room Hub',
              deviceType: 'Hub 2',
              enableCloudService: true,
              hubDeviceId: 'hub-123'
            }
          ],
          infraredRemoteList: []
        },
        message: 'success'
      });

      mockSwitchBotAPI.getDeviceStatus.mockResolvedValue({
        statusCode: 100,
        body: {
          temperature: 25.5,
          humidity: 60,
          lightLevel: 500
        },
        message: 'success'
      });

      const result = await environmentService.testConnection();

      expect(result).toBe(true);
    });

    it('should return false when connection fails', async () => {
      mockSwitchBotAPI.getDevices.mockRejectedValue(
        new SwitchBotAPIError('Connection failed', 500)
      );

      const result = await environmentService.testConnection();

      expect(result).toBe(false);
    });
  });

  describe('resetHubCache', () => {
    it('should reset cached hub device ID', async () => {
      // Mock device list response
      mockSwitchBotAPI.getDevices.mockResolvedValue({
        statusCode: 100,
        body: {
          deviceList: [
            {
              deviceId: 'hub-123',
              deviceName: 'Living Room Hub',
              deviceType: 'Hub 2',
              enableCloudService: true,
              hubDeviceId: 'hub-123'
            }
          ],
          infraredRemoteList: []
        },
        message: 'success'
      });

      mockSwitchBotAPI.getDeviceStatus.mockResolvedValue({
        statusCode: 100,
        body: {
          temperature: 25.5,
          humidity: 60,
          lightLevel: 500
        },
        message: 'success'
      });

      // First call to cache the hub ID
      await environmentService.getCurrentEnvironmentData();
      expect(mockSwitchBotAPI.getDevices).toHaveBeenCalledTimes(1);

      // Reset cache
      environmentService.resetHubCache();

      // Second call should fetch devices again
      await environmentService.getCurrentEnvironmentData();
      expect(mockSwitchBotAPI.getDevices).toHaveBeenCalledTimes(2);
    });
  });
});