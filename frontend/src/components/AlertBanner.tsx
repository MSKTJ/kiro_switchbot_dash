import React from 'react';
import { Alert } from '../types';

interface AlertBannerProps {
  alerts: Alert[];
  onDismiss?: (alertId: string) => void;
  onClearAll?: () => void;
}

const AlertBanner: React.FC<AlertBannerProps> = ({ alerts, onDismiss, onClearAll }) => {
  if (!alerts || alerts.length === 0) {
    return null;
  }

  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
  const warningAlerts = alerts.filter(alert => alert.severity === 'warning');

  const getSeverityStyles = (severity: 'warning' | 'critical') => {
    switch (severity) {
      case 'critical':
        return {
          container: 'bg-red-900/20 border-red-500/50 text-red-100',
          icon: 'text-red-400',
          button: 'text-red-300 hover:text-red-100 hover:bg-red-800/30'
        };
      case 'warning':
        return {
          container: 'bg-yellow-900/20 border-yellow-500/50 text-yellow-100',
          icon: 'text-yellow-400',
          button: 'text-yellow-300 hover:text-yellow-100 hover:bg-yellow-800/30'
        };
    }
  };

  const getAlertIcon = (severity: 'warning' | 'critical') => {
    switch (severity) {
      case 'critical':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderAlertGroup = (alertGroup: Alert[], severity: 'warning' | 'critical') => {
    if (alertGroup.length === 0) return null;

    const styles = getSeverityStyles(severity);
    const icon = getAlertIcon(severity);

    return (
      <div key={severity} className={`border rounded-lg p-4 mb-3 ${styles.container}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className={`flex-shrink-0 ${styles.icon}`}>
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold">
                  {severity === 'critical' ? '重要なアラート' : '警告'}
                  <span className="ml-2 text-xs opacity-75">
                    ({alertGroup.length}件)
                  </span>
                </h4>
                {onClearAll && alertGroup.length > 1 && (
                  <button
                    onClick={onClearAll}
                    className={`text-xs px-2 py-1 rounded transition-colors ${styles.button}`}
                  >
                    すべて解除
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {alertGroup.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{alert.message}</p>
                      <p className="text-xs opacity-75 mt-1">
                        {formatTimestamp(alert.timestamp)}
                      </p>
                    </div>
                    {onDismiss && (
                      <button
                        onClick={() => onDismiss(alert.id)}
                        className={`ml-3 text-xs px-2 py-1 rounded transition-colors ${styles.button}`}
                      >
                        解除
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mb-6">
      {renderAlertGroup(criticalAlerts, 'critical')}
      {renderAlertGroup(warningAlerts, 'warning')}
    </div>
  );
};

export default AlertBanner;