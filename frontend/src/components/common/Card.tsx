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
        'bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all',
        hoverable ? 'hover:shadow-md hover:border-slate-300' : '',
        className
      )}
      {...props}
    >
      {hasHeader && (
        <div
          className={cn(
            'px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4',
            headerClassName
          )}
        >
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-slate-900 leading-snug">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
        </div>
      )}

      <div className={cn('p-5', bodyClassName)}>{children}</div>

      {footer && (
        <div
          className={cn(
            'px-5 py-3 bg-slate-50/70 border-t border-slate-200 text-xs text-slate-500',
            footerClassName
          )}
        >
          {footer}
        </div>
      )}
    </div>
  );
};
