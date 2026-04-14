"use client";

import { BadgeCheck } from "lucide-react";

interface VerifiedBadgeProps {
  size?: number;
  className?: string;
  showTooltip?: boolean;
}

export default function VerifiedBadge({ 
  size = 14, 
  className = "", 
  showTooltip = true 
}: VerifiedBadgeProps) {
  return (
    <span 
      className={`inline-flex items-center justify-center text-blue-400 relative group animate-in fade-in zoom-in duration-500 delay-100 ${className}`}
    >
      <BadgeCheck 
        size={size} 
        fill="currentColor" 
        className="text-blue-500 fill-blue-500/20 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)] cursor-help" 
      />
      
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] invisible opacity-0 group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all duration-300 pointer-events-none z-[100]">
          <div className="bg-[#0c0c14]/95 backdrop-blur-md border border-white/10 text-white px-3 py-2 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] text-[10px] font-bold tracking-wide text-center">
            Akun Terverifikasi
            <div className="text-[8px] text-slate-400 font-medium tracking-normal mt-0.5 whitespace-nowrap">Instruktur / Moderator Ahli</div>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white/10"></div>
            <div className="absolute top-[calc(100%-1px)] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#0c0c14]/95"></div>
          </div>
        </div>
      )}
    </span>
  );
}
