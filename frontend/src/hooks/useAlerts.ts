import { useState, useEffect, useCallback } from 'react';
import { Alert, AlertThresholds, ApiResponse } from '../types';

interface AlertState {
  alerts: Alert[];
  thresholds: AlertThresholds | null;
  isLoading: boolean;
  error: string | null;
}

interface AlertStatistics {
  activeCount: number;
  totalToday: number;
  temperatureAlerts: number;
  humidityAlerts: number;
}

export const useAlerts = () => {
  const [state, setState] = useState<AlertState>({
    alerts: [],
    thresholds: null,
    isLoading: false,
    error: null
  });

  const [statistics, setStatistics] = useState<AlertStatistics>({
    activeCount: 0,
    totalToday: 0,
    temperatureAlerts: 0,
    humidityAlerts: 0
  });

  // Fetch active alerts
  const fetchAlerts = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch('/api/alerts');
      const data: ApiResponse<{ alerts: any[]; count: number }> = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch alerts');
      }

      const alerts: Alert[] = data.data?.alerts.map(alert => ({
        ...alert,
        timestamp: new Date(alert.timestamp)
      })) || [];

      setState(prev => ({
        ...prev,
        alerts,
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch alerts',
        isLoading: false
      }));
    }
  }, []);

  // Fetch alert thresholds
  const fetchThresholds = useCallback(async () => {
    try {
      const response = await fetch('/api/alerts/thresholds');
      const data: ApiResponse<AlertThresholds> = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch thresholds');
      }

      setState(prev => ({
        ...prev,
        thresholds: data.data || null
      }));
    } catch (error) {
      console.error('Failed to fetch thresholds:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch thresholds'
      }));
    }
  }, []);

  // Fetch alert statistics
  const fetchStatistics = useCallback(async () => {
    try {
      const response = await fetch('/api/alerts/statistics');
      const data: ApiResponse<AlertStatistics> = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch statistics');
      }

      setStatistics(data.data || {
        activeCount: 0,
        totalToday: 0,
        temperatureAlerts: 0,
        humidityAlerts: 0
      });
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  }, []);

  // Update alert thresholds
  const updateThresholds = useCallback(async (newThresholds: AlertThresholds) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch('/api/alerts/thresholds', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newThresholds)
      });

      const data: ApiResponse<{ thresholds: AlertThresholds }> = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update thresholds');
      }

      setState(prev => ({
        ...prev,
        thresholds: data.data?.thresholds || null,
        isLoading: false
      }));

      // Refresh alerts after updating thresholds
      await fetchAlerts();
    } catch (error) {
      console.error('Failed to update thresholds:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update thresholds',
        isLoading: false
      }));
      throw error; // Re-throw to allow component to handle
    }
  }, [fetchAlerts]);

  // Dismiss a specific alert
  const dismissAlert = useCallback(async (alertId: string) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'DELETE'
      });

      const data: ApiResponse<{ alertId: string }> = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to dismiss alert');
      }

      // Remove alert from local state
      setState(prev => ({
        ...prev,
        alerts: prev.alerts.filter(alert => alert.id !== alertId)
      }));

      // Refresh statistics
      await fetchStatistics();
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to dismiss alert'
      }));
    }
  }, [fetchStatistics]);

  // Clear all alerts
  const clearAllAlerts = useCallback(async () => {
    try {
      const response = await fetch('/api/alerts', {
        method: 'DELETE'
      });

      const data: ApiResponse<{ message: string }> = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to clear alerts');
      }

      // Clear alerts from local state
      setState(prev => ({
        ...prev,
        alerts: []
      }));

      // Refresh statistics
      await fetchStatistics();
    } catch (error) {
      console.error('Failed to clear alerts:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to clear alerts'
      }));
    }
  }, [fetchStatistics]);

  // Update alerts from WebSocket
  const updateAlertsFromWebSocket = useCallback((newAlerts: Alert[]) => {
    const alerts = newAlerts.map(alert => ({
      ...alert,
      timestamp: new Date(alert.timestamp)
    }));

    setState(prev => ({
      ...prev,
      alerts
    }));
  }, []);

  // Handle new alert from WebSocket
  const handleNewAlert = useCallback((alert: Alert) => {
    const newAlert = {
      ...alert,
      timestamp: new Date(alert.timestamp)
    };

    setState(prev => ({
      ...prev,
      alerts: [...prev.alerts.filter(a => a.id !== alert.id), newAlert]
    }));
  }, []);

  // Handle alert dismissal from WebSocket
  const handleAlertDismissed = useCallback((alertId: string) => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.filter(alert => alert.id !== alertId)
    }));
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchAlerts();
    fetchThresholds();
    fetchStatistics();
  }, [fetchAlerts, fetchThresholds, fetchStatistics]);

  return {
    // State
    alerts: state.alerts,
    thresholds: state.thresholds,
    statistics,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    fetchAlerts,
    fetchThresholds,
    fetchStatistics,
    updateThresholds,
    dismissAlert,
    clearAllAlerts,

    // WebSocket handlers
    updateAlertsFromWebSocket,
    handleNewAlert,
    handleAlertDismissed
  };
};