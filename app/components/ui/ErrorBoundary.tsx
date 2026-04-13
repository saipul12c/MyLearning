"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="card max-w-md w-full p-8 text-center border-red-500/20 bg-red-500/5 backdrop-blur-xl animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500">
              <AlertCircle size={32} />
            </div>
            
            <h2 className="text-2xl font-black text-white mb-3 tracking-tight">Ups! Terjadi Kesalahan</h2>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              Sesuatu tidak berjalan semestinya di bagian ini. Kami telah mencatat masalah ini untuk segera diperbaiki.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="btn-primary w-full flex items-center justify-center gap-2 !py-3 font-bold uppercase tracking-widest text-xs"
              >
                <RefreshCcw size={16} /> Coba Muat Ulang
              </button>
              
              <button
                onClick={() => window.location.href = "/dashboard"}
                className="btn-secondary w-full flex items-center justify-center gap-2 !py-3 font-bold uppercase tracking-widest text-xs"
              >
                <Home size={16} /> Kembali ke Dashboard
              </button>
            </div>
            
            {process.env.NODE_ENV === "development" && (
                <div className="mt-8 pt-6 border-t border-white/5 text-left">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Error Detail (Dev Mode Only):</p>
                    <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-[10px] font-mono text-red-400 overflow-x-auto whitespace-pre">
                        {this.state.error?.message}
                    </div>
                </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
