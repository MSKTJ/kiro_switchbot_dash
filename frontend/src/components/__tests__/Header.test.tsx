import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Header from '../Header';

describe('Header', () => {
  it('renders the brand logo and title', () => {
    render(<Header />);
    expect(screen.getByText('SB')).toBeInTheDocument();
    expect(screen.getByText('SwitchBot Dashboard')).toBeInTheDocument();
  });

  it('renders navigation links on desktop', () => {
    render(<Header />);
    expect(screen.getByText('ダッシュボード')).toBeInTheDocument();
    expect(screen.getByText('デバイス')).toBeInTheDocument();
    expect(screen.getByText('設定')).toBeInTheDocument();
  });

  it('shows online status indicator', () => {
    render(<Header />);
    expect(screen.getByText('オンライン')).toBeInTheDocument();
  });

  it('toggles mobile menu when button is clicked', () => {
    render(<Header />);
    
    // Mobile menu should not be visible initially
    expect(screen.queryByText('システム状態: オンライン')).not.toBeInTheDocument();
    
    // Click mobile menu button
    const menuButton = screen.getByLabelText('メニューを開く');
    fireEvent.click(menuButton);
    
    // Mobile menu should now be visible
    expect(screen.getByText('システム状態: オンライン')).toBeInTheDocument();
  });

  it('closes mobile menu when navigation link is clicked', () => {
    render(<Header />);
    
    // Open mobile menu
    const menuButton = screen.getByLabelText('メニューを開く');
    fireEvent.click(menuButton);
    
    // Click a navigation link
    const dashboardLink = screen.getAllByText('ダッシュボード')[1]; // Second one is in mobile menu
    fireEvent.click(dashboardLink);
    
    // Mobile menu should be closed
    expect(screen.queryByText('システム状態: オンライン')).not.toBeInTheDocument();
  });
});