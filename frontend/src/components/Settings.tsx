/**
 * Settings page component
 */

import { useState, useCallback } from 'react';
import { useSettings } from '../hooks/useSettings';
import { SettingsUpdateRequest } from '../types/settings';

const Settings = () => {
  const { settings, isLoading, error, updateSettings, resetSettings } = useSettings();
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  /**
   * Show feedback message
   */
  const showFeedback = useCallback((type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  }, []);

  /**
   * Handle settings update
   */
  const handleUpdateSettings = useCallback(async (updates: SettingsUpdateRequest) => {
    setIsUpdating(true);
    
    const success = await updateSettings(updates);
    
    if (success) {
      showFeedback('success', '設定が正常に更新されました');
    } else {
      showFeedback('error', '設定の更新に失敗しました');
    }
    
    setIsUpdating(false);
  }, [updateSettings, showFeedback]);

  /**
   * Handle reset settings
   */
  const handleResetSettings = useCallback(async () => {
    if (!confirm('設定をデフォルト値にリセットしますか？この操作は元に戻せません。')) {
      return;
    }

    setIsUpdating(true);
    
    const success = await resetSettings();
    
    if (success) {
      showFeedback('success', '設定がデフォルト値にリセットされました');
    } else {
      showFeedback('error', '設定のリセットに失敗しました');
    }
    
    setIsUpdating(false);
  }, [resetSettings, showFeedback]);

  /**
   * Handle data update interval change
   */
  const handleDataUpdateIntervalChange = useCallback((interval: number) => {
    handleUpdateSettings({ dataUpdateInterval: interval });
  }, [handleUpdateSettings]);

  /**
   * Handle temperature threshold change
   */
  const handleTemperatureThresholdChange = useCallback((min: number, max: number) => {
    handleUpdateSettings({
      alertThresholds: {
        temperature: { min, max }
      }
    });
  }, [handleUpdateSettings]);

  /**
   * Handle humidity threshold change
   */
  const handleHumidityThresholdChange = useCallback((min: number, max: number) => {
    handleUpdateSettings({
      alertThresholds: {
        humidity: { min, max }
      }
    });
  }, [handleUpdateSettings]);

  /**
   * Handle notification settings change
   */
  const handleNotificationChange = useCallback((enabled: boolean, sound: boolean) => {
    handleUpdateSettings({
      notifications: { enabled, sound }
    });
  }, [handleUpdateSettings]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="card p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <span className="ml-3 text-gray-400">設定を読み込み中...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="card p-6">
          <div className="text-center">
            <div className="text-red-400 mb-4">⚠️ エラーが発生しました</div>
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              再読み込み
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="card p-6">
          <div className="text-center text-gray-400">
            設定データが見つかりません
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">設定</h1>
            <p className="text-gray-400 mt-1">アプリケーションの動作を設定できます</p>
          </div>
          <button
            onClick={handleResetSettings}
            disabled={isUpdating}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            デフォルトに戻す
          </button>
        </div>
      </div>

      {/* Feedback Message */}
      {feedback && (
        <div className={`card p-4 ${
          feedback.type === 'success' 
            ? 'bg-green-900 border border-green-700 text-green-300' 
            : 'bg-red-900 border border-red-700 text-red-300'
        }`}>
          <div className="flex items-center">
            <span className="mr-2">
              {feedback.type === 'success' ? '✅' : '❌'}
            </span>
            {feedback.message}
          </div>
        </div>
      )}

      {/* Data Update Interval */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-white mb-4">データ更新間隔</h2>
        <p className="text-gray-400 mb-4">環境データの取得間隔を設定します</p>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-300 w-24">更新間隔:</label>
            <input
              type="range"
              min="5"
              max="300"
              step="5"
              value={settings.dataUpdateInterval}
              onChange={(e) => handleDataUpdateIntervalChange(parseInt(e.target.value))}
              disabled={isUpdating}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <span className="text-white font-medium w-16 text-right">
              {settings.dataUpdateInterval}秒
            </span>
          </div>
          
          <div className="flex justify-between text-xs text-gray-500">
            <span>5秒 (高頻度)</span>
            <span>300秒 (5分)</span>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {[5, 30, 60, 120].map(interval => (
              <button
                key={interval}
                onClick={() => handleDataUpdateIntervalChange(interval)}
                disabled={isUpdating}
                className={`px-3 py-2 rounded text-sm transition-colors ${
                  settings.dataUpdateInterval === interval
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {interval}秒
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alert Thresholds */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-white mb-4">アラート閾値</h2>
        <p className="text-gray-400 mb-6">環境データのアラート条件を設定します</p>
        
        <div className="space-y-6">
          {/* Temperature Thresholds */}
          <div>
            <h3 className="text-lg font-medium text-white mb-3">温度アラート</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">最低温度</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="-20"
                      max="50"
                      value={settings.alertThresholds.temperature.min}
                      onChange={(e) => handleTemperatureThresholdChange(
                        parseInt(e.target.value),
                        settings.alertThresholds.temperature.max
                      )}
                      disabled={isUpdating}
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                    />
                    <span className="text-gray-400">°C</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">最高温度</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="-20"
                      max="50"
                      value={settings.alertThresholds.temperature.max}
                      onChange={(e) => handleTemperatureThresholdChange(
                        settings.alertThresholds.temperature.min,
                        parseInt(e.target.value)
                      )}
                      disabled={isUpdating}
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                    />
                    <span className="text-gray-400">°C</span>
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                温度が {settings.alertThresholds.temperature.min}°C 未満または {settings.alertThresholds.temperature.max}°C を超えるとアラートが発生します
              </div>
            </div>
          </div>

          {/* Humidity Thresholds */}
          <div>
            <h3 className="text-lg font-medium text-white mb-3">湿度アラート</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">最低湿度</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={settings.alertThresholds.humidity.min}
                      onChange={(e) => handleHumidityThresholdChange(
                        parseInt(e.target.value),
                        settings.alertThresholds.humidity.max
                      )}
                      disabled={isUpdating}
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                    />
                    <span className="text-gray-400">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">最高湿度</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={settings.alertThresholds.humidity.max}
                      onChange={(e) => handleHumidityThresholdChange(
                        settings.alertThresholds.humidity.min,
                        parseInt(e.target.value)
                      )}
                      disabled={isUpdating}
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                    />
                    <span className="text-gray-400">%</span>
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                湿度が {settings.alertThresholds.humidity.min}% 未満または {settings.alertThresholds.humidity.max}% を超えるとアラートが発生します
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-white mb-4">通知設定</h2>
        <p className="text-gray-400 mb-6">アラート通知の動作を設定します</p>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-300">通知を有効にする</label>
              <p className="text-xs text-gray-500 mt-1">アラート発生時に通知を表示します</p>
            </div>
            <button
              onClick={() => handleNotificationChange(
                !settings.notifications.enabled,
                settings.notifications.sound
              )}
              disabled={isUpdating}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                settings.notifications.enabled ? 'bg-blue-600' : 'bg-gray-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.notifications.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-300">通知音を有効にする</label>
              <p className="text-xs text-gray-500 mt-1">アラート発生時に音を再生します</p>
            </div>
            <button
              onClick={() => handleNotificationChange(
                settings.notifications.enabled,
                !settings.notifications.sound
              )}
              disabled={isUpdating || !settings.notifications.enabled}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                settings.notifications.sound && settings.notifications.enabled ? 'bg-blue-600' : 'bg-gray-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.notifications.sound && settings.notifications.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {isUpdating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
            <span className="text-white">設定を更新中...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;