/**
 * Tests for EnvironmentChart component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EnvironmentChart from '../EnvironmentChart';
import { HistoricalDataPoint, TimePeriod } from '../../types';

// Mock Chart.js
vi.mock('react-chartjs-2', () => ({
  Line: vi.fn(({ data, options }) => (
    <div data-testid="chart-mock">
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
      <div data-testid="chart-options">{JSON.stringify(options)}</div>
    </div>
  ))
}));

// Mock Chart.js registration
vi.mock('chart.js', () => ({
  Chart: {
    register: vi.fn()
  },
  CategoryScale: {},
  LinearScale: {},
  PointElement: {},
  LineElement: {},
  Title: {},
  Tooltip: {},
  Legend: {},
  TimeScale: {}
}));

describe('EnvironmentChart', () => {
  const mockHistoricalData: HistoricalDataPoint[] = [
    {
      timestamp: new Date('2024-01-01T10:00:00Z'),
      temperature: 25.5,
      humidity: 60,
      light: 800,
      sampleCount: 1
    },
    {
      timestamp: new Date('2024-01-01T11:00:00Z'),
      temperature: 26.0,
      humidity: 62,
      light: 850,
      sampleCount: 1
    },
    {
      timestamp: new Date('2024-01-01T12:00:00Z'),
      temperature: 24.5,
      humidity: 58,
      light: 750,
      sampleCount: 1
    }
  ];

  const defaultProps = {
    data: mockHistoricalData,
    selectedPeriod: '1h' as TimePeriod,
    onPeriodChange: vi.fn(),
    isLoading: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render chart with data', () => {
      render(<EnvironmentChart {...defaultProps} />);

      expect(screen.getByText('環境データ履歴')).toBeInTheDocument();
      expect(screen.getByTestId('chart-mock')).toBeInTheDocument();
    });

    it('should render loading state', () => {
      render(<EnvironmentChart {...defaultProps} isLoading={true} />);

      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
      // Check for loading spinner by class
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('should render error state', () => {
      const errorMessage = 'Failed to load data';
      render(<EnvironmentChart {...defaultProps} error={errorMessage} />);

      expect(screen.getByText('データの読み込みに失敗しました')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should render empty state when no data', () => {
      render(<EnvironmentChart {...defaultProps} data={[]} />);

      expect(screen.getByText('データがありません')).toBeInTheDocument();
      expect(screen.getByText('データが蓄積されるまでお待ちください')).toBeInTheDocument();
    });
  });

  describe('metric selection', () => {
    it('should render metric selection buttons', () => {
      render(<EnvironmentChart {...defaultProps} />);

      expect(screen.getByRole('button', { name: /🌡️ 温度/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /💧 湿度/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /💡 照度/ })).toBeInTheDocument();
    });

    it('should highlight selected metric', () => {
      render(<EnvironmentChart {...defaultProps} />);

      const temperatureButton = screen.getByRole('button', { name: /🌡️ 温度/ });
      expect(temperatureButton).toHaveClass('bg-blue-600');
    });

    it('should change metric when button is clicked', async () => {
      render(<EnvironmentChart {...defaultProps} />);

      const humidityButton = screen.getByRole('button', { name: /💧 湿度/ });
      fireEvent.click(humidityButton);

      await waitFor(() => {
        expect(humidityButton).toHaveClass('bg-blue-600');
      });
    });
  });

  describe('period selection', () => {
    it('should render period selection buttons', () => {
      render(<EnvironmentChart {...defaultProps} />);

      expect(screen.getByRole('button', { name: '1時間' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '6時間' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '12時間' })).toBeInTheDocument();
    });

    it('should highlight selected period', () => {
      render(<EnvironmentChart {...defaultProps} />);

      const period1hButton = screen.getByRole('button', { name: '1時間' });
      expect(period1hButton).toHaveClass('bg-green-600');
    });

    it('should call onPeriodChange when period button is clicked', () => {
      const onPeriodChange = vi.fn();
      render(<EnvironmentChart {...defaultProps} onPeriodChange={onPeriodChange} />);

      const period6hButton = screen.getByRole('button', { name: '6時間' });
      fireEvent.click(period6hButton);

      expect(onPeriodChange).toHaveBeenCalledWith('6h');
    });
  });

  describe('data summary', () => {
    it('should display data summary when data is available', () => {
      render(<EnvironmentChart {...defaultProps} />);

      expect(screen.getByText('データポイント数')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // 3 data points

      expect(screen.getByText('最新値')).toBeInTheDocument();
      expect(screen.getByText('24.5°C')).toBeInTheDocument(); // Latest temperature

      expect(screen.getByText('期間')).toBeInTheDocument();
      expect(screen.getAllByText('1時間')).toHaveLength(2); // Button and summary
    });

    it('should not display data summary when no data', () => {
      render(<EnvironmentChart {...defaultProps} data={[]} />);

      expect(screen.queryByText('データポイント数')).not.toBeInTheDocument();
    });
  });

  describe('chart data formatting', () => {
    it('should format temperature data correctly', () => {
      render(<EnvironmentChart {...defaultProps} />);

      const chartData = screen.getByTestId('chart-data');
      const data = JSON.parse(chartData.textContent || '{}');

      expect(data.datasets[0].label).toBe('温度');
      expect(data.datasets[0].data).toHaveLength(3);
      expect(data.datasets[0].data[0].y).toBe(25.5);
    });

    it('should format humidity data correctly when humidity metric is selected', async () => {
      render(<EnvironmentChart {...defaultProps} />);

      const humidityButton = screen.getByRole('button', { name: /💧 湿度/ });
      fireEvent.click(humidityButton);

      await waitFor(() => {
        const chartData = screen.getByTestId('chart-data');
        const data = JSON.parse(chartData.textContent || '{}');

        expect(data.datasets[0].label).toBe('湿度');
        expect(data.datasets[0].data[0].y).toBe(60);
      });
    });

    it('should format light data correctly when light metric is selected', async () => {
      render(<EnvironmentChart {...defaultProps} />);

      const lightButton = screen.getByRole('button', { name: /💡 照度/ });
      fireEvent.click(lightButton);

      await waitFor(() => {
        const chartData = screen.getByTestId('chart-data');
        const data = JSON.parse(chartData.textContent || '{}');

        expect(data.datasets[0].label).toBe('照度');
        expect(data.datasets[0].data[0].y).toBe(800);
      });
    });
  });

  describe('responsive design', () => {
    it('should have responsive classes', () => {
      render(<EnvironmentChart {...defaultProps} />);

      const controlsContainer = screen.getByText('環境データ履歴').closest('.card');
      expect(controlsContainer).toHaveClass('p-6');

      // Check for responsive grid classes in summary
      const summaryContainer = screen.getByText('データポイント数').closest('.grid');
      expect(summaryContainer).toHaveClass('grid-cols-1', 'sm:grid-cols-3');
    });
  });

  describe('accessibility', () => {
    it('should have proper button roles and labels', () => {
      render(<EnvironmentChart {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      buttons.forEach(button => {
        // Check that buttons are properly accessible
        expect(button.tagName).toBe('BUTTON');
      });
    });

    it('should have proper heading structure', () => {
      render(<EnvironmentChart {...defaultProps} />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('環境データ履歴');
    });
  });
});