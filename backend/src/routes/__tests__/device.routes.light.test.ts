/**
 * Tests for light control API endpoints
 */

import request from 'supertest';
import express from 'express';
import { deviceRoutes } from '../device.routes';
import { deviceService } from '../../services/device.service';
import { Device } from '../../models/device';

// Mock the device service
jest.mock('../../services/device.service');
const mockDeviceService = deviceService as jest.Mocked<typeof deviceService>;

const app = express();
app.use(express.json());
app.use('/api/devices', deviceRoutes);

describe('Light Control API Endpoints', () => {
  const mockLightDevice: Device = {
    deviceId: 'light-001',
    deviceName: 'Test Light',
    deviceType: 'Light',
    status: 'online',
    hubDeviceId: 'hub-001',
    enableCloudService: true,
    isInfraredRemote: false,
    properties: {
      power: 'off' as const,
      brightness: 50
    },
    lastUpdated: new Date()
  };

  const mockNonLightDevice: Device = {
    deviceId: 'hub-001',
    deviceName: 'Test Hub',
    deviceType: 'Hub',
    status: 'online',
    properties: {
      temperature: 25,
      humidity: 60
    },
    lastUpdated: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/devices/:deviceId/light/toggle', () => {
    it('should toggle light from off to on', async () => {
      mockDeviceService.getDeviceById.mockResolvedValue(mockLightDevice);
      mockDeviceService.controlDevice.mockResolvedValue();

      const response = await request(app)
        .post('/api/devices/light-001/light/toggle')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.command).toBe('turnOn');
      expect(response.body.data.previousState).toBe('off');
      expect(response.body.data.newState).toBe('on');
      expect(mockDeviceService.controlDevice).toHaveBeenCalledWith('light-001', 'turnOn');
    });

    it('should toggle light from on to off', async () => {
      const onLightDevice = { ...mockLightDevice, properties: { power: 'on' as const, brightness: 75 } };
      mockDeviceService.getDeviceById.mockResolvedValue(onLightDevice);
      mockDeviceService.controlDevice.mockResolvedValue();

      const response = await request(app)
        .post('/api/devices/light-001/light/toggle')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.command).toBe('turnOff');
      expect(response.body.data.previousState).toBe('on');
      expect(response.body.data.newState).toBe('off');
      expect(mockDeviceService.controlDevice).toHaveBeenCalledWith('light-001', 'turnOff');
    });

    it('should return error for non-light device', async () => {
      mockDeviceService.getDeviceById.mockResolvedValue(mockNonLightDevice);

      const response = await request(app)
        .post('/api/devices/hub-001/light/toggle')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_DEVICE_TYPE');
      expect(response.body.error.message).toBe('Device is not a light');
    });

    it('should handle device not found error', async () => {
      mockDeviceService.getDeviceById.mockRejectedValue(new Error('Device not found'));

      const response = await request(app)
        .post('/api/devices/nonexistent/light/toggle')
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should handle control device error', async () => {
      mockDeviceService.getDeviceById.mockResolvedValue(mockLightDevice);
      mockDeviceService.controlDevice.mockRejectedValue(new Error('Control failed'));

      const response = await request(app)
        .post('/api/devices/light-001/light/toggle')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/devices/:deviceId/light/brightness', () => {
    it('should set brightness successfully', async () => {
      mockDeviceService.getDeviceById.mockResolvedValue(mockLightDevice);
      mockDeviceService.controlDevice.mockResolvedValue();

      const response = await request(app)
        .post('/api/devices/light-001/light/brightness')
        .send({ brightness: 75 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.command).toBe('setBrightness');
      expect(response.body.data.brightness).toBe(75);
      expect(mockDeviceService.controlDevice).toHaveBeenCalledWith('light-001', 'setBrightness', '75');
    });

    it('should validate brightness range - too low', async () => {
      const response = await request(app)
        .post('/api/devices/light-001/light/brightness')
        .send({ brightness: -10 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toBe('Brightness must be a number between 0 and 100');
    });

    it('should validate brightness range - too high', async () => {
      const response = await request(app)
        .post('/api/devices/light-001/light/brightness')
        .send({ brightness: 150 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate brightness type', async () => {
      const response = await request(app)
        .post('/api/devices/light-001/light/brightness')
        .send({ brightness: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return error for non-light device', async () => {
      mockDeviceService.getDeviceById.mockResolvedValue(mockNonLightDevice);

      const response = await request(app)
        .post('/api/devices/hub-001/light/brightness')
        .send({ brightness: 50 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_DEVICE_TYPE');
    });
  });

  describe('POST /api/devices/:deviceId/light/power', () => {
    it('should turn light on', async () => {
      mockDeviceService.getDeviceById.mockResolvedValue(mockLightDevice);
      mockDeviceService.controlDevice.mockResolvedValue();

      const response = await request(app)
        .post('/api/devices/light-001/light/power')
        .send({ power: 'on' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.command).toBe('turnOn');
      expect(response.body.data.power).toBe('on');
      expect(mockDeviceService.controlDevice).toHaveBeenCalledWith('light-001', 'turnOn');
    });

    it('should turn light off', async () => {
      mockDeviceService.getDeviceById.mockResolvedValue(mockLightDevice);
      mockDeviceService.controlDevice.mockResolvedValue();

      const response = await request(app)
        .post('/api/devices/light-001/light/power')
        .send({ power: 'off' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.command).toBe('turnOff');
      expect(response.body.data.power).toBe('off');
      expect(mockDeviceService.controlDevice).toHaveBeenCalledWith('light-001', 'turnOff');
    });

    it('should validate power value', async () => {
      const response = await request(app)
        .post('/api/devices/light-001/light/power')
        .send({ power: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toBe('Power must be either "on" or "off"');
    });

    it('should return error for non-light device', async () => {
      mockDeviceService.getDeviceById.mockResolvedValue(mockNonLightDevice);

      const response = await request(app)
        .post('/api/devices/hub-001/light/power')
        .send({ power: 'on' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_DEVICE_TYPE');
    });
  });
});