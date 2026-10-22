import React from 'react';
import { Badge, type BadgeSize } from './Badge';

export type DeliveryStatus =
  | 'Pending'
  | 'Assigned'
  | 'In Transit'
  | 'Delivered'
  | 'Failed'
  | 'Returned'
  | 'Unassigned'
  | 'Paid'
  | 'Unpaid'
  | 'Active'
  | 'Inactive'
  | string;

export interface StatusBadgeProps {
  status: DeliveryStatus;
  size?: BadgeSize;
  className?: string;
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className = '',
  showDot = true,
}) => {
  const normalized = (status || '').toLowerCase().replace(/[_-]/g, ' ').trim();

  let variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' =
    'default';
  let label = status;

  switch (normalized) {
    case 'delivered':
    case 'completed':
    case 'paid':
    case 'active':
      variant = 'success';
      label = normalized === 'delivered' ? 'Delivered' : normalized === 'paid' ? 'Paid' : 'Active';
      break;

    case 'in transit':
    case 'intransit':
    case 'in progress':
      variant = 'primary';
      label = 'In Transit';
      break;

    case 'pending':
    case 'unpaid':
    case 'awaiting':
      variant = 'warning';
      label = normalized === 'pending' ? 'Pending' : 'Unpaid';
      break;

    case 'assigned':
      variant = 'info';
      label = 'Assigned';
      break;

    case 'failed':
    case 'cancelled':
    case 'rejected':
      variant = 'danger';
      label = normalized === 'failed' ? 'Failed' : 'Cancelled';
      break;

    case 'returned':
    case 'return':
      variant = 'danger';
      label = 'Returned';
      break;

    case 'unassigned':
    case 'inactive':
      variant = 'neutral';
      label = normalized === 'unassigned' ? 'Unassigned' : 'Inactive';
      break;

    default:
      variant = 'default';
      label = status;
      break;
  }

  return (
    <Badge variant={variant} size={size} dot={showDot} className={className}>
      {label}
    </Badge>
  );
};
