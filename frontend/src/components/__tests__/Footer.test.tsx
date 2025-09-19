import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Footer from '../Footer';

describe('Footer', () => {
  it('renders copyright information', () => {
    render(<Footer />);
    expect(screen.getByText('© 2024 SwitchBot Dashboard')).toBeInTheDocument();
  });

  it('renders technology stack information', () => {
    render(<Footer />);
    expect(screen.getByText('Built with React + TypeScript + Tailwind CSS')).toBeInTheDocument();
  });

  it('renders version information', () => {
    render(<Footer />);
    expect(screen.getByText('Version 1.0.0')).toBeInTheDocument();
  });

  it('renders status indicators', () => {
    render(<Footer />);
    expect(screen.getByText('フロントエンド')).toBeInTheDocument();
    expect(screen.getByText('バックエンド')).toBeInTheDocument();
    expect(screen.getByText('SwitchBot API')).toBeInTheDocument();
  });

  it('renders current date', () => {
    render(<Footer />);
    const currentDate = new Date().toLocaleDateString('ja-JP');
    expect(screen.getByText(`最終更新: ${currentDate}`)).toBeInTheDocument();
  });
});