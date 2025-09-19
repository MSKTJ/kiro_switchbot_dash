/**
 * Device model tests
 */

import {
  Device,
  DeviceValidator,
  DeviceUtils,
  DeviceType,
  DeviceStatus,
  RawSwitchBotDevice,
  RawInfraredRemoteDevice
} from '../device';

describe('DeviceValidator', () => {
  describe('validateSwitchBotDevice', () => {
    it('should validate a valid SwitchBot device', () => {
      const rawDevice: RawSwitchBotDevice = {
        deviceId: 'test-device-001',
        deviceName: 'Test Light',
        deviceType: 'Light',
        enableCloudService: true,
        hubDeviceId: 'hub-001'
      };

      const result = DeviceValidator.validateSwitchBotDevice(rawDevice);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.device).toBeDefined();
      expect(result.device!.deviceId).toBe('test-device-001');
      expect(result.device!.deviceName).toBe('Test Light');
      expect(result.device!.deviceType).toBe('Light');
      expect(result.device!.isInfraredRemote).toBe(false);
    });

    it('should reject device with missing deviceId', () => {
      const rawDevice = {
        deviceName: 'Test Light',
        deviceType: 'Light',
        enableCloudService: true,
        hubDeviceId: 'hub-001'
      } as RawSwitchBotDevice;

      const result = DeviceValidator.validateSwitchBotDevice(rawDevice);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Device ID is required and must be a string');
    });

    it('should reject device with missing deviceName', () => {
      const rawDevice = {
        deviceId: 'test-device-001',
        deviceType: 'Light',
        enableCloudService: true,
        hubDeviceId: 'hub-001'
      } as RawSwitchBotDevice;

      const result = DeviceValidator.validateSwitchBotDevice(rawDevice);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Device name is required and must be a string');
    });

    it('should map Hub 2 device type correctly', () => {
      const rawDevice: RawSwitchBotDevice = {
        deviceId: 'hub-001',
        deviceName: 'Living Room Hub',
        deviceType: 'Hub 2',
        enableCloudService: true,
        hubDeviceId: ''
      };

      const result = DeviceValidator.validateSwitchBotDevice(rawDevice);

      expect(result.isValid).toBe(true);
      expect(result.device!.deviceType).toBe('Hub');
    });

    it('should map unknown device type to Unknown', () => {
      const rawDevice: RawSwitchBotDevice = {
        deviceId: 'unknown-001',
        deviceName: 'Unknown Device',
        deviceType: 'SomeNewDevice',
        enableCloudService: true,
        hubDeviceId: 'hub-001'
      };

      const result = DeviceValidator.validateSwitchBotDevice(rawDevice);

      expect(result.isValid).toBe(true);
      expect(result.device!.deviceType).toBe('Unknown');
    });
  });

  describe('validateInfraredRemoteDevice', () => {
    it('should validate a valid infrared remote device', () => {
      const rawDevice: RawInfraredRemoteDevice = {
        deviceId: 'ir-ac-001',
        deviceName: 'Living Room AC',
        remoteType: 'Air Conditioner',
        hubDeviceId: 'hub-001'
      };

      const result = DeviceValidator.validateInfraredRemoteDevice(rawDevice);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.device).toBeDefined();
      expect(result.device!.deviceId).toBe('ir-ac-001');
      expect(result.device!.deviceName).toBe('Living Room AC');
      expect(result.device!.deviceType).toBe('Air Conditioner');
      expect(result.device!.isInfraredRemote).toBe(true);
      expect(result.device!.remoteType).toBe('Air Conditioner');
    });

    it('should reject infrared device with missing remoteType', () => {
      const rawDevice = {
        deviceId: 'ir-ac-001',
        deviceName: 'Living Room AC',
        hubDeviceId: 'hub-001'
      } as RawInfraredRemoteDevice;

      const result = DeviceValidator.validateInfraredRemoteDevice(rawDevice);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Remote type is required and must be a string');
    });

    it('should map TV remote type to Unknown', () => {
      const rawDevice: RawInfraredRemoteDevice = {
        deviceId: 'ir-tv-001',
        deviceName: 'Living Room TV',
        remoteType: 'TV',
        hubDeviceId: 'hub-001'
      };

      const result = DeviceValidator.validateInfraredRemoteDevice(rawDevice);

      expect(result.isValid).toBe(true);
      expect(result.device!.deviceType).toBe('Unknown');
    });
  });

  describe('isControllableDevice', () => {
    it('should return true for controllable device types', () => {
      expect(DeviceValidator.isControllableDevice('Light')).toBe(true);
      expect(DeviceValidator.isControllableDevice('Air Conditioner')).toBe(true);
      expect(DeviceValidator.isControllableDevice('Bot')).toBe(true);
      expect(DeviceValidator.isControllableDevice('Curtain')).toBe(true);
      expect(DeviceValidator.isControllableDevice('Plug')).toBe(true);
    });

    it('should return false for non-controllable device types', () => {
      expect(DeviceValidator.isControllableDevice('Hub')).toBe(false);
      expect(DeviceValidator.isControllableDevice('Unknown')).toBe(false);
    });
  });

  describe('isEnvironmentDevice', () => {
    it('should return true for Hub devices', () => {
      expect(DeviceValidator.isEnvironmentDevice('Hub')).toBe(true);
    });

    it('should return false for non-environment device types', () => {
      expect(DeviceValidator.isEnvironmentDevice('Light')).toBe(false);
      expect(DeviceValidator.isEnvironmentDevice('Air Conditioner')).toBe(false);
      expect(DeviceValidator.isEnvironmentDevice('Unknown')).toBe(false);
    });
  });
});

describe('DeviceUtils', () => {
  const mockDevices: Device[] = [
    {
      deviceId: 'light-001',
      deviceName: 'Living Room Light',
      deviceType: 'Light',
      status: 'online',
      isInfraredRemote: false,
      lastUpdated: new Date()
    },
    {
      deviceId: 'ac-001',
      deviceName: 'Bedroom AC',
      deviceType: 'Air Conditioner',
      status: 'offline',
      isInfraredRemote: true,
      remoteType: 'Air Conditioner',
      lastUpdated: new Date()
    },
    {
      deviceId: 'hub-001',
      deviceName: 'Main Hub',
      deviceType: 'Hub',
      status: 'online',
      isInfraredRemote: false,
      lastUpdated: new Date()
    }
  ];

  describe('filterDevices', () => {
    it('should filter devices by type', () => {
      const filtered = DeviceUtils.filterDevices(mockDevices, { deviceType: 'Light' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].deviceType).toBe('Light');
    });

    it('should filter devices by status', () => {
      const filtered = DeviceUtils.filterDevices(mockDevices, { status: 'online' });
      expect(filtered).toHaveLength(2);
      expect(filtered.every(d => d.status === 'online')).toBe(true);
    });

    it('should filter controllable devices only', () => {
      const filtered = DeviceUtils.filterDevices(mockDevices, { controllableOnly: true });
      expect(filtered).toHaveLength(2);
      expect(filtered.every(d => ['Light', 'Air Conditioner'].includes(d.deviceType))).toBe(true);
    });

    it('should filter environment devices only', () => {
      const filtered = DeviceUtils.filterDevices(mockDevices, { environmentOnly: true });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].deviceType).toBe('Hub');
    });

    it('should apply multiple filters', () => {
      const filtered = DeviceUtils.filterDevices(mockDevices, {
        status: 'online',
        controllableOnly: true
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].deviceType).toBe('Light');
      expect(filtered[0].status).toBe('online');
    });
  });

  describe('groupDevicesByType', () => {
    it('should group devices by type', () => {
      const grouped = DeviceUtils.groupDevicesByType(mockDevices);
      
      expect(grouped['Light']).toHaveLength(1);
      expect(grouped['Air Conditioner']).toHaveLength(1);
      expect(grouped['Hub']).toHaveLength(1);
      expect(grouped['Bot']).toHaveLength(0);
      expect(grouped['Curtain']).toHaveLength(0);
      expect(grouped['Plug']).toHaveLength(0);
      expect(grouped['Unknown']).toHaveLength(0);
    });
  });

  describe('getDeviceDisplayName', () => {
    it('should return display name for regular device', () => {
      const device = mockDevices[0];
      const displayName = DeviceUtils.getDeviceDisplayName(device);
      expect(displayName).toBe('Living Room Light (Light)');
    });

    it('should return display name for infrared remote device', () => {
      const device = mockDevices[1];
      const displayName = DeviceUtils.getDeviceDisplayName(device);
      expect(displayName).toBe('Bedroom AC (Air Conditioner (IR))');
    });
  });

  describe('isRecentlyUpdated', () => {
    it('should return true for recently updated device', () => {
      const device: Device = {
        ...mockDevices[0],
        lastUpdated: new Date() // Just now
      };
      
      expect(DeviceUtils.isRecentlyUpdated(device, 5)).toBe(true);
    });

    it('should return false for old device', () => {
      const device: Device = {
        ...mockDevices[0],
        lastUpdated: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
      };
      
      expect(DeviceUtils.isRecentlyUpdated(device, 5)).toBe(false);
    });
  });
});