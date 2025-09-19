import React, { useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  ChartOptions,
  TooltipItem
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

export interface HistoricalDataPoint {
  timestamp: Date;
  temperature: number;
  humidity: number;
  light: number;
  sampleCount?: number;
}

export type TimePeriod = '1h' | '6h' | '12h';

interface EnvironmentChartProps {
  data: HistoricalDataPoint[];
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  isLoading?: boolean;
  error?: string;
}

const EnvironmentChart: React.FC<EnvironmentChartProps> = ({
  data,
  selectedPeriod,
  onPeriodChange,
  isLoading = false,
  error
}) => {
  const chartRef = useRef<ChartJS<'line'>>(null);
  const [selectedMetric, setSelectedMetric] = useState<'temperature' | 'humidity' | 'light'>('temperature');

  // Chart configuration
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#E5E7EB', // text-gray-200
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: getChartTitle(selectedMetric, selectedPeriod),
        color: '#F9FAFB', // text-gray-50
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)', // bg-gray-900
        titleColor: '#F9FAFB',
        bodyColor: '#E5E7EB',
        borderColor: '#374151',
        borderWidth: 1,
        callbacks: {
          title: (context) => {
            const date = new Date(context[0].parsed.x);
            return date.toLocaleString('ja-JP');
          },
          label: (context: TooltipItem<'line'>) => {
            const value = context.parsed.y;
            const unit = getMetricUnit(selectedMetric);
            return `${context.dataset.label}: ${value.toFixed(1)}${unit}`;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          displayFormats: {
            minute: 'HH:mm',
            hour: 'HH:mm',
            day: 'MM/dd HH:mm',
            week: 'MM/dd',
            month: 'MM/dd'
          },
          unit: getTimeUnit(selectedPeriod)
        },
        grid: {
          color: '#374151', // border-gray-700
        },
        ticks: {
          color: '#9CA3AF', // text-gray-400
          maxTicksLimit: 8
        }
      },
      y: {
        grid: {
          color: '#374151', // border-gray-700
        },
        ticks: {
          color: '#9CA3AF', // text-gray-400
          callback: function(value) {
            const unit = getMetricUnit(selectedMetric);
            return `${value}${unit}`;
          }
        }
      }
    },
    elements: {
      point: {
        radius: 2,
        hoverRadius: 6
      },
      line: {
        tension: 0.1
      }
    }
  };

  // Prepare chart data based on selected metric
  const chartData = {
    labels: data.map(point => point.timestamp),
    datasets: [
      {
        label: getMetricLabel(selectedMetric),
        data: data.map(point => ({
          x: point.timestamp.getTime(),
          y: point[selectedMetric]
        })),
        borderColor: getMetricColor(selectedMetric),
        backgroundColor: getMetricColor(selectedMetric, 0.1),
        borderWidth: 2,
        fill: true,
        pointBackgroundColor: getMetricColor(selectedMetric),
        pointBorderColor: '#1F2937', // bg-gray-800
        pointBorderWidth: 1
      }
    ]
  };

  // Period selection buttons
  const periodButtons: { value: TimePeriod; label: string }[] = [
    { value: '1h', label: '1時間' },
    { value: '6h', label: '6時間' },
    { value: '12h', label: '12時間' }
  ];

  // Metric selection buttons
  const metricButtons: { value: typeof selectedMetric; label: string; icon: string }[] = [
    { value: 'temperature', label: '温度', icon: '🌡️' },
    { value: 'humidity', label: '湿度', icon: '💧' },
    { value: 'light', label: '照度', icon: '💡' }
  ];

  return (
    <div className="card p-6">
      <div className="flex flex-col space-y-4 mb-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">環境データ履歴</h3>
          {isLoading && (
            <div className="flex items-center space-x-2 text-blue-400">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">読み込み中...</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          {/* Metric Selection */}
          <div className="flex space-x-2">
            {metricButtons.map((metric) => (
              <button
                key={metric.value}
                onClick={() => setSelectedMetric(metric.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                  selectedMetric === metric.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <span>{metric.icon}</span>
                <span>{metric.label}</span>
              </button>
            ))}
          </div>

          {/* Period Selection */}
          <div className="flex space-x-2">
            {periodButtons.map((period) => (
              <button
                key={period.value}
                onClick={() => onPeriodChange(period.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === period.value
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative">
        {error ? (
          <div className="h-64 flex items-center justify-center bg-gray-700 rounded-lg">
            <div className="text-center">
              <div className="text-red-400 text-lg mb-2">⚠️</div>
              <p className="text-red-400 font-medium">データの読み込みに失敗しました</p>
              <p className="text-gray-400 text-sm mt-1">{error}</p>
            </div>
          </div>
        ) : data.length === 0 && !isLoading ? (
          <div className="h-64 flex items-center justify-center bg-gray-700 rounded-lg">
            <div className="text-center">
              <div className="text-gray-400 text-lg mb-2">📊</div>
              <p className="text-gray-400 font-medium">データがありません</p>
              <p className="text-gray-500 text-sm mt-1">
                データが蓄積されるまでお待ちください
              </p>
            </div>
          </div>
        ) : (
          <div className="h-64 bg-gray-800 rounded-lg p-4">
            <Line ref={chartRef} data={chartData} options={options} />
          </div>
        )}
      </div>

      {/* Data Summary */}
      {data.length > 0 && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">データポイント数</div>
            <div className="text-lg font-semibold text-white">{data.length}</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">最新値</div>
            <div className="text-lg font-semibold text-white">
              {data.length > 0 ? 
                `${data[data.length - 1][selectedMetric].toFixed(1)}${getMetricUnit(selectedMetric)}` : 
                '-'
              }
            </div>
          </div>
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">期間</div>
            <div className="text-lg font-semibold text-white">
              {periodButtons.find(p => p.value === selectedPeriod)?.label}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions
function getChartTitle(metric: string, period: TimePeriod): string {
  const metricName = getMetricLabel(metric);
  const periodName = period === '1h' ? '1時間' : period === '6h' ? '6時間' : '12時間';
  return `${metricName} - ${periodName}`;
}

function getMetricLabel(metric: string): string {
  switch (metric) {
    case 'temperature': return '温度';
    case 'humidity': return '湿度';
    case 'light': return '照度';
    default: return metric;
  }
}

function getMetricUnit(metric: string): string {
  switch (metric) {
    case 'temperature': return '°C';
    case 'humidity': return '%';
    case 'light': return ' lux';
    default: return '';
  }
}

function getMetricColor(metric: string, alpha: number = 1): string {
  const colors = {
    temperature: alpha === 1 ? '#EF4444' : `rgba(239, 68, 68, ${alpha})`, // red-500
    humidity: alpha === 1 ? '#3B82F6' : `rgba(59, 130, 246, ${alpha})`,   // blue-500
    light: alpha === 1 ? '#F59E0B' : `rgba(245, 158, 11, ${alpha})`       // amber-500
  };
  return colors[metric as keyof typeof colors] || '#6B7280';
}

function getTimeUnit(period: TimePeriod): 'minute' | 'hour' | 'day' {
  switch (period) {
    case '1h':
      return 'minute';
    case '6h':
    case '12h':
      return 'hour';
    default:
      return 'hour';
  }
}

export default EnvironmentChart;