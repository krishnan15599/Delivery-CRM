import React from 'react';
import { Link } from 'react-router-dom';
import type { Conversation } from '../../../../types/chat';

export interface DeliveryContextBarProps {
  conversation: Conversation;
}

const getStatusBadgeClasses = (status?: string): string => {
  const s = (status || '').toLowerCase();
  if (s.includes('delivered') || s.includes('completed')) {
    return 'bg-[#DDF3E7] text-[#1E8E5A]';
  }
  if (s.includes('fail') || s.includes('cancel')) {
    return 'bg-[#FADFDF] text-[#C23B3B]';
  }
  if (s.includes('await') || s.includes('pend')) {
    return 'bg-[#FCEFCF] text-[#A66A00]';
  }
  return 'bg-[#E0EAFB] text-[#2563C9]';
};

export const DeliveryContextBar: React.FC<DeliveryContextBarProps> = ({ conversation }) => {
  if (!conversation.relatedDeliveryTracking) {
    return null;
  }

  const statusLabel = conversation.deliveryStatus || 'Out for delivery';
  const orderLink = conversation.relatedDeliveryId
    ? `/deliveries/${conversation.relatedDeliveryId}`
    : '/deliveries';

  return (
    <div className="flex items-center gap-2.5 px-3.5 sm:px-5 py-2 bg-white border-b border-[#DDE5E3] text-[13px] flex-wrap shrink-0">
      <b className="text-[#10201F] font-semibold">
        {conversation.relatedDeliveryTracking}
      </b>

      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${getStatusBadgeClasses(
          statusLabel
        )}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        {statusLabel}
      </span>

      {typeof conversation.codAmount === 'number' && (
        <span className="text-[#5E716F]">
          To collect:{' '}
          {conversation.codAmount > 0
            ? `₹${conversation.codAmount.toLocaleString('en-IN')}`
            : 'Prepaid'}
        </span>
      )}

      <Link
        to={orderLink}
        className="ml-auto text-[#2563C9] font-semibold hover:underline"
      >
        View order
      </Link>
    </div>
  );
};
