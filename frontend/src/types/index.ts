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
export type DeviceType = 'Light' | 'Air Conditioner' | 'Hub' | 'Bot' | 'Curtain' | 'Plug' | 'Unknown';
export type DeviceStatus = 'online' | 'offline' | 'unknown';

export interface Device {
  deviceId: string;
  deviceName: string;
  deviceType: DeviceType;
  status: DeviceStatus;
  hubDeviceId?: string;
  enableCloudService?: boolean;
  isInfraredRemote?: boolean;
  remoteType?: string;
  properties?: DeviceProperties;
  lastUpdated: string;
}

export interface LightProperties {
  power: 'on' | 'off';
  brightness?: number;
  colorTemperature?: number;
  color?: {
    red: number;
    green: number;
    blue: number;
  };
}

export interface AirConditionerProperties {
  power: 'on' | 'off';
  mode: 'cool' | 'heat' | 'dry' | 'auto' | 'fan';
  temperature: number;
  fanSpeed: 'auto' | 'low' | 'medium' | 'high';
}

export interface HubProperties {
  temperature?: number;
  humidity?: number;
  lightLevel?: number;
  version?: string;
}

export interface BotProperties {
  power: 'on' | 'off';
  battery?: number;
}

export interface CurtainProperties {
  position: number;
  battery?: number;
  calibrate?: boolean;
}

export interface PlugProperties {
  power: 'on' | 'off';
  voltage?: number;
  current?: number;
  power_consumption?: number;
}

export type DeviceProperties = LightProperties | AirConditionerProperties | HubProperties | BotProperties | CurtainProperties | PlugProperties;

// Device API Response Types
export interface DeviceListResponse {
  devices: Device[];
  total: number;
  timestamp: string;
}

export interface DeviceStatistics {
  total: number;
  online: number;
  offline: number;
  unknown: number;
  controllable: number;
  byType: Record<DeviceType, number>;
}

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