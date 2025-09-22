/**
 * Custom hook for settings management
 */

import { useState, useEffect, useCallback } from 'react';
import { AppSettings, SettingsUpdateRequest, SettingsApiResponse, SettingsApiError } from '../types/settings';

interface UseSettingsReturn {
  settings: AppSettings | null;
  isLoading: boolean;
  error: string | null;
  updateSettings: (updates: SettingsUpdateRequest) => Promise<boolean>;
  resetSettings: () => Promise<boolean>;
  refreshSettings: () => Promise<void>;
}

export const useSettings = (): UseSettingsReturn => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch settings from API
   */
  const fetchSettings = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/settings');
      const data: SettingsApiResponse | SettingsApiError = await response.json();

      if (!response.ok || !data.success) {
        const errorData = data as SettingsApiError;
        throw new Error(errorData.error?.message || 'Failed to fetch settings');
      }

      const successData = data as SettingsApiResponse;
      setSettings(successData.data);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Failed to fetch settings:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update settings
   */
  const updateSettings = useCallback(async (updates: SettingsUpdateRequest): Promise<boolean> => {
    try {
      setError(null);

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      const data: SettingsApiResponse | SettingsApiError = await response.json();

      if (!response.ok || !data.success) {
        const errorData = data as SettingsApiError;
        throw new Error(errorData.error?.message || 'Failed to update settings');
      }

      const successData = data as SettingsApiResponse;
      setSettings(successData.data);
      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Failed to update settings:', err);
      return false;
    }
  }, []);

  /**
   * Reset settings to defaults
   */
  const resetSettings = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);

      const response = await fetch('/api/settings/reset', {
        method: 'POST'
      });

      const data: SettingsApiResponse | SettingsApiError = await response.json();

      if (!response.ok || !data.success) {
        const errorData = data as SettingsApiError;
        throw new Error(errorData.error?.message || 'Failed to reset settings');
      }

      const successData = data as SettingsApiResponse;
      setSettings(successData.data);
      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Failed to reset settings:', err);
      return false;
    }
  }, []);

  /**
   * Refresh settings (alias for fetchSettings)
   */
  const refreshSettings = useCallback(async (): Promise<void> => {
    await fetchSettings();
  }, [fetchSettings]);

  // Load settings on mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    resetSettings,
    refreshSettings
  };
};