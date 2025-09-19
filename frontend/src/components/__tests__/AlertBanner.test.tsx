/**
 * Tests for AlertBanner component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AlertBanner from '../AlertBanner';
import { Alert } from '../../types';

const mockAlerts: Alert[] = [
  {
    id: 'alert-1',
    type: 'temperature',
    severity: 'warning',
    message: '温度が高すぎます: 32.0°C (最高: 28°C)',
    timestamp: new Date('2024-01-01T12:00:00Z'),
    isActive: true,
    value: 32,
    threshold: 28,
    condition: 'above'
  },
  {
    id: 'alert-2',
    type: 'humidity',
    severity: 'critical',
    message: '湿度が低すぎます: 20.0% (最低: 30%)',
    timestamp: new Date('2024-01-01T12:05:00Z'),
    isActive: true,
    value: 20,
    threshold: 30,
    condition: 'below'
  }
];

describe('AlertBanner', () => {
  it('should render nothing when no alerts', () => {
    const { container } = render(<AlertBanner alerts={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render alerts grouped by severity', () => {
    render(<AlertBanner alerts={mockAlerts} />);
    
    expect(screen.getByText('重要なアラート')).toBeInTheDocument();
    expect(screen.getByText('警告')).toBeInTheDocument();
  });

  it('should display alert messages and timestamps', () => {
    render(<AlertBanner alerts={mockAlerts} />);
    
    expect(screen.getByText('温度が高すぎます: 32.0°C (最高: 28°C)')).toBeInTheDocument();
    expect(screen.getByText('湿度が低すぎます: 20.0% (最低: 30%)')).toBeInTheDocument();
  });

  it('should show alert count for each severity group', () => {
    render(<AlertBanner alerts={mockAlerts} />);
    
    expect(screen.getAllByText('(1件)')).toHaveLength(2); // One for each severity group
  });

  it('should call onDismiss when dismiss button is clicked', () => {
    const onDismiss = vi.fn();
    render(<AlertBanner alerts={mockAlerts} onDismiss={onDismiss} />);
    
    const dismissButtons = screen.getAllByText('解除');
    fireEvent.click(dismissButtons[0]);
    
    expect(onDismiss).toHaveBeenCalledWith('alert-2'); // Critical alert should be first
  });

  it('should call onClearAll when clear all button is clicked', () => {
    const onClearAll = vi.fn();
    const multipleWarningAlerts = [
      { ...mockAlerts[0], id: 'alert-1' },
      { ...mockAlerts[0], id: 'alert-3', severity: 'warning' as const }
    ];
    
    render(<AlertBanner alerts={multipleWarningAlerts} onClearAll={onClearAll} />);
    
    const clearAllButton = screen.getByText('すべて解除');
    fireEvent.click(clearAllButton);
    
    expect(onClearAll).toHaveBeenCalled();
  });

  it('should not show clear all button for single alert', () => {
    render(<AlertBanner alerts={[mockAlerts[0]]} />);
    
    expect(screen.queryByText('すべて解除')).not.toBeInTheDocument();
  });

  it('should format timestamps correctly', () => {
    render(<AlertBanner alerts={mockAlerts} />);
    
    // Check that time is displayed (format may vary based on locale)
    expect(screen.getAllByText(/\d{2}:\d{2}/)).toHaveLength(2); // One for each alert
  });

  it('should apply correct styling for different severities', () => {
    render(<AlertBanner alerts={mockAlerts} />);
    
    const criticalAlert = screen.getByText('湿度が低すぎます: 20.0% (最低: 30%)').closest('.border');
    const warningAlert = screen.getByText('温度が高すぎます: 32.0°C (最高: 28°C)').closest('.border');
    
    expect(criticalAlert).toHaveClass('border-red-500/50');
    expect(warningAlert).toHaveClass('border-yellow-500/50');
  });

  it('should handle empty alerts array gracefully', () => {
    const { container } = render(<AlertBanner alerts={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should handle null alerts gracefully', () => {
    const { container } = render(<AlertBanner alerts={null as any} />);
    expect(container.firstChild).toBeNull();
  });
});