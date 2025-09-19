/**
 * AirConditionerControl component tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AirConditionerControl from '../AirConditionerControl';
import { Device, AirConditionerProperties } from '../../types';

// Mock fetch
global.fetch = vi.fn();

const mockAirconDevice: Device = {
  deviceId: 'aircon-001',
  deviceName: 'リビングエアコン',
  deviceType: 'Air Conditioner',
  status: 'online',
  hubDeviceId: 'hub-001',
  enableCloudService: true,
  isInfraredRemote: true,
  remoteType: 'Air Conditioner',
  properties: {
    power: 'off',
    mode: 'auto',
    temperature: 25,
    fanSpeed: 'auto'
  } as AirConditionerProperties,
  lastUpdated: '2024-01-01T12:00:00Z'
};

const mockOnControlSuccess = vi.fn();
const mockOnControlError = vi.fn();

describe('AirConditionerControl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  it('should render air conditioner device information', () => {
    render(
      <AirConditionerControl
        device={mockAirconDevice}
        onControlSuccess={mockOnControlSuccess}
        onControlError={mockOnControlError}
      />
    );

    expect(screen.getByText('リビングエアコン')).toBeInTheDocument();
    expect(screen.getByText('エアコンデバイス')).toBeInTheDocument();
    expect(screen.getByText('オンライン')).toBeInTheDocument();
  });

  it('should display current air conditioner status', () => {
    const onDevice = {
      ...mockAirconDevice,
      properties: {
        ...mockAirconDevice.properties,
        power: 'on',
        mode: 'cool',
        temperature: 22
      } as AirConditionerProperties
    };

    render(
      <AirConditionerControl
        device={onDevice}
        onControlSuccess={mockOnControlSuccess}
        onControlError={mockOnControlError}
      />
    );

    expect(screen.getAllByText('22°C')).toHaveLength(3); // Temperature appears in multiple places
    expect(screen.getByText('❄️ 冷房')).toBeInTheDocument();
    expect(screen.getByText('運転中')).toBeInTheDocument();
  });

  it('should handle power toggle', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { deviceId: 'aircon-001', command: 'turnOn' }
      })
    });

    render(
      <AirConditionerControl
        device={mockAirconDevice}
        onControlSuccess={mockOnControlSuccess}
        onControlError={mockOnControlError}
      />
    );

    const toggleButton = screen.getByText('トグルスイッチ').nextElementSibling as HTMLElement;
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/devices/aircon-001/aircon/toggle',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });

    expect(mockOnControlSuccess).toHaveBeenCalledWith(
      'aircon-001',
      '電源ON',
      expect.any(Object)
    );
  });

  it('should handle explicit power control', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { deviceId: 'aircon-001', command: 'turnOn', power: 'on' }
      })
    });

    render(
      <AirConditionerControl
        device={mockAirconDevice}
        onControlSuccess={mockOnControlSuccess}
        onControlError={mockOnControlError}
      />
    );

    const onButton = screen.getByRole('button', { name: 'ON' });
    fireEvent.click(onButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/devices/aircon-001/aircon/power',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ power: 'on' })
        })
      );
    });

    expect(mockOnControlSuccess).toHaveBeenCalledWith(
      'aircon-001',
      '電源ON',
      expect.any(Object)
    );
  });

  it('should handle mode selection', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { deviceId: 'aircon-001', command: 'setMode', mode: 'cool' }
      })
    });

    const onDevice = {
      ...mockAirconDevice,
      properties: { ...mockAirconDevice.properties, power: 'on' } as AirConditionerProperties
    };

    render(
      <AirConditionerControl
        device={onDevice}
        onControlSuccess={mockOnControlSuccess}
        onControlError={mockOnControlError}
      />
    );

    const coolButton = screen.getByRole('button', { name: /❄️ 冷房/i });
    fireEvent.click(coolButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/devices/aircon-001/aircon/mode',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'cool' })
        })
      );
    });

    expect(mockOnControlSuccess).toHaveBeenCalledWith(
      'aircon-001',
      '運転モード変更 (冷房)',
      expect.any(Object)
    );
  });

  it('should handle temperature adjustment with buttons', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { deviceId: 'aircon-001', command: 'setTemperature', temperature: 26 }
      })
    });

    const onDevice = {
      ...mockAirconDevice,
      properties: { ...mockAirconDevice.properties, power: 'on' } as AirConditionerProperties
    };

    render(
      <AirConditionerControl
        device={onDevice}
        onControlSuccess={mockOnControlSuccess}
        onControlError={mockOnControlError}
      />
    );

    const increaseButton = screen.getByRole('button', { name: '+' });
    fireEvent.click(increaseButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/devices/aircon-001/aircon/temperature',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ temperature: 26 })
        })
      );
    });

    expect(mockOnControlSuccess).toHaveBeenCalledWith(
      'aircon-001',
      '温度設定 (26°C)',
      expect.any(Object)
    );
  });

  it('should handle temperature slider change', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { deviceId: 'aircon-001', command: 'setTemperature', temperature: 20 }
      })
    });

    const onDevice = {
      ...mockAirconDevice,
      properties: { ...mockAirconDevice.properties, power: 'on' } as AirConditionerProperties
    };

    render(
      <AirConditionerControl
        device={onDevice}
        onControlSuccess={mockOnControlSuccess}
        onControlError={mockOnControlError}
      />
    );

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '20' } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/devices/aircon-001/aircon/temperature',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ temperature: 20 })
        })
      );
    });

    expect(mockOnControlSuccess).toHaveBeenCalledWith(
      'aircon-001',
      '温度設定 (20°C)',
      expect.any(Object)
    );
  });

  it('should handle temperature preset buttons', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { deviceId: 'aircon-001', command: 'setTemperature', temperature: 22 }
      })
    });

    const onDevice = {
      ...mockAirconDevice,
      properties: { ...mockAirconDevice.properties, power: 'on' } as AirConditionerProperties
    };

    render(
      <AirConditionerControl
        device={onDevice}
        onControlSuccess={mockOnControlSuccess}
        onControlError={mockOnControlError}
      />
    );

    const preset22Button = screen.getByRole('button', { name: '22°C' });
    fireEvent.click(preset22Button);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/devices/aircon-001/aircon/temperature',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ temperature: 22 })
        })
      );
    });

    expect(mockOnControlSuccess).toHaveBeenCalledWith(
      'aircon-001',
      '温度設定 (22°C)',
      expect.any(Object)
    );
  });

  it('should disable controls when device is offline', () => {
    const offlineDevice = { ...mockAirconDevice, status: 'offline' as const };

    render(
      <AirConditionerControl
        device={offlineDevice}
        onControlSuccess={mockOnControlSuccess}
        onControlError={mockOnControlError}
      />
    );

    expect(screen.getByText('オフライン')).toBeInTheDocument();
    
    const onButton = screen.getByRole('button', { name: 'ON' });
    expect(onButton).toBeDisabled();
  });

  it('should disable controls when disabled prop is true', () => {
    render(
      <AirConditionerControl
        device={mockAirconDevice}
        onControlSuccess={mockOnControlSuccess}
        onControlError={mockOnControlError}
        disabled={true}
      />
    );

    const toggleButton = screen.getByText('トグルスイッチ').nextElementSibling as HTMLElement;
    expect(toggleButton).toBeDisabled();
  });

  it('should handle API errors', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: { message: 'Device not found' }
      })
    });

    render(
      <AirConditionerControl
        device={mockAirconDevice}
        onControlSuccess={mockOnControlSuccess}
        onControlError={mockOnControlError}
      />
    );

    const toggleButton = screen.getByText('トグルスイッチ').nextElementSibling as HTMLElement;
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(mockOnControlError).toHaveBeenCalledWith(
        'aircon-001',
        '電源ON',
        'Device not found'
      );
    });

    expect(screen.getByText(/電源ONに失敗しました/)).toBeInTheDocument();
  });

  it('should handle network errors', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(
      <AirConditionerControl
        device={mockAirconDevice}
        onControlSuccess={mockOnControlSuccess}
        onControlError={mockOnControlError}
      />
    );

    const toggleButton = screen.getByText('トグルスイッチ').nextElementSibling as HTMLElement;
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(mockOnControlError).toHaveBeenCalledWith(
        'aircon-001',
        '電源ON',
        'Network error'
      );
    });

    expect(screen.getByText(/電源ON中にエラーが発生しました/)).toBeInTheDocument();
  });

  it('should show loading indicator during control operations', async () => {
    (global.fetch as any).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ success: true, data: {} })
      }), 100))
    );

    render(
      <AirConditionerControl
        device={mockAirconDevice}
        onControlSuccess={mockOnControlSuccess}
        onControlError={mockOnControlError}
      />
    );

    const toggleButton = screen.getByText('トグルスイッチ').nextElementSibling as HTMLElement;
    fireEvent.click(toggleButton);

    expect(screen.getByText('制御中...')).toBeInTheDocument();
    expect(toggleButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.queryByText('制御中...')).not.toBeInTheDocument();
    });
  });

  it('should not render for non-air conditioner devices', () => {
    const lightDevice = { ...mockAirconDevice, deviceType: 'Light' as const };

    render(
      <AirConditionerControl
        device={lightDevice}
        onControlSuccess={mockOnControlSuccess}
        onControlError={mockOnControlError}
      />
    );

    expect(screen.getByText('このデバイスはエアコンではありません')).toBeInTheDocument();
    expect(screen.queryByText('電源制御')).not.toBeInTheDocument();
  });

  it('should respect temperature boundaries', async () => {
    const onDevice = {
      ...mockAirconDevice,
      properties: { 
        ...mockAirconDevice.properties, 
        power: 'on',
        temperature: 16 
      } as AirConditionerProperties
    };

    render(
      <AirConditionerControl
        device={onDevice}
        onControlSuccess={mockOnControlSuccess}
        onControlError={mockOnControlError}
      />
    );

    const decreaseButton = screen.getByRole('button', { name: '-' });
    expect(decreaseButton).toBeDisabled(); // At minimum temperature

    // Test maximum boundary
    const maxTempDevice = {
      ...mockAirconDevice,
      properties: { 
        ...mockAirconDevice.properties, 
        power: 'on',
        temperature: 30 
      } as AirConditionerProperties
    };

    render(
      <AirConditionerControl
        device={maxTempDevice}
        onControlSuccess={mockOnControlSuccess}
        onControlError={mockOnControlError}
      />
    );

    const increaseButtons = screen.getAllByRole('button', { name: '+' });
    expect(increaseButtons[increaseButtons.length - 1]).toBeDisabled(); // At maximum temperature
  });
});