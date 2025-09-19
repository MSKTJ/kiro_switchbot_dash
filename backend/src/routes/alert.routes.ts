/**
 * Alert API routes
 */

import { Router, Request, Response } from 'express';
import { alertService, AlertServiceError } from '../services/alert.service';
import { AlertThresholds } from '../models/alert';

const router = Router();

/**
 * GET /api/alerts
 * Get all active alerts
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const activeAlerts = alertService.getActiveAlerts();
    
    res.json({
      success: true,
      data: {
        alerts: activeAlerts.map(alert => ({
          id: alert.id,
          type: alert.type,
          severity: alert.severity,
          message: alert.message,
          timestamp: alert.timestamp.toISOString(),
          isActive: alert.isActive,
          value: alert.value,
          threshold: alert.threshold,
          condition: alert.condition
        })),
        count: activeAlerts.length
      }
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_ALERTS_ERROR',
        message: 'Failed to retrieve alerts'
      }
    });
  }
});

/**
 * GET /api/alerts/history
 * Get alert history
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const history = alertService.getAlertHistory(limit);
    
    res.json({
      success: true,
      data: {
        alerts: history.map(alert => ({
          id: alert.id,
          type: alert.type,
          severity: alert.severity,
          message: alert.message,
          timestamp: alert.timestamp.toISOString(),
          isActive: alert.isActive,
          value: alert.value,
          threshold: alert.threshold,
          condition: alert.condition
        })),
        count: history.length
      }
    });
  } catch (error) {
    console.error('Get alert history error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_HISTORY_ERROR',
        message: 'Failed to retrieve alert history'
      }
    });
  }
});

/**
 * GET /api/alerts/statistics
 * Get alert statistics
 */
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const statistics = alertService.getAlertStatistics();
    
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Get alert statistics error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_STATISTICS_ERROR',
        message: 'Failed to retrieve alert statistics'
      }
    });
  }
});

/**
 * GET /api/alerts/thresholds
 * Get current alert thresholds
 */
router.get('/thresholds', async (req: Request, res: Response) => {
  try {
    const thresholds = alertService.getThresholds();
    
    res.json({
      success: true,
      data: thresholds
    });
  } catch (error) {
    console.error('Get thresholds error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_THRESHOLDS_ERROR',
        message: 'Failed to retrieve alert thresholds'
      }
    });
  }
});

/**
 * PUT /api/alerts/thresholds
 * Update alert thresholds
 */
router.put('/thresholds', async (req: Request, res: Response) => {
  try {
    const thresholds: AlertThresholds = req.body;
    
    // Validate request body
    if (!thresholds || typeof thresholds !== 'object') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Request body must contain threshold settings'
        }
      });
    }

    // Validate threshold structure
    if (!thresholds.temperature || !thresholds.humidity) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_THRESHOLDS',
          message: 'Thresholds must include temperature and humidity settings'
        }
      });
    }

    alertService.updateThresholds(thresholds);
    
    res.json({
      success: true,
      data: {
        message: 'Alert thresholds updated successfully',
        thresholds: alertService.getThresholds()
      }
    });
  } catch (error) {
    console.error('Update thresholds error:', error);
    
    if (error instanceof AlertServiceError) {
      const statusCode = error.code === 'VALIDATION_ERROR' ? 400 : 500;
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
          code: 'UPDATE_THRESHOLDS_ERROR',
          message: 'Failed to update alert thresholds'
        }
      });
    }
  }
});

/**
 * DELETE /api/alerts/:alertId
 * Dismiss a specific alert
 */
router.delete('/:alertId', async (req: Request, res: Response) => {
  try {
    const alertId = req.params.alertId;
    
    if (!alertId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ALERT_ID',
          message: 'Alert ID is required'
        }
      });
    }

    const dismissed = alertService.dismissAlert(alertId);
    
    if (dismissed) {
      res.json({
        success: true,
        data: {
          message: 'Alert dismissed successfully',
          alertId
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: {
          code: 'ALERT_NOT_FOUND',
          message: 'Alert not found or already dismissed'
        }
      });
    }
  } catch (error) {
    console.error('Dismiss alert error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'DISMISS_ALERT_ERROR',
        message: 'Failed to dismiss alert'
      }
    });
  }
});

/**
 * DELETE /api/alerts
 * Clear all active alerts
 */
router.delete('/', async (req: Request, res: Response) => {
  try {
    alertService.clearAllAlerts();
    
    res.json({
      success: true,
      data: {
        message: 'All alerts cleared successfully'
      }
    });
  } catch (error) {
    console.error('Clear alerts error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'CLEAR_ALERTS_ERROR',
        message: 'Failed to clear alerts'
      }
    });
  }
});

export { router as alertRoutes };