/**
 * Settings type definitions
 */

export interface AppSettings {
  dataUpdateInterval: number; // seconds
  alertThresholds: {
    temperature: {
      min: number;
      max: number;
    };
    humidity: {
      min: number;
      max: number;
    };
  };
  notifications: {
    enabled: boolean;
    sound: boolean;
  };
}

export interface SettingsUpdateRequest {
  dataUpdateInterval?: number;
  alertThresholds?: {
    temperature?: {
      min?: number;
      max?: number;
    };
    humidity?: {
      min?: number;
      max?: number;
    };
  };
  notifications?: {
    enabled?: boolean;
    sound?: boolean;
  };
}

export interface SettingsApiResponse {
  success: boolean;
  data: AppSettings;
  message?: string;
}

export interface SettingsApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}