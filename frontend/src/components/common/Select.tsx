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
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', options, placeholder, error, leftIcon, children, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div className="absolute left-3 flex items-center pointer-events-none text-gray-400">
            {leftIcon}
          </div>
        )}
        <select
          ref={ref}
          className={cn(
            'w-full appearance-none bg-white border border-gray-200 rounded-lg text-sm text-gray-900 transition-colors cursor-pointer',
            'focus:outline-none focus:border-[#2c5fbf] focus:ring-2 focus:ring-[#2c5fbf]/15',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
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
        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 pointer-events-none" />
      </div>
    );
  }
);

Select.displayName = 'Select';
