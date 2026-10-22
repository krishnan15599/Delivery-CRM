import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 select-none disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer';

    const variants = {
      primary: 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white focus:ring-indigo-500/40 shadow-sm',
      secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 focus:ring-slate-300',
      outline: 'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 focus:ring-indigo-200',
      ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:ring-slate-200',
      danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-300 shadow-sm',
      success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-300 shadow-sm',
    };

    const sizes = {
      xs: 'text-xs px-2.5 py-1.5 gap-1.5',
      sm: 'text-xs px-3 py-2 gap-1.5',
      md: 'text-sm px-4 py-2.5 gap-2',
      lg: 'text-base px-5 py-3 gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
