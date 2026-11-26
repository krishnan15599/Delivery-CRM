import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[];
  placeholder?: string;
  error?: boolean | string;
  leftIcon?: React.ReactNode;
  wrapperClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className = '', wrapperClassName = 'w-full', options, placeholder, error, leftIcon, children, ...props },
    ref
  ) => {
    return (
      <div className={cn('relative flex items-center', wrapperClassName)}>
        {leftIcon && (
          <div className="absolute left-3 flex items-center pointer-events-none text-slate-400">
            {leftIcon}
          </div>
        )}
        <select
          ref={ref}
          className={cn(
            'w-full appearance-none bg-white border border-slate-200 rounded-lg text-sm text-slate-900 transition-colors cursor-pointer',
            'focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15',
            'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
            leftIcon ? 'pl-9' : 'pl-3.5',
            'pr-9 py-2',
            error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/15' : '',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
      </div>
    );
  }
);

Select.displayName = 'Select';
