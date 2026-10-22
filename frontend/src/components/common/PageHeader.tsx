import React from 'react';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  showBack = false,
  onBack,
  className = '',
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={cn('mb-6 flex flex-col gap-2', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center space-x-1.5 text-xs text-slate-500 mb-1">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={idx}>
                {crumb.path && !isLast ? (
                  <Link
                    to={crumb.path}
                    className="hover:text-indigo-600 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={isLast ? 'font-medium text-slate-800' : ''}>
                    {crumb.label}
                  </span>
                )}
                {!isLast && (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={handleBack}
              type="button"
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-slate-500 mt-1.5">{subtitle}</p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center flex-wrap gap-2.5 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
