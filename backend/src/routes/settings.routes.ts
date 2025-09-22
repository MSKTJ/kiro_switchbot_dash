/**
 * Settings API routes
 */

import { Router, Request, Response } from 'express';
import { settingsService, SettingsServiceError } from '../services/settings.service';
import { webSocketService } from '../index';
import { webSocketService } from '../index';

const router = Router();

/**
 * Helper function to get HTTP status code for settings service errors
 */
function getStatusCodeForError(errorCode: string): number {
  switch (errorCode) {
    case 'VALIDATION_ERROR':
      return 400;
    case 'FILE_ERROR':
      return 500;
    default:
      return 500;
  }
}

/**
 * GET /api/settings
 * Get current application settings
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const settings = settingsService.getSettings();
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Failed to get settings:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve settings'
      }
    });
  }
});

/**
 * PUT /api/settings
 * Update application settings
 */
router.put('/', (req: Request, res: Response) => {
  try {
    const updates = req.body;
    
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request body must be a valid settings object'
        }
      });
    }

    const updatedSettings = settingsService.updateSettings(updates);
    
    // Restart WebSocket service if data update interval was changed
    if (updates.dataUpdateInterval !== undefined) {
      console.log('Data update interval changed, restarting WebSocket service');
      webSocketService.restartWithNewSettings();
    }
    
    res.json({
      success: true,
      data: updatedSettings,
      message: 'Settings updated successfully'
    });

  } catch (error) {
    console.error('Failed to update settings:', error);
    
    if (error instanceof SettingsServiceError) {
      const statusCode = getStatusCodeForError(error.code);
      res.status(statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while updating settings'
        }
      });
    }
  }
});

/**
 * POST /api/settings/reset
 * Reset settings to defaults
 */
router.post('/reset', (req: Request, res: Response) => {
  try {
    const defaultSettings = settingsService.resetSettings();
    
    // Restart WebSocket service with default settings
    console.log('Settings reset to defaults, restarting WebSocket service');
    webSocketService.restartWithNewSettings();
    
    res.json({
      success: true,
      data: defaultSettings,
      message: 'Settings reset to defaults successfully'
    });

  } catch (error) {
    console.error('Failed to reset settings:', error);
    
    if (error instanceof SettingsServiceError) {
      const statusCode = getStatusCodeForError(error.code);
      res.status(statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while resetting settings'
        }
      });
    }
  }
});

/**
 * GET /api/settings/data-update-interval
 * Get current data update interval
 */
router.get('/data-update-interval', (req: Request, res: Response) => {
  try {
    const interval = settingsService.getDataUpdateInterval();
    
    res.json({
      success: true,
      data: {
        interval,
        unit: 'seconds'
      }
    });
  } catch (error) {
    console.error('Failed to get data update interval:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve data update interval'
      }
    });
  }
});

/**
 * GET /api/settings/alert-thresholds
 * Get current alert thresholds
 */
router.get('/alert-thresholds', (req: Request, res: Response) => {
  try {
    const thresholds = settingsService.getAlertThresholds();
    
    res.json({
      success: true,
      data: thresholds
    });
  } catch (error) {
    console.error('Failed to get alert thresholds:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve alert thresholds'
      }
    });
  }
});

export default router;