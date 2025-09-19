/**
 * Device card component for displaying individual device information
 */

import { Device, DeviceType } from '../types';

interface DeviceCardProps {
  device: Device;
  onControl?: (deviceId: string, command: string, parameter?: any) => Promise<boolean>;
  onStatusUpdate?: (deviceId: string) => Promise<void>;
  onTest?: (deviceId: string) => Promise<boolean>;
  isControlling?: boolean;
}

const DeviceCard = ({ 
  device, 
  onControl, 
  onStatusUpdate, 
  onTest, 
  isControlling = false 
}: DeviceCardProps) => {
  const getDeviceIcon = (deviceType: DeviceType): string => {
    switch (deviceType) {
      case 'Light':
        return '💡';
      case 'Air Conditioner':
        return '❄️';
      case 'Hub':
        return '🏠';
      case 'Bot':
        return '🤖';
      case 'Curtain':
        return '🪟';
      case 'Plug':
        return '🔌';
      default:
        return '❓';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'online':
        return 'text-green-400';
      case 'offline':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'online':
        return 'オンライン';
      case 'offline':
        return 'オフライン';
      default:
        return '不明';
    }
  };

  const isControllable = (): boolean => {
    const controllableTypes: DeviceType[] = ['Light', 'Air Conditioner', 'Bot', 'Curtain', 'Plug'];
    return controllableTypes.includes(device.deviceType);
  };

  const handleControl = async (command: string, parameter?: any) => {
    if (onControl && !isControlling) {
      await onControl(device.deviceId, command, parameter);
    }
  };

  const handleStatusUpdate = async () => {
    if (onStatusUpdate) {
      await onStatusUpdate(device.deviceId);
    }
  };

  const handleTest = async () => {
    if (onTest) {
      await onTest(device.deviceId);
    }
  };

  const renderDeviceControls = () => {
    if (!isControllable() || !onControl) {
      return null;
    }

    switch (device.deviceType) {
      case 'Light':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">電源</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleControl('turnOff')}
                  disabled={isControlling || (device.properties as any)?.power !== 'on'}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    (device.properties as any)?.power !== 'on'
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  } ${isControlling ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  OFF
                </button>
                <button
                  onClick={() => handleControl('turnOn')}
                  disabled={isControlling || (device.properties as any)?.power === 'on'}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    (device.properties as any)?.power === 'on'
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  } ${isControlling ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  ON
                </button>
              </div>
            </div>
            
            {/* Toggle Switch */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">トグル</span>
              <button
                onClick={() => handleControl(
                  (device.properties as any)?.power === 'on' ? 'turnOff' : 'turnOn'
                )}
                disabled={isControlling}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                  (device.properties as any)?.power === 'on' ? 'bg-blue-600' : 'bg-gray-600'
                } ${isControlling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    (device.properties as any)?.power === 'on' ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {(device.properties as any)?.brightness !== undefined && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">明るさ</span>
                  <span className="text-sm text-gray-400">{(device.properties as any).brightness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={(device.properties as any).brightness}
                  onChange={(e) => handleControl('setBrightness', parseInt(e.target.value))}
                  disabled={isControlling || (device.properties as any)?.power !== 'on'}
                  className={`w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider ${
                    isControlling || (device.properties as any)?.power !== 'on' ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  style={{
                    background: (device.properties as any)?.power === 'on' 
                      ? `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(device.properties as any).brightness}%, #374151 ${(device.properties as any).brightness}%, #374151 100%)`
                      : '#374151'
                  }}
                />
                
                {/* Brightness Presets */}
                <div className="flex items-center justify-between">
                  {[25, 50, 75, 100].map(brightness => (
                    <button
                      key={brightness}
                      onClick={() => handleControl('setBrightness', brightness)}
                      disabled={isControlling || (device.properties as any)?.power !== 'on'}
                      className={`px-1 py-0.5 rounded text-xs transition-colors ${
                        (device.properties as any)?.brightness === brightness
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      } ${isControlling || (device.properties as any)?.power !== 'on' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {brightness}%
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'Air Conditioner':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">電源</span>
              <button
                onClick={() => handleControl(
                  (device.properties as any)?.power === 'on' ? 'turnOff' : 'turnOn'
                )}
                disabled={isControlling}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  (device.properties as any)?.power === 'on'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
                } ${isControlling ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {(device.properties as any)?.power === 'on' ? 'ON' : 'OFF'}
              </button>
            </div>
            {(device.properties as any)?.power === 'on' && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">設定温度</span>
                  <span className="text-sm text-gray-400">{(device.properties as any)?.temperature}°C</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">モード</span>
                  <span className="text-sm text-gray-400 capitalize">{(device.properties as any)?.mode}</span>
                </div>
              </>
            )}
          </div>
        );

      case 'Bot':
        return (
          <div className="space-y-3">
            <button
              onClick={() => handleControl('press')}
              disabled={isControlling}
              className={`w-full px-3 py-2 rounded text-sm font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white ${
                isControlling ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isControlling ? '実行中...' : 'プレス'}
            </button>
            {(device.properties as any)?.battery !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">バッテリー</span>
                <span className="text-sm text-gray-400">{(device.properties as any).battery}%</span>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center text-gray-400 text-sm">
            制御機能は準備中です
          </div>
        );
    }
  };

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getDeviceIcon(device.deviceType)}</span>
          <div>
            <h4 className="font-medium text-white">{device.deviceName}</h4>
            <p className="text-sm text-gray-400">
              {device.deviceType}
              {device.isInfraredRemote && ' (IR)'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-xs ${getStatusColor(device.status)}`}>
            ● {getStatusText(device.status)}
          </span>
        </div>
      </div>

      {/* Device Properties */}
      {device.properties && Object.keys(device.properties).length > 0 && (
        <div className="mb-4">
          {renderDeviceControls()}
        </div>
      )}

      {/* Device Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-700">
        <div className="text-xs text-gray-500">
          更新: {new Date(device.lastUpdated).toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
        <div className="flex items-center space-x-2">
          {onStatusUpdate && (
            <button
              onClick={handleStatusUpdate}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              更新
            </button>
          )}
          {onTest && (
            <button
              onClick={handleTest}
              className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
            >
              テスト
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeviceCard;