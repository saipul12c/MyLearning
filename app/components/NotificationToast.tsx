"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";
import { 
  X, Info, CheckCircle2, AlertTriangle, AlertOctagon, 
  ExternalLink, Megaphone, Hammer, ShieldAlert, Sparkles, BellRing
} from "lucide-react";

export default function NotificationToast() {
  const { user } = useAuth();
  const [activeToast, setActiveToast] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          setActiveToast(payload.new);
          // Auto-hide after 12 seconds for more complex messages
          const timer = setTimeout(() => setActiveToast(null), 12000);
          return () => clearTimeout(timer);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!activeToast) return null;

  const getTheme = () => {
    const title = activeToast.title.toLowerCase();
    
    if (title.includes('maintenance') || title.includes('perbaikan')) {
      return { 
        icon: Hammer, 
        color: 'text-amber-400', 
        border: 'border-amber-500/30', 
        bg: 'bg-amber-500/10',
        glow: 'shadow-amber-500/20',
        label: 'MAINTENANCE',
        animate: 'animate-pulse'
      };
    }
    
    if (title.includes('urgent') || title.includes('penting') || activeToast.type === 'error') {
      return { 
        icon: ShieldAlert, 
        color: 'text-red-400', 
        border: 'border-red-500/30', 
        bg: 'bg-red-500/15',
        glow: 'shadow-red-500/30',
        label: 'CRITICAL',
        animate: 'animate-bounce-subtle'
      };
    }

    if (activeToast.type === 'success') {
      return { 
        icon: CheckCircle2, 
        color: 'text-emerald-400', 
        border: 'border-emerald-500/30', 
        bg: 'bg-emerald-500/10',
        glow: 'shadow-emerald-500/20',
        label: 'INFO',
        animate: ''
      };
    }

    return { 
      icon: Info, 
      color: 'text-blue-400', 
      border: 'border-blue-500/30', 
      bg: 'bg-blue-500/10',
      glow: 'shadow-blue-500/20',
      label: 'ANNOUNCEMENT',
      animate: ''
    };
  };

  const theme = getTheme();
  const Icon = theme.icon;

  return (
    <div className={`fixed bottom-8 right-8 z-[9999] w-full max-w-md animate-in slide-in-from-right-10 duration-700 ease-out ${theme.animate}`}>
      <div className={`p-6 rounded-[2.5rem] border ${theme.border} ${theme.bg} backdrop-blur-2xl shadow-2xl relative overflow-hidden group ring-1 ring-white/10 ${theme.glow}`}>
        
        {/* Animated Background Gradients */}
        <div className={`absolute -top-20 -right-20 w-40 h-40 blur-[80px] opacity-30 rounded-full transition-all duration-1000 ${theme.color.replace('text', 'bg')}`} />
        <div className={`absolute -bottom-20 -left-20 w-40 h-40 blur-[80px] opacity-10 rounded-full transition-all duration-1000 ${theme.color.replace('text', 'bg')}`} />

        <div className="flex gap-5 relative z-10">
          <div className={`w-14 h-14 rounded-3xl ${theme.bg} border ${theme.border} flex items-center justify-center shrink-0 shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500`}>
             <Icon className={`${theme.color} drop-shadow-lg`} size={28} />
          </div>
          
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-2 mb-1.5">
               <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${theme.border} ${theme.color} uppercase tracking-[0.1em]`}>
                 {theme.label}
               </span>
               <span className="text-[10px] text-slate-500 font-bold">• Just Now</span>
            </div>
            
            <h4 className="text-[15px] font-black text-white uppercase tracking-tight mb-1.5 line-clamp-1 leading-none">
              {activeToast.title}
            </h4>
            <p className="text-[12px] text-slate-400 leading-relaxed line-clamp-3 font-medium">
              {activeToast.message}
            </p>
            
            {activeToast.link_url && (
              <a 
                href={activeToast.link_url}
                className="mt-4 inline-flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-widest hover:scale-105 transition-all bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2 rounded-2xl shadow-lg shadow-purple-500/20"
              >
                <Sparkles size={12} /> Ambil Tindakan
              </a>
            )}
          </div>

          <button 
            onClick={() => setActiveToast(null)}
            className="text-slate-600 hover:text-white hover:rotate-90 p-2 transition-all duration-300 self-start bg-white/5 rounded-full"
          >
            <X size={16} />
          </button>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="absolute bottom-0 left-0 h-[3px] bg-white/5 w-full overflow-hidden">
           <div className={`h-full bg-gradient-to-r from-transparent via-white/40 to-white/10 animate-shrink`} style={{ animationDuration: '12s' }} />
        </div>
      </div>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-shrink {
          animation: shrink linear forwards;
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
