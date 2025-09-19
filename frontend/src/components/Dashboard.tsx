import { useEffect, useState } from 'react';
import EnvironmentCards from './EnvironmentCards';
import EnvironmentChart from './EnvironmentChart';
import AlertBanner from './AlertBanner';
import AlertSettingsModal from './AlertSettingsModal';
import DeviceList from './DeviceList';
import LightControlPanel from './LightControlPanel';
import AirConditionerControlPanel from './AirConditionerControlPanel';
import { useWebSocket } from '../hooks/useWebSocket';
import { useEnvironmentHistory } from '../hooks/useEnvironmentHistory';
import { useAlerts } from '../hooks/useAlerts';
import { useDevices } from '../hooks/useDevices';

const Dashboard = () => {
  const [isAlertSettingsOpen, setIsAlertSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'devices' | 'lights' | 'aircons'>('overview');
  
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

  // Device management
  const {
    devices,
    statistics: deviceStatistics,
    isLoading: devicesLoading,
    error: devicesError,
    controlDevice,
    updateDeviceStatus,
    testDeviceConnectivity,
    refresh: refreshDevices
  } = useDevices();

  // WebSocket with alert handlers
  const { environmentData, state, subscribe, unsubscribe } = useWebSocket(
    updateAlertsFromWebSocket,
    handleNewAlert,
    handleAlertDismissed
  );
  
  const { historyState, selectedPeriod, setSelectedPeriod } = useEnvironmentHistory();

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

          {/* Tab Navigation */}
          <div className="flex items-center space-x-1 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              概要
            </button>
            <button
              onClick={() => setActiveTab('lights')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'lights'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              照明制御
            </button>
            <button
              onClick={() => setActiveTab('aircons')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'aircons'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              エアコン制御
            </button>
            <button
              onClick={() => setActiveTab('devices')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'devices'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              デバイス
            </button>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      <AlertBanner
        alerts={alerts}
        onDismiss={dismissAlert}
        onClearAll={clearAllAlerts}
      />

      {/* Tab Content */}
      {activeTab === 'overview' ? (
        /* Overview Tab - Main Dashboard Grid */
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
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setActiveTab('lights')}
                      className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
                    >
                      照明制御
                    </button>
                    <button
                      onClick={() => setActiveTab('aircons')}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      エアコン制御
                    </button>
                    <button
                      onClick={() => setActiveTab('devices')}
                      className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      すべて表示
                    </button>
                  </div>
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
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {device.deviceType === 'Light' && (
                            <button
                              onClick={() => setActiveTab('lights')}
                              className="px-2 py-1 rounded text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
                              title="詳細制御"
                            >
                              ⚙️
                            </button>
                          )}
                          {device.deviceType === 'Air Conditioner' && (
                            <button
                              onClick={() => setActiveTab('aircons')}
                              className="px-2 py-1 rounded text-xs text-blue-400 hover:text-blue-300 transition-colors"
                              title="詳細制御"
                            >
                              ⚙️
                            </button>
                          )}
                          <button
                            onClick={() => controlDevice(
                              device.deviceId,
                              (device.properties as any)?.power === 'on' ? 'turnOff' : 'turnOn'
                            )}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                              (device.properties as any)?.power === 'on'
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
                            }`}
                          >
                            {(device.properties as any)?.power === 'on' ? 'ON' : 'OFF'}
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
      ) : activeTab === 'lights' ? (
        /* Lights Tab */
        <LightControlPanel
          devices={devices}
          onDeviceUpdate={async (deviceId: string) => { await updateDeviceStatus(deviceId); }}
        />
      ) : activeTab === 'aircons' ? (
        /* Air Conditioners Tab */
        <AirConditionerControlPanel
          devices={devices}
          onDeviceUpdate={async (deviceId: string) => { await updateDeviceStatus(deviceId); }}
        />
      ) : (
        /* Devices Tab */
        <DeviceList
          devices={devices}
          isLoading={devicesLoading}
          error={devicesError}
          onControl={controlDevice}
          onStatusUpdate={async (deviceId: string) => { await updateDeviceStatus(deviceId); }}
          onTest={testDeviceConnectivity}
          onRefresh={refreshDevices}
        />
      )}

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