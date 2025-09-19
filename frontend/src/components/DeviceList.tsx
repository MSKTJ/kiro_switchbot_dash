/**
 * Device list component for displaying all devices
 */

import { useState } from 'react';
import { Device, DeviceType, DeviceStatus } from '../types';
import DeviceCard from './DeviceCard';

interface DeviceListProps {
  devices: Device[];
  isLoading: boolean;
  error: string | null;
  onControl?: (deviceId: string, command: string, parameter?: any) => Promise<boolean>;
  onStatusUpdate?: (deviceId: string) => Promise<void>;
  onTest?: (deviceId: string) => Promise<boolean>;
  onRefresh?: () => void;
}

interface DeviceFilters {
  type: DeviceType | 'all';
  status: DeviceStatus | 'all';
  controllableOnly: boolean;
}

const DeviceList = ({
  devices,
  isLoading,
  error,
  onControl,
  onStatusUpdate,
  onTest,
  onRefresh
}: DeviceListProps) => {
  const [filters, setFilters] = useState<DeviceFilters>({
    type: 'all',
    status: 'all',
    controllableOnly: false
  });
  const [controllingDevices, setControllingDevices] = useState<Set<string>>(new Set());

  const deviceTypes: (DeviceType | 'all')[] = [
    'all', 'Light', 'Air Conditioner', 'Hub', 'Bot', 'Curtain', 'Plug', 'Unknown'
  ];

  const statusOptions: (DeviceStatus | 'all')[] = ['all', 'online', 'offline', 'unknown'];

  const getTypeLabel = (type: DeviceType | 'all'): string => {
    const labels: Record<DeviceType | 'all', string> = {
      'all': 'すべて',
      'Light': '照明',
      'Air Conditioner': 'エアコン',
      'Hub': 'ハブ',
      'Bot': 'ボット',
      'Curtain': 'カーテン',
      'Plug': 'プラグ',
      'Unknown': '不明'
    };
    return labels[type];
  };

  const getStatusLabel = (status: DeviceStatus | 'all'): string => {
    const labels: Record<DeviceStatus | 'all', string> = {
      'all': 'すべて',
      'online': 'オンライン',
      'offline': 'オフライン',
      'unknown': '不明'
    };
    return labels[status];
  };

  const isControllableDevice = (deviceType: DeviceType): boolean => {
    const controllableTypes: DeviceType[] = ['Light', 'Air Conditioner', 'Bot', 'Curtain', 'Plug'];
    return controllableTypes.includes(deviceType);
  };

  const filteredDevices = devices.filter(device => {
    // Type filter
    if (filters.type !== 'all' && device.deviceType !== filters.type) {
      return false;
    }

    // Status filter
    if (filters.status !== 'all' && device.status !== filters.status) {
      return false;
    }

    // Controllable only filter
    if (filters.controllableOnly && !isControllableDevice(device.deviceType)) {
      return false;
    }

    return true;
  });

  const handleControl = async (deviceId: string, command: string, parameter?: any): Promise<boolean> => {
    if (!onControl) return false;

    setControllingDevices(prev => new Set(prev).add(deviceId));
    
    try {
      const success = await onControl(deviceId, command, parameter);
      return success;
    } finally {
      setControllingDevices(prev => {
        const newSet = new Set(prev);
        newSet.delete(deviceId);
        return newSet;
      });
    }
  };

  const handleStatusUpdate = async (deviceId: string): Promise<void> => {
    if (onStatusUpdate) {
      await onStatusUpdate(deviceId);
    }
  };

  const handleTest = async (deviceId: string): Promise<boolean> => {
    if (onTest) {
      return await onTest(deviceId);
    }
    return false;
  };

  const groupedDevices = filteredDevices.reduce((groups, device) => {
    const type = device.deviceType;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(device);
    return groups;
  }, {} as Record<DeviceType, Device[]>);

  if (error) {
    return (
      <div className="card p-6">
        <div className="text-center">
          <div className="text-red-400 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-lg font-medium">デバイス取得エラー</p>
          </div>
          <p className="text-gray-400 mb-4">{error}</p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="btn-primary"
            >
              再試行
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">デバイス一覧</h2>
          <p className="text-sm text-gray-400 mt-1">
            {filteredDevices.length} / {devices.length} デバイス
          </p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="btn-secondary flex items-center space-x-2"
          >
            <svg 
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{isLoading ? '更新中...' : '更新'}</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              デバイスタイプ
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as DeviceType | 'all' }))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {deviceTypes.map(type => (
                <option key={type} value={type}>
                  {getTypeLabel(type)}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              ステータス
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as DeviceStatus | 'all' }))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>
                  {getStatusLabel(status)}
                </option>
              ))}
            </select>
          </div>

          {/* Controllable Only Filter */}
          <div className="flex items-end">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.controllableOnly}
                onChange={(e) => setFilters(prev => ({ ...prev, controllableOnly: e.target.checked }))}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-300">制御可能のみ</span>
            </label>
          </div>
        </div>
      </div>

      {/* Device List */}
      {isLoading && devices.length === 0 ? (
        <div className="card p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-400">デバイスを検索中...</p>
          </div>
        </div>
      ) : filteredDevices.length === 0 ? (
        <div className="card p-8">
          <div className="text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 6.306A7.962 7.962 0 0112 5c-2.34 0-4.29 1.009-5.824 2.562" />
              </svg>
              <p className="text-lg font-medium">デバイスが見つかりません</p>
            </div>
            <p className="text-gray-500">
              {devices.length === 0 
                ? 'SwitchBotデバイスが登録されていないか、接続に問題があります。'
                : 'フィルター条件に一致するデバイスがありません。'
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedDevices).map(([deviceType, typeDevices]) => (
            <div key={deviceType}>
              <h3 className="text-lg font-medium text-white mb-3 flex items-center">
                <span className="mr-2">{getTypeLabel(deviceType as DeviceType)}</span>
                <span className="text-sm text-gray-400">({typeDevices.length})</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {typeDevices.map(device => (
                  <DeviceCard
                    key={device.deviceId}
                    device={device}
                    onControl={handleControl}
                    onStatusUpdate={handleStatusUpdate}
                    onTest={handleTest}
                    isControlling={controllingDevices.has(device.deviceId)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeviceList;