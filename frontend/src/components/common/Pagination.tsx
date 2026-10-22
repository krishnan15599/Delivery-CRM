import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
  className = '',
}) => {
  if (totalPages <= 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : currentPage * pageSize;

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 border-t border-gray-100 text-xs text-gray-600',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {totalItems !== undefined ? (
          <span>
            Showing <strong className="font-semibold text-gray-800">{startItem}</strong> to{' '}
            <strong className="font-semibold text-gray-800">{endItem}</strong> of{' '}
            <strong className="font-semibold text-gray-800">{totalItems}</strong> entries
          </span>
        ) : (
          <span>
            Page <strong className="font-semibold text-gray-800">{currentPage}</strong> of{' '}
            <strong className="font-semibold text-gray-800">{totalPages}</strong>
          </span>
        )}

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-2">
            <span>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-white border border-gray-200 rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#2c5fbf]"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="First page"
          type="button"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Previous page"
          type="button"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center space-x-1 px-1">
          {getPageNumbers().map((p, idx) =>
            typeof p === 'number' ? (
              <button
                key={idx}
                type="button"
                onClick={() => onPageChange(p)}
                className={cn(
                  'w-7 h-7 text-xs rounded font-medium transition-colors flex items-center justify-center',
                  p === currentPage
                    ? 'bg-[#2c5fbf] text-white'
                    : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
                )}
              >
                {p}
              </button>
            ) : (
              <span key={idx} className="px-1 text-gray-400">
                {p}
              </span>
            )
          )}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Next page"
          type="button"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Last page"
          type="button"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
