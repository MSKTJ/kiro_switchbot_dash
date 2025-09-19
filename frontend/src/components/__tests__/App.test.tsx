import { render, screen } from '@testing-library/react';
import App from '../../App';

describe('App Component', () => {
  it('renders the main dashboard title', () => {
    render(<App />);
    
    const titles = screen.getAllByText('SwitchBot Dashboard');
    expect(titles.length).toBeGreaterThan(0);
    expect(titles[0]).toBeInTheDocument();
  });

  it('renders the dashboard layout', () => {
    render(<App />);
    
    // Dashboard should contain system status
    const statusTitle = screen.getByText('システム状態');
    expect(statusTitle).toBeInTheDocument();
    
    // Should show online status
    const onlineStatus = screen.getByText('● オンライン');
    expect(onlineStatus).toBeInTheDocument();
  });

  it('renders header and footer components', () => {
    render(<App />);
    
    // Header should contain navigation - use getAllByText since there are multiple instances
    const dashboardLinks = screen.getAllByText('ダッシュボード');
    expect(dashboardLinks.length).toBeGreaterThan(0);
    expect(dashboardLinks[0]).toBeInTheDocument();
    
    // Footer should contain copyright
    const copyright = screen.getByText(/© 2024 SwitchBot Dashboard/);
    expect(copyright).toBeInTheDocument();
  });
});