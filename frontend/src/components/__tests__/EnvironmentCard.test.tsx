import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import EnvironmentCard from '../EnvironmentCard';

// Mock icon component
const MockIcon = () => <div data-testid="mock-icon">Icon</div>;

describe('EnvironmentCard', () => {
  const defaultProps = {
    title: 'Temperature',
    value: 25.5,
    unit: '°C',
    icon: <MockIcon />,
    colorClass: 'text-primary-400'
  };

  it('renders with basic props', () => {
    render(<EnvironmentCard {...defaultProps} />);
    
    expect(screen.getByText('Temperature')).toBeInTheDocument();
    expect(screen.getByText('25.5')).toBeInTheDocument();
    expect(screen.getByText('°C')).toBeInTheDocument();
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  it('displays loading state correctly', () => {
    const { container } = render(<EnvironmentCard {...defaultProps} isLoading={true} />);
    
    expect(screen.getByText('データ取得中...')).toBeInTheDocument();
    
    const indicator = container.querySelector('.w-2.h-2.rounded-full');
    expect(indicator).toHaveClass('bg-yellow-400', 'animate-pulse');
  });

  it('displays error state correctly', () => {
    const errorMessage = 'Connection failed';
    render(<EnvironmentCard {...defaultProps} error={errorMessage} />);
    
    expect(screen.getByText('エラー')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('displays null value correctly', () => {
    render(<EnvironmentCard {...defaultProps} value={null} />);
    
    expect(screen.getByText('--')).toBeInTheDocument();
    expect(screen.getByText('データなし')).toBeInTheDocument();
  });

  it('formats temperature values correctly', () => {
    render(<EnvironmentCard {...defaultProps} title="温度" value={25.678} />);
    
    expect(screen.getByText('25.7')).toBeInTheDocument();
  });

  it('formats humidity values correctly', () => {
    render(<EnvironmentCard {...defaultProps} title="湿度" value={65.8} unit="%" />);
    
    expect(screen.getByText('66')).toBeInTheDocument();
  });

  it('formats light values correctly', () => {
    render(<EnvironmentCard {...defaultProps} title="照度" value={850.7} unit="lux" />);
    
    expect(screen.getByText('851')).toBeInTheDocument();
  });

  it('displays last updated time correctly', () => {
    const lastUpdated = new Date('2024-01-01T12:00:00Z');
    render(<EnvironmentCard {...defaultProps} lastUpdated={lastUpdated} />);
    
    // Should show time in Japanese format
    expect(screen.getByText(/\d{2}:\d{2}/)).toBeInTheDocument();
  });

  it('displays recent update time in seconds', () => {
    const lastUpdated = new Date(Date.now() - 30000); // 30 seconds ago
    render(<EnvironmentCard {...defaultProps} lastUpdated={lastUpdated} />);
    
    expect(screen.getByText('30秒前に更新')).toBeInTheDocument();
  });

  it('displays update time in minutes', () => {
    const lastUpdated = new Date(Date.now() - 120000); // 2 minutes ago
    render(<EnvironmentCard {...defaultProps} lastUpdated={lastUpdated} />);
    
    expect(screen.getByText('2分前に更新')).toBeInTheDocument();
  });

  it('applies correct color classes', () => {
    const { container } = render(<EnvironmentCard {...defaultProps} colorClass="text-success-400" />);
    
    const valueElement = container.querySelector('.text-3xl');
    expect(valueElement).toHaveClass('text-success-400');
  });

  it('shows connection indicator with correct color', () => {
    const { container } = render(<EnvironmentCard {...defaultProps} />);
    
    const indicator = container.querySelector('.w-2.h-2.rounded-full');
    expect(indicator).toHaveClass('bg-green-400');
  });

  it('shows error connection indicator', () => {
    const { container } = render(<EnvironmentCard {...defaultProps} error="Test error" />);
    
    const indicator = container.querySelector('.w-2.h-2.rounded-full');
    expect(indicator).toHaveClass('bg-red-400');
  });
});