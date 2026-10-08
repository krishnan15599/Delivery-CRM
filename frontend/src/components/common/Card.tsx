import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  bodyClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
  hoverable?: boolean;
}

export const Card = ({
  title,
  subtitle,
  action,
  footer,
  className = '',
  bodyClassName = '',
  headerClassName = '',
  footerClassName = '',
  hoverable = false,
  children,
  ...props
}: CardProps) => {
  const hasHeader = title || subtitle || action;

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden transition-all',
        hoverable ? 'hover:shadow-md hover:border-gray-200' : '',
        className
      )}
      {...props}
    >
      {hasHeader && (
        <div
          className={cn(
            'px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4',
            headerClassName
          )}
        >
          <div>
            {title && (
              <h3 className="text-base font-semibold text-gray-900 leading-snug">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
        </div>
      )}

      <div className={cn('p-6', bodyClassName)}>{children}</div>

      {footer && (
        <div
          className={cn(
            'px-6 py-3 bg-gray-50/70 border-t border-gray-100 text-xs text-gray-500',
            footerClassName
          )}
        >
          {footer}
        </div>
      )}
    </div>
  );
};
