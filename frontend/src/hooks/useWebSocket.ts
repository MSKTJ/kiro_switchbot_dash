import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { EnvironmentData, HistoricalDataPoint, TimePeriod, Alert } from '../types';

export interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

export interface UseWebSocketReturn {
  environmentData: EnvironmentData | null;
  state: WebSocketState;
  subscribe: () => void;
  unsubscribe: () => void;
  reconnect: () => void;
  getHistory: (period: TimePeriod) => void;
  onAlertUpdate?: (alerts: Alert[]) => void;
  onAlertTriggered?: (alert: Alert) => void;
  onAlertDismissed?: (alertId: string) => void;
}

export interface WebSocketEvents {
  environmentUpdate: EnvironmentData;
  historyUpdate: HistoricalDataPoint[];
  alertUpdate: Alert[];
  alertTriggered: Alert;
  alertDismissed: { alertId: string };
  error: { code: string; message: string };
  connectionStatus: { connected: boolean; timestamp: string };
}

const WEBSOCKET_URL = (import.meta as any).env?.VITE_WEBSOCKET_URL || 'http://localhost:3001';
const RECONNECT_DELAY = 3000; // 3 seconds
const MAX_RECONNECT_ATTEMPTS = 5;

export const useWebSocket = (
  onAlertUpdate?: (alerts: Alert[]) => void,
  onAlertTriggered?: (alert: Alert) => void,
  onAlertDismissed?: (alertId: string) => void
): UseWebSocketReturn => {
  const [environmentData, setEnvironmentData] = useState<EnvironmentData | null>(null);
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastUpdate: null
  });

  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const isSubscribedRef = useRef<boolean>(false);

  // Initialize WebSocket connection
  const initializeConnection = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const socket = io(WEBSOCKET_URL, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: false // We'll handle reconnection manually
      });

      socketRef.current = socket;

      // Connection established
      socket.on('connect', () => {
        console.log('WebSocket connected');
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null
        }));
        reconnectAttemptsRef.current = 0;

        // Re-subscribe if we were previously subscribed
        if (isSubscribedRef.current) {
          socket.emit('subscribeEnvironment');
        }
      });

      // Connection failed
      socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          error: `接続エラー: ${error.message}`
        }));
        handleReconnect();
      });

      // Disconnected
      socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          error: reason === 'io client disconnect' ? null : `接続が切断されました: ${reason}`
        }));

        // Only attempt reconnect if it wasn't a manual disconnect
        if (reason !== 'io client disconnect') {
          handleReconnect();
        }
      });

      // Environment data updates
      socket.on('environmentUpdate', (data: EnvironmentData) => {
        console.log('Received environment update:', data);
        
        // Convert timestamp string to Date object if needed
        const processedData: EnvironmentData = {
          ...data,
          timestamp: typeof data.timestamp === 'string' ? new Date(data.timestamp) : data.timestamp
        };

        setEnvironmentData(processedData);
        setState(prev => ({
          ...prev,
          lastUpdate: new Date(),
          error: null
        }));
      });

      // Error messages from server
      socket.on('error', (errorData: { code: string; message: string }) => {
        console.error('WebSocket server error:', errorData);
        setState(prev => ({
          ...prev,
          error: `サーバーエラー: ${errorData.message}`
        }));
      });

      // Connection status updates
      socket.on('connectionStatus', (status: { connected: boolean; timestamp: string }) => {
        console.log('Connection status update:', status);
        if (!status.connected) {
          setState(prev => ({
            ...prev,
            error: 'サーバーとの接続が失われました'
          }));
        }
      });

      // History data updates
      socket.on('historyUpdate', (historyData: HistoricalDataPoint[]) => {
        console.log('Received history update:', historyData.length, 'data points');
        // History data is handled by the history hook, but we could emit a custom event here
        // if needed for coordination between hooks
      });

      // Alert updates
      socket.on('alertUpdate', (alerts: Alert[]) => {
        console.log('Received alert update:', alerts.length, 'alerts');
        if (onAlertUpdate) {
          const processedAlerts = alerts.map(alert => ({
            ...alert,
            timestamp: typeof alert.timestamp === 'string' ? new Date(alert.timestamp) : alert.timestamp
          }));
          onAlertUpdate(processedAlerts);
        }
      });

      // New alert triggered
      socket.on('alertTriggered', (alert: Alert) => {
        console.log('New alert triggered:', alert);
        if (onAlertTriggered) {
          const processedAlert = {
            ...alert,
            timestamp: typeof alert.timestamp === 'string' ? new Date(alert.timestamp) : alert.timestamp
          };
          onAlertTriggered(processedAlert);
        }
      });

      // Alert dismissed
      socket.on('alertDismissed', (data: { alertId: string }) => {
        console.log('Alert dismissed:', data.alertId);
        if (onAlertDismissed) {
          onAlertDismissed(data.alertId);
        }
      });

    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        error: `初期化エラー: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
  }, []);

  // Handle reconnection logic
  const handleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      setState(prev => ({
        ...prev,
        error: `再接続に失敗しました (${MAX_RECONNECT_ATTEMPTS}回試行)`
      }));
      return;
    }

    reconnectAttemptsRef.current += 1;
    console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})...`);

    reconnectTimeoutRef.current = window.setTimeout(() => {
      initializeConnection();
    }, RECONNECT_DELAY);
  }, [initializeConnection]);

  // Subscribe to environment updates
  const subscribe = useCallback(() => {
    if (!socketRef.current?.connected) {
      console.warn('Cannot subscribe: WebSocket not connected');
      return;
    }

    console.log('Subscribing to environment updates');
    isSubscribedRef.current = true;
    socketRef.current.emit('subscribeEnvironment');
  }, []);

  // Unsubscribe from environment updates
  const unsubscribe = useCallback(() => {
    if (!socketRef.current?.connected) {
      console.warn('Cannot unsubscribe: WebSocket not connected');
      return;
    }

    console.log('Unsubscribing from environment updates');
    isSubscribedRef.current = false;
    socketRef.current.emit('unsubscribeEnvironment');
  }, []);

  // Request history data
  const getHistory = useCallback((period: TimePeriod) => {
    if (!socketRef.current?.connected) {
      console.warn('Cannot request history: WebSocket not connected');
      return;
    }

    console.log('Requesting history data for period:', period);
    socketRef.current.emit('getHistory', period);
  }, []);

  // Manual reconnect
  const reconnect = useCallback(() => {
    console.log('Manual reconnect requested');
    
    // Clear any pending reconnect timeout
    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Reset reconnect attempts
    reconnectAttemptsRef.current = 0;

    // Disconnect existing connection
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Initialize new connection
    initializeConnection();
  }, [initializeConnection]);

  // Initialize connection on mount
  useEffect(() => {
    initializeConnection();

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [initializeConnection]);

  return {
    environmentData,
    state,
    subscribe,
    unsubscribe,
    reconnect,
    getHistory,
    onAlertUpdate,
    onAlertTriggered,
    onAlertDismissed
  };
};