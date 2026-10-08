import React from 'react';
import { PackageOpen } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = '',
}) => {
  const renderIcon = () => {
    if (!icon) {
      return (
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
          <PackageOpen className="w-6 h-6" />
        </div>
      );
    }
    if (React.isValidElement(icon)) {
      return <div className="mb-3">{icon}</div>;
    }
    const IconComp = icon as React.ComponentType<{ className?: string }>;
    return (
      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-[#2c5fbf] mb-3">
        <IconComp className="w-6 h-6" />
      </div>
    );
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center max-w-md mx-auto',
        className
      )}
    >
      {renderIcon()}
      <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-gray-500 mb-5 max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
};
