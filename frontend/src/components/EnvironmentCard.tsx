import React from 'react';

export interface EnvironmentCardProps {
  title: string;
  value: number | null;
  unit: string;
  icon: React.ReactNode;
  colorClass: string;
  isLoading?: boolean;
  error?: string;
  lastUpdated?: Date;
}

const EnvironmentCard: React.FC<EnvironmentCardProps> = ({
  title,
  value,
  unit,
  icon,
  colorClass,
  isLoading = false,
  error,
  lastUpdated
}) => {
  const formatValue = (val: number | null): string => {
    if (val === null) return '--';
    
    // Format based on the type of value
    if (title === '温度') {
      return val.toFixed(1);
    } else if (title === '湿度') {
      return Math.round(val).toString();
    } else if (title === '照度') {
      return Math.round(val).toString();
    }
    
    return val.toString();
  };

  const getStatusText = (): string => {
    if (error) return 'エラー';
    if (isLoading) return 'データ取得中...';
    if (value === null) return 'データなし';
    if (lastUpdated) {
      const now = new Date();
      const diffMs = now.getTime() - lastUpdated.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      
      if (diffSeconds < 60) {
        return `${diffSeconds}秒前に更新`;
      } else if (diffSeconds < 3600) {
        const diffMinutes = Math.floor(diffSeconds / 60);
        return `${diffMinutes}分前に更新`;
      } else {
        return lastUpdated.toLocaleTimeString('ja-JP', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
    }
    return '更新待ち';
  };

  const getStatusColor = (): string => {
    if (error) return 'text-red-400';
    if (isLoading) return 'text-yellow-400';
    if (value === null) return 'text-gray-500';
    return 'text-gray-400';
  };

  return (
    <div className="card p-6 transition-all duration-200 hover:shadow-lg">
      {/* Header with icon and title */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-300">{title}</h3>
        <div className={`text-xl ${colorClass}`}>
          {icon}
        </div>
      </div>

      {/* Main value display */}
      <div className="mb-2">
        <div className={`text-3xl font-bold ${colorClass} transition-colors duration-200`}>
          {formatValue(value)}
          <span className="text-lg ml-1">{unit}</span>
        </div>
      </div>

      {/* Status text */}
      <div className="flex items-center justify-between">
        <p className={`text-sm ${getStatusColor()}`}>
          {getStatusText()}
        </p>
        
        {/* Connection indicator */}
        <div className="flex items-center space-x-1">
          <div 
            className={`w-2 h-2 rounded-full transition-colors duration-200 ${
              error ? 'bg-red-400' : 
              isLoading ? 'bg-yellow-400 animate-pulse' : 
              value !== null ? 'bg-green-400' : 'bg-gray-500'
            }`}
          />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-2 p-2 bg-red-900/20 border border-red-700/30 rounded text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default EnvironmentCard;