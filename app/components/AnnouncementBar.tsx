"use client";

import { useEffect, useState } from "react";
import { getActivePromotions, Promotion, trackImpression } from "@/lib/promotions";
import { Sparkles, X, ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function AnnouncementBar() {
  const [promo, setPromo] = useState<Promotion | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [hasTracked, setHasTracked] = useState(false);

  useEffect(() => {
    async function fetchPromo() {
      const promos = await getActivePromotions("global_announcement");
      if (promos.length > 0) {
        setPromo(promos[0]);
      }
    }
    fetchPromo();
  }, []);

  useEffect(() => {
    if (promo && isVisible && !hasTracked) {
      // Track impression after 3 seconds of visibility to ensure "true" view
      const timer = setTimeout(() => {
        trackImpression(promo.id);
        setHasTracked(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [promo, isVisible, hasTracked]);

  if (!promo || !isVisible) return null;

  return (
    <div className="relative z-[100] bg-gradient-to-r from-purple-900 via-indigo-900 to-cyan-900 border-b border-white/10 overflow-hidden animate-slide-down">
      {/* Decorative pulse background */}
      <div className="absolute inset-0 bg-white/5 animate-pulse" />
      
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between text-white relative z-10">
        <div className="flex-1 flex items-center justify-center gap-2 md:gap-4 overflow-hidden">
          <div className="hidden sm:flex items-center gap-2 px-2 py-0.5 rounded bg-purple-500/20 text-[10px] font-black uppercase tracking-widest border border-purple-500/30">
            <Sparkles size={10} className="text-purple-400" />
            {promo.badgeText || "NEW"}
          </div>
          
          <div className="flex items-center gap-2 whitespace-nowrap overflow-hidden">
            <span className="text-xs md:text-sm font-bold tracking-tight">{promo.title}</span>
            <span className="hidden md:inline-block text-xs text-slate-300 opacity-80 border-l border-white/20 pl-2">
               {promo.description}
            </span>
          </div>

          <Link 
            href={promo.linkUrl}
            target={promo.isExternal ? "_blank" : "_self"}
            className="flex items-center gap-1.5 text-[10px] md:text-xs font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition-all group"
          >
            Pelajari <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <button 
          onClick={() => setIsVisible(false)}
          className="p-1 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors ml-4"
          aria-label="Tutup"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
