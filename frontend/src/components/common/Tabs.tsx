import React from 'react';
import { cn } from '../../utils/cn';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number | string;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'underline' | 'pills' | 'segmented';
  size?: 'sm' | 'md';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  activeTab,
  onChange,
  variant = 'underline',
  size = 'md',
  className = '',
}) => {
  if (variant === 'segmented') {
    return (
      <div
        className={cn(
          'inline-flex p-1 bg-gray-100 rounded-xl space-x-1 select-none',
          className
        )}
        role="tablist"
      >
        {items.map((tab) => {
          const isActive = tab.id === activeTab;
          const IconComp = tab.icon;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              disabled={tab.disabled}
              onClick={() => onChange(tab.id)}
              className={cn(
                'flex items-center gap-2 rounded-lg font-medium transition-all cursor-pointer',
                size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm',
                isActive
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900',
                tab.disabled ? 'opacity-40 cursor-not-allowed' : ''
              )}
            >
              {IconComp && <IconComp className="w-4 h-4 shrink-0" />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'text-[11px] px-1.5 py-0.2 rounded-full font-semibold',
                    isActive
                      ? 'bg-blue-50 text-[#1a5bc9]'
                      : 'bg-gray-200 text-gray-600'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'pills') {
    return (
      <div className={cn('flex items-center gap-1.5 select-none overflow-x-auto', className)} role="tablist">
        {items.map((tab) => {
          const isActive = tab.id === activeTab;
          const IconComp = tab.icon;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              disabled={tab.disabled}
              onClick={() => onChange(tab.id)}
              className={cn(
                'flex items-center gap-2 rounded-lg font-medium transition-colors cursor-pointer',
                size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm',
                isActive
                  ? 'bg-[#2c5fbf] text-white shadow-xs'
                  : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-200',
                tab.disabled ? 'opacity-40 cursor-not-allowed' : ''
              )}
            >
              {IconComp && <IconComp className="w-4 h-4 shrink-0" />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'text-[11px] px-1.5 py-0.2 rounded-full font-semibold',
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Default: underline variant
  return (
    <div className={cn('border-b border-gray-200 select-none overflow-x-auto', className)}>
      <nav className="flex space-x-6" role="tablist">
        {items.map((tab) => {
          const isActive = tab.id === activeTab;
          const IconComp = tab.icon;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              disabled={tab.disabled}
              onClick={() => onChange(tab.id)}
              className={cn(
                'flex items-center gap-2 border-b-2 font-medium transition-colors py-3 px-1 cursor-pointer whitespace-nowrap',
                size === 'sm' ? 'text-xs' : 'text-sm',
                isActive
                  ? 'border-[#2c5fbf] text-[#2c5fbf]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                tab.disabled ? 'opacity-40 cursor-not-allowed' : ''
              )}
            >
              {IconComp && <IconComp className="w-4 h-4 shrink-0" />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'text-[11px] px-2 py-0.5 rounded-full font-semibold',
                    isActive
                      ? 'bg-blue-50 text-[#1a5bc9]'
                      : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
