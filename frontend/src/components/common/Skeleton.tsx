import React from 'react';
import { cn } from '../../utils/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  circle?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  circle = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200/80',
        circle ? 'rounded-full' : 'rounded-md',
        className
      )}
      {...props}
    />
  );
};

export interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  columns = 5,
  className = '',
}) => {
  return (
    <div className={cn('w-full border border-gray-100 rounded-xl overflow-hidden bg-white', className)}>
      <div className="bg-gray-50/70 p-4 border-b border-gray-100 flex items-center justify-between gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1 max-w-[120px]" />
        ))}
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="p-4 flex items-center justify-between gap-4">
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton
                key={c}
                className={cn('h-4 flex-1', c === 0 ? 'max-w-[140px]' : 'max-w-[100px]')}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export interface SkeletonCardProps {
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ className = '' }) => {
  return (
    <div className={cn('bg-white p-5 rounded-xl border border-gray-100 shadow-sm', className)}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
      <Skeleton className="h-7 w-36 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
};
