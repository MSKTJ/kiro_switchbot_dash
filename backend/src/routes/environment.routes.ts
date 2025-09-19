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
 * GET /api/environment/history/status
 * Get history service status and debug information
 */
router.get('/history/status', (req: Request, res: Response) => {
  try {
    const status = environmentHistoryService.getStatus();
    
    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('History status retrieval error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'STATUS_ERROR',
        message: 'Failed to retrieve history status'
      }
    });
  }
});

/**
 * POST /api/environment/history/generate-test-data
 * Generate test data for development (only in development mode)
 */
router.post('/history/generate-test-data', (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Test data generation is not allowed in production'
      }
    });
  }

  try {
    const { hours = 12, intervalMinutes = 5 } = req.body;
    
    // Clear existing data
    environmentHistoryService.clearHistory();
    
    // Generate test data
    const now = new Date();
    const dataPoints = Math.floor((hours * 60) / intervalMinutes);
    
    for (let i = dataPoints; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * intervalMinutes * 60 * 1000);
      const testData: EnvironmentData = {
        temperature: 20 + Math.sin(i * 0.1) * 5 + Math.random() * 2,
        humidity: 50 + Math.cos(i * 0.15) * 10 + Math.random() * 5,
        light: 500 + Math.sin(i * 0.05) * 300 + Math.random() * 100,
        timestamp
      };
      
      environmentHistoryService.addDataPoint(testData);
    }
    
    const status = environmentHistoryService.getStatus();
    
    res.json({
      success: true,
      data: {
        message: `Generated ${dataPoints + 1} test data points over ${hours} hours`,
        status,
        parameters: { hours, intervalMinutes }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test data generation error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'GENERATION_ERROR',
        message: 'Failed to generate test data'
      }
    });
  }
});

/**
 * GET /api/environment/history/debug
 * Get debug information about historical data
 */
router.get('/history/debug', (req: Request, res: Response) => {
  try {
    const status = environmentHistoryService.getStatus();
    const allData = environmentHistoryService.getHistoricalData('12h'); // Get all data within 12h
    
    res.json({
      success: true,
      data: {
        status,
        sampleData: allData.slice(0, 10), // First 10 data points
        totalDataPoints: allData.length,
        latestDataPoint: allData[allData.length - 1] || null,
        oldestDataPoint: allData[0] || null
      }
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DEBUG_ERROR',
        message: 'Failed to get debug information'
      }
    });
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
    if (!['1h', '6h', '12h'].includes(period)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PERIOD',
          message: 'Period must be one of: 1h, 6h, 12h'
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
 * GET /api/environment/history/status
 * Get history service status and debug information
 */
router.get('/history/status', (req: Request, res: Response) => {
  try {
    const status = environmentHistoryService.getStatus();
    
    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('History status retrieval error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'STATUS_ERROR',
        message: 'Failed to retrieve history status'
      }
    });
  }
});

/**
 * POST /api/environment/history/generate-test-data
 * Generate test data for development (only in development mode)
 */
router.post('/history/generate-test-data', (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Test data generation is not allowed in production'
      }
    });
  }

  try {
    const { hours = 12, intervalMinutes = 5 } = req.body;
    
    // Clear existing data
    environmentHistoryService.clearHistory();
    
    // Generate test data
    const now = new Date();
    const dataPoints = Math.floor((hours * 60) / intervalMinutes);
    
    for (let i = dataPoints; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * intervalMinutes * 60 * 1000);
      const testData: EnvironmentData = {
        temperature: 20 + Math.sin(i * 0.1) * 5 + Math.random() * 2,
        humidity: 50 + Math.cos(i * 0.15) * 10 + Math.random() * 5,
        light: 500 + Math.sin(i * 0.05) * 300 + Math.random() * 100,
        timestamp
      };
      
      environmentHistoryService.addDataPoint(testData);
    }
    
    const status = environmentHistoryService.getStatus();
    
    res.json({
      success: true,
      data: {
        message: `Generated ${dataPoints + 1} test data points over ${hours} hours`,
        status,
        parameters: { hours, intervalMinutes }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test data generation error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'GENERATION_ERROR',
        message: 'Failed to generate test data'
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