/**
 * Light control component for managing lighting devices
 */

import { useState, useCallback } from 'react';
import { Device, LightProperties } from '../types';

interface LightControlProps {
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

const LightControl = ({ 
  device, 
  onControlSuccess, 
  onControlError, 
  disabled = false 
}: LightControlProps) => {
  const [isControlling, setIsControlling] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    timestamp: Date;
  } | null>(null);

  const lightProperties = device.properties as LightProperties;
  const isPoweredOn = lightProperties?.power === 'on';
  const currentBrightness = lightProperties?.brightness || 0;

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
  const controlLight = useCallback(async (
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
   * Toggle light power (ON/OFF)
   */
  const handleTogglePower = useCallback(async () => {
    const actionName = isPoweredOn ? '電源OFF' : '電源ON';
    await controlLight('/light/toggle', undefined, actionName);
  }, [controlLight, isPoweredOn]);

  /**
   * Set light power explicitly
   */
  const handleSetPower = useCallback(async (power: 'on' | 'off') => {
    const actionName = power === 'on' ? '電源ON' : '電源OFF';
    await controlLight('/light/power', { power }, actionName);
  }, [controlLight]);

  /**
   * Set light brightness
   */
  const handleSetBrightness = useCallback(async (brightness: number) => {
    await controlLight('/light/brightness', { brightness }, `明るさ設定 (${brightness}%)`);
  }, [controlLight]);

  /**
   * Handle brightness slider change
   */
  const handleBrightnessChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const brightness = parseInt(event.target.value, 10);
    handleSetBrightness(brightness);
  }, [handleSetBrightness]);

  if (device.deviceType !== 'Light') {
    return (
      <div className="text-center text-gray-400 text-sm p-4">
        このデバイスは照明ではありません
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Device Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">💡</span>
          <div>
            <h3 className="font-medium text-white">{device.deviceName}</h3>
            <p className="text-sm text-gray-400">照明デバイス</p>
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
              disabled={isControlling || disabled || device.status !== 'online'}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                isPoweredOn && device.status === 'online'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-600 text-gray-400'
              } ${isControlling || device.status !== 'online' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              OFF
            </button>
            <button
              onClick={() => handleSetPower('on')}
              disabled={isControlling || disabled || device.status !== 'online'}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                !isPoweredOn && device.status === 'online'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-600 text-gray-400'
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

      {/* Brightness Control */}
      {lightProperties?.brightness !== undefined && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">明るさ調整</span>
            <span className="text-sm text-gray-400">{currentBrightness}%</span>
          </div>
          
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="100"
              value={currentBrightness}
              onChange={handleBrightnessChange}
              disabled={isControlling || disabled || device.status !== 'online'}
              className={`w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider ${
                isControlling || disabled || device.status !== 'online' ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              style={{
                background: isPoweredOn 
                  ? `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${currentBrightness}%, #374151 ${currentBrightness}%, #374151 100%)`
                  : '#374151'
              }}
            />
            
            {/* Brightness Preset Buttons */}
            <div className="flex items-center justify-between">
              {[25, 50, 75, 100].map(brightness => (
                <button
                  key={brightness}
                  onClick={() => handleSetBrightness(brightness)}
                  disabled={isControlling || disabled || device.status !== 'online'}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    currentBrightness === brightness
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  } ${isControlling || disabled || device.status !== 'online' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {brightness}%
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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
            isPoweredOn ? 'bg-yellow-900 text-yellow-300' : 'bg-gray-700 text-gray-400'
          }`}>
            {isPoweredOn ? '点灯中' : '消灯中'}
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

export default LightControl;