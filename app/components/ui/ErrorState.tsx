"use client";

import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showHome?: boolean;
}

export default function ErrorState({
  title = "Terjadi Gangguan",
  message = "Gagal memuat data dari server. Silakan coba beberapa saat lagi.",
  onRetry,
  showHome = true
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-500">
      <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 shadow-2xl shadow-red-500/10">
        <AlertTriangle className="text-red-500" size={32} />
      </div>
      
      <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">
        {title}
      </h2>
      
      <p className="text-slate-400 max-w-md mx-auto mb-10 leading-relaxed">
        {message}
      </p>
      
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn-primary !px-8 flex items-center gap-2"
          >
            <RefreshCcw size={18} />
            Coba Lagi
          </button>
        )}
        
        {showHome && (
          <Link
            href="/dashboard"
            className="btn-secondary !px-8 flex items-center gap-2"
          >
            <Home size={18} />
            Kembali ke Beranda
          </Link>
        )}
      </div>
    </div>
  );
}
