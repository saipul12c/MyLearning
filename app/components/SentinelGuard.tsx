"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthContext";
import { getPublicSentinelConfigs } from "@/lib/sentinel/actions";
import { SentinelState } from "@/lib/sentinel/types";
import { AlertOctagon, Lock, RefreshCcw } from "lucide-react";

export default function SentinelGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [state, setState] = useState<SentinelState | null>(() => {
    if (typeof window !== 'undefined') {
      const cached = window.sessionStorage.getItem('sentinel_state');
      const lastCheck = window.sessionStorage.getItem('sentinel_last_check');
      const now = Date.now();
      if (cached && lastCheck && (now - parseInt(lastCheck)) < 300000) { // 5 minutes cache
        try { 
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === 'object') return parsed;
        } catch (e) { 
          window.sessionStorage.removeItem('sentinel_state');
          return null; 
        }
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(!state);

  const isPublicPage = pathname.startsWith('/security-check') || 
                       pathname.startsWith('/maintenance') || 
                       pathname.startsWith('/login');

  useEffect(() => {
    async function checkSentinel() {
      if (typeof window === 'undefined') return;

      const now = Date.now();
      const CACHE_KEY = 'sentinel_state';
      const TIME_KEY = 'sentinel_last_check';
      const FIVE_MINUTES = 5 * 60 * 1000;

      const cached = window.sessionStorage.getItem(CACHE_KEY);
      const lastCheck = window.sessionStorage.getItem(TIME_KEY);

      const hasValidCache = cached && lastCheck && (now - parseInt(lastCheck)) < FIVE_MINUTES;

      if (hasValidCache) {
        setState(JSON.parse(cached));
        setLoading(false);
        
        // Background revalidation (silent)
        getPublicSentinelConfigs().then(configs => {
          setState(configs);
          window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(configs));
          window.sessionStorage.setItem(TIME_KEY, Date.now().toString());
        }).catch(() => {});
        
        return;
      }

      // Standard fetch with 5-second TIMEOUT to prevent hanging
      try {
        const fetchPromise = getPublicSentinelConfigs();
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error("Timeout")), 5000)
        );

        const configs = await Promise.race([fetchPromise, timeoutPromise]);
        
        setState(configs);
        window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(configs));
        window.sessionStorage.setItem(TIME_KEY, now.toString());
      } catch (error) {
        console.error("Sentinel Check Failed or Timed out:", error);
        // Fail-safe: Use old cache or default empty state
        if (cached) setState(JSON.parse(cached));
      } finally {
        setLoading(false);
      }
    }

    checkSentinel();
  }, [pathname]);

  // Bypass for Admin users or Public Pages (Challenge, Maintenance, Login)
  const isAdmin = user?.role === 'admin';

  if (loading && !isAdmin && !isPublicPage) {
    return (
      <div className="fixed inset-0 bg-[#050505] z-[9999] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
          <RefreshCcw className="w-10 h-10 text-blue-500 animate-spin relative z-10" />
        </div>
        <p className="text-slate-500 text-[10px] font-bold tracking-[0.3em] uppercase mt-6 animate-pulse">Securing Connection...</p>
      </div>
    );
  }

  // Maintenance Mode Logic
  if (state?.maintenance_mode === true && !isAdmin && !pathname.startsWith('/login')) {
    return (
      <div className="fixed inset-0 bg-[#050505] z-[9999] flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="max-w-md w-full glass-strong rounded-[2.5rem] p-10 text-center border border-white/10 relative z-10">
          <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mx-auto mb-8 animate-pulse">
            <AlertOctagon size={40} />
          </div>
          <h1 className="text-3xl font-black text-white mb-4 tracking-tight">System Maintenance</h1>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Kami sedang melakukan pembaruan sistem untuk memberikan pengalaman belajar yang lebih baik. Kami akan segera kembali.
          </p>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-500 font-mono italic">
            Sentinel Protocol: ACTIVE_MAINTENANCE
          </div>
        </div>
      </div>
    );
  }

  // Security Lockdown (Only Admins can browse)
  if (state?.security_lockdown === true && !isAdmin && !pathname.startsWith('/login')) {
    return (
      <div className="fixed inset-0 bg-[#050505] z-[9999] flex items-center justify-center p-6">
        <div className="max-w-md w-full glass-strong rounded-[2.5rem] p-10 text-center border border-red-500/20">
          <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mx-auto mb-8">
            <Lock size={40} />
          </div>
          <h1 className="text-3xl font-black text-white mb-4 tracking-tight">Access Restricted</h1>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Akses ke platform saat ini dibatasi untuk alasan keamanan. Silakan hubungi administrator jika Anda merasa ini adalah kesalahan.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
