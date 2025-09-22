/**
 * Device card component for displaying individual device information
 */

import { useState, useEffect } from 'react';
import { Device, DeviceType } from '../types';

interface DeviceCardProps {
  device: Device;
  onControl?: (deviceId: string, command: string, parameter?: any) => Promise<boolean>;
  onStatusUpdate?: (deviceId: string) => Promise<void>;
  onTest?: (deviceId: string) => Promise<boolean>;
  isControlling?: boolean;
  isSelected?: boolean;
  irDeviceStates?: Record<string, {
    power: 'on' | 'off';
    brightness?: number;
    colorTemp?: number;
    mode?: 'cool' | 'heat' | 'dry' | 'auto' | 'fan';
    temperature?: number;
  }>;
}

const DeviceCard = ({ 
  device, 
  onControl, 
  onStatusUpdate, 
  onTest, 
  isControlling = false,
  isSelected = false,
  irDeviceStates = {}
}: DeviceCardProps) => {
  // グローバルなIR機器状態を使用（App.tsxから渡される）
  const irDeviceState = irDeviceStates[device.deviceId] || {
    power: null,
    brightness: null,
    colorTemp: null,
    mode: null,
    temperature: null
  };
  
  const [isUpdatingBrightness, setIsUpdatingBrightness] = useState(false);
  const [isUpdatingColorTemp, setIsUpdatingColorTemp] = useState(false);
  const [isUpdatingPower, setIsUpdatingPower] = useState(false);

  // コンポーネントマウント時のログ
  useEffect(() => {
    if (device.deviceType === 'Light') {
      console.log(`🚀 [MOUNT] DeviceCard mounted for ${device.deviceName} (${device.isInfraredRemote ? 'IR' : 'Direct'}):`, {
        timestamp: new Date().toISOString(),
        deviceId: device.deviceId,
        initialIrState: irDeviceState,
        deviceProperties: device.properties
      });
    }
    
    return () => {
      if (device.deviceType === 'Light') {
        console.log(`🔚 [UNMOUNT] DeviceCard unmounted for ${device.deviceName}`);
      }
    };
  }, []);

  // デバイスの明るさと色温度の値を取得
  const deviceBrightness = (device.properties as any)?.brightness;
  const deviceColorTemp = (device.properties as any)?.colorTemperature;
  const devicePowerState = (device.properties as any)?.power;
  
  // IR機器の判定（明示的にIR機器として扱うか、デバイス状態が取得できない場合もIR機器として扱う）
  const isIRDevice = device.isInfraredRemote || 
    // デバイス状態が常にnullやundefinedの場合はIR機器として扱う
    (devicePowerState === null || devicePowerState === undefined) ||
    // 特定のデバイスIDパターンでIR機器を判定（必要に応じて）
    device.deviceId.includes('IR') ||
    // 強制的にIR機器として扱う（テスト用）
    true; // 一時的にすべてのライトをIR機器として扱う
  
  // IR機器の場合は常にグローバル状態を優先（外部状態は無視）
  const currentPowerState = isIRDevice 
    ? (irDeviceState.power !== null ? irDeviceState.power : 'off') // IR機器はデフォルトOFF
    : (devicePowerState || 'off');
  const currentBrightness = isIRDevice 
    ? (irDeviceState.brightness !== null ? irDeviceState.brightness : 50) // IR機器はデフォルト50%
    : (deviceBrightness || 0);
  const currentColorTemp = isIRDevice 
    ? (irDeviceState.colorTemp !== null ? irDeviceState.colorTemp : 3000) // IR機器はデフォルト3000K
    : (deviceColorTemp || 3000);

  // エアコンの現在の状態を取得
  const currentAcPowerState = isIRDevice && device.deviceType === 'Air Conditioner'
    ? (irDeviceState.power !== null ? irDeviceState.power : 'off')
    : (devicePowerState || 'off');
  // エアコンの状態取得（グローバル状態を優先）
  const currentAcTemperature = device.isInfraredRemote 
    ? (irDeviceState.temperature !== null && irDeviceState.temperature !== undefined 
        ? irDeviceState.temperature 
        : (device.properties as any)?.temperature || 25)
    : ((device.properties as any)?.temperature || 25);
    
  const currentAcMode = device.isInfraredRemote 
    ? (irDeviceState.mode || (device.properties as any)?.mode || 'auto')
    : ((device.properties as any)?.mode || 'auto');
  
  // デバイスの詳細情報を確認
  if (device.deviceType === 'Light') {
    console.log(`🔍 [RENDER] Light Device ${device.deviceName} (${isIRDevice ? 'IR' : 'Direct'}):`, {
      timestamp: new Date().toISOString(),
      deviceId: device.deviceId,
      isInfraredRemote: device.isInfraredRemote,
      deviceType: device.deviceType,
      deviceProperties: device.properties,
      irDeviceState,
      currentState: {
        power: currentPowerState,
        brightness: currentBrightness,
        colorTemp: currentColorTemp
      },
      updating: {
        brightness: isUpdatingBrightness,
        colorTemp: isUpdatingColorTemp,
        power: isUpdatingPower
      },
      stateSource: isIRDevice ? 'IR Local State' : 'Device Properties',
      deviceLastUpdated: device.lastUpdated
    });
  }

  // グローバル状態管理により、ローカルでの状態保存は不要

  // デバイスプロパティの変化を監視（IR機器の状態が外部更新で影響されていないか確認）
  useEffect(() => {
    if (isIRDevice) {
      console.log(`📡 [DEVICE UPDATE] IR device properties updated for ${device.deviceName}:`, {
        timestamp: new Date().toISOString(),
        devicePower: devicePowerState,
        deviceBrightness: deviceBrightness,
        irStatePower: irDeviceState.power,
        currentPower: currentPowerState,
        warning: devicePowerState !== irDeviceState.power && irDeviceState.power !== null ? 'MISMATCH DETECTED!' : 'OK'
      });
      
      // IR機器の状態が外部更新で変更された場合、ローカル状態を保護
      if (irDeviceState.power !== null && devicePowerState !== irDeviceState.power) {
        console.log(`🛡️ [STATE PROTECTION] Protecting IR device state from external update`);
        // 外部更新を無視してローカル状態を維持
      }
    } else {
      console.log(`📡 [DEVICE UPDATE] Direct device properties updated for ${device.deviceName}:`, {
        timestamp: new Date().toISOString(),
        devicePower: devicePowerState,
        deviceBrightness: deviceBrightness
      });
    }
  }, [isIRDevice, device.deviceName, deviceBrightness, deviceColorTemp, devicePowerState, irDeviceState.power, currentPowerState]);

  // コンポーネントのクリーンアップ
  useEffect(() => {
    return () => {
      // 必要に応じてクリーンアップ処理を追加
    };
  }, []);

  // 更新中状態が長時間続く場合の緊急フォールバック
  useEffect(() => {
    if (isUpdatingBrightness) {
      const emergencyTimeout = setTimeout(() => {
        console.log('Emergency fallback: clearing brightness update state');
        setIsUpdatingBrightness(false);
      }, 3000);
      return () => clearTimeout(emergencyTimeout);
    }
  }, [isUpdatingBrightness]);

  useEffect(() => {
    if (isUpdatingColorTemp) {
      const emergencyTimeout = setTimeout(() => {
        console.log('Emergency fallback: clearing color temp update state');
        setIsUpdatingColorTemp(false);
      }, 3000);
      return () => clearTimeout(emergencyTimeout);
    }
  }, [isUpdatingColorTemp]);

  useEffect(() => {
    if (isUpdatingPower) {
      const emergencyTimeout = setTimeout(() => {
        console.log('Emergency fallback: clearing power update state');
        setIsUpdatingPower(false);
      }, 3000);
      return () => clearTimeout(emergencyTimeout);
    }
  }, [isUpdatingPower]);

  // 明るさ制御関数（グローバル状態管理を使用）
  const handleBrightnessChange = async (delta: number) => {
    const newBrightness = Math.max(0, Math.min(100, currentBrightness + delta));
    
    console.log(`Changing brightness by ${delta}% (${currentBrightness}% → ${newBrightness}%) for ${isIRDevice ? 'IR' : 'Direct'} device`);
    
    setIsUpdatingBrightness(true);
    
    const success = await handleControl('setBrightness', newBrightness);
    
    if (success) {
      console.log(`Brightness control successful for ${device.deviceName}`);
    } else {
      console.log('Brightness API call failed');
    }
    
    setTimeout(() => {
      setIsUpdatingBrightness(false);
    }, 1000);
  };

  // 色温度制御関数（グローバル状態管理を使用）
  const handleColorTempChange = async (delta: number) => {
    const newColorTemp = Math.max(2700, Math.min(6500, currentColorTemp + delta));
    
    setIsUpdatingColorTemp(true);
    
    console.log(`Changing color temperature by ${delta}K (${currentColorTemp}K → ${newColorTemp}K)`);
    const success = await handleControl('setColorTemperature', newColorTemp);
    
    if (success) {
      console.log('Color temperature control successful');
    } else {
      console.log('Color temperature API call failed');
    }
    
    setTimeout(() => {
      setIsUpdatingColorTemp(false);
    }, 1000);
  };

  // エアコン制御関数
  const handleAcPowerChange = async (powerState: 'on' | 'off') => {
    console.log(`🌡️ [AC CONTROL] Changing AC power state to ${powerState} for device ${device.deviceName}`);
    
    setIsUpdatingPower(true);
    
    const command = powerState === 'on' ? 'turnOn' : 'turnOff';
    const success = await handleControl(command);
    
    if (success) {
      console.log(`🌡️ [AC CONTROL] AC power control successful for ${device.deviceName}`);
    } else {
      console.log(`🌡️ [AC CONTROL] AC power control API call failed`);
    }
    
    setTimeout(() => {
      setIsUpdatingPower(false);
    }, 1000);
  };

  const handleAcModeChange = async (mode: 'cool' | 'heat' | 'auto') => {
    console.log(`🌡️ [AC CONTROL] Changing AC mode to ${mode} for device ${device.deviceName}`);
    
    setIsUpdatingPower(true);
    
    const success = await handleControl('setMode', mode);
    
    if (success) {
      console.log(`🌡️ [AC CONTROL] AC mode control successful for ${device.deviceName}`);
    } else {
      console.log(`🌡️ [AC CONTROL] AC mode control API call failed`);
    }
    
    setTimeout(() => {
      setIsUpdatingPower(false);
    }, 1000);
  };

  const handleAcTemperatureChange = async (delta: number) => {
    const currentTemp = (device.properties as any)?.temperature || 25;
    const newTemp = Math.max(16, Math.min(30, currentTemp + delta));
    
    console.log(`🌡️ [AC CONTROL] Changing AC temperature by ${delta}°C (${currentTemp}°C → ${newTemp}°C)`);
    
    setIsUpdatingPower(true);
    
    const success = await handleControl('setTemperature', newTemp);
    
    if (success) {
      console.log(`🌡️ [AC CONTROL] AC temperature control successful for ${device.deviceName}`);
    } else {
      console.log(`🌡️ [AC CONTROL] AC temperature control API call failed`);
    }
    
    setTimeout(() => {
      setIsUpdatingPower(false);
    }, 1000);
  };

  // 電源制御関数（グローバル状態管理を使用）
  const handlePowerChange = async (powerState: 'on' | 'off') => {
    console.log(`🔘 [POWER CONTROL] Changing power state to ${powerState} for ${isIRDevice ? 'IR' : 'Direct'} device ${device.deviceName}`);
    
    setIsUpdatingPower(true);
    
    const command = powerState === 'on' ? 'turnOn' : 'turnOff';
    const success = await handleControl(command);
    
    if (success) {
      console.log(`🔘 [POWER CONTROL] Power control successful for ${device.deviceName}`);
    } else {
      console.log(`🔘 [POWER CONTROL] Power control API call failed`);
    }
    
    setTimeout(() => {
      setIsUpdatingPower(false);
    }, 1000);
  };
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

  const handleControl = async (command: string, parameter?: any): Promise<boolean> => {
    if (onControl && !isControlling) {
      console.log(`Controlling device ${device.deviceId}: ${command}`, parameter);
      const success = await onControl(device.deviceId, command, parameter);
      console.log(`Control result for ${device.deviceId}:`, success);
      return success;
    }
    return false;
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
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-300">電源</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  currentPowerState === 'on'
                    ? 'bg-green-900/50 text-green-400 border border-green-500/30'
                    : 'bg-red-900/50 text-red-400 border border-red-500/30'
                }`}>
                  {currentPowerState === 'on' ? '点灯中' : '消灯中'}
                  {isUpdatingPower && <span className="ml-1">...</span>}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePowerChange('off')}
                  disabled={isControlling || isUpdatingPower}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    currentPowerState === 'off'
                      ? 'bg-red-600 hover:bg-red-700 text-white'  // OFFの時にハイライト
                      : 'bg-gray-600 hover:bg-gray-700 text-gray-400'  // ONの時はグレー
                  } ${isControlling || isUpdatingPower ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  OFF
                </button>
                <button
                  onClick={() => handlePowerChange('on')}
                  disabled={isControlling || isUpdatingPower}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    currentPowerState === 'on'
                      ? 'bg-green-600 hover:bg-green-700 text-white'  // ONの時にハイライト
                      : 'bg-gray-600 hover:bg-gray-700 text-gray-400'  // OFFの時はグレー
                  } ${isControlling || isUpdatingPower ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  ON
                </button>
              </div>
            </div>
            
            {/* Toggle Switch */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">トグル</span>
              <button
                onClick={() => handlePowerChange(
                  currentPowerState === 'on' ? 'off' : 'on'
                )}
                disabled={isControlling || isUpdatingPower}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                  currentPowerState === 'on' ? 'bg-blue-600' : 'bg-gray-600'
                } ${isControlling || isUpdatingPower ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    currentPowerState === 'on' ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* 明るさ制御 */}
            {(device.properties as any)?.brightness !== undefined && (
              <div className={`space-y-2 ${currentPowerState === 'off' ? 'opacity-60' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-300">明るさ</span>
                    {currentPowerState === 'off' && (
                      <span className="text-xs text-gray-500">(消灯中)</span>
                    )}
                  </div>
                  <span className="text-sm text-gray-400">
                    {currentBrightness}%
                    {isUpdatingBrightness && <span className="ml-1 text-yellow-400">更新中...</span>}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleBrightnessChange(-10)}
                    disabled={isControlling || isUpdatingBrightness}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors bg-gray-600 hover:bg-gray-700 text-white ${
                      isControlling || isUpdatingBrightness ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    -
                  </button>
                  <div className="flex-1 mx-3 bg-gray-700 rounded-full h-2 relative">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        currentPowerState === 'on' 
                          ? 'bg-blue-600' 
                          : 'bg-gray-500'
                      }`}
                      style={{
                        width: `${currentBrightness}%`
                      }}
                    />
                  </div>
                  <button
                    onClick={() => handleBrightnessChange(10)}
                    disabled={isControlling || isUpdatingBrightness}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors bg-gray-600 hover:bg-gray-700 text-white ${
                      isControlling || isUpdatingBrightness ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    +
                  </button>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <button
                    onClick={() => handleBrightnessChange(-1)}
                    disabled={isControlling || isUpdatingBrightness}
                    className={`px-2 py-1 rounded text-xs transition-colors bg-gray-700 hover:bg-gray-600 text-gray-300 ${
                      isControlling || isUpdatingBrightness ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    -1%
                  </button>
                  <button
                    onClick={() => handleBrightnessChange(1)}
                    disabled={isControlling || isUpdatingBrightness}
                    className={`px-2 py-1 rounded text-xs transition-colors bg-gray-700 hover:bg-gray-600 text-gray-300 ${
                      isControlling || isUpdatingBrightness ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    +1%
                  </button>
                </div>
                {/* 明るさプリセット */}
                <div className="flex items-center justify-between mt-2">
                  {[25, 50, 75, 100].map(brightness => (
                    <button
                      key={brightness}
                      onClick={async () => {
                        const delta = brightness - currentBrightness;
                        await handleBrightnessChange(delta);
                      }}
                      disabled={isControlling || isUpdatingBrightness}
                      className={`px-2 py-1 rounded text-xs transition-colors ${
                        currentBrightness === brightness
                          ? currentPowerState === 'on' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      } ${isControlling || isUpdatingBrightness ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {brightness}%
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 色温度制御 */}
            {/* 色温度制御は一時的に無効化（SwitchBot APIの対応確認後に有効化） */}
            {false && device.deviceType === 'Light' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">
                    色温度
                    {/* デバッグ情報 */}
                    <span className="text-xs text-gray-500 ml-1">
                      ({(device.properties as any)?.colorTemperature ? 'デバイス値あり' : 'デフォルト値'})
                    </span>
                  </span>
                  <span className="text-sm text-gray-400">
                    {localColorTemp !== null 
                      ? localColorTemp 
                      : (device.properties as any)?.colorTemperature || 3000}K
                    {isUpdatingColorTemp && <span className="ml-1 text-yellow-400">更新中...</span>}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleColorTempChange(-500)}
                    disabled={isControlling || isUpdatingColorTemp}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors bg-gray-600 hover:bg-gray-700 text-white ${
                      isControlling || isUpdatingColorTemp ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    -
                  </button>
                  <div className="flex-1 mx-3 bg-gray-700 rounded-full h-2 relative">
                    <div 
                      className="bg-orange-400 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${((localColorTemp !== null ? localColorTemp : (device.properties as any)?.colorTemperature || 3000) - 2700) / (6500 - 2700) * 100}%`
                      }}
                    />
                  </div>
                  <button
                    onClick={() => handleColorTempChange(500)}
                    disabled={isControlling || isUpdatingColorTemp}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors bg-gray-600 hover:bg-gray-700 text-white ${
                      isControlling || isUpdatingColorTemp ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    +
                  </button>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <button
                    onClick={() => handleColorTempChange(-100)}
                    disabled={isControlling || isUpdatingColorTemp}
                    className={`px-2 py-1 rounded text-xs transition-colors bg-gray-700 hover:bg-gray-600 text-gray-300 ${
                      isControlling || isUpdatingColorTemp ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    -100K
                  </button>
                  <button
                    onClick={() => handleColorTempChange(100)}
                    disabled={isControlling || isUpdatingColorTemp}
                    className={`px-2 py-1 rounded text-xs transition-colors bg-gray-700 hover:bg-gray-600 text-gray-300 ${
                      isControlling || isUpdatingColorTemp ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    +100K
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'Air Conditioner':
        return (
          <div className="space-y-3">
            {/* 電源制御 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-300">電源</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  currentAcPowerState === 'on'
                    ? 'bg-blue-900/50 text-blue-400 border border-blue-500/30'
                    : 'bg-red-900/50 text-red-400 border border-red-500/30'
                }`}>
                  {currentAcPowerState === 'on' ? '運転中' : '停止中'}
                  {isUpdatingPower && <span className="ml-1">...</span>}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleAcPowerChange('off')}
                  disabled={isControlling || isUpdatingPower}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    currentAcPowerState === 'off'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-gray-600 hover:bg-gray-700 text-gray-400'
                  } ${isControlling || isUpdatingPower ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  OFF
                </button>
                <button
                  onClick={() => handleAcPowerChange('on')}
                  disabled={isControlling || isUpdatingPower}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    currentAcPowerState === 'on'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-600 hover:bg-gray-700 text-gray-400'
                  } ${isControlling || isUpdatingPower ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  ON
                </button>
              </div>
            </div>

            {/* 運転モード選択 */}
            <div className={`space-y-2 ${currentAcPowerState === 'off' ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-300">運転モード</span>
                  {currentAcPowerState === 'off' && (
                    <span className="text-xs text-gray-500">(停止中)</span>
                  )}
                </div>
                <span className="text-sm text-gray-400 capitalize">{currentAcMode}</span>
              </div>
              <div className="flex items-center justify-between space-x-1">
                <button
                  onClick={() => handleAcModeChange('cool')}
                  disabled={isControlling || isUpdatingPower}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    currentAcMode === 'cool'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  } ${isControlling || isUpdatingPower ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  冷房
                </button>
                <button
                  onClick={() => handleAcModeChange('auto')}
                  disabled={isControlling || isUpdatingPower}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    currentAcMode === 'auto'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  } ${isControlling || isUpdatingPower ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  自動
                </button>
                <button
                  onClick={() => handleAcModeChange('heat')}
                  disabled={isControlling || isUpdatingPower}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    currentAcMode === 'heat'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  } ${isControlling || isUpdatingPower ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  暖房
                </button>
              </div>
            </div>

            {/* 温度調整 */}
            <div className={`space-y-2 ${currentAcPowerState === 'off' ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-300">設定温度</span>
                  {currentAcPowerState === 'off' && (
                    <span className="text-xs text-gray-500">(停止中)</span>
                  )}
                </div>
                <span className="text-sm text-gray-400">
                  {currentAcTemperature}°C
                  {isUpdatingPower && <span className="ml-1 text-yellow-400">更新中...</span>}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => handleAcTemperatureChange(-1)}
                  disabled={isControlling || isUpdatingPower}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors bg-gray-600 hover:bg-gray-700 text-white ${
                    isControlling || isUpdatingPower ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  -
                </button>
                <div className="flex-1 mx-3 bg-gray-700 rounded-full h-2 relative">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      currentAcPowerState === 'on' 
                        ? currentAcMode === 'cool' ? 'bg-blue-600' : 
                          currentAcMode === 'heat' ? 'bg-red-600' : 'bg-green-600'
                        : 'bg-gray-500'
                    }`}
                    style={{
                      width: `${((currentAcTemperature - 16) / (30 - 16)) * 100}%`
                    }}
                  />
                </div>
                <button
                  onClick={() => handleAcTemperatureChange(1)}
                  disabled={isControlling || isUpdatingPower}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors bg-gray-600 hover:bg-gray-700 text-white ${
                    isControlling || isUpdatingPower ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  +
                </button>
              </div>
              {/* 温度プリセット */}
              <div className="flex items-center justify-between">
                {[18, 22, 25, 28].map(temp => (
                  <button
                    key={temp}
                    onClick={() => handleAcTemperatureChange(temp - currentAcTemperature)}
                    disabled={isControlling || isUpdatingPower}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      currentAcTemperature === temp
                        ? currentAcPowerState === 'on' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    } ${isControlling || isUpdatingPower ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {temp}°C
                  </button>
                ))}
              </div>
            </div>
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
    <div className={`card p-4 ${isSelected ? 'ring-2 ring-blue-500 bg-blue-900/20' : ''}`}>
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