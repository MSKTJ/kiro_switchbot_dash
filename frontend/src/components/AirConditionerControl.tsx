/**
 * Air conditioner control component for managing air conditioning devices
 */

import { useState, useCallback } from 'react';
import { Device, AirConditionerProperties } from '../types';

interface AirConditionerControlProps {
  device: Device;
  onControlSuccess?: (deviceId: string, action: string, result: any) => void;
  onControlError?: (deviceId: string, action: string, error: string) => void;
  disabled?: boolean;
}

interface ControlResponse {
  success: boolean;
  message?: string;
  error?: string;
}

const AirConditionerControl = ({ 
  device, 
  onControlSuccess, 
  onControlError, 
  disabled = false 
}: AirConditionerControlProps) => {
  const [isControlling, setIsControlling] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    timestamp: Date;
  } | null>(null);

  const airconProperties = device.properties as AirConditionerProperties;
  const isPoweredOn = airconProperties?.power === 'on';
  const currentMode = airconProperties?.mode || 'auto';
  const currentTemperature = airconProperties?.temperature || 25;

  /**
   * Show feedback message to user
   */
  const showFeedback = useCallback((type: 'success' | 'error', message: string) => {
    setFeedback({
      type,
      message,
      timestamp: new Date()
    });

    // Auto-hide feedback after 3 seconds
    setTimeout(() => {
      setFeedback(null);
    }, 3000);
  }, []);

  /**
   * Generic control function with error handling and feedback
   */
  const controlAirConditioner = useCallback(async (
    endpoint: string,
    body?: any,
    actionName: string = 'control'
  ): Promise<ControlResponse> => {
    if (isControlling || disabled) {
      return { success: false, error: 'Control operation already in progress' };
    }

    setIsControlling(true);
    
    try {
      const response = await fetch(`/api/devices/${device.deviceId}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const errorMessage = result.error?.message || result.error || 'Control operation failed';
        showFeedback('error', `${actionName}に失敗しました: ${errorMessage}`);
        onControlError?.(device.deviceId, actionName, errorMessage);
        return { success: false, error: errorMessage };
      }

      showFeedback('success', `${actionName}が完了しました`);
      onControlSuccess?.(device.deviceId, actionName, result.data);
      return { success: true, message: `${actionName} completed successfully` };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showFeedback('error', `${actionName}中にエラーが発生しました: ${errorMessage}`);
      onControlError?.(device.deviceId, actionName, errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsControlling(false);
    }
  }, [device.deviceId, isControlling, disabled, showFeedback, onControlSuccess, onControlError]);

  /**
   * Toggle air conditioner power (ON/OFF)
   */
  const handleTogglePower = useCallback(async () => {
    const actionName = isPoweredOn ? '電源OFF' : '電源ON';
    await controlAirConditioner('/aircon/toggle', undefined, actionName);
  }, [controlAirConditioner, isPoweredOn]);

  /**
   * Set air conditioner power explicitly
   */
  const handleSetPower = useCallback(async (power: 'on' | 'off') => {
    const actionName = power === 'on' ? '電源ON' : '電源OFF';
    await controlAirConditioner('/aircon/power', { power }, actionName);
  }, [controlAirConditioner]);

  /**
   * Set air conditioner operation mode
   */
  const handleSetMode = useCallback(async (mode: 'cool' | 'heat' | 'dry' | 'auto' | 'fan') => {
    const modeNames = {
      cool: '冷房',
      heat: '暖房',
      dry: '除湿',
      auto: '自動',
      fan: '送風'
    };
    await controlAirConditioner('/aircon/mode', { mode }, `運転モード変更 (${modeNames[mode]})`);
  }, [controlAirConditioner]);

  /**
   * Set air conditioner target temperature
   */
  const handleSetTemperature = useCallback(async (temperature: number) => {
    await controlAirConditioner('/aircon/temperature', { temperature }, `温度設定 (${temperature}°C)`);
  }, [controlAirConditioner]);

  /**
   * Handle temperature adjustment buttons
   */
  const handleTemperatureAdjust = useCallback((delta: number) => {
    const newTemperature = Math.max(16, Math.min(30, currentTemperature + delta));
    handleSetTemperature(newTemperature);
  }, [currentTemperature, handleSetTemperature]);

  /**
   * Handle temperature slider change
   */
  const handleTemperatureSliderChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const temperature = parseInt(event.target.value, 10);
    handleSetTemperature(temperature);
  }, [handleSetTemperature]);

  if (device.deviceType !== 'Air Conditioner') {
    return (
      <div className="text-center text-gray-400 text-sm p-4">
        このデバイスはエアコンではありません
      </div>
    );
  }

  const modeIcons = {
    cool: '❄️',
    heat: '🔥',
    dry: '💨',
    auto: '🔄',
    fan: '🌀'
  };

  const modeNames = {
    cool: '冷房',
    heat: '暖房',
    dry: '除湿',
    auto: '自動',
    fan: '送風'
  };

  return (
    <div className="space-y-4">
      {/* Device Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">❄️</span>
          <div>
            <h3 className="font-medium text-white">{device.deviceName}</h3>
            <p className="text-sm text-gray-400">エアコンデバイス</p>
          </div>
        </div>
        <div className={`text-xs px-2 py-1 rounded ${
          device.status === 'online' 
            ? 'bg-green-900 text-green-300' 
            : 'bg-red-900 text-red-300'
        }`}>
          {device.status === 'online' ? 'オンライン' : 'オフライン'}
        </div>
      </div>

      {/* Feedback Message */}
      {feedback && (
        <div className={`p-3 rounded-lg text-sm ${
          feedback.type === 'success' 
            ? 'bg-green-900 text-green-300 border border-green-700' 
            : 'bg-red-900 text-red-300 border border-red-700'
        }`}>
          <div className="flex items-center justify-between">
            <span>{feedback.message}</span>
            <span className="text-xs opacity-75">
              {feedback.timestamp.toLocaleTimeString('ja-JP', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </span>
          </div>
        </div>
      )}

      {/* Power Control */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">電源制御</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleSetPower('off')}
              disabled={isControlling || disabled || !isPoweredOn || device.status !== 'online'}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                !isPoweredOn || device.status !== 'online'
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              } ${isControlling || device.status !== 'online' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              OFF
            </button>
            <button
              onClick={() => handleSetPower('on')}
              disabled={isControlling || disabled || isPoweredOn || device.status !== 'online'}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                isPoweredOn || device.status !== 'online'
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              } ${isControlling || device.status !== 'online' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              ON
            </button>
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">トグルスイッチ</span>
          <button
            onClick={handleTogglePower}
            disabled={isControlling || disabled || device.status !== 'online'}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
              isPoweredOn ? 'bg-blue-600' : 'bg-gray-600'
            } ${isControlling || disabled || device.status !== 'online' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isPoweredOn ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Operation Mode Control */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">運転モード</span>
          <span className="text-sm text-gray-400 flex items-center">
            {modeIcons[currentMode]} {modeNames[currentMode]}
          </span>
        </div>
        
        <div className="grid grid-cols-5 gap-2">
          {(['cool', 'heat', 'dry', 'auto', 'fan'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => handleSetMode(mode)}
              disabled={isControlling || disabled || !isPoweredOn}
              className={`p-2 rounded text-xs font-medium transition-colors flex flex-col items-center space-y-1 ${
                currentMode === mode
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              } ${isControlling || disabled || !isPoweredOn ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="text-lg">{modeIcons[mode]}</span>
              <span>{modeNames[mode]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Temperature Control */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">温度設定</span>
          <span className="text-sm text-gray-400">{currentTemperature}°C</span>
        </div>
        
        {/* Temperature Buttons */}
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => handleTemperatureAdjust(-1)}
            disabled={isControlling || disabled || !isPoweredOn || currentTemperature <= 16}
            className={`w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition-colors ${
              isControlling || disabled || !isPoweredOn || currentTemperature <= 16 
                ? 'opacity-50 cursor-not-allowed' 
                : ''
            }`}
          >
            -
          </button>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{currentTemperature}°C</div>
            <div className="text-xs text-gray-400">設定温度</div>
          </div>
          
          <button
            onClick={() => handleTemperatureAdjust(1)}
            disabled={isControlling || disabled || !isPoweredOn || currentTemperature >= 30}
            className={`w-10 h-10 rounded-full bg-red-600 text-white font-bold text-lg hover:bg-red-700 transition-colors ${
              isControlling || disabled || !isPoweredOn || currentTemperature >= 30 
                ? 'opacity-50 cursor-not-allowed' 
                : ''
            }`}
          >
            +
          </button>
        </div>

        {/* Temperature Slider */}
        <div className="space-y-2">
          <input
            type="range"
            min="16"
            max="30"
            value={currentTemperature}
            onChange={handleTemperatureSliderChange}
            disabled={isControlling || disabled || !isPoweredOn}
            className={`w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider ${
              isControlling || disabled || !isPoweredOn ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            style={{
              background: isPoweredOn 
                ? `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((currentTemperature - 16) / 14) * 100}%, #374151 ${((currentTemperature - 16) / 14) * 100}%, #374151 100%)`
                : '#374151'
            }}
          />
          
          {/* Temperature Preset Buttons */}
          <div className="flex items-center justify-between">
            {[18, 22, 26, 28].map(temperature => (
              <button
                key={temperature}
                onClick={() => handleSetTemperature(temperature)}
                disabled={isControlling || disabled || !isPoweredOn}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  currentTemperature === temperature
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                } ${isControlling || disabled || !isPoweredOn ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {temperature}°C
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Device Status */}
      <div className="pt-3 border-t border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            最終更新: {new Date(device.lastUpdated).toLocaleTimeString('ja-JP', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
          <span className={`px-2 py-1 rounded ${
            isPoweredOn ? 'bg-blue-900 text-blue-300' : 'bg-gray-700 text-gray-400'
          }`}>
            {isPoweredOn ? '運転中' : '停止中'}
          </span>
        </div>
      </div>

      {/* Loading Indicator */}
      {isControlling && (
        <div className="flex items-center justify-center py-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
          <span className="ml-2 text-sm text-gray-400">制御中...</span>
        </div>
      )}
    </div>
  );
};

export default AirConditionerControl;