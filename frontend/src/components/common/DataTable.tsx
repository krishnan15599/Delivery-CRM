import React, { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Pagination } from './Pagination';
import { EmptyState } from './EmptyState';
import { SkeletonTable } from './Skeleton';
import { cn } from '../../utils/cn';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowKey?: keyof T | ((row: T) => string | number);
  loading?: boolean;
  emptyText?: string;
  emptyState?: React.ReactNode;
  // Selection
  selectable?: boolean;
  selectedKeys?: (string | number)[];
  onSelectionChange?: (selectedKeys: (string | number)[], selectedRows: T[]) => void;
  bulkActions?: React.ReactNode;
  // Sorting
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  // Pagination
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems?: number;
    pageSize?: number;
    pageSizeOptions?: number[];
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
  };
  // Interaction
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  rowKey = 'id',
  loading = false,
  emptyText = 'No data available',
  emptyState,
  selectable = false,
  selectedKeys: controlledSelectedKeys,
  onSelectionChange,
  bulkActions,
  sortColumn: controlledSortColumn,
  sortDirection: controlledSortDirection,
  onSort,
  pagination,
  onRowClick,
  className = '',
}: DataTableProps<T>) {
  // Local sorting if uncontrolled
  const [internalSortColumn, setInternalSortColumn] = useState<string | undefined>(
    controlledSortColumn
  );
  const [internalSortDir, setInternalSortDir] = useState<'asc' | 'desc'>('asc');

  // Local selection if uncontrolled
  const [internalSelectedKeys, setInternalSelectedKeys] = useState<(string | number)[]>([]);

  const isControlledSelection = controlledSelectedKeys !== undefined;
  const currentSelectedKeys = isControlledSelection
    ? controlledSelectedKeys
    : internalSelectedKeys;

  const currentSortCol = controlledSortColumn ?? internalSortColumn;
  const currentSortDir = controlledSortDirection ?? internalSortDir;

  const getRowId = React.useCallback(
    (row: T): string | number => {
      if (typeof rowKey === 'function') {
        return rowKey(row);
      }
      return row[rowKey];
    },
    [rowKey]
  );

  const handleSort = (colKey: string) => {
    let nextDir: 'asc' | 'desc' = 'asc';
    if (currentSortCol === colKey) {
      nextDir = currentSortDir === 'asc' ? 'desc' : 'asc';
    }

    if (onSort) {
      onSort(colKey, nextDir);
    } else {
      setInternalSortColumn(colKey);
      setInternalSortDir(nextDir);
    }
  };

  // Sort data client-side if uncontrolled onSort
  const sortedData = useMemo(() => {
    if (onSort || !currentSortCol) return data;

    return [...data].sort((a, b) => {
      const valA = a[currentSortCol];
      const valB = b[currentSortCol];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return currentSortDir === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (currentSortDir === 'asc') {
        return strA.localeCompare(strB);
      }
      return strB.localeCompare(strA);
    });
  }, [data, currentSortCol, currentSortDir, onSort]);

  // Selection handlers
  const allRowKeys = useMemo(() => sortedData.map(getRowId), [sortedData, getRowId]);
  const isAllSelected =
    allRowKeys.length > 0 && allRowKeys.every((key) => currentSelectedKeys.includes(key));
  const isSomeSelected =
    currentSelectedKeys.length > 0 &&
    currentSelectedKeys.some((key) => allRowKeys.includes(key)) &&
    !isAllSelected;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    let newSelected: (string | number)[] = [];

    if (checked) {
      newSelected = Array.from(new Set([...currentSelectedKeys, ...allRowKeys]));
    } else {
      newSelected = currentSelectedKeys.filter((k) => !allRowKeys.includes(k));
    }

    if (!isControlledSelection) {
      setInternalSelectedKeys(newSelected);
    }
    const selectedRows = sortedData.filter((row) => newSelected.includes(getRowId(row)));
    onSelectionChange?.(newSelected, selectedRows);
  };

  const handleSelectRow = (e: React.MouseEvent, row: T) => {
    e.stopPropagation();
    const id = getRowId(row);
    let newSelected: (string | number)[] = [];

    if (currentSelectedKeys.includes(id)) {
      newSelected = currentSelectedKeys.filter((k) => k !== id);
    } else {
      newSelected = [...currentSelectedKeys, id];
    }

    if (!isControlledSelection) {
      setInternalSelectedKeys(newSelected);
    }
    const selectedRows = sortedData.filter((r) => newSelected.includes(getRowId(r)));
    onSelectionChange?.(newSelected, selectedRows);
  };

  if (loading) {
    return (
      <SkeletonTable
        rows={pagination?.pageSize || 6}
        columns={columns.length + (selectable ? 1 : 0)}
        className={className}
      />
    );
  }

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col',
        className
      )}
    >
      {/* Bulk action toolbar when items are selected */}
      {selectable && currentSelectedKeys.length > 0 && (
        <div className="bg-indigo-50/80 px-5 py-2.5 border-b border-indigo-100 flex items-center justify-between transition-all">
          <span className="text-xs font-semibold text-indigo-700">
            {currentSelectedKeys.length} {currentSelectedKeys.length === 1 ? 'item' : 'items'} selected
          </span>
          {bulkActions && <div className="flex items-center gap-2">{bulkActions}</div>}
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50/70 text-xs font-semibold uppercase text-slate-500 tracking-wide select-none border-b border-slate-200">
            <tr>
              {selectable && (
                <th className="w-12 px-4 py-3.5 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected;
                    }}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-600 cursor-pointer"
                  />
                </th>
              )}

              {columns.map((col) => {
                const alignClass =
                  col.align === 'center'
                    ? 'text-center'
                    : col.align === 'right'
                    ? 'text-right'
                    : 'text-left';

                return (
                  <th
                    key={col.key}
                    style={{ width: col.width }}
                    className={cn(
                      'px-5 py-3.5 font-semibold text-slate-500',
                      alignClass,
                      col.sortable ? 'cursor-pointer hover:bg-slate-100/70 transition-colors' : '',
                      col.className
                    )}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div
                      className={cn(
                        'flex items-center gap-1.5',
                        col.align === 'center'
                          ? 'justify-center'
                          : col.align === 'right'
                          ? 'justify-end'
                          : 'justify-start'
                      )}
                    >
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-slate-400">
                          {currentSortCol === col.key ? (
                            currentSortDir === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {sortedData.length > 0 ? (
              sortedData.map((row, rowIdx) => {
                const id = getRowId(row);
                const isSelected = currentSelectedKeys.includes(id);

                return (
                  <tr
                    key={id ?? rowIdx}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      'transition-colors',
                      isSelected ? 'bg-indigo-50/40 hover:bg-indigo-50/60' : 'hover:bg-slate-50/70',
                      onRowClick ? 'cursor-pointer' : ''
                    )}
                  >
                    {selectable && (
                      <td
                        className="w-12 px-4 py-3.5 text-center"
                        onClick={(e) => handleSelectRow(e, row)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // handled by click
                          className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-600 cursor-pointer"
                        />
                      </td>
                    )}

                    {columns.map((col) => {
                      const alignClass =
                        col.align === 'center'
                          ? 'text-center'
                          : col.align === 'right'
                          ? 'text-right'
                          : 'text-left';

                      return (
                        <td
                          key={col.key}
                          className={cn('px-5 py-3.5 text-slate-700', alignClass, col.className)}
                        >
                          {col.render ? col.render(row, rowIdx) : row[col.key]}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="py-8"
                >
                  {emptyState || <EmptyState title={emptyText} />}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
          pageSizeOptions={pagination.pageSizeOptions}
          onPageChange={pagination.onPageChange}
          onPageSizeChange={pagination.onPageSizeChange}
        />
      )}
    </div>
  );
}
