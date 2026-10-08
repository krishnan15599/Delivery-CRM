import React from 'react';
import { cn } from '../../utils/cn';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral';

export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  dotColor?: string;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; border: string; dot: string }> = {
  default: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-200',
    dot: 'bg-gray-400',
  },
  primary: {
    bg: 'bg-blue-50',
    text: 'text-[#1a5bc9]',
    border: 'border-blue-200',
    dot: 'bg-[#2c5fbf]',
  },
  success: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  warning: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  danger: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
  info: {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    dot: 'bg-sky-500',
  },
  neutral: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-[11px] px-2 py-0.5 gap-1 font-medium',
  md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
  lg: 'text-sm px-3 py-1.5 gap-1.5 font-medium',
};

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  dotColor,
  className = '',
  ...props
}: BadgeProps) => {
  const styles = variantStyles[variant] || variantStyles.default;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border transition-colors select-none',
        styles.bg,
        styles.text,
        styles.border,
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColor || styles.dot)}
        />
      )}
      {children}
    </span>
  );
};
