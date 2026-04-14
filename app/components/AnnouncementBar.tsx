"use client";

import { useEffect, useState, useCallback } from "react";
import { getActivePromotions, Promotion, trackImpression, dismissAdPersistent, isAdDismissedPersistent } from "@/lib/promotions";
import { Sparkles, X, ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function AnnouncementBar() {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [trackedIds, setTrackedIds] = useState<Set<string>>(new Set());
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    async function fetchPromos() {
      const allPromos = await getActivePromotions("global_announcement");
      // Filter out persistently dismissed ones
      const validPromos = allPromos.filter(p => !isAdDismissedPersistent(p.id));
      setPromos(validPromos);
    }
    fetchPromos();
  }, []);

  const promo = promos[currentIndex] || null;

  // Track impression for current promo
  useEffect(() => {
    if (!promo || !isVisible || trackedIds.has(promo.id)) return;

    const timer = setTimeout(() => {
      trackImpression(promo.id);
      setTrackedIds(prev => new Set(prev).add(promo.id));
    }, 3000);

    return () => clearTimeout(timer);
  }, [promo, isVisible, trackedIds]);

  // Auto-rotate if multiple promos
  useEffect(() => {
    if (promos.length <= 1 || !isVisible) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % promos.length);
        setIsTransitioning(false);
      }, 300); // transition duration
    }, 8000);

    return () => clearInterval(interval);
  }, [promos.length, isVisible]);

  const handleDismiss = useCallback(() => {
    if (promo) {
      dismissAdPersistent(promo.id);
    }
    // Remove current promo from the list
    const newPromos = promos.filter((_, i) => i !== currentIndex);
    if (newPromos.length === 0) {
      setIsVisible(false);
    } else {
      setPromos(newPromos);
      setCurrentIndex(prev => prev >= newPromos.length ? 0 : prev);
    }
  }, [promo, promos, currentIndex]);

  if (!promo || !isVisible || promos.length === 0) return null;

  return (
    <div className="relative z-[100] bg-gradient-to-r from-purple-900 via-indigo-900 to-cyan-900 border-b border-white/10 overflow-hidden animate-slide-down">
      {/* Decorative pulse background */}
      <div className="absolute inset-0 bg-white/5 animate-pulse" />
      
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between text-white relative z-10">
        <div className="flex-1 flex items-center justify-center gap-2 md:gap-4 overflow-hidden">
          <div className="hidden sm:flex items-center gap-2 px-2 py-0.5 rounded bg-purple-500/20 text-[10px] font-black uppercase tracking-widest border border-purple-500/30 shrink-0">
            <Sparkles size={10} className="text-purple-400" />
            {promo.badgeText || "NEW"}
          </div>
          
          <div className={`flex items-center gap-2 whitespace-nowrap overflow-hidden transition-all duration-300 ${isTransitioning ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"}`}>
            <span className="text-xs md:text-sm font-bold tracking-tight">{promo.title}</span>
            <span className="hidden md:inline-block text-xs text-slate-300 opacity-80 border-l border-white/20 pl-2">
               {promo.description}
            </span>
          </div>

          <Link 
            href={promo.linkUrl}
            target={promo.isExternal ? "_blank" : "_self"}
            className="flex items-center gap-1.5 text-[10px] md:text-xs font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition-all group shrink-0"
          >
            Pelajari <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Rotation indicator dots */}
          {promos.length > 1 && (
            <div className="hidden md:flex items-center gap-1 ml-2 shrink-0">
              {promos.map((_, i) => (
                <div
                  key={i}
                  className={`w-1 h-1 rounded-full transition-all duration-300 ${
                    i === currentIndex ? "bg-white w-2.5" : "bg-white/30"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <button 
          onClick={handleDismiss}
          className="p-1 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors ml-4 shrink-0"
          aria-label="Tutup"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
