/**
 * Air conditioner control routes tests
 */

import request from 'supertest';
import express from 'express';
import { deviceRoutes } from '../device.routes';
import { deviceService } from '../../services/device.service';
import { Device } from '../../models/device';

// Mock device service
jest.mock('../../services/device.service');
const mockDeviceService = deviceService as jest.Mocked<typeof deviceService>;

const app = express();
app.use(express.json());
app.use('/api/devices', deviceRoutes);

describe('Air Conditioner Control Routes', () => {
  const mockAirconDevice: Device = {
    deviceId: 'aircon-001',
    deviceName: 'リビングエアコン',
    deviceType: 'Air Conditioner',
    status: 'online',
    hubDeviceId: 'hub-001',
    enableCloudService: true,
    isInfraredRemote: true,
    remoteType: 'Air Conditioner',
    properties: {
      power: 'off',
      mode: 'auto',
      temperature: 25,
      fanSpeed: 'auto'
    },
    lastUpdated: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/devices/:deviceId/aircon/power', () => {
    it('should set air conditioner power to on', async () => {
      mockDeviceService.getDeviceById.mockResolvedValue(mockAirconDevice);
      mockDeviceService.controlDevice.mockResolvedValue();

      const response = await request(app)
        .post('/api/devices/aircon-001/aircon/power')
        .send({ power: 'on' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.power).toBe('on');
      expect(mockDeviceService.controlDevice).toHaveBeenCalledWith('aircon-001', 'turnOn');
    });

    it('should set air conditioner power to off', async () => {
      mockDeviceService.getDeviceById.mockResolvedValue(mockAirconDevice);
      mockDeviceService.controlDevice.mockResolvedValue();

      const response = await request(app)
        .post('/api/devices/aircon-001/aircon/power')
        .send({ power: 'off' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.power).toBe('off');
      expect(mockDeviceService.controlDevice).toHaveBeenCalledWith('aircon-001', 'turnOff');
    });

    it('should return 400 for invalid power value', async () => {
      const response = await request(app)
        .post('/api/devices/aircon-001/aircon/power')
        .send({ power: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for non-air conditioner device', async () => {
      const lightDevice = { ...mockAirconDevice, deviceType: 'Light' as const };
      mockDeviceService.getDeviceById.mockResolvedValue(lightDevice);

      const response = await request(app)
        .post('/api/devices/aircon-001/aircon/power')
        .send({ power: 'on' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_DEVICE_TYPE');
    });
  });

  describe('POST /api/devices/:deviceId/aircon/mode', () => {
    it('should set air conditioner mode to cool', async () => {
      mockDeviceService.getDeviceById.mockResolvedValue(mockAirconDevice);
      mockDeviceService.controlDevice.mockResolvedValue();

      const response = await request(app)
        .post('/api/devices/aircon-001/aircon/mode')
        .send({ mode: 'cool' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.mode).toBe('cool');
      expect(mockDeviceService.controlDevice).toHaveBeenCalledWith('aircon-001', 'setMode', 'cool');
    });

    it('should set air conditioner mode to heat', async () => {
      mockDeviceService.getDeviceById.mockResolvedValue(mockAirconDevice);
      mockDeviceService.controlDevice.mockResolvedValue();

      const response = await request(app)
        .post('/api/devices/aircon-001/aircon/mode')
        .send({ mode: 'heat' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.mode).toBe('heat');
      expect(mockDeviceService.controlDevice).toHaveBeenCalledWith('aircon-001', 'setMode', 'heat');
    });

    it('should return 400 for invalid mode', async () => {
      const response = await request(app)
        .post('/api/devices/aircon-001/aircon/mode')
        .send({ mode: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should accept all valid modes', async () => {
      mockDeviceService.getDeviceById.mockResolvedValue(mockAirconDevice);
      mockDeviceService.controlDevice.mockResolvedValue();

      const validModes = ['cool', 'heat', 'dry', 'auto', 'fan'];
      
      for (const mode of validModes) {
        const response = await request(app)
          .post('/api/devices/aircon-001/aircon/mode')
          .send({ mode });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.mode).toBe(mode);
      }
    });
  });

  describe('POST /api/devices/:deviceId/aircon/temperature', () => {
    it('should set air conditioner temperature to 22', async () => {
      mockDeviceService.getDeviceById.mockResolvedValue(mockAirconDevice);
      mockDeviceService.controlDevice.mockResolvedValue();

      const response = await request(app)
        .post('/api/devices/aircon-001/aircon/temperature')
        .send({ temperature: 22 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.temperature).toBe(22);
      expect(mockDeviceService.controlDevice).toHaveBeenCalledWith('aircon-001', 'setTemperature', '22');
    });

    it('should accept temperature at minimum boundary (16)', async () => {
      mockDeviceService.getDeviceById.mockResolvedValue(mockAirconDevice);
      mockDeviceService.controlDevice.mockResolvedValue();

      const response = await request(app)
        .post('/api/devices/aircon-001/aircon/temperature')
        .send({ temperature: 16 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.temperature).toBe(16);
    });

    it('should accept temperature at maximum boundary (30)', async () => {
      mockDeviceService.getDeviceById.mockResolvedValue(mockAirconDevice);
      mockDeviceService.controlDevice.mockResolvedValue();

      const response = await request(app)
        .post('/api/devices/aircon-001/aircon/temperature')
        .send({ temperature: 30 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.temperature).toBe(30);
    });

    it('should return 400 for temperature below minimum (15)', async () => {
      const response = await request(app)
        .post('/api/devices/aircon-001/aircon/temperature')
        .send({ temperature: 15 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for temperature above maximum (31)', async () => {
      const response = await request(app)
        .post('/api/devices/aircon-001/aircon/temperature')
        .send({ temperature: 31 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for non-numeric temperature', async () => {
      const response = await request(app)
        .post('/api/devices/aircon-001/aircon/temperature')
        .send({ temperature: 'hot' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/devices/:deviceId/aircon/toggle', () => {
    it('should toggle air conditioner from off to on', async () => {
      const offDevice = {
        ...mockAirconDevice,
        properties: { ...mockAirconDevice.properties, power: 'off' as const }
      };
      mockDeviceService.getDeviceById.mockResolvedValue(offDevice);
      mockDeviceService.controlDevice.mockResolvedValue();

      const response = await request(app)
        .post('/api/devices/aircon-001/aircon/toggle');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.previousState).toBe('off');
      expect(response.body.data.newState).toBe('on');
      expect(mockDeviceService.controlDevice).toHaveBeenCalledWith('aircon-001', 'turnOn');
    });

    it('should toggle air conditioner from on to off', async () => {
      const onDevice = {
        ...mockAirconDevice,
        properties: { ...mockAirconDevice.properties, power: 'on' as const }
      };
      mockDeviceService.getDeviceById.mockResolvedValue(onDevice);
      mockDeviceService.controlDevice.mockResolvedValue();

      const response = await request(app)
        .post('/api/devices/aircon-001/aircon/toggle');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.previousState).toBe('on');
      expect(response.body.data.newState).toBe('off');
      expect(mockDeviceService.controlDevice).toHaveBeenCalledWith('aircon-001', 'turnOff');
    });

    it('should handle device with no properties', async () => {
      const deviceWithoutProps = { ...mockAirconDevice, properties: undefined };
      mockDeviceService.getDeviceById.mockResolvedValue(deviceWithoutProps);
      mockDeviceService.controlDevice.mockResolvedValue();

      const response = await request(app)
        .post('/api/devices/aircon-001/aircon/toggle');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.previousState).toBe('off'); // Default to off
      expect(response.body.data.newState).toBe('on');
      expect(mockDeviceService.controlDevice).toHaveBeenCalledWith('aircon-001', 'turnOn');
    });
  });

  describe('Error Handling', () => {
    it('should handle device service errors', async () => {
      mockDeviceService.getDeviceById.mockRejectedValue(new Error('Device not found'));

      const response = await request(app)
        .post('/api/devices/aircon-001/aircon/power')
        .send({ power: 'on' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INTERNAL_ERROR');
    });

    it('should handle control device errors', async () => {
      mockDeviceService.getDeviceById.mockResolvedValue(mockAirconDevice);
      mockDeviceService.controlDevice.mockRejectedValue(new Error('Control failed'));

      const response = await request(app)
        .post('/api/devices/aircon-001/aircon/power')
        .send({ power: 'on' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INTERNAL_ERROR');
    });
  });
});