"use client";

import { X, AlertTriangle, Loader2 } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  variant?: "danger" | "warning" | "info";
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel = "Batal",
  onConfirm,
  onCancel,
  isLoading = false,
  variant = "danger",
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const variantColors = {
    danger: "text-red-400 bg-red-500/10 border-red-500/20",
    warning: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    info: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  };

  const buttonColors = {
    danger: "bg-gradient-to-r from-red-600 to-rose-500 hover:shadow-red-500/20",
    warning: "bg-gradient-to-r from-amber-600 to-orange-500 hover:shadow-amber-500/20",
    info: "bg-gradient-to-r from-blue-600 to-indigo-500 hover:shadow-blue-500/20",
  };

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300"
      onClick={onCancel}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      {/* Modal */}
      <div 
        className="relative bg-[#0f0f1a] rounded-2xl border border-white/10 max-w-md w-full overflow-hidden shadow-2xl scale-in-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header decoration */}
        <div className={`h-1 w-full ${variant === 'danger' ? 'bg-red-500' : variant === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
        
        <div className="p-8">
          <div className="flex flex-col items-center text-center">
            {/* Icon */}
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border ${variantColors[variant]}`}>
              <AlertTriangle size={32} />
            </div>

            {/* Content */}
            <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              {message}
            </p>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 w-full">
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-semibold text-sm hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={`px-6 py-3 rounded-xl text-white font-bold text-sm shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${buttonColors[variant]} disabled:opacity-70`}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Menunggu...
                  </>
                ) : (
                  confirmLabel
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white rounded-lg transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
