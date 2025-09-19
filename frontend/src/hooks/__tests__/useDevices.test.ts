/**
 * useDevices hook tests
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useDevices } from '../useDevices';
import { Device, DeviceListResponse, DeviceStatistics } from '../../types';

// Mock fetch
global.fetch = vi.fn();
const mockFetch = fetch as ReturnType<typeof vi.fn>;

describe('useDevices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockDevices: Device[] = [
    {
      deviceId: 'light-001',
      deviceName: 'Living Room Light',
      deviceType: 'Light',
      status: 'online',
      hubDeviceId: 'hub-001',
      enableCloudService: true,
      isInfraredRemote: false,
      properties: {
        power: 'on',
        brightness: 80
      },
      lastUpdated: '2023-01-01T12:00:00Z'
    },
    {
      deviceId: 'ac-001',
      deviceName: 'Bedroom AC',
      deviceType: 'Air Conditioner',
      status: 'offline',
      hubDeviceId: 'hub-001',
      isInfraredRemote: true,
      remoteType: 'Air Conditioner',
      properties: {
        power: 'off',
        mode: 'cool',
        temperature: 25,
        fanSpeed: 'auto'
      },
      lastUpdated: '2023-01-01T12:00:00Z'
    },
    {
      deviceId: 'hub-001',
      deviceName: 'Main Hub',
      deviceType: 'Hub',
      status: 'online',
      isInfraredRemote: false,
      properties: {
        temperature: 25.4,
        humidity: 62,
        lightLevel: 850
      },
      lastUpdated: '2023-01-01T12:00:00Z'
    }
  ];

  const mockDeviceListResponse: DeviceListResponse = {
    devices: mockDevices,
    total: 3,
    timestamp: '2023-01-01T12:00:00Z'
  };

  const mockStatistics: DeviceStatistics = {
    total: 3,
    online: 2,
    offline: 1,
    unknown: 0,
    controllable: 2,
    byType: {
      'Light': 1,
      'Air Conditioner': 1,
      'Hub': 1,
      'Bot': 0,
      'Curtain': 0,
      'Plug': 0,
      'Unknown': 0
    }
  };

  it('should initialize with loading state', () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        data: mockDeviceListResponse
      })
    } as any);

    const { result } = renderHook(() => useDevices());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.devices).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch error', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useDevices());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.devices).toEqual([]);
  });

  it('should get devices by type', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        data: mockDeviceListResponse
      })
    } as any);

    const { result } = renderHook(() => useDevices());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const lightDevices = result.current.getDevicesByType('Light');
    expect(lightDevices).toHaveLength(1);
    expect(lightDevices[0].deviceType).toBe('Light');
  });

  it('should get controllable devices', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        data: mockDeviceListResponse
      })
    } as any);

    const { result } = renderHook(() => useDevices());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const controllableDevices = result.current.getControllableDevices();
    expect(controllableDevices).toHaveLength(2);
    expect(controllableDevices.every(d => ['Light', 'Air Conditioner'].includes(d.deviceType))).toBe(true);
  });

  it('should get environment devices', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        data: mockDeviceListResponse
      })
    } as any);

    const { result } = renderHook(() => useDevices());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const environmentDevices = result.current.getEnvironmentDevices();
    expect(environmentDevices).toHaveLength(1);
    expect(environmentDevices[0].deviceType).toBe('Hub');
  });
});