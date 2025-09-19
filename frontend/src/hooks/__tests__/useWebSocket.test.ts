import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useWebSocket } from '../useWebSocket';
import { EnvironmentData } from '../../types';

// Mock socket.io-client
const mockSocket = {
  connected: false,
  connect: vi.fn(),
  disconnect: vi.fn(),
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn()
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket)
}));

describe('useWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket.connected = false;
    mockSocket.on.mockImplementation((event: string, callback: Function) => {
      // Store callbacks for later triggering
      (mockSocket as any)[`_${event}Callback`] = callback;
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useWebSocket());

    expect(result.current.environmentData).toBeNull();
    expect(result.current.state.isConnected).toBe(false);
    expect(result.current.state.isConnecting).toBe(true); // Should be connecting on init
    expect(result.current.state.error).toBeNull();
    expect(result.current.state.lastUpdate).toBeNull();
  });

  it('handles successful connection', async () => {
    const { result } = renderHook(() => useWebSocket());

    // Simulate successful connection
    act(() => {
      mockSocket.connected = true;
      (mockSocket as any)._connectCallback?.();
    });

    await waitFor(() => {
      expect(result.current.state.isConnected).toBe(true);
      expect(result.current.state.isConnecting).toBe(false);
      expect(result.current.state.error).toBeNull();
    });
  });

  it('handles connection error', async () => {
    const { result } = renderHook(() => useWebSocket());

    // Simulate connection error
    act(() => {
      const error = new Error('Connection failed');
      (mockSocket as any)._connect_errorCallback?.(error);
    });

    await waitFor(() => {
      expect(result.current.state.isConnected).toBe(false);
      expect(result.current.state.isConnecting).toBe(false);
      expect(result.current.state.error).toContain('Connection failed');
    });
  });

  it('handles disconnection', async () => {
    const { result } = renderHook(() => useWebSocket());

    // First connect
    act(() => {
      mockSocket.connected = true;
      (mockSocket as any)._connectCallback?.();
    });

    // Then disconnect
    act(() => {
      mockSocket.connected = false;
      (mockSocket as any)._disconnectCallback?.('transport close');
    });

    await waitFor(() => {
      expect(result.current.state.isConnected).toBe(false);
      expect(result.current.state.error).toContain('transport close');
    });
  });

  it('handles environment data updates', async () => {
    const { result } = renderHook(() => useWebSocket());

    const mockEnvironmentData: EnvironmentData = {
      temperature: 25.5,
      humidity: 65,
      light: 850,
      timestamp: new Date('2024-01-01T12:00:00Z')
    };

    // Simulate receiving environment data
    act(() => {
      (mockSocket as any)._environmentUpdateCallback?.(mockEnvironmentData);
    });

    await waitFor(() => {
      expect(result.current.environmentData).toEqual(mockEnvironmentData);
      expect(result.current.state.lastUpdate).toBeInstanceOf(Date);
      expect(result.current.state.error).toBeNull();
    });
  });

  it('handles environment data with string timestamp', async () => {
    const { result } = renderHook(() => useWebSocket());

    const mockEnvironmentDataWithStringTimestamp = {
      temperature: 25.5,
      humidity: 65,
      light: 850,
      timestamp: '2024-01-01T12:00:00Z'
    };

    // Simulate receiving environment data with string timestamp
    act(() => {
      (mockSocket as any)._environmentUpdateCallback?.(mockEnvironmentDataWithStringTimestamp);
    });

    await waitFor(() => {
      expect(result.current.environmentData?.timestamp).toBeInstanceOf(Date);
      expect(result.current.environmentData?.temperature).toBe(25.5);
    });
  });

  it('handles server errors', async () => {
    const { result } = renderHook(() => useWebSocket());

    const errorData = { code: 'FETCH_ERROR', message: 'Failed to fetch data' };

    // Simulate server error
    act(() => {
      (mockSocket as any)._errorCallback?.(errorData);
    });

    await waitFor(() => {
      expect(result.current.state.error).toContain('Failed to fetch data');
    });
  });

  it('subscribes to environment updates when connected', async () => {
    const { result } = renderHook(() => useWebSocket());

    // Connect first
    act(() => {
      mockSocket.connected = true;
      (mockSocket as any)._connectCallback?.();
    });

    // Subscribe
    act(() => {
      result.current.subscribe();
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('subscribeEnvironment');
  });

  it('does not subscribe when not connected', () => {
    const { result } = renderHook(() => useWebSocket());

    // Try to subscribe without connection
    act(() => {
      result.current.subscribe();
    });

    expect(mockSocket.emit).not.toHaveBeenCalledWith('subscribeEnvironment');
  });

  it('unsubscribes from environment updates', async () => {
    const { result } = renderHook(() => useWebSocket());

    // Connect first
    act(() => {
      mockSocket.connected = true;
      (mockSocket as any)._connectCallback?.();
    });

    // Unsubscribe
    act(() => {
      result.current.unsubscribe();
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('unsubscribeEnvironment');
  });

  it('reconnects manually', async () => {
    const { result } = renderHook(() => useWebSocket());

    // Trigger manual reconnect
    act(() => {
      result.current.reconnect();
    });

    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('cleans up on unmount', () => {
    const { unmount } = renderHook(() => useWebSocket());

    unmount();

    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('handles connection status updates', async () => {
    const { result } = renderHook(() => useWebSocket());

    const statusData = { connected: false, timestamp: '2024-01-01T12:00:00Z' };

    // Simulate connection status update
    act(() => {
      (mockSocket as any)._connectionStatusCallback?.(statusData);
    });

    await waitFor(() => {
      expect(result.current.state.error).toContain('サーバーとの接続が失われました');
    });
  });
});