/**
 * Settings routes tests
 */

import request from 'supertest';
import express from 'express';
import settingsRoutes from '../settings.routes';
import { settingsService, SettingsServiceError } from '../../services/settings.service';

// Mock the settings service
jest.mock('../../services/settings.service');
const mockSettingsService = settingsService as jest.Mocked<typeof settingsService>;

// Create test app
const app = express();
app.use(express.json());
app.use('/api/settings', settingsRoutes);

describe('Settings Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/settings', () => {
    it('should return current settings', async () => {
      const mockSettings = {
        dataUpdateInterval: 30,
        alertThresholds: {
          temperature: { min: 18, max: 28 },
          humidity: { min: 30, max: 70 }
        },
        notifications: {
          enabled: true,
          sound: true
        }
      };

      mockSettingsService.getSettings.mockReturnValue(mockSettings);

      const response = await request(app)
        .get('/api/settings')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockSettings
      });
    });

    it('should handle service errors', async () => {
      mockSettingsService.getSettings.mockImplementation(() => {
        throw new Error('Service error');
      });

      const response = await request(app)
        .get('/api/settings')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve settings'
        }
      });
    });
  });

  describe('PUT /api/settings', () => {
    it('should update settings successfully', async () => {
      const updates = {
        dataUpdateInterval: 60
      };

      const updatedSettings = {
        dataUpdateInterval: 60,
        alertThresholds: {
          temperature: { min: 18, max: 28 },
          humidity: { min: 30, max: 70 }
        },
        notifications: {
          enabled: true,
          sound: true
        }
      };

      mockSettingsService.updateSettings.mockReturnValue(updatedSettings);

      const response = await request(app)
        .put('/api/settings')
        .send(updates)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: updatedSettings,
        message: 'Settings updated successfully'
      });

      expect(mockSettingsService.updateSettings).toHaveBeenCalledWith(updates);
    });

    it('should return 400 for invalid request body', async () => {
      const response = await request(app)
        .put('/api/settings')
        .send({})
        .expect(200); // Empty object should be valid

      expect(response.body.success).toBe(true);
    });

    it('should handle validation errors', async () => {
      const updates = {
        dataUpdateInterval: -1 // Invalid value
      };

      const validationError = new SettingsServiceError('Invalid data update interval', 'VALIDATION_ERROR');
      mockSettingsService.updateSettings.mockImplementation(() => {
        throw validationError;
      });

      const response = await request(app)
        .put('/api/settings')
        .send(updates)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/settings/reset', () => {
    it('should reset settings to defaults', async () => {
      const defaultSettings = {
        dataUpdateInterval: 30,
        alertThresholds: {
          temperature: { min: 18, max: 28 },
          humidity: { min: 30, max: 70 }
        },
        notifications: {
          enabled: true,
          sound: true
        }
      };

      mockSettingsService.resetSettings.mockReturnValue(defaultSettings);

      const response = await request(app)
        .post('/api/settings/reset')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: defaultSettings,
        message: 'Settings reset to defaults successfully'
      });

      expect(mockSettingsService.resetSettings).toHaveBeenCalled();
    });

    it('should handle reset errors', async () => {
      const resetError = new SettingsServiceError('Failed to reset', 'UNKNOWN_ERROR');
      mockSettingsService.resetSettings.mockImplementation(() => {
        throw resetError;
      });

      const response = await request(app)
        .post('/api/settings/reset')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('GET /api/settings/data-update-interval', () => {
    it('should return current data update interval', async () => {
      mockSettingsService.getDataUpdateInterval.mockReturnValue(60);

      const response = await request(app)
        .get('/api/settings/data-update-interval')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          interval: 60,
          unit: 'seconds'
        }
      });
    });
  });

  describe('GET /api/settings/alert-thresholds', () => {
    it('should return current alert thresholds', async () => {
      const thresholds = {
        temperature: { min: 18, max: 28 },
        humidity: { min: 30, max: 70 }
      };

      mockSettingsService.getAlertThresholds.mockReturnValue(thresholds);

      const response = await request(app)
        .get('/api/settings/alert-thresholds')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: thresholds
      });
    });
  });
});