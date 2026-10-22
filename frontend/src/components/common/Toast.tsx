import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

export interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const typeConfig: Record<
  ToastType,
  { icon: React.ComponentType<{ className?: string }>; bg: string; border: string; text: string; iconColor: string }
> = {
  success: {
    icon: CheckCircle2,
    bg: 'bg-white',
    border: 'border-emerald-200',
    text: 'text-gray-800',
    iconColor: 'text-emerald-500',
  },
  error: {
    icon: AlertCircle,
    bg: 'bg-white',
    border: 'border-rose-200',
    text: 'text-gray-800',
    iconColor: 'text-rose-500',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-white',
    border: 'border-amber-200',
    text: 'text-gray-800',
    iconColor: 'text-amber-500',
  },
  info: {
    icon: Info,
    bg: 'bg-white',
    border: 'border-blue-200',
    text: 'text-gray-800',
    iconColor: 'text-[#2c5fbf]',
  },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { ...toast, id };

      setToasts((prev) => [...prev, newToast]);

      const duration = toast.duration ?? 4000;
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
      return id;
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title?: string) => addToast({ type: 'success', message, title }),
    [addToast]
  );
  const error = useCallback(
    (message: string, title?: string) => addToast({ type: 'error', message, title }),
    [addToast]
  );
  const warning = useCallback(
    (message: string, title?: string) => addToast({ type: 'warning', message, title }),
    [addToast]
  );
  const info = useCallback(
    (message: string, title?: string) => addToast({ type: 'info', message, title }),
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, success, error, warning, info }}
    >
      {children}
      {/* Toast Notification Container */}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none"
        aria-live="assertive"
      >
        {toasts.map((toast) => {
          const config = typeConfig[toast.type];
          const Icon = config.icon;

          return (
            <div
              key={toast.id}
              className={cn(
                'pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg transition-all animate-in fade-in slide-in-from-bottom-3 duration-200',
                config.bg,
                config.border
              )}
            >
              <div className="shrink-0 pt-0.5">
                <Icon className={cn('w-4 h-4', config.iconColor)} />
              </div>

              <div className="flex-1">
                {toast.title && (
                  <h5 className="text-xs font-semibold text-gray-900 mb-0.5">
                    {toast.title}
                  </h5>
                )}
                <p className="text-xs text-gray-600 leading-snug">{toast.message}</p>
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 text-gray-400 hover:text-gray-700 rounded-md transition-colors"
                aria-label="Dismiss toast"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
