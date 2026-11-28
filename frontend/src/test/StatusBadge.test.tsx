import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../components/common/StatusBadge';

describe('StatusBadge Component', () => {
  it('renders Delivered status badge correctly', () => {
    render(<StatusBadge status="Delivered" />);
    expect(screen.getByText('Delivered')).toBeInTheDocument();
  });

  it('renders Out for Delivery badge with correct status label', () => {
    render(<StatusBadge status="Out for Delivery" />);
    expect(screen.getByText('Out for Delivery')).toBeInTheDocument();
  });

  it('renders Pending badge', () => {
    render(<StatusBadge status="Pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });
});
