import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../components/common/StatusBadge';

describe('StatusBadge Component', () => {
  it('renders Delivered status badge correctly', () => {
    render(<StatusBadge status="Delivered" />);
    expect(screen.getByText('Delivered')).toBeInTheDocument();
  });

  it('renders In Transit badge with correct status label', () => {
    render(<StatusBadge status="In Transit" />);
    expect(screen.getByText('In Transit')).toBeInTheDocument();
  });

  it('renders Pending badge', () => {
    render(<StatusBadge status="Pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });
});
