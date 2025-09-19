/**
 * Light control panel component for managing multiple lighting devices
 */

import { useState, useEffect } from 'react';
import { Device, LightProperties } from '../types';
import { useLightControl } from '../hooks/useLightControl';
import LightControl from './LightControl';

interface LightControlPanelProps {
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

const LightControlPanel = ({ 
  devices, 
  onDeviceUpdate, 
  className = '' 
}: LightControlPanelProps) => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ControlFeedback[]>([]);
  const [showAllLights, setShowAllLights] = useState(false);

  const {
    error,
    clearError
  } = useLightControl();

  // Filter light devices
  const lightDevices = devices.filter(device => device.deviceType === 'Light');
  const onlineLights = lightDevices.filter(device => device.status === 'online');
  const offlineLights = lightDevices.filter(device => device.status === 'offline');

  // Auto-select first light device if none selected
  useEffect(() => {
    if (!selectedDeviceId && onlineLights.length > 0) {
      setSelectedDeviceId(onlineLights[0].deviceId);
    }
  }, [selectedDeviceId, onlineLights]);

  const selectedDevice = lightDevices.find(device => device.deviceId === selectedDeviceId);

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
    const device = lightDevices.find(d => d.deviceId === deviceId);
    return device?.deviceName || deviceId;
  };

  /**
   * Clear feedback
   */
  const clearFeedback = () => {
    setFeedback([]);
    clearError();
  };

  if (lightDevices.length === 0) {
    return (
      <div className={`card p-6 ${className}`}>
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="text-lg font-medium">照明デバイスが見つかりません</p>
          </div>
          <p className="text-gray-500">
            SwitchBot照明デバイスが登録されていないか、接続に問題があります。
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
          <h2 className="text-xl font-semibold text-white">照明制御</h2>
          <p className="text-sm text-gray-400 mt-1">
            {onlineLights.length} / {lightDevices.length} デバイスがオンライン
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAllLights(!showAllLights)}
            className="btn-secondary text-sm"
          >
            {showAllLights ? '選択表示' : 'すべて表示'}
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
      {!showAllLights && lightDevices.length > 1 && (
        <div className="card p-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            制御するデバイスを選択
          </label>
          <select
            value={selectedDeviceId || ''}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {onlineLights.map(device => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.deviceName} (オンライン)
              </option>
            ))}
            {offlineLights.map(device => (
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

      {/* Light Controls */}
      {showAllLights ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lightDevices.map(device => (
            <div key={device.deviceId} className="card p-4">
              <LightControl
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
          <LightControl
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
          <div className="text-2xl font-bold text-white">{lightDevices.length}</div>
          <div className="text-sm text-gray-400">総デバイス数</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{onlineLights.length}</div>
          <div className="text-sm text-gray-400">オンライン</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {onlineLights.filter(device => {
              const props = device.properties as LightProperties;
              return props?.power === 'on';
            }).length}
          </div>
          <div className="text-sm text-gray-400">点灯中</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">
            {Math.round(
              onlineLights.reduce((sum, device) => {
                const props = device.properties as LightProperties;
                return sum + (props?.brightness || 0);
              }, 0) / Math.max(onlineLights.length, 1)
            )}%
          </div>
          <div className="text-sm text-gray-400">平均明るさ</div>
        </div>
      </div>

      {/* Global Error */}
      {error && (
        <div className="card p-4 bg-red-900 border border-red-700">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-red-300">エラーが発生しました</h4>
              <p className="text-sm text-red-400 mt-1">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="text-red-300 hover:text-red-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LightControlPanel;