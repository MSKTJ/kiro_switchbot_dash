/**
 * Device API routes
 */

import { Router, Request, Response } from 'express';
import { deviceService, DeviceServiceError } from '../services/device.service';
import { DeviceFilterOptions, DeviceType, DeviceStatus } from '../models/device';

const router = Router();

/**
 * GET /api/devices
 * Get all devices or filtered devices
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      type,
      status,
      controllable,
      environment,
      refresh
    } = req.query;

    // Parse filter options
    const filterOptions: DeviceFilterOptions = {};
    
    if (type && typeof type === 'string') {
      filterOptions.deviceType = type as DeviceType;
    }
    
    if (status && typeof status === 'string') {
      filterOptions.status = status as DeviceStatus;
    }
    
    if (controllable === 'true') {
      filterOptions.controllableOnly = true;
    }
    
    if (environment === 'true') {
      filterOptions.environmentOnly = true;
    }

    // Force refresh if requested
    const forceRefresh = refresh === 'true';

    // Get devices
    const devices = Object.keys(filterOptions).length > 0 
      ? await deviceService.getFilteredDevices(filterOptions)
      : await deviceService.getAllDevices(forceRefresh);

    res.json({
      success: true,
      data: {
        devices: devices.map(device => ({
          deviceId: device.deviceId,
          deviceName: device.deviceName,
          deviceType: device.deviceType,
          status: device.status,
          hubDeviceId: device.hubDeviceId,
          enableCloudService: device.enableCloudService,
          isInfraredRemote: device.isInfraredRemote,
          remoteType: device.remoteType,
          properties: device.properties,
          lastUpdated: device.lastUpdated.toISOString()
        })),
        total: devices.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Device list retrieval error:', error);
    
    if (error instanceof DeviceServiceError) {
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
          message: 'An unexpected error occurred while retrieving devices'
        }
      });
    }
  }
});

/**
 * GET /api/devices/grouped
 * Get devices grouped by type
 */
router.get('/grouped', async (req: Request, res: Response) => {
  try {
    const groupedDevices = await deviceService.getDevicesGroupedByType();
    
    // Transform for response
    const responseData: Record<string, any[]> = {};
    Object.entries(groupedDevices).forEach(([type, devices]) => {
      responseData[type] = devices.map(device => ({
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        deviceType: device.deviceType,
        status: device.status,
        hubDeviceId: device.hubDeviceId,
        enableCloudService: device.enableCloudService,
        isInfraredRemote: device.isInfraredRemote,
        remoteType: device.remoteType,
        properties: device.properties,
        lastUpdated: device.lastUpdated.toISOString()
      }));
    });

    res.json({
      success: true,
      data: responseData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Grouped devices retrieval error:', error);
    
    if (error instanceof DeviceServiceError) {
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
          message: 'An unexpected error occurred while retrieving grouped devices'
        }
      });
    }
  }
});

/**
 * GET /api/devices/statistics
 * Get device statistics
 */
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const statistics = await deviceService.getDeviceStatistics();
    
    res.json({
      success: true,
      data: statistics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Device statistics retrieval error:', error);
    
    if (error instanceof DeviceServiceError) {
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
          message: 'An unexpected error occurred while retrieving device statistics'
        }
      });
    }
  }
});

/**
 * GET /api/devices/:deviceId
 * Get specific device by ID
 */
router.get('/:deviceId', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const device = await deviceService.getDeviceById(deviceId);
    
    res.json({
      success: true,
      data: {
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        deviceType: device.deviceType,
        status: device.status,
        hubDeviceId: device.hubDeviceId,
        enableCloudService: device.enableCloudService,
        isInfraredRemote: device.isInfraredRemote,
        remoteType: device.remoteType,
        properties: device.properties,
        lastUpdated: device.lastUpdated.toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Device retrieval error for ${req.params.deviceId}:`, error);
    
    if (error instanceof DeviceServiceError) {
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
          message: 'An unexpected error occurred while retrieving device'
        }
      });
    }
  }
});

/**
 * PUT /api/devices/:deviceId/status
 * Update device status
 */
router.put('/:deviceId/status', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const device = await deviceService.updateDeviceStatus(deviceId);
    
    res.json({
      success: true,
      data: {
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        deviceType: device.deviceType,
        status: device.status,
        properties: device.properties,
        lastUpdated: device.lastUpdated.toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Device status update error for ${req.params.deviceId}:`, error);
    
    if (error instanceof DeviceServiceError) {
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
          message: 'An unexpected error occurred while updating device status'
        }
      });
    }
  }
});

/**
 * POST /api/devices/:deviceId/control
 * Control device
 */
router.post('/:deviceId/control', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const { command, parameter } = req.body;
    
    // Validate request body
    if (!command || typeof command !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Command is required and must be a string'
        }
      });
    }
    
    await deviceService.controlDevice(deviceId, command, parameter);
    
    res.json({
      success: true,
      data: {
        deviceId,
        command,
        parameter,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error(`Device control error for ${req.params.deviceId}:`, error);
    
    if (error instanceof DeviceServiceError) {
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
          message: 'An unexpected error occurred while controlling device'
        }
      });
    }
  }
});

/**
 * POST /api/devices/:deviceId/test
 * Test device connectivity
 */
router.post('/:deviceId/test', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const isConnected = await deviceService.testDeviceConnectivity(deviceId);
    
    res.json({
      success: true,
      data: {
        deviceId,
        connected: isConnected,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error(`Device connectivity test error for ${req.params.deviceId}:`, error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'TEST_FAILED',
        message: 'Device connectivity test failed'
      }
    });
  }
});

/**
 * POST /api/devices/:deviceId/light/toggle
 * Toggle light power (ON/OFF)
 */
router.post('/:deviceId/light/toggle', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    
    // Get current device status to determine toggle action
    const device = await deviceService.getDeviceById(deviceId);
    
    // Validate device type
    if (device.deviceType !== 'Light') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DEVICE_TYPE',
          message: 'Device is not a light'
        }
      });
    }
    
    // Determine command based on current power state
    const lightProperties = device.properties as any;
    const currentPower = lightProperties?.power || 'off';
    const command = currentPower === 'on' ? 'turnOff' : 'turnOn';
    
    await deviceService.controlDevice(deviceId, command);
    
    res.json({
      success: true,
      data: {
        deviceId,
        command,
        previousState: currentPower,
        newState: currentPower === 'on' ? 'off' : 'on',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error(`Light toggle error for ${req.params.deviceId}:`, error);
    
    if (error instanceof DeviceServiceError) {
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
          message: 'An unexpected error occurred while toggling light'
        }
      });
    }
  }
});

/**
 * POST /api/devices/:deviceId/light/brightness
 * Set light brightness (0-100)
 */
router.post('/:deviceId/light/brightness', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const { brightness } = req.body;
    
    // Validate brightness value
    if (typeof brightness !== 'number' || brightness < 0 || brightness > 100) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Brightness must be a number between 0 and 100'
        }
      });
    }
    
    // Get device to validate type
    const device = await deviceService.getDeviceById(deviceId);
    
    if (device.deviceType !== 'Light') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DEVICE_TYPE',
          message: 'Device is not a light'
        }
      });
    }
    
    // Set brightness
    await deviceService.controlDevice(deviceId, 'setBrightness', brightness.toString());
    
    res.json({
      success: true,
      data: {
        deviceId,
        command: 'setBrightness',
        brightness,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error(`Light brightness control error for ${req.params.deviceId}:`, error);
    
    if (error instanceof DeviceServiceError) {
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
          message: 'An unexpected error occurred while setting light brightness'
        }
      });
    }
  }
});

/**
 * POST /api/devices/:deviceId/light/power
 * Set light power state explicitly (on/off)
 */
router.post('/:deviceId/light/power', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const { power } = req.body;
    
    // Validate power value
    if (power !== 'on' && power !== 'off') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Power must be either "on" or "off"'
        }
      });
    }
    
    // Get device to validate type
    const device = await deviceService.getDeviceById(deviceId);
    
    if (device.deviceType !== 'Light') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DEVICE_TYPE',
          message: 'Device is not a light'
        }
      });
    }
    
    // Set power state
    const command = power === 'on' ? 'turnOn' : 'turnOff';
    await deviceService.controlDevice(deviceId, command);
    
    res.json({
      success: true,
      data: {
        deviceId,
        command,
        power,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error(`Light power control error for ${req.params.deviceId}:`, error);
    
    if (error instanceof DeviceServiceError) {
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
          message: 'An unexpected error occurred while setting light power'
        }
      });
    }
  }
});

/**
 * POST /api/devices/:deviceId/aircon/power
 * Set air conditioner power state (on/off)
 */
router.post('/:deviceId/aircon/power', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const { power } = req.body;
    
    // Validate power value
    if (power !== 'on' && power !== 'off') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Power must be either "on" or "off"'
        }
      });
    }
    
    // Get device to validate type
    const device = await deviceService.getDeviceById(deviceId);
    
    if (device.deviceType !== 'Air Conditioner') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DEVICE_TYPE',
          message: 'Device is not an air conditioner'
        }
      });
    }
    
    // Set power state
    const command = power === 'on' ? 'turnOn' : 'turnOff';
    await deviceService.controlDevice(deviceId, command);
    
    res.json({
      success: true,
      data: {
        deviceId,
        command,
        power,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error(`Air conditioner power control error for ${req.params.deviceId}:`, error);
    
    if (error instanceof DeviceServiceError) {
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
          message: 'An unexpected error occurred while setting air conditioner power'
        }
      });
    }
  }
});

/**
 * POST /api/devices/:deviceId/aircon/mode
 * Set air conditioner operation mode
 */
router.post('/:deviceId/aircon/mode', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const { mode } = req.body;
    
    // Validate mode value
    const validModes = ['cool', 'heat', 'dry', 'auto', 'fan'];
    if (!validModes.includes(mode)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Mode must be one of: ${validModes.join(', ')}`
        }
      });
    }
    
    // Get device to validate type
    const device = await deviceService.getDeviceById(deviceId);
    
    if (device.deviceType !== 'Air Conditioner') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DEVICE_TYPE',
          message: 'Device is not an air conditioner'
        }
      });
    }
    
    // Set operation mode
    await deviceService.controlDevice(deviceId, 'setMode', mode);
    
    res.json({
      success: true,
      data: {
        deviceId,
        command: 'setMode',
        mode,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error(`Air conditioner mode control error for ${req.params.deviceId}:`, error);
    
    if (error instanceof DeviceServiceError) {
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
          message: 'An unexpected error occurred while setting air conditioner mode'
        }
      });
    }
  }
});

/**
 * POST /api/devices/:deviceId/aircon/temperature
 * Set air conditioner target temperature
 */
router.post('/:deviceId/aircon/temperature', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const { temperature } = req.body;
    
    // Validate temperature value
    if (typeof temperature !== 'number' || temperature < 16 || temperature > 30) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Temperature must be a number between 16 and 30 degrees Celsius'
        }
      });
    }
    
    // Get device to validate type
    const device = await deviceService.getDeviceById(deviceId);
    
    if (device.deviceType !== 'Air Conditioner') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DEVICE_TYPE',
          message: 'Device is not an air conditioner'
        }
      });
    }
    
    // Set target temperature
    await deviceService.controlDevice(deviceId, 'setTemperature', temperature);
    
    res.json({
      success: true,
      data: {
        deviceId,
        command: 'setTemperature',
        temperature,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error(`Air conditioner temperature control error for ${req.params.deviceId}:`, error);
    
    if (error instanceof DeviceServiceError) {
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
          message: 'An unexpected error occurred while setting air conditioner temperature'
        }
      });
    }
  }
});

/**
 * POST /api/devices/:deviceId/aircon/toggle
 * Toggle air conditioner power (ON/OFF)
 */
router.post('/:deviceId/aircon/toggle', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    
    // Get current device status to determine toggle action
    const device = await deviceService.getDeviceById(deviceId);
    
    // Validate device type
    if (device.deviceType !== 'Air Conditioner') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DEVICE_TYPE',
          message: 'Device is not an air conditioner'
        }
      });
    }
    
    // Determine command based on current power state
    const airconProperties = device.properties as any;
    const currentPower = airconProperties?.power || 'off';
    const command = currentPower === 'on' ? 'turnOff' : 'turnOn';
    
    await deviceService.controlDevice(deviceId, command);
    
    res.json({
      success: true,
      data: {
        deviceId,
        command,
        previousState: currentPower,
        newState: currentPower === 'on' ? 'off' : 'on',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error(`Air conditioner toggle error for ${req.params.deviceId}:`, error);
    
    if (error instanceof DeviceServiceError) {
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
          message: 'An unexpected error occurred while toggling air conditioner'
        }
      });
    }
  }
});

/**
 * DELETE /api/devices/cache
 * Clear device cache
 */
router.delete('/cache', (req: Request, res: Response) => {
  try {
    deviceService.clearCache();
    
    res.json({
      success: true,
      data: {
        message: 'Device cache cleared successfully',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'CACHE_ERROR',
        message: 'Failed to clear device cache'
      }
    });
  }
});

/**
 * Map error codes to HTTP status codes
 */
function getStatusCodeForError(errorCode: string): number {
  switch (errorCode) {
    case 'DEVICE_NOT_FOUND':
      return 404;
    case 'VALIDATION_ERROR':
      return 422;
    case 'API_ERROR':
      return 502; // Bad Gateway - external API error
    case 'CONTROL_ERROR':
    case 'STATUS_ERROR':
      return 503; // Service Unavailable
    case 'UNKNOWN_ERROR':
    default:
      return 500;
  }
}

export { router as deviceRoutes };