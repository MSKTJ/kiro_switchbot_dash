import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import EnvironmentCards from '../EnvironmentCards';
import { EnvironmentData } from '../../types';

describe('EnvironmentCards', () => {
  const mockEnvironmentData: EnvironmentData = {
    temperature: 25.5,
    humidity: 65,
    light: 850,
    timestamp: new Date('2024-01-01T12:00:00Z')
  };

  it('renders all three environment cards', () => {
    render(<EnvironmentCards environmentData={mockEnvironmentData} />);
    
    expect(screen.getByText('温度')).toBeInTheDocument();
    expect(screen.getByText('湿度')).toBeInTheDocument();
    expect(screen.getByText('照度')).toBeInTheDocument();
  });

  it('displays correct values for each card', () => {
    render(<EnvironmentCards environmentData={mockEnvironmentData} />);
    
    expect(screen.getByText('25.5')).toBeInTheDocument(); // Temperature
    expect(screen.getByText('65')).toBeInTheDocument(); // Humidity
    expect(screen.getByText('850')).toBeInTheDocument(); // Light
  });

  it('displays correct units for each card', () => {
    render(<EnvironmentCards environmentData={mockEnvironmentData} />);
    
    expect(screen.getByText('°C')).toBeInTheDocument(); // Temperature unit
    expect(screen.getByText('%')).toBeInTheDocument(); // Humidity unit
    expect(screen.getByText('lux')).toBeInTheDocument(); // Light unit
  });

  it('handles null environment data', () => {
    render(<EnvironmentCards environmentData={null} />);
    
    // Should show placeholder values
    const placeholders = screen.getAllByText('--');
    expect(placeholders).toHaveLength(3); // One for each card
  });

  it('displays loading state for all cards', () => {
    render(<EnvironmentCards environmentData={null} isLoading={true} />);
    
    const loadingTexts = screen.getAllByText('データ取得中...');
    expect(loadingTexts).toHaveLength(3); // One for each card
  });

  it('displays error state for all cards', () => {
    const errorMessage = 'Connection failed';
    render(<EnvironmentCards environmentData={null} error={errorMessage} />);
    
    const errorTexts = screen.getAllByText('エラー');
    expect(errorTexts).toHaveLength(3); // One for each card
    
    const errorMessages = screen.getAllByText(errorMessage);
    expect(errorMessages).toHaveLength(3); // Error message in each card
  });

  it('renders with responsive grid layout', () => {
    const { container } = render(<EnvironmentCards environmentData={mockEnvironmentData} />);
    
    const gridContainer = container.firstChild;
    expect(gridContainer).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-3', 'gap-4', 'mb-6');
  });

  it('passes timestamp to all cards', () => {
    render(<EnvironmentCards environmentData={mockEnvironmentData} />);
    
    // All cards should show the same timestamp
    const timeElements = screen.getAllByText(/\d{2}:\d{2}/);
    expect(timeElements).toHaveLength(3);
  });

  it('handles partial environment data', () => {
    const partialData: Partial<EnvironmentData> = {
      temperature: 25.5,
      timestamp: new Date('2024-01-01T12:00:00Z')
    };
    
    render(<EnvironmentCards environmentData={partialData as EnvironmentData} />);
    
    expect(screen.getByText('25.5')).toBeInTheDocument(); // Temperature should show
    
    // Humidity and light should show placeholder
    const placeholders = screen.getAllByText('--');
    expect(placeholders).toHaveLength(2);
  });
});