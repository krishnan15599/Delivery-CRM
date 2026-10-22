import React, { useState } from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  const [internalLoading, setInternalLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setInternalLoading(true);
      await onConfirm();
    } finally {
      setInternalLoading(false);
    }
  };

  const loadingState = isLoading || internalLoading;

  const iconVariants = {
    danger: {
      bg: 'bg-rose-50 text-rose-600',
      icon: AlertTriangle,
      btnVariant: 'danger' as const,
    },
    warning: {
      bg: 'bg-amber-50 text-amber-600',
      icon: AlertCircle,
      btnVariant: 'primary' as const,
    },
    primary: {
      bg: 'bg-blue-50 text-[#2c5fbf]',
      icon: Info,
      btnVariant: 'primary' as const,
    },
  };

  const currentVariant = iconVariants[variant] || iconVariants.danger;
  const IconComp = currentVariant.icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      size="sm"
      closeOnOverlayClick={!loadingState}
      closeOnEsc={!loadingState}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loadingState}
            onClick={onCancel}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={currentVariant.btnVariant}
            size="sm"
            isLoading={loadingState}
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl shrink-0 ${currentVariant.bg}`}>
          <IconComp className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-base font-bold text-gray-900 mb-1">{title}</h4>
          <div className="text-xs text-gray-600 leading-relaxed">{message}</div>
        </div>
      </div>
    </Modal>
  );
};
