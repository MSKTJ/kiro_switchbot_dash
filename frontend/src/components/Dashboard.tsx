import { useEffect, useState } from 'react';
import EnvironmentCards from './EnvironmentCards';
import EnvironmentChart from './EnvironmentChart';
import AlertBanner from './AlertBanner';
import AlertSettingsModal from './AlertSettingsModal';
import { useWebSocket } from '../hooks/useWebSocket';
import { useEnvironmentHistory } from '../hooks/useEnvironmentHistory';
import { useAlerts } from '../hooks/useAlerts';
import { useDevices } from '../hooks/useDevices';

interface DashboardProps {
  onDeviceSelect?: (deviceId: string) => void;
  devices: any[];
  controlDevice: (deviceId: string, command: string, parameter?: any) => Promise<boolean>;
  devicesLoading: boolean;
  irDeviceStates: Record<string, {
    power: 'on' | 'off';
    brightness?: number;
    colorTemp?: number;
  }>;
}

const Dashboard = ({ onDeviceSelect, devices, controlDevice, devicesLoading, irDeviceStates }: DashboardProps) => {
  const [isAlertSettingsOpen, setIsAlertSettingsOpen] = useState(false);
  
  // グローバルなIR機器状態を使用（App.tsxから渡される）
  
  // Alert management
  const {
    alerts,
    thresholds,
    statistics,
    isLoading: alertsLoading,
    error: alertsError,
    updateThresholds,
    dismissAlert,
    clearAllAlerts,
    updateAlertsFromWebSocket,
    handleNewAlert,
    handleAlertDismissed
  } = useAlerts();

  // Device statistics calculation (moved from useDevices)
  const deviceStatistics = devices.length > 0 ? {
    total: devices.length,
    online: devices.filter(d => d.status === 'online').length,
    controllable: devices.filter(d => ['Light', 'Air Conditioner', 'Bot', 'Curtain', 'Plug'].includes(d.deviceType)).length,
    byType: devices.reduce((acc, device) => {
      acc[device.deviceType] = (acc[device.deviceType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  } : null;

  // WebSocket with alert handlers
  const { environmentData, state, subscribe, unsubscribe } = useWebSocket(
    updateAlertsFromWebSocket,
    handleNewAlert,
    handleAlertDismissed
  );
  
  const { historyState, selectedPeriod, setSelectedPeriod } = useEnvironmentHistory();

  // クイック制御用の電源制御関数
  const handleQuickPowerControl = async (deviceId: string, powerState: 'on' | 'off') => {
    // enhancedControlDevice関数を使用（IR機器状態も自動更新される）
    const command = powerState === 'on' ? 'turnOn' : 'turnOff';
    await controlDevice(deviceId, command);
  };

  // デバイスの現在の電源状態を取得（グローバルIR機器状態対応）
  const getDevicePowerState = (device: any): 'on' | 'off' => {
    const isIRDevice = device.isInfraredRemote || true; // 一時的にすべてIR機器として扱う
    
    if (isIRDevice && irDeviceStates[device.deviceId]) {
      return irDeviceStates[device.deviceId].power;
    }
    
    return (device.properties as any)?.power || 'off';
  };

  // Subscribe to environment updates on mount
  useEffect(() => {
    if (state.isConnected) {
      subscribe();
    }

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [state.isConnected, subscribe, unsubscribe]);

  // グローバル状態はApp.tsxで管理されるため、ここでの保存処理は不要

  return (
    <div className="container mx-auto px-4 py-6 lg:py-8">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
          ダッシュボード
        </h1>
        <p className="text-gray-400">
          スマートホーム環境の監視と制御
        </p>
        
        {/* Connection Status */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <div 
              className={`w-2 h-2 rounded-full ${
                state.isConnected ? 'bg-green-400' : 
                state.isConnecting ? 'bg-yellow-400 animate-pulse' : 
                'bg-red-400'
              }`}
            />
            <span className="text-sm text-gray-400">
              {state.isConnected ? 'リアルタイム接続中' : 
               state.isConnecting ? '接続中...' : 
               '接続切断'}
            </span>
            {deviceStatistics && (
              <span className="text-sm text-gray-400 ml-4">
                デバイス: {deviceStatistics.online}/{deviceStatistics.total}台オンライン
              </span>
            )}
          </div>


        </div>
      </div>

      {/* Alert Banner */}
      <AlertBanner
        alerts={alerts}
        onDismiss={dismissAlert}
        onClearAll={clearAllAlerts}
      />

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Environment Data Section */}
        <div className="lg:col-span-8">
          <EnvironmentCards
            environmentData={environmentData}
            isLoading={state.isConnecting}
            error={state.error || undefined}
          />

          {/* Chart Section */}
          <EnvironmentChart
            data={historyState.data}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            isLoading={historyState.isLoading}
            error={historyState.error || undefined}
          />
        </div>

        {/* Device Controls Section */}
        <div className="lg:col-span-4">
          <div className="space-y-6">
            {/* Device Status */}
            <div className="card p-6">
              <h3 className="text-xl font-semibold text-white mb-4">デバイス状態</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">システム状態</span>
                  <span className="text-success-400 text-sm">● オンライン</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">接続デバイス</span>
                  <span className="text-gray-400 text-sm">
                    {devicesLoading ? '検索中...' : 
                     deviceStatistics ? `${deviceStatistics.total}台` : '不明'}
                  </span>
                </div>
                {deviceStatistics && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">オンライン</span>
                      <span className="text-green-400 text-sm">{deviceStatistics.online}台</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">制御可能</span>
                      <span className="text-blue-400 text-sm">{deviceStatistics.controllable}台</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">照明デバイス</span>
                      <span className="text-yellow-400 text-sm">
                        {deviceStatistics.byType?.Light || 0}台
                        {devices.filter(d => d.deviceType === 'Light' && (d.properties as any)?.power === 'on').length > 0 && 
                          ` (${devices.filter(d => d.deviceType === 'Light' && (d.properties as any)?.power === 'on').length}点灯中)`
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">エアコンデバイス</span>
                      <span className="text-blue-400 text-sm">
                        {deviceStatistics.byType?.['Air Conditioner'] || 0}台
                        {devices.filter(d => d.deviceType === 'Air Conditioner' && (d.properties as any)?.power === 'on').length > 0 && 
                          ` (${devices.filter(d => d.deviceType === 'Air Conditioner' && (d.properties as any)?.power === 'on').length}運転中)`
                        }
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Quick Device Controls */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">クイック制御</h3>
              </div>
              <div className="space-y-4">
                {devices.filter(d => ['Light', 'Air Conditioner'].includes(d.deviceType)).slice(0, 3).length > 0 ? (
                  devices.filter(d => ['Light', 'Air Conditioner'].includes(d.deviceType)).slice(0, 3).map(device => (
                    <div key={device.deviceId} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">
                          {device.deviceType === 'Light' ? '💡' : '❄️'}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-white">{device.deviceName}</p>
                          <p className="text-xs text-gray-400">
                            {device.deviceType}
                            {device.deviceType === 'Light' && (device.properties as any)?.brightness && 
                              ` • ${(device.properties as any).brightness}%`
                            }
                            {device.isInfraredRemote && <span className="ml-1 text-orange-400">(IR)</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {/* 現在の状態表示 */}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          getDevicePowerState(device) === 'on'
                            ? 'bg-green-900/50 text-green-400 border border-green-500/30'
                            : 'bg-red-900/50 text-red-400 border border-red-500/30'
                        }`}>
                          {getDevicePowerState(device) === 'on' ? '点灯中' : '消灯中'}
                        </span>
                        
                        {/* OFFボタン */}
                        <button
                          onClick={() => handleQuickPowerControl(device.deviceId, 'off')}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                            getDevicePowerState(device) === 'off'
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-gray-600 hover:bg-gray-700 text-gray-400'
                          }`}
                        >
                          OFF
                        </button>
                        
                        {/* ONボタン */}
                        <button
                          onClick={() => handleQuickPowerControl(device.deviceId, 'on')}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                            getDevicePowerState(device) === 'on'
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-gray-600 hover:bg-gray-700 text-gray-400'
                          }`}
                        >
                          ON
                        </button>
                        <button
                          onClick={() => onDeviceSelect?.(device.deviceId)}
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                          title="詳細設定"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-gray-700 rounded-lg">
                    <p className="text-gray-400 text-center text-sm">
                      {devicesLoading ? 'デバイスを検索中...' : '制御可能なデバイスがありません'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Alerts Section */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">アラート</h3>
                <button
                  onClick={() => setIsAlertSettingsOpen(true)}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  設定
                </button>
              </div>
              
              {alertsError && (
                <div className="bg-red-900/20 border border-red-500/50 text-red-100 px-3 py-2 rounded text-sm mb-4">
                  {alertsError}
                </div>
              )}
              
              {alerts.length > 0 ? (
                <div className="space-y-3">
                  {alerts.slice(0, 3).map((alert) => (
                    <div key={alert.id} className="flex items-start space-x-3 p-3 bg-gray-700/50 rounded-lg">
                      <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                        alert.severity === 'critical' ? 'bg-red-400' : 'bg-yellow-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white">{alert.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(alert.timestamp).toLocaleTimeString('ja-JP', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {alerts.length > 3 && (
                    <p className="text-xs text-gray-400 text-center">
                      他 {alerts.length - 3} 件のアラート
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <p>アクティブなアラートはありません</p>
                  {statistics.totalToday > 0 && (
                    <p className="text-xs mt-1">今日: {statistics.totalToday}件</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Alert Settings Modal */}
      <AlertSettingsModal
        isOpen={isAlertSettingsOpen}
        onClose={() => setIsAlertSettingsOpen(false)}
        currentThresholds={thresholds}
        onSave={updateThresholds}
        isLoading={alertsLoading}
      />
    </div>
  );
};

export default Dashboard;