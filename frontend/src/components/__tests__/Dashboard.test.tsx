import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Dashboard from '../Dashboard';

describe('Dashboard', () => {
  it('renders dashboard title', () => {
    render(<Dashboard />);
    expect(screen.getByText('ダッシュボード')).toBeInTheDocument();
  });

  it('renders environment data placeholders', () => {
    render(<Dashboard />);
    expect(screen.getByText('温度')).toBeInTheDocument();
    expect(screen.getByText('湿度')).toBeInTheDocument();
    expect(screen.getByText('照度')).toBeInTheDocument();
  });

  it('renders device status section', () => {
    render(<Dashboard />);
    expect(screen.getByText('デバイス状態')).toBeInTheDocument();
    expect(screen.getByText('システム状態')).toBeInTheDocument();
  });

  it('renders device controls section', () => {
    render(<Dashboard />);
    expect(screen.getByText('デバイス制御')).toBeInTheDocument();
  });

  it('renders alerts section', () => {
    render(<Dashboard />);
    expect(screen.getByText('アラート')).toBeInTheDocument();
    expect(screen.getByText('アクティブなアラートはありません')).toBeInTheDocument();
  });

  it('renders environment history chart placeholder', () => {
    render(<Dashboard />);
    expect(screen.getByText('環境データ履歴')).toBeInTheDocument();
    expect(screen.getByText('グラフ表示エリア')).toBeInTheDocument();
  });
});