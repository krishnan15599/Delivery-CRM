import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../utils/cn';

export type StatCardColor = 'blue' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple' | 'cyan';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: {
    value: string | number;
    isPositive?: boolean | null; // null for neutral
    period?: string;
  };
  subtitle?: string;
  color?: StatCardColor;
  className?: string;
  loading?: boolean;
  onClick?: () => void;
}

const colorStyles: Record<
  StatCardColor,
  { bg: string; iconBg: string; iconColor: string; badge: string; textBadge: string }
> = {
  blue: {
    bg: 'hover:border-blue-300',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    badge: 'bg-blue-50 border-blue-200',
    textBadge: 'text-blue-700',
  },
  indigo: {
    bg: 'hover:border-indigo-300',
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    badge: 'bg-indigo-50 border-indigo-200',
    textBadge: 'text-indigo-700',
  },
  emerald: {
    bg: 'hover:border-green-300',
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
    badge: 'bg-green-50 border-green-200',
    textBadge: 'text-green-700',
  },
  amber: {
    bg: 'hover:border-amber-300',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    badge: 'bg-amber-50 border-amber-200',
    textBadge: 'text-amber-700',
  },
  rose: {
    bg: 'hover:border-red-300',
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
    badge: 'bg-red-50 border-red-200',
    textBadge: 'text-red-700',
  },
  purple: {
    bg: 'hover:border-indigo-300',
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    badge: 'bg-indigo-50 border-indigo-200',
    textBadge: 'text-indigo-700',
  },
  cyan: {
    bg: 'hover:border-blue-300',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    badge: 'bg-blue-50 border-blue-200',
    textBadge: 'text-blue-700',
  },
};

export const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  color = 'blue',
  className = '',
  loading = false,
  onClick,
}: StatCardProps) => {
  const styles = colorStyles[color] || colorStyles.blue;

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="h-3 bg-slate-200 rounded w-24"></div>
          <div className="w-10 h-10 rounded-xl bg-slate-200"></div>
        </div>
        <div className="h-7 bg-slate-200 rounded w-32 mb-2"></div>
        <div className="h-3 bg-slate-200 rounded w-20"></div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl p-5 border border-slate-200 shadow-sm transition-all',
        styles.bg,
        onClick ? 'cursor-pointer hover:shadow-md active:scale-[0.99]' : '',
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className={cn('p-2.5 rounded-xl', styles.iconBg, styles.iconColor)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between mt-1">
        <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
        {trend && (
          <div
            className={cn(
              'flex items-center text-xs font-medium px-2 py-0.5 rounded-md border',
              trend.isPositive === true
                ? 'bg-green-50 text-green-700 border-green-200'
                : trend.isPositive === false
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-slate-50 text-slate-600 border-slate-200'
            )}
          >
            {trend.isPositive === true ? (
              <TrendingUp className="w-3 h-3 mr-1" />
            ) : trend.isPositive === false ? (
              <TrendingDown className="w-3 h-3 mr-1" />
            ) : (
              <Minus className="w-3 h-3 mr-1" />
            )}
            {trend.value}
          </div>
        )}
      </div>

      {(subtitle || trend?.period) && (
        <p className="text-xs text-slate-400 mt-2 truncate">
          {subtitle || trend?.period}
        </p>
      )}
    </div>
  );
};
