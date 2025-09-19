import React, { useState, useEffect } from 'react';
import { AlertThresholds } from '../types';

interface AlertSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentThresholds: AlertThresholds | null;
  onSave: (thresholds: AlertThresholds) => Promise<void>;
  isLoading?: boolean;
}

const AlertSettingsModal: React.FC<AlertSettingsModalProps> = ({
  isOpen,
  onClose,
  currentThresholds,
  onSave,
  isLoading = false
}) => {
  const [thresholds, setThresholds] = useState<AlertThresholds>({
    temperature: { min: 18, max: 28 },
    humidity: { min: 30, max: 70 }
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Update local state when currentThresholds changes
  useEffect(() => {
    if (currentThresholds) {
      setThresholds(currentThresholds);
    }
  }, [currentThresholds]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen && currentThresholds) {
      setThresholds(currentThresholds);
      setErrors({});
    }
  }, [isOpen, currentThresholds]);

  const validateThresholds = (newThresholds: AlertThresholds): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    // Temperature validation
    if (newThresholds.temperature.min >= newThresholds.temperature.max) {
      newErrors.temperature = '最低温度は最高温度より低く設定してください';
    }
    if (newThresholds.temperature.min < -40 || newThresholds.temperature.min > 80) {
      newErrors.temperatureMin = '最低温度は-40°Cから80°Cの間で設定してください';
    }
    if (newThresholds.temperature.max < -40 || newThresholds.temperature.max > 80) {
      newErrors.temperatureMax = '最高温度は-40°Cから80°Cの間で設定してください';
    }

    // Humidity validation
    if (newThresholds.humidity.min >= newThresholds.humidity.max) {
      newErrors.humidity = '最低湿度は最高湿度より低く設定してください';
    }
    if (newThresholds.humidity.min < 0 || newThresholds.humidity.min > 100) {
      newErrors.humidityMin = '最低湿度は0%から100%の間で設定してください';
    }
    if (newThresholds.humidity.max < 0 || newThresholds.humidity.max > 100) {
      newErrors.humidityMax = '最高湿度は0%から100%の間で設定してください';
    }

    return newErrors;
  };

  const handleInputChange = (
    type: 'temperature' | 'humidity',
    bound: 'min' | 'max',
    value: string
  ) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    const newThresholds = {
      ...thresholds,
      [type]: {
        ...thresholds[type],
        [bound]: numValue
      }
    };

    setThresholds(newThresholds);
    
    // Clear related errors
    const newErrors = { ...errors };
    delete newErrors[type];
    delete newErrors[`${type}${bound.charAt(0).toUpperCase() + bound.slice(1)}`];
    setErrors(newErrors);
  };

  const handleSave = async () => {
    const validationErrors = validateThresholds(thresholds);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(thresholds);
      onClose();
    } catch (error) {
      console.error('Failed to save thresholds:', error);
      setErrors({ general: '設定の保存に失敗しました' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (currentThresholds) {
      setThresholds(currentThresholds);
      setErrors({});
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">アラート設定</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={isSaving}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* General Error */}
          {errors.general && (
            <div className="bg-red-900/20 border border-red-500/50 text-red-100 px-4 py-3 rounded">
              {errors.general}
            </div>
          )}

          {/* Temperature Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">温度アラート</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  最低温度 (°C)
                </label>
                <input
                  type="number"
                  value={thresholds.temperature.min}
                  onChange={(e) => handleInputChange('temperature', 'min', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  step="0.1"
                  min="-40"
                  max="80"
                  disabled={isSaving}
                />
                {errors.temperatureMin && (
                  <p className="text-red-400 text-xs mt-1">{errors.temperatureMin}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  最高温度 (°C)
                </label>
                <input
                  type="number"
                  value={thresholds.temperature.max}
                  onChange={(e) => handleInputChange('temperature', 'max', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  step="0.1"
                  min="-40"
                  max="80"
                  disabled={isSaving}
                />
                {errors.temperatureMax && (
                  <p className="text-red-400 text-xs mt-1">{errors.temperatureMax}</p>
                )}
              </div>
            </div>
            
            {errors.temperature && (
              <p className="text-red-400 text-sm">{errors.temperature}</p>
            )}
          </div>

          {/* Humidity Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">湿度アラート</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  最低湿度 (%)
                </label>
                <input
                  type="number"
                  value={thresholds.humidity.min}
                  onChange={(e) => handleInputChange('humidity', 'min', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  step="1"
                  min="0"
                  max="100"
                  disabled={isSaving}
                />
                {errors.humidityMin && (
                  <p className="text-red-400 text-xs mt-1">{errors.humidityMin}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  最高湿度 (%)
                </label>
                <input
                  type="number"
                  value={thresholds.humidity.max}
                  onChange={(e) => handleInputChange('humidity', 'max', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  step="1"
                  min="0"
                  max="100"
                  disabled={isSaving}
                />
                {errors.humidityMax && (
                  <p className="text-red-400 text-xs mt-1">{errors.humidityMax}</p>
                )}
              </div>
            </div>
            
            {errors.humidity && (
              <p className="text-red-400 text-sm">{errors.humidity}</p>
            )}
          </div>

          {/* Current Values Info */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-300 mb-2">現在の設定</h4>
            <div className="text-sm text-gray-400 space-y-1">
              <p>温度: {thresholds.temperature.min}°C ～ {thresholds.temperature.max}°C</p>
              <p>湿度: {thresholds.humidity.min}% ～ {thresholds.humidity.max}%</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-700">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            disabled={isSaving}
          >
            リセット
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
            disabled={isSaving}
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSaving || isLoading}
          >
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertSettingsModal;