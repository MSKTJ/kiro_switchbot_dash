import { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';
import DeviceList from './components/DeviceList';
import { useDevices } from './hooks/useDevices';

type ActiveView = 'dashboard' | 'devices' | 'settings';

function App() {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  
  // グローバルなIR機器状態管理
  const [irDeviceStates, setIrDeviceStates] = useState<Record<string, {
    power: 'on' | 'off';
    brightness?: number;
    colorTemp?: number;
    mode?: 'cool' | 'heat' | 'dry' | 'auto' | 'fan';
    temperature?: number;
  }>>(() => {
    const saved = sessionStorage.getItem('global-ir-device-states');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse saved IR device states:', e);
      }
    }
    return {};
  });
  
  // デバイス管理のためのhookを使用
  const {
    devices,
    isLoading: devicesLoading,
    error: devicesError,
    controlDevice,
    updateDeviceStatus,
    testDevice,
    refreshDevices
  } = useDevices();

  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    setActiveView('devices');
  };

  // IR機器状態の更新関数
  const updateIrDeviceState = (deviceId: string, updates: Partial<{
    power: 'on' | 'off';
    brightness: number;
    colorTemp: number;
    mode: 'cool' | 'heat' | 'dry' | 'auto' | 'fan';
    temperature: number;
  }>) => {
    setIrDeviceStates(prev => {
      const newStates = {
        ...prev,
        [deviceId]: {
          ...prev[deviceId],
          ...updates
        }
      };
      sessionStorage.setItem('global-ir-device-states', JSON.stringify(newStates));
      return newStates;
    });
  };

  // 拡張されたcontrolDevice関数（IR機器状態も更新）
  const enhancedControlDevice = async (deviceId: string, command: string, parameter?: any): Promise<boolean> => {
    const device = devices.find(d => d.deviceId === deviceId);
    const isIRDevice = device?.isInfraredRemote || true; // 一時的にすべてIR機器として扱う
    
    // IR機器の場合は即座に状態を更新
    if (isIRDevice) {
      if (command === 'turnOn') {
        updateIrDeviceState(deviceId, { power: 'on' });
      } else if (command === 'turnOff') {
        updateIrDeviceState(deviceId, { power: 'off' });
      } else if (command === 'setBrightness') {
        updateIrDeviceState(deviceId, { brightness: parameter });
      } else if (command === 'setColorTemperature') {
        updateIrDeviceState(deviceId, { colorTemp: parameter });
      } else if (command === 'setMode') {
        updateIrDeviceState(deviceId, { mode: parameter, power: 'on' });
      } else if (command === 'setTemperature') {
        updateIrDeviceState(deviceId, { temperature: parameter, power: 'on' });
      }
    }
    
    // 元のcontrolDevice関数を呼び出し
    return await controlDevice(deviceId, command, parameter);
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <Dashboard 
            onDeviceSelect={handleDeviceSelect}
            devices={devices}
            controlDevice={enhancedControlDevice}
            devicesLoading={devicesLoading}
            irDeviceStates={irDeviceStates}
          />
        );
      case 'devices':
        return (
          <div className="container mx-auto px-4 py-6">
            <DeviceList
              devices={devices}
              isLoading={devicesLoading}
              error={devicesError}
              onControl={enhancedControlDevice}
              onStatusUpdate={updateDeviceStatus}
              onTest={testDevice}
              onRefresh={refreshDevices}
              selectedDeviceId={selectedDeviceId}
              onDeviceSelect={setSelectedDeviceId}
              irDeviceStates={irDeviceStates}
            />
          </div>
        );
      case 'settings':
        return (
          <div className="container mx-auto px-4 py-6">
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-white mb-4">設定</h2>
              <p className="text-gray-400">設定機能は開発中です。</p>
            </div>
          </div>
        );
      default:
        return <Dashboard onDeviceSelect={handleDeviceSelect} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col dark">
      <Header activeView={activeView} onViewChange={setActiveView} />
      
      <main className="flex-1">
        {renderContent()}
      </main>
      
      <Footer />
    </div>
  );
}

export default App;