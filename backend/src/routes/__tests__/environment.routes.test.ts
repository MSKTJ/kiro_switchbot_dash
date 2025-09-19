/**
 * Unit tests for environment routes
 */

import request from 'supertest';
import express from 'express';
import { environmentRoutes } from '../environment.routes';
import { EnvironmentData } from '../../models/environment';

// Mock the environment service
jest.mock('../../services/environment.service', () => ({
  EnvironmentServiceError: class extends Error {
    constructor(message: string, public code: string, public originalError?: any) {
      super(message);
      this.name = 'EnvironmentServiceError';
    }
  },
  environmentService: {
    getCurrentEnvironmentData: jest.fn(),
    testConnection: jest.fn()
  }
}));

// Get the mocked functions and class
const { environmentService, EnvironmentServiceError: MockEnvironmentServiceError } = require('../../services/environment.service');
const mockGetCurrentEnvironmentData = environmentService.getCurrentEnvironmentData as jest.MockedFunction<any>;
const mockTestConnection = environmentService.testConnection as jest.MockedFunction<any>;

// Create test app
const app = express();
app.use(express.json());
app.use('/api/environment', environmentRoutes);

describe('Environment Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentEnvironmentData.mockReset();
    mockTestConnection.mockReset();
  });

  describe('GET /api/environment', () => {
    it('should return environment data successfully', async () => {
      const mockData: EnvironmentData = {
        temperature: 25.5,
        humidity: 60,
        light: 500,
        timestamp: new Date('2023-12-01T10:00:00Z')
      };

      mockGetCurrentEnvironmentData.mockResolvedValue(mockData);

      const response = await request(app)
        .get('/api/environment')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          temperature: 25.5,
          humidity: 60,
          light: 500,
          timestamp: '2023-12-01T10:00:00.000Z'
        }
      });

      expect(mockGetCurrentEnvironmentData).toHaveBeenCalledTimes(1);
    });

    it('should handle HUB_NOT_FOUND error', async () => {
      const error = new MockEnvironmentServiceError('No SwitchBot Hub 2 device found', 'HUB_NOT_FOUND');
      mockGetCurrentEnvironmentData.mockRejectedValue(error);

      const response = await request(app)
        .get('/api/environment')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'HUB_NOT_FOUND',
          message: 'No SwitchBot Hub 2 device found'
        }
      });
    });

    it('should handle VALIDATION_ERROR', async () => {
      const error = new MockEnvironmentServiceError('Invalid temperature value', 'VALIDATION_ERROR');
      mockGetCurrentEnvironmentData.mockRejectedValue(error);

      const response = await request(app)
        .get('/api/environment')
        .expect(422);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid temperature value'
        }
      });
    });

    it('should handle API_ERROR', async () => {
      const error = new MockEnvironmentServiceError('SwitchBot API failed', 'API_ERROR');
      mockGetCurrentEnvironmentData.mockRejectedValue(error);

      const response = await request(app)
        .get('/api/environment')
        .expect(502);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'API_ERROR',
          message: 'SwitchBot API failed'
        }
      });
    });

    it('should handle UNKNOWN_ERROR', async () => {
      const error = new MockEnvironmentServiceError('Something went wrong', 'UNKNOWN_ERROR');
      mockGetCurrentEnvironmentData.mockRejectedValue(error);

      const response = await request(app)
        .get('/api/environment')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'Something went wrong'
        }
      });
    });

    it('should handle unexpected errors', async () => {
      mockGetCurrentEnvironmentData.mockRejectedValue(
        new Error('Unexpected error')
      );

      const response = await request(app)
        .get('/api/environment')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while retrieving environment data'
        }
      });
    });
  });

  describe('GET /api/environment/test', () => {
    it('should return connection status when working', async () => {
      mockTestConnection.mockResolvedValue(true);

      const response = await request(app)
        .get('/api/environment/test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.connected).toBe(true);
      expect(response.body.data.timestamp).toBeDefined();
      expect(mockTestConnection).toHaveBeenCalledTimes(1);
    });

    it('should return connection status when not working', async () => {
      mockTestConnection.mockResolvedValue(false);

      const response = await request(app)
        .get('/api/environment/test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.connected).toBe(false);
      expect(response.body.data.timestamp).toBeDefined();
    });

    it('should handle test connection errors', async () => {
      mockTestConnection.mockRejectedValue(
        new Error('Test failed')
      );

      const response = await request(app)
        .get('/api/environment/test')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'TEST_FAILED',
          message: 'Environment service test failed'
        }
      });
    });
  });
});