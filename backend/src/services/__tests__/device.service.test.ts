/**
 * Device service tests
 */

import { DeviceService, DeviceServiceError } from '../device.service';
import { switchBotAPI } from '../../utils/switchbot-api';
import { Device, DeviceType } from '../../models/device';

// Mock the switchBotAPI
jest.mock('../../utils/switchbot-api');
const mockSwitchBotAPI = switchBotAPI as jest.Mocked<typeof switchBotAPI>;

describe('DeviceService', () => {
  let deviceService: DeviceService;

  beforeEach(() => {
    deviceService = new DeviceService();
    jest.clearAllMocks();
  });

  const mockDeviceListResponse = {
    statusCode: 100,
    body: {
      deviceList: [
        {
          deviceId: 'light-001',
          deviceName: 'Living Room Light',
          deviceType: 'Light',
          enableCloudService: true,
          hubDeviceId: 'hub-001'
        },
        {
          deviceId: 'hub-001',
          deviceName: 'Main Hub',
          deviceType: 'Hub 2',
          enableCloudService: true,
          hubDeviceId: ''
        }
      ],
      infraredRemoteList: [
        {
          deviceId: 'ac-001',
          deviceName: 'Bedroom AC',
          remoteType: 'Air Conditioner',
          hubDeviceId: 'hub-001'
        }
      ]
    },
    message: 'success'
  };

  describe('getAllDevices', () => {
    it('should fetch and return all devices', async () => {
      mockSwitchBotAPI.getDevices.mockResolvedValue(mockDeviceListResponse);

      const devices = await deviceService.getAllDevices();

      expect(devices).toHaveLength(3);
      expect(devices[0].deviceId).toBe('light-001');
      expect(devices[0].deviceType).toBe('Light');
      expect(devices[0].isInfraredRemote).toBe(false);
      
      expect(devices[1].deviceId).toBe('hub-001');
      expect(devices[1].deviceType).toBe('Hub');
      
      expect(devices[2].deviceId).toBe('ac-001');
      expect(devices[2].deviceType).toBe('Air Conditioner');
      expect(devices[2].isInfraredRemote).toBe(true);
    });

    it('should use cached devices when cache is valid', async () => {
      mockSwitchBotAPI.getDevices.mockResolvedValue(mockDeviceListResponse);

      // First call should fetch from API
      await deviceService.getAllDevices();
      expect(mockSwitchBotAPI.getDevices).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await deviceService.getAllDevices();
      expect(mockSwitchBotAPI.getDevices).toHaveBeenCalledTimes(1);
    });

    it('should force refresh when requested', async () => {
      mockSwitchBotAPI.getDevices.mockResolvedValue(mockDeviceListResponse);

      // First call
      await deviceService.getAllDevices();
      expect(mockSwitchBotAPI.getDevices).toHaveBeenCalledTimes(1);

      // Force refresh
      await deviceService.getAllDevices(true);
      expect(mockSwitchBotAPI.getDevices).toHaveBeenCalledTimes(2);
    });

    it('should throw DeviceServiceError on API error', async () => {
      const apiError = new Error('API Error');
      mockSwitchBotAPI.getDevices.mockRejectedValue(apiError);

      await expect(deviceService.getAllDevices()).rejects.toThrow(DeviceServiceError);
      await expect(deviceService.getAllDevices()).rejects.toThrow('Unknown error occurred while fetching devices');
    });
  });

  describe('getFilteredDevices', () => {
    beforeEach(async () => {
      mockSwitchBotAPI.getDevices.mockResolvedValue(mockDeviceListResponse);
      await deviceService.getAllDevices(); // Populate cache
    });

    it('should filter devices by type', async () => {
      const lightDevices = await deviceService.getFilteredDevices({ deviceType: 'Light' });
      expect(lightDevices).toHaveLength(1);
      expect(lightDevices[0].deviceType).toBe('Light');
    });

    it('should filter controllable devices only', async () => {
      const controllableDevices = await deviceService.getFilteredDevices({ controllableOnly: true });
      expect(controllableDevices).toHaveLength(2); // Light and Air Conditioner
      expect(controllableDevices.every(d => ['Light', 'Air Conditioner'].includes(d.deviceType))).toBe(true);
    });

    it('should filter environment devices only', async () => {
      const environmentDevices = await deviceService.getFilteredDevices({ environmentOnly: true });
      expect(environmentDevices).toHaveLength(1);
      expect(environmentDevices[0].deviceType).toBe('Hub');
    });
  });

  describe('getDeviceById', () => {
    beforeEach(async () => {
      mockSwitchBotAPI.getDevices.mockResolvedValue(mockDeviceListResponse);
      await deviceService.getAllDevices(); // Populate cache
    });

    it('should return device by ID', async () => {
      const device = await deviceService.getDeviceById('light-001');
      expect(device.deviceId).toBe('light-001');
      expect(device.deviceName).toBe('Living Room Light');
    });

    it('should throw error for non-existent device', async () => {
      await expect(deviceService.getDeviceById('non-existent')).rejects.toThrow(DeviceServiceError);
      await expect(deviceService.getDeviceById('non-existent')).rejects.toThrow('Device with ID non-existent not found');
    });
  });

  describe('getDevicesGroupedByType', () => {
    beforeEach(async () => {
      mockSwitchBotAPI.getDevices.mockResolvedValue(mockDeviceListResponse);
      await deviceService.getAllDevices(); // Populate cache
    });

    it('should group devices by type', async () => {
      const grouped = await deviceService.getDevicesGroupedByType();
      
      expect(grouped['Light']).toHaveLength(1);
      expect(grouped['Air Conditioner']).toHaveLength(1);
      expect(grouped['Hub']).toHaveLength(1);
      expect(grouped['Bot']).toHaveLength(0);
      expect(grouped['Curtain']).toHaveLength(0);
      expect(grouped['Plug']).toHaveLength(0);
      expect(grouped['Unknown']).toHaveLength(0);
    });
  });

  describe('getControllableDevices', () => {
    beforeEach(async () => {
      mockSwitchBotAPI.getDevices.mockResolvedValue(mockDeviceListResponse);
      await deviceService.getAllDevices(); // Populate cache
    });

    it('should return only controllable devices', async () => {
      const controllableDevices = await deviceService.getControllableDevices();
      expect(controllableDevices).toHaveLength(2);
      expect(controllableDevices.every(d => ['Light', 'Air Conditioner'].includes(d.deviceType))).toBe(true);
    });
  });

  describe('getEnvironmentDevices', () => {
    beforeEach(async () => {
      mockSwitchBotAPI.getDevices.mockResolvedValue(mockDeviceListResponse);
      await deviceService.getAllDevices(); // Populate cache
    });

    it('should return only environment devices', async () => {
      const environmentDevices = await deviceService.getEnvironmentDevices();
      expect(environmentDevices).toHaveLength(1);
      expect(environmentDevices[0].deviceType).toBe('Hub');
    });
  });

  describe('updateDeviceStatus', () => {
    beforeEach(async () => {
      mockSwitchBotAPI.getDevices.mockResolvedValue(mockDeviceListResponse);
      await deviceService.getAllDevices(); // Populate cache
    });

    it('should update device status successfully', async () => {
      const mockStatusResponse = {
        statusCode: 100,
        body: {
          power: 'on',
          brightness: 80
        },
        message: 'success'
      };
      
      mockSwitchBotAPI.getDeviceStatus.mockResolvedValue(mockStatusResponse);

      const device = await deviceService.updateDeviceStatus('light-001');
      
      expect(device.status).toBe('online');
      expect(device.properties).toEqual({
        power: 'on',
        brightness: 80,
        colorTemperature: undefined,
        color: undefined
      });
      expect(mockSwitchBotAPI.getDeviceStatus).toHaveBeenCalledWith('light-001');
    });

    it('should mark device as offline on status update failure', async () => {
      const apiError = new Error('Device not responding');
      mockSwitchBotAPI.getDeviceStatus.mockRejectedValue(apiError);

      await expect(deviceService.updateDeviceStatus('light-001')).rejects.toThrow(DeviceServiceError);
      
      // Device should be marked as offline in cache
      const device = await deviceService.getDeviceById('light-001');
      expect(device.status).toBe('offline');
    });
  });

  describe('controlDevice', () => {
    beforeEach(async () => {
      mockSwitchBotAPI.getDevices.mockResolvedValue(mockDeviceListResponse);
      await deviceService.getAllDevices(); // Populate cache
    });

    it('should control device successfully', async () => {
      const mockCommandResponse = {
        statusCode: 100,
        body: {},
        message: 'success'
      };
      
      mockSwitchBotAPI.sendDeviceCommand.mockResolvedValue(mockCommandResponse);

      await deviceService.controlDevice('light-001', 'turnOn');
      
      expect(mockSwitchBotAPI.sendDeviceCommand).toHaveBeenCalledWith('light-001', 'turnOn', undefined);
    });

    it('should throw error for non-controllable device', async () => {
      await expect(deviceService.controlDevice('hub-001', 'turnOn')).rejects.toThrow(DeviceServiceError);
      await expect(deviceService.controlDevice('hub-001', 'turnOn')).rejects.toThrow('Device type Hub is not controllable');
    });

    it('should throw error on control failure', async () => {
      const apiError = new Error('Control failed');
      mockSwitchBotAPI.sendDeviceCommand.mockRejectedValue(apiError);

      await expect(deviceService.controlDevice('light-001', 'turnOn')).rejects.toThrow(DeviceServiceError);
    });
  });

  describe('testDeviceConnectivity', () => {
    beforeEach(async () => {
      mockSwitchBotAPI.getDevices.mockResolvedValue(mockDeviceListResponse);
      await deviceService.getAllDevices(); // Populate cache
    });

    it('should return true for successful connectivity test', async () => {
      const mockStatusResponse = {
        statusCode: 100,
        body: { power: 'on' },
        message: 'success'
      };
      
      mockSwitchBotAPI.getDeviceStatus.mockResolvedValue(mockStatusResponse);

      const isConnected = await deviceService.testDeviceConnectivity('light-001');
      expect(isConnected).toBe(true);
    });

    it('should return false for failed connectivity test', async () => {
      const apiError = new Error('Device not responding');
      mockSwitchBotAPI.getDeviceStatus.mockRejectedValue(apiError);

      const isConnected = await deviceService.testDeviceConnectivity('light-001');
      expect(isConnected).toBe(false);
    });
  });

  describe('getDeviceStatistics', () => {
    beforeEach(async () => {
      mockSwitchBotAPI.getDevices.mockResolvedValue(mockDeviceListResponse);
      await deviceService.getAllDevices(); // Populate cache
    });

    it('should return device statistics', async () => {
      const stats = await deviceService.getDeviceStatistics();
      
      expect(stats.total).toBe(3);
      expect(stats.unknown).toBe(3); // All devices start with unknown status
      expect(stats.controllable).toBe(2);
      expect(stats.byType['Light']).toBe(1);
      expect(stats.byType['Air Conditioner']).toBe(1);
      expect(stats.byType['Hub']).toBe(1);
    });
  });

  describe('clearCache', () => {
    it('should clear device cache', async () => {
      mockSwitchBotAPI.getDevices.mockResolvedValue(mockDeviceListResponse);
      
      // Populate cache
      await deviceService.getAllDevices();
      expect(mockSwitchBotAPI.getDevices).toHaveBeenCalledTimes(1);
      
      // Clear cache
      deviceService.clearCache();
      
      // Next call should fetch from API again
      await deviceService.getAllDevices();
      expect(mockSwitchBotAPI.getDevices).toHaveBeenCalledTimes(2);
    });
  });
});