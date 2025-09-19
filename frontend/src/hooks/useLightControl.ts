/**
 * Custom hook for light control functionality
 */

import { useState, useCallback } from 'react';
import { Device, LightProperties, ApiResponse } from '../types';

interface LightControlState {
  isControlling: boolean;
  lastAction: string | null;
  lastResult: any | null;
  error: string | null;
}

interface LightControlResponse {
  deviceId: string;
  command: string;
  timestamp: string;
  [key: string]: any;
}

export const useLightControl = () => {
  const [state, setState] = useState<LightControlState>({
    isControlling: false,
    lastAction: null,
    lastResult: null,
    error: null
  });

  /**
   * Generic light control function
   */
  const controlLight = useCallback(async (
    deviceId: string,
    endpoint: string,
    body?: any,
    actionName?: string
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    setState(prev => ({ 
      ...prev, 
      isControlling: true, 
      error: null,
      lastAction: actionName || 'control'
    }));

    try {
      const response = await fetch(`/api/devices/${deviceId}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined
      });

      const result: ApiResponse<LightControlResponse> = await response.json();

      if (!response.ok || !result.success) {
        const errorMessage = result.error || `HTTP error! status: ${response.status}`;
        setState(prev => ({
          ...prev,
          isControlling: false,
          error: errorMessage,
          lastResult: null
        }));
        return { success: false, error: errorMessage };
      }

      setState(prev => ({
        ...prev,
        isControlling: false,
        error: null,
        lastResult: result.data
      }));

      return { success: true, data: result.data };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState(prev => ({
        ...prev,
        isControlling: false,
        error: errorMessage,
        lastResult: null
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Toggle light power (ON/OFF)
   */
  const togglePower = useCallback(async (deviceId: string) => {
    return controlLight(deviceId, '/light/toggle', undefined, 'toggle');
  }, [controlLight]);

  /**
   * Set light power explicitly
   */
  const setPower = useCallback(async (deviceId: string, power: 'on' | 'off') => {
    return controlLight(deviceId, '/light/power', { power }, `power_${power}`);
  }, [controlLight]);

  /**
   * Set light brightness
   */
  const setBrightness = useCallback(async (deviceId: string, brightness: number) => {
    if (brightness < 0 || brightness > 100) {
      return { success: false, error: 'Brightness must be between 0 and 100' };
    }
    return controlLight(deviceId, '/light/brightness', { brightness }, 'brightness');
  }, [controlLight]);

  /**
   * Turn light on
   */
  const turnOn = useCallback(async (deviceId: string) => {
    return setPower(deviceId, 'on');
  }, [setPower]);

  /**
   * Turn light off
   */
  const turnOff = useCallback(async (deviceId: string) => {
    return setPower(deviceId, 'off');
  }, [setPower]);

  /**
   * Check if device is a light and controllable
   */
  const isLightDevice = useCallback((device: Device): boolean => {
    return device.deviceType === 'Light' && device.status === 'online';
  }, []);

  /**
   * Get light properties safely
   */
  const getLightProperties = useCallback((device: Device): LightProperties | null => {
    if (device.deviceType !== 'Light') return null;
    return device.properties as LightProperties || null;
  }, []);

  /**
   * Check if light is currently on
   */
  const isLightOn = useCallback((device: Device): boolean => {
    const properties = getLightProperties(device);
    return properties?.power === 'on';
  }, [getLightProperties]);

  /**
   * Get current brightness
   */
  const getCurrentBrightness = useCallback((device: Device): number => {
    const properties = getLightProperties(device);
    return properties?.brightness || 0;
  }, [getLightProperties]);

  /**
   * Check if brightness control is available
   */
  const hasBrightnessControl = useCallback((device: Device): boolean => {
    const properties = getLightProperties(device);
    return properties?.brightness !== undefined;
  }, [getLightProperties]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState({
      isControlling: false,
      lastAction: null,
      lastResult: null,
      error: null
    });
  }, []);

  return {
    // State
    isControlling: state.isControlling,
    lastAction: state.lastAction,
    lastResult: state.lastResult,
    error: state.error,

    // Control functions
    togglePower,
    setPower,
    setBrightness,
    turnOn,
    turnOff,

    // Utility functions
    isLightDevice,
    getLightProperties,
    isLightOn,
    getCurrentBrightness,
    hasBrightnessControl,

    // State management
    clearError,
    reset
  };
};