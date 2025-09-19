/**
 * Environment data API routes
 */

import { Router, Request, Response } from 'express';
import { environmentService, EnvironmentServiceError } from '../services/environment.service';
import { environmentHistoryService, TimePeriod } from '../services/environment-history.service';
import { EnvironmentData } from '../models/environment';

const router = Router();

/**
 * GET /api/environment
 * Get current environment data from SwitchBot Hub 2
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const environmentData: EnvironmentData = await environmentService.getCurrentEnvironmentData();
    
    res.json({
      success: true,
      data: {
        temperature: environmentData.temperature,
        humidity: environmentData.humidity,
        light: environmentData.light,
        timestamp: environmentData.timestamp.toISOString()
      }
    });
  } catch (error) {
    console.error('Environment data retrieval error:', error);
    
    if (error instanceof EnvironmentServiceError) {
      // Handle known service errors
      const statusCode = getStatusCodeForError(error.code);
      res.status(statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message
        }
      });
    } else {
      // Handle unexpected errors
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while retrieving environment data'
        }
      });
    }
  }
});

/**
 * GET /api/environment/history/:period
 * Get historical environment data for specified time period
 */
router.get('/history/:period', async (req: Request, res: Response) => {
  try {
    const period = req.params.period as TimePeriod;
    
    // Validate period parameter
    if (!['24h', '1w', '1m'].includes(period)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PERIOD',
          message: 'Period must be one of: 24h, 1w, 1m'
        }
      });
    }

    const historyData = environmentHistoryService.getHistoricalData(period);
    const statistics = environmentHistoryService.getDataStatistics(period);
    
    res.json({
      success: true,
      data: {
        period,
        dataPoints: historyData.map(point => ({
          temperature: point.temperature,
          humidity: point.humidity,
          light: point.light,
          timestamp: point.timestamp.toISOString(),
          sampleCount: point.sampleCount
        })),
        statistics,
        totalPoints: historyData.length
      }
    });
  } catch (error) {
    console.error('History data retrieval error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'HISTORY_ERROR',
        message: 'Failed to retrieve historical data'
      }
    });
  }
});

/**
 * GET /api/environment/test
 * Test environment service connectivity
 */
router.get('/test', async (req: Request, res: Response) => {
  try {
    const isWorking = await environmentService.testConnection();
    
    res.json({
      success: true,
      data: {
        connected: isWorking,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Environment service test error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'TEST_FAILED',
        message: 'Environment service test failed'
      }
    });
  }
});

/**
 * Map error codes to HTTP status codes
 */
function getStatusCodeForError(errorCode: string): number {
  switch (errorCode) {
    case 'HUB_NOT_FOUND':
      return 404;
    case 'VALIDATION_ERROR':
      return 422;
    case 'API_ERROR':
      return 502; // Bad Gateway - external API error
    case 'UNKNOWN_ERROR':
    default:
      return 500;
  }
}

export { router as environmentRoutes };