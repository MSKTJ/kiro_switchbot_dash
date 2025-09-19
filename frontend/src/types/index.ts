// Environment Data Types
export interface EnvironmentData {
  temperature: number;
  humidity: number;
  light: number;
  timestamp: Date;
}

// Historical Data Types
export interface HistoricalDataPoint {
  timestamp: Date;
  temperature: number;
  humidity: number;
  light: number;
  temperatureMin?: number;
  temperatureMax?: number;
  humidityMin?: number;
  humidityMax?: number;
  lightMin?: number;
  lightMax?: number;
  sampleCount?: number;
}

export type TimePeriod = '24h' | '1w' | '1m';

export interface HistoryStatistics {
  temperature: { min: number; max: number; avg: number };
  humidity: { min: number; max: number; avg: number };
  light: { min: number; max: number; avg: number };
  dataPointCount: number;
}

// Device Types
export interface Device {
  deviceId: string;
  deviceName: string;
  deviceType: 'Light' | 'Air Conditioner' | 'Hub';
  status: 'online' | 'offline';
  properties: DeviceProperties;
}

export interface LightProperties {
  power: 'on' | 'off';
  brightness?: number;
}

export interface AirConditionerProperties {
  power: 'on' | 'off';
  mode: 'cool' | 'heat' | 'dry' | 'auto';
  temperature: number;
}

export type DeviceProperties = LightProperties | AirConditionerProperties;

// Settings Types
export interface AppSettings {
  updateInterval: number;
  temperatureThreshold: {
    min: number;
    max: number;
  };
  humidityThreshold: {
    min: number;
    max: number;
  };
  theme: 'dark' | 'light';
}

// Alert Types
export interface Alert {
  id: string;
  type: 'temperature' | 'humidity';
  severity: 'warning' | 'critical';
  message: string;
  timestamp: Date;
  isActive: boolean;
  value: number;
  threshold: number;
  condition: 'above' | 'below';
}

export interface AlertThresholds {
  temperature: {
    min: number;
    max: number;
  };
  humidity: {
    min: number;
    max: number;
  };
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}