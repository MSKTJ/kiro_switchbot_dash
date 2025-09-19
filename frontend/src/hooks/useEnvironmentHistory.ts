import { useState, useEffect, useCallback } from 'react';
import { HistoricalDataPoint, TimePeriod, HistoryStatistics } from '../types';

export interface HistoryState {
  data: HistoricalDataPoint[];
  statistics: HistoryStatistics | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface UseEnvironmentHistoryReturn {
  historyState: HistoryState;
  selectedPeriod: TimePeriod;
  setSelectedPeriod: (period: TimePeriod) => void;
  refreshHistory: () => Promise<void>;
  clearError: () => void;
}

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3001/api';

export const useEnvironmentHistory = (initialPeriod: TimePeriod = '24h'): UseEnvironmentHistoryReturn => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(initialPeriod);
  const [historyState, setHistoryState] = useState<HistoryState>({
    data: [],
    statistics: null,
    isLoading: false,
    error: null,
    lastUpdated: null
  });

  // Fetch history data from API
  const fetchHistoryData = useCallback(async (period: TimePeriod): Promise<void> => {
    setHistoryState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`${API_BASE_URL}/environment/history/${period}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch history data');
      }

      // Convert timestamp strings to Date objects
      const processedData: HistoricalDataPoint[] = result.data.dataPoints.map((point: any) => ({
        ...point,
        timestamp: new Date(point.timestamp)
      }));

      setHistoryState(prev => ({
        ...prev,
        data: processedData,
        statistics: result.data.statistics,
        isLoading: false,
        error: null,
        lastUpdated: new Date()
      }));

      console.log(`Loaded ${processedData.length} historical data points for period: ${period}`);
    } catch (error) {
      console.error('Failed to fetch history data:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unknown error occurred while fetching history data';

      setHistoryState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  }, []);

  // Refresh current period data
  const refreshHistory = useCallback(async (): Promise<void> => {
    await fetchHistoryData(selectedPeriod);
  }, [selectedPeriod, fetchHistoryData]);

  // Clear error state
  const clearError = useCallback((): void => {
    setHistoryState(prev => ({ ...prev, error: null }));
  }, []);

  // Handle period change
  const handlePeriodChange = useCallback((period: TimePeriod): void => {
    if (period !== selectedPeriod) {
      setSelectedPeriod(period);
    }
  }, [selectedPeriod]);

  // Fetch data when period changes
  useEffect(() => {
    fetchHistoryData(selectedPeriod);
  }, [selectedPeriod, fetchHistoryData]);

  // Auto-refresh data periodically (every 5 minutes for current data)
  useEffect(() => {
    if (selectedPeriod === '24h') {
      const interval = setInterval(() => {
        fetchHistoryData(selectedPeriod);
      }, 5 * 60 * 1000); // 5 minutes

      return () => clearInterval(interval);
    }
  }, [selectedPeriod, fetchHistoryData]);

  return {
    historyState,
    selectedPeriod,
    setSelectedPeriod: handlePeriodChange,
    refreshHistory,
    clearError
  };
};