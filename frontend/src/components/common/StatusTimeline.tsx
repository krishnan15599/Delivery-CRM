import React from 'react';
import { CheckCircle2, Clock, AlertCircle, Circle } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface TimelineEvent {
  id: string | number;
  title: string;
  description?: string;
  timestamp: string | Date;
  status?: 'completed' | 'current' | 'upcoming' | 'failed';
  actor?: string;
  icon?: React.ReactNode;
}

export interface StatusTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

const formatEventDate = (dateVal: string | Date): string => {
  if (!dateVal) return '';
  if (typeof dateVal === 'string') return dateVal;
  return dateVal.toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const StatusTimeline: React.FC<StatusTimelineProps> = ({
  events,
  className = '',
}) => {
  return (
    <div className={cn('relative pl-4 space-y-6', className)}>
      {events.map((event, idx) => {
        const isLast = idx === events.length - 1;
        const status = event.status || 'completed';

        let iconColor = 'text-emerald-600 bg-emerald-50 ring-4 ring-emerald-50';
        let defaultIcon = <CheckCircle2 className="w-4 h-4" />;

        if (status === 'current') {
          iconColor = 'text-[#2c5fbf] bg-blue-50 ring-4 ring-blue-50';
          defaultIcon = <Clock className="w-4 h-4" />;
        } else if (status === 'failed') {
          iconColor = 'text-rose-600 bg-rose-50 ring-4 ring-rose-50';
          defaultIcon = <AlertCircle className="w-4 h-4" />;
        } else if (status === 'upcoming') {
          iconColor = 'text-gray-400 bg-gray-50 ring-4 ring-gray-50';
          defaultIcon = <Circle className="w-4 h-4" />;
        }

        return (
          <div key={event.id ?? idx} className="relative flex items-start gap-3.5 group">
            {/* Connecting line */}
            {!isLast && (
              <span
                className={cn(
                  'absolute left-3.5 top-6 bottom-[-24px] w-0.5',
                  status === 'completed' ? 'bg-emerald-200' : 'bg-gray-200'
                )}
                aria-hidden="true"
              />
            )}

            {/* Icon Node */}
            <div
              className={cn(
                'relative z-10 w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-105',
                iconColor
              )}
            >
              {event.icon || defaultIcon}
            </div>

            {/* Content Details */}
            <div className="flex-1 pt-0.5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <h4 className="text-xs font-semibold text-gray-900">{event.title}</h4>
                <time className="text-[11px] text-gray-400 font-mono">
                  {formatEventDate(event.timestamp)}
                </time>
              </div>

              {event.description && (
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  {event.description}
                </p>
              )}

              {event.actor && (
                <span className="inline-block mt-1 text-[11px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                  {event.actor}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
