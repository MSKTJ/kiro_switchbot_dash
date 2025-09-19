/**
 * Air conditioner control panel component for managing multiple air conditioning devices
 */

import { useState, useEffect } from 'react';
import { Device, AirConditionerProperties } from '../types';
import AirConditionerControl from './AirConditionerControl';

interface AirConditionerControlPanelProps {
  devices: Device[];
  onDeviceUpdate?: (deviceId: string) => void;
  className?: string;
}

interface ControlFeedback {
  deviceId: string;
  action: string;
  success: boolean;
  message: string;
  timestamp: Date;
}

const AirConditionerControlPanel = ({ 
  devices, 
  onDeviceUpdate, 
  className = '' 
}: AirConditionerControlPanelProps) => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ControlFeedback[]>([]);
  const [showAllAircons, setShowAllAircons] = useState(false);

  // Filter air conditioner devices
  const airconDevices = devices.filter(device => device.deviceType === 'Air Conditioner');
  const onlineAircons = airconDevices.filter(device => device.status === 'online');
  const offlineAircons = airconDevices.filter(device => device.status === 'offline');

  // Auto-select first air conditioner device if none selected
  useEffect(() => {
    if (!selectedDeviceId && onlineAircons.length > 0) {
      setSelectedDeviceId(onlineAircons[0].deviceId);
    }
  }, [selectedDeviceId, onlineAircons]);

  const selectedDevice = airconDevices.find(device => device.deviceId === selectedDeviceId);

  /**
   * Handle control success
   */
  const handleControlSuccess = (deviceId: string, action: string, _result: any) => {
    const newFeedback: ControlFeedback = {
      deviceId,
      action,
      success: true,
      message: `${action}が完了しました`,
      timestamp: new Date()
    };

    setFeedback(prev => [newFeedback, ...prev.slice(0, 4)]); // Keep last 5 feedback items
    onDeviceUpdate?.(deviceId);
  };

  /**
   * Handle control error
   */
  const handleControlError = (deviceId: string, action: string, error: string) => {
    const newFeedback: ControlFeedback = {
      deviceId,
      action,
      success: false,
      message: `${action}に失敗: ${error}`,
      timestamp: new Date()
    };

    setFeedback(prev => [newFeedback, ...prev.slice(0, 4)]);
  };

  /**
   * Get device name by ID
   */
  const getDeviceName = (deviceId: string): string => {
    const device = airconDevices.find(d => d.deviceId === deviceId);
    return device?.deviceName || deviceId;
  };

  /**
   * Clear feedback
   */
  const clearFeedback = () => {
    setFeedback([]);
  };

  if (airconDevices.length === 0) {
    return (
      <div className={`card p-6 ${className}`}>
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p className="text-lg font-medium">エアコンデバイスが見つかりません</p>
          </div>
          <p className="text-gray-500">
            SwitchBotエアコンデバイスが登録されていないか、接続に問題があります。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">エアコン制御</h2>
          <p className="text-sm text-gray-400 mt-1">
            {onlineAircons.length} / {airconDevices.length} デバイスがオンライン
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAllAircons(!showAllAircons)}
            className="btn-secondary text-sm"
          >
            {showAllAircons ? '選択表示' : 'すべて表示'}
          </button>
          {feedback.length > 0 && (
            <button
              onClick={clearFeedback}
              className="btn-secondary text-sm"
            >
              履歴クリア
            </button>
          )}
        </div>
      </div>

      {/* Device Selector */}
      {!showAllAircons && airconDevices.length > 1 && (
        <div className="card p-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            制御するデバイスを選択
          </label>
          <select
            value={selectedDeviceId || ''}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {onlineAircons.map(device => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.deviceName} (オンライン)
              </option>
            ))}
            {offlineAircons.map(device => (
              <option key={device.deviceId} value={device.deviceId} disabled>
                {device.deviceName} (オフライン)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Control Feedback */}
      {feedback.length > 0 && (
        <div className="card p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-3">制御履歴</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {feedback.map((item, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-2 rounded text-sm ${
                  item.success
                    ? 'bg-green-900 text-green-300'
                    : 'bg-red-900 text-red-300'
                }`}
              >
                <div>
                  <span className="font-medium">{getDeviceName(item.deviceId)}</span>
                  <span className="ml-2">{item.message}</span>
                </div>
                <span className="text-xs opacity-75">
                  {item.timestamp.toLocaleTimeString('ja-JP', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Air Conditioner Controls */}
      {showAllAircons ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {airconDevices.map(device => (
            <div key={device.deviceId} className="card p-4">
              <AirConditionerControl
                device={device}
                onControlSuccess={handleControlSuccess}
                onControlError={handleControlError}
                disabled={device.status !== 'online'}
              />
            </div>
          ))}
        </div>
      ) : selectedDevice ? (
        <div className="card p-6">
          <AirConditionerControl
            device={selectedDevice}
            onControlSuccess={handleControlSuccess}
            onControlError={handleControlError}
            disabled={selectedDevice.status !== 'online'}
          />
        </div>
      ) : (
        <div className="card p-6">
          <div className="text-center text-gray-400">
            制御するデバイスを選択してください
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-white">{airconDevices.length}</div>
          <div className="text-sm text-gray-400">総デバイス数</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{onlineAircons.length}</div>
          <div className="text-sm text-gray-400">オンライン</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">
            {onlineAircons.filter(device => {
              const props = device.properties as AirConditionerProperties;
              return props?.power === 'on';
            }).length}
          </div>
          <div className="text-sm text-gray-400">運転中</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-orange-400">
            {Math.round(
              onlineAircons.reduce((sum, device) => {
                const props = device.properties as AirConditionerProperties;
                return sum + (props?.temperature || 25);
              }, 0) / Math.max(onlineAircons.length, 1)
            )}°C
          </div>
          <div className="text-sm text-gray-400">平均設定温度</div>
        </div>
      </div>

      {/* Mode Distribution */}
      {onlineAircons.length > 0 && (
        <div className="card p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-3">運転モード分布</h3>
          <div className="grid grid-cols-5 gap-2">
            {(['cool', 'heat', 'dry', 'auto', 'fan'] as const).map(mode => {
              const count = onlineAircons.filter(device => {
                const props = device.properties as AirConditionerProperties;
                return props?.mode === mode && props?.power === 'on';
              }).length;
              
              const modeNames = {
                cool: '冷房',
                heat: '暖房',
                dry: '除湿',
                auto: '自動',
                fan: '送風'
              };

              const modeIcons = {
                cool: '❄️',
                heat: '🔥',
                dry: '💨',
                auto: '🔄',
                fan: '🌀'
              };

              return (
                <div key={mode} className="text-center p-2 bg-gray-700 rounded">
                  <div className="text-lg">{modeIcons[mode]}</div>
                  <div className="text-xs text-gray-400">{modeNames[mode]}</div>
                  <div className="text-sm font-bold text-white">{count}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AirConditionerControlPanel;