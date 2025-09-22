/**
 * Custom hook for device management
 */

import { useState, useEffect, useCallback } from 'react';
import { Device, DeviceType, DeviceStatus, DeviceListResponse, DeviceStatistics, ApiResponse } from '../types';

interface DeviceState {
  devices: Device[];
  statistics: DeviceStatistics | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface DeviceFilters {
  type?: DeviceType;
  status?: DeviceStatus;
  controllableOnly?: boolean;
  environmentOnly?: boolean;
}

export const useDevices = () => {
  const [state, setState] = useState<DeviceState>({
    devices: [],
    statistics: null,
    isLoading: false,
    error: null,
    lastUpdated: null
  });

  const [filters, setFilters] = useState<DeviceFilters>({});

  /**
   * Fetch devices from API
   */
  const fetchDevices = useCallback(async (forceRefresh: boolean = false) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const queryParams = new URLSearchParams();
      
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.controllableOnly) queryParams.append('controllable', 'true');
      if (filters.environmentOnly) queryParams.append('environment', 'true');
      if (forceRefresh) queryParams.append('refresh', 'true');

      const response = await fetch(`/api/devices?${queryParams.toString()}`);
      const result: ApiResponse<DeviceListResponse> = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch devices');
      }

      setState(prev => ({
        ...prev,
        devices: result.data!.devices,
        isLoading: false,
        error: null,
        lastUpdated: new Date()
      }));

    } catch (error) {
      console.error('Failed to fetch devices:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }));
    }
  }, [filters]);

  /**
   * Fetch device statistics
   */
  const fetchStatistics = useCallback(async () => {
    try {
      const response = await fetch('/api/devices/statistics');
      const result: ApiResponse<DeviceStatistics> = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch device statistics');
      }

      setState(prev => ({
        ...prev,
        statistics: result.data!
      }));

    } catch (error) {
      console.error('Failed to fetch device statistics:', error);
    }
  }, []);

  /**
   * Update device status
   */
  const updateDeviceStatus = useCallback(async (deviceId: string): Promise<Device | null> => {
    try {
      const response = await fetch(`/api/devices/${deviceId}/status`, {
        method: 'PUT'
      });
      const result: ApiResponse<Device> = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to update device status');
      }

      const updatedDevice = result.data;

      // Update device in state
      setState(prev => ({
        ...prev,
        devices: prev.devices.map(device =>
          device.deviceId === deviceId ? updatedDevice : device
        )
      }));

      return updatedDevice;

    } catch (error) {
      console.error(`Failed to update device status for ${deviceId}:`, error);
      return null;
    }
  }, []);

  /**
   * Control device
   */
  const controlDevice = useCallback(async (
    deviceId: string,
    command: string,
    parameter?: any
  ): Promise<boolean> => {
    console.log(`useDevices: Controlling device ${deviceId}: ${command}`, parameter);
    
    try {
      const requestBody = { command, parameter };
      console.log(`useDevices: API request body:`, requestBody);
      
      const response = await fetch(`/api/devices/${deviceId}/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const result: ApiResponse<any> = await response.json();
      console.log(`useDevices: API response for ${deviceId}:`, result);

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to control device');
      }

      // Update device status after successful control
      setTimeout(() => {
        console.log(`useDevices: Updating device status for ${deviceId}`);
        updateDeviceStatus(deviceId);
      }, 1000);

      return true;

    } catch (error) {
      console.error(`Failed to control device ${deviceId}:`, error);
      return false;
    }
  }, [updateDeviceStatus]);

  /**
   * Test device connectivity
   */
  const testDeviceConnectivity = useCallback(async (deviceId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/devices/${deviceId}/test`, {
        method: 'POST'
      });
      const result: ApiResponse<{ connected: boolean }> = await response.json();

      if (!response.ok) {
        return false;
      }

      return result.success && result.data?.connected === true;

    } catch (error) {
      console.error(`Failed to test device connectivity for ${deviceId}:`, error);
      return false;
    }
  }, []);

  /**
   * Clear device cache
   */
  const clearCache = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/devices/cache', {
        method: 'DELETE'
      });
      const result: ApiResponse<any> = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to clear cache');
      }

      // Refresh devices after clearing cache
      await fetchDevices(true);
      return true;

    } catch (error) {
      console.error('Failed to clear device cache:', error);
      return false;
    }
  }, [fetchDevices]);

  /**
   * Get devices filtered by type
   */
  const getDevicesByType = useCallback((deviceType: DeviceType): Device[] => {
    return state.devices.filter(device => device.deviceType === deviceType);
  }, [state.devices]);

  /**
   * Get controllable devices
   */
  const getControllableDevices = useCallback((): Device[] => {
    const controllableTypes: DeviceType[] = ['Light', 'Air Conditioner', 'Bot', 'Curtain', 'Plug'];
    return state.devices.filter(device => controllableTypes.includes(device.deviceType));
  }, [state.devices]);

  /**
   * Get environment devices (Hubs)
   */
  const getEnvironmentDevices = useCallback((): Device[] => {
    return state.devices.filter(device => device.deviceType === 'Hub');
  }, [state.devices]);

  /**
   * Update filters and refetch devices
   */
  const updateFilters = useCallback((newFilters: DeviceFilters) => {
    setFilters(newFilters);
  }, []);

  /**
   * Refresh devices
   */
  const refresh = useCallback(() => {
    fetchDevices(true);
    fetchStatistics();
  }, [fetchDevices, fetchStatistics]);

  // Initial fetch on mount and when filters change
  useEffect(() => {
    fetchDevices();
    fetchStatistics();
  }, [fetchDevices, fetchStatistics]);

  return {
    // State
    devices: state.devices,
    statistics: state.statistics,
    isLoading: state.isLoading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    filters,

    // Actions
    fetchDevices,
    updateDeviceStatus,
    controlDevice,
    testDeviceConnectivity,
    clearCache,
    updateFilters,
    refresh,

    // Computed values
    getDevicesByType,
    getControllableDevices,
    getEnvironmentDevices
  };
};