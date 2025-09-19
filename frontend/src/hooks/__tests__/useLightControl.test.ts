/**
 * Tests for useLightControl hook
 */

import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useLightControl } from '../useLightControl';
import { Device } from '../../types';

// Mock fetch
global.fetch = vi.fn();

const mockLightDevice: Device = {
  deviceId: 'light-001',
  deviceName: 'Test Light',
  deviceType: 'Light',
  status: 'online',
  properties: {
    power: 'off',
    brightness: 50
  },
  lastUpdated: '2024-01-01T12:00:00Z'
};

const mockNonLightDevice: Device = {
  deviceId: 'hub-001',
  deviceName: 'Test Hub',
  deviceType: 'Hub',
  status: 'online',
  properties: {
    temperature: 25,
    humidity: 60
  },
  lastUpdated: '2024-01-01T12:00:00Z'
};

describe('useLightControl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockClear();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useLightControl());

    expect(result.current.isControlling).toBe(false);
    expect(result.current.lastAction).toBe(null);
    expect(result.current.lastResult).toBe(null);
    expect(result.current.error).toBe(null);
  });

  describe('togglePower', () => {
    it('should toggle power successfully', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            deviceId: 'light-001',
            command: 'turnOn',
            timestamp: '2024-01-01T12:00:00Z'
          }
        })
      });

      const { result } = renderHook(() => useLightControl());

      let response: any;
      await act(async () => {
        response = await result.current.togglePower('light-001');
      });

      expect(response.success).toBe(true);
      expect(result.current.isControlling).toBe(false);
      expect(result.current.lastAction).toBe('toggle');
      expect(result.current.error).toBe(null);
      expect(fetch).toHaveBeenCalledWith('/api/devices/light-001/light/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: undefined
      });
    });

    it('should handle toggle power error', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: 'Device not found'
        })
      });

      const { result } = renderHook(() => useLightControl());

      let response: any;
      await act(async () => {
        response = await result.current.togglePower('light-001');
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('Device not found');
      expect(result.current.error).toBe('Device not found');
    });
  });

  describe('setPower', () => {
    it('should set power to on', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            deviceId: 'light-001',
            command: 'turnOn',
            power: 'on',
            timestamp: '2024-01-01T12:00:00Z'
          }
        })
      });

      const { result } = renderHook(() => useLightControl());

      let response: any;
      await act(async () => {
        response = await result.current.setPower('light-001', 'on');
      });

      expect(response.success).toBe(true);
      expect(result.current.lastAction).toBe('power_on');
      expect(fetch).toHaveBeenCalledWith('/api/devices/light-001/light/power', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ power: 'on' })
      });
    });

    it('should set power to off', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            deviceId: 'light-001',
            command: 'turnOff',
            power: 'off',
            timestamp: '2024-01-01T12:00:00Z'
          }
        })
      });

      const { result } = renderHook(() => useLightControl());

      let response: any;
      await act(async () => {
        response = await result.current.setPower('light-001', 'off');
      });

      expect(response.success).toBe(true);
      expect(result.current.lastAction).toBe('power_off');
    });
  });

  describe('setBrightness', () => {
    it('should set brightness successfully', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            deviceId: 'light-001',
            command: 'setBrightness',
            brightness: 75,
            timestamp: '2024-01-01T12:00:00Z'
          }
        })
      });

      const { result } = renderHook(() => useLightControl());

      let response: any;
      await act(async () => {
        response = await result.current.setBrightness('light-001', 75);
      });

      expect(response.success).toBe(true);
      expect(result.current.lastAction).toBe('brightness');
      expect(fetch).toHaveBeenCalledWith('/api/devices/light-001/light/brightness', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ brightness: 75 })
      });
    });

    it('should validate brightness range', async () => {
      const { result } = renderHook(() => useLightControl());

      let response: any;
      await act(async () => {
        response = await result.current.setBrightness('light-001', 150);
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('Brightness must be between 0 and 100');
    });

    it('should validate negative brightness', async () => {
      const { result } = renderHook(() => useLightControl());

      let response: any;
      await act(async () => {
        response = await result.current.setBrightness('light-001', -10);
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('Brightness must be between 0 and 100');
    });
  });

  describe('turnOn and turnOff', () => {
    it('should turn on light', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { deviceId: 'light-001', command: 'turnOn', power: 'on' }
        })
      });

      const { result } = renderHook(() => useLightControl());

      let response: any;
      await act(async () => {
        response = await result.current.turnOn('light-001');
      });

      expect(response.success).toBe(true);
      expect(result.current.lastAction).toBe('power_on');
    });

    it('should turn off light', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { deviceId: 'light-001', command: 'turnOff', power: 'off' }
        })
      });

      const { result } = renderHook(() => useLightControl());

      let response: any;
      await act(async () => {
        response = await result.current.turnOff('light-001');
      });

      expect(response.success).toBe(true);
      expect(result.current.lastAction).toBe('power_off');
    });
  });

  describe('utility functions', () => {
    it('should identify light device correctly', () => {
      const { result } = renderHook(() => useLightControl());

      expect(result.current.isLightDevice(mockLightDevice)).toBe(true);
      expect(result.current.isLightDevice(mockNonLightDevice)).toBe(false);
    });

    it('should identify offline light device as not controllable', () => {
      const { result } = renderHook(() => useLightControl());
      const offlineLight = { ...mockLightDevice, status: 'offline' as const };

      expect(result.current.isLightDevice(offlineLight)).toBe(false);
    });

    it('should get light properties correctly', () => {
      const { result } = renderHook(() => useLightControl());

      const lightProps = result.current.getLightProperties(mockLightDevice);
      expect(lightProps).toEqual({ power: 'off', brightness: 50 });

      const nonLightProps = result.current.getLightProperties(mockNonLightDevice);
      expect(nonLightProps).toBe(null);
    });

    it('should check if light is on', () => {
      const { result } = renderHook(() => useLightControl());
      const onLight = { ...mockLightDevice, properties: { power: 'on', brightness: 75 } };

      expect(result.current.isLightOn(mockLightDevice)).toBe(false);
      expect(result.current.isLightOn(onLight)).toBe(true);
    });

    it('should get current brightness', () => {
      const { result } = renderHook(() => useLightControl());

      expect(result.current.getCurrentBrightness(mockLightDevice)).toBe(50);
      expect(result.current.getCurrentBrightness(mockNonLightDevice)).toBe(0);
    });

    it('should check brightness control availability', () => {
      const { result } = renderHook(() => useLightControl());
      const lightWithoutBrightness = { 
        ...mockLightDevice, 
        properties: { power: 'off' } 
      };

      expect(result.current.hasBrightnessControl(mockLightDevice)).toBe(true);
      expect(result.current.hasBrightnessControl(lightWithoutBrightness)).toBe(false);
      expect(result.current.hasBrightnessControl(mockNonLightDevice)).toBe(false);
    });
  });

  describe('state management', () => {
    it('should clear error', async () => {
      const { result } = renderHook(() => useLightControl());

      // First trigger an error
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: 'Test error'
        })
      });

      await act(async () => {
        await result.current.togglePower('light-001');
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });

    it('should reset state', () => {
      const { result } = renderHook(() => useLightControl());

      act(() => {
        result.current.reset();
      });

      expect(result.current.isControlling).toBe(false);
      expect(result.current.lastAction).toBe(null);
      expect(result.current.lastResult).toBe(null);
      expect(result.current.error).toBe(null);
    });
  });

  describe('network errors', () => {
    it('should handle network error', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useLightControl());

      let response: any;
      await act(async () => {
        response = await result.current.togglePower('light-001');
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('Network error');
      expect(result.current.error).toBe('Network error');
    });

    it('should handle unknown error', async () => {
      (fetch as any).mockRejectedValueOnce('Unknown error');

      const { result } = renderHook(() => useLightControl());

      let response: any;
      await act(async () => {
        response = await result.current.togglePower('light-001');
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('Unknown error occurred');
    });
  });

  describe('controlling state', () => {
    it('should set controlling state during operation', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      (fetch as any).mockReturnValueOnce(promise);

      const { result } = renderHook(() => useLightControl());

      // Start the operation
      act(() => {
        result.current.togglePower('light-001');
      });

      // Should be controlling
      expect(result.current.isControlling).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise!({
          ok: true,
          json: async () => ({ success: true, data: {} })
        });
      });

      // Should no longer be controlling
      expect(result.current.isControlling).toBe(false);
    });
  });
});