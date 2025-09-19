import { useEffect, useState } from 'react';
import EnvironmentCards from './EnvironmentCards';
import EnvironmentChart from './EnvironmentChart';
import AlertBanner from './AlertBanner';
import AlertSettingsModal from './AlertSettingsModal';
import { useWebSocket } from '../hooks/useWebSocket';
import { useEnvironmentHistory } from '../hooks/useEnvironmentHistory';
import { useAlerts } from '../hooks/useAlerts';

const Dashboard = () => {
  const [isAlertSettingsOpen, setIsAlertSettingsOpen] = useState(false);
  
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
        <div className="flex items-center space-x-2 mt-2">
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
                  <span className="text-gray-400 text-sm">検索中...</span>
                </div>
              </div>
            </div>

            {/* Device Controls Placeholder */}
            <div className="card p-6">
              <h3 className="text-xl font-semibold text-white mb-4">デバイス制御</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-700 rounded-lg">
                  <p className="text-gray-400 text-center">
                    デバイスが検出されていません
                  </p>
                </div>
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