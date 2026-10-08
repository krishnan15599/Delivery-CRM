import React from 'react';
import { Filter, X, RotateCcw } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ActiveFilter {
  id: string;
  label: string;
  value: string;
}

export interface FilterBarProps {
  children?: React.ReactNode;
  activeFilters?: ActiveFilter[];
  onRemoveFilter?: (id: string) => void;
  onClearAll?: () => void;
  actions?: React.ReactNode;
  className?: string;
  totalResults?: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  children,
  activeFilters = [],
  onRemoveFilter,
  onClearAll,
  actions,
  className = '',
  totalResults,
}) => {
  const hasActiveFilters = activeFilters.length > 0;

  return (
    <div className={cn('flex flex-col gap-3 mb-4', className)}>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Left side: Search and filters */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mr-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>
          {children}
        </div>

        {/* Right side: Actions / Total count */}
        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
          {totalResults !== undefined && (
            <span className="text-xs text-gray-500 hidden md:inline-block">
              Total: <strong className="font-semibold text-gray-800">{totalResults}</strong>
            </span>
          )}
          {actions}
        </div>
      </div>

      {/* Active filter badges / chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-500">Active filters:</span>
          {activeFilters.map((filter) => (
            <span
              key={filter.id}
              className="inline-flex items-center gap-1.5 bg-blue-50 text-[#1a5bc9] border border-blue-100 text-xs px-2.5 py-1 rounded-md"
            >
              <span className="font-medium text-blue-900">{filter.label}:</span>
              <span>{filter.value}</span>
              {onRemoveFilter && (
                <button
                  type="button"
                  onClick={() => onRemoveFilter(filter.id)}
                  className="hover:bg-blue-100 p-0.5 rounded transition-colors text-blue-600"
                  title="Remove filter"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}

          {onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors ml-2"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
