import React from 'react';
import { AlertCircle, HelpCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  error?: string | boolean;
  helperText?: string;
  tooltip?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  required = false,
  error,
  helperText,
  tooltip,
  children,
  className = '',
}) => {
  const hasError = Boolean(error);
  const errorMessage = typeof error === 'string' ? error : undefined;

  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label
            htmlFor={htmlFor}
            className="flex items-center gap-1 text-xs font-semibold text-gray-700 select-none"
          >
            <span>{label}</span>
            {required && <span className="text-rose-500 font-bold">*</span>}
            {tooltip && (
              <span
                className="text-gray-400 hover:text-gray-600 cursor-help"
                title={tooltip}
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </span>
            )}
          </label>
        </div>
      )}

      {children}

      {hasError && errorMessage ? (
        <div className="flex items-center gap-1 text-xs text-rose-600 mt-0.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      ) : helperText ? (
        <p className="text-xs text-gray-500 mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
};
