import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onCancel]);

  useEffect(() => {
    if (open && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  const variantStyles = {
    danger: {
      icon: <AlertTriangle size={20} className="text-red-500" />,
      bg: 'bg-red-50',
      border: 'border-red-200',
      btn: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      icon: <AlertTriangle size={20} className="text-amber-500" />,
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      btn: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
    info: {
      icon: <AlertTriangle size={20} className="text-blue-500" />,
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      btn: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  };

  const style = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message">
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 outline-none"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${style.bg} ${style.border} border`}>
              {style.icon}
            </div>
            <div>
              <h2 id="confirm-title" className="text-lg font-semibold text-slate-900">{title}</h2>
              <p id="confirm-message" className="text-sm text-slate-500 mt-1">{message}</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${style.btn}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
