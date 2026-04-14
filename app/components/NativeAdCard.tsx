"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getActivePromotions, type Promotion, type PromotionLocation, trackImpression, trackClick, trackDismiss, isAdDismissed } from "@/lib/promotions";
import { ExternalLink, ArrowRight, X, Sparkles } from "lucide-react";
import Image from "next/image";

interface NativeAdCardProps {
  location: PromotionLocation;
  categoryId?: string;
  className?: string;
  /** Style: "inline" blends between sections, "compact" is smaller, "featured" is prominent */
  variant?: "inline" | "compact" | "featured";
}

export default function NativeAdCard({ location, categoryId, className = "", variant = "inline" }: NativeAdCardProps) {
  const [promo, setPromo] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(true);
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchAd() {
      try {
        const promos = await getActivePromotions(location, categoryId);
        const validPromo = promos.find(p => !isAdDismissed(p.id));
        setPromo(validPromo || null);
      } catch {
        setPromo(null);
      } finally {
        setLoading(false);
      }
    }
    fetchAd();
  }, [location, categoryId]);

  // IntersectionObserver for lazy impression tracking
  useEffect(() => {
    if (!promo || hasTrackedImpression || !containerRef.current) return;

    let timeoutId: NodeJS.Timeout;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          timeoutId = setTimeout(() => {
            const sessionKey = `ad_seen_${promo.id}`;
            if (!sessionStorage.getItem(sessionKey)) {
              trackImpression(promo.id);
              sessionStorage.setItem(sessionKey, "true");
            }
            setHasTrackedImpression(true);
          }, 2000);
        } else {
          clearTimeout(timeoutId);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [promo, hasTrackedImpression]);

  const handleClick = useCallback(() => {
    if (!promo) return;
    const clickKey = `ad_clicked_${promo.id}`;
    if (!sessionStorage.getItem(clickKey)) {
      trackClick(promo.id);
      sessionStorage.setItem(clickKey, "true");
    }
  }, [promo]);

  const handleDismiss = useCallback(() => {
    if (promo) trackDismiss(promo.id);
    setVisible(false);
  }, [promo]);

  if (!visible || loading) {
    if (loading) {
      if (variant === "compact") {
         return (
           <div className={`rounded-2xl bg-white/[0.02] border border-white/5 h-20 animate-shimmer-premium w-full flex-shrink-0 ${className}`} />
         );
      }
      if (variant === "featured") {
         return (
           <div className={`rounded-[2rem] bg-white/[0.02] border border-white/5 aspect-[21/9] animate-shimmer-premium w-full flex-shrink-0 ${className}`} />
         );
      }
      return (
        <div className={`rounded-2xl bg-white/[0.02] border border-white/5 h-32 animate-shimmer-premium w-full flex-shrink-0 ${className}`} />
      );
    }
    return null;
  }

  if (!promo) return null;

  if (variant === "compact") {
    return (
      <div ref={containerRef} className={`group relative animate-fade-scale ${className}`}>
        <a
          href={promo.linkUrl}
          onClick={handleClick}
          target={promo.isExternal ? "_blank" : "_self"}
          rel={promo.isExternal ? "noopener noreferrer" : ""}
          className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-purple-500/20 hover:bg-white/[0.04] transition-all duration-300"
        >
          {promo.imageUrl && (
            <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/5">
              <Image src={promo.imageUrl} alt={promo.title} fill className="object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[8px] font-black text-purple-400 uppercase tracking-[0.15em] bg-purple-500/10 px-1.5 py-0.5 rounded">
                {promo.badgeText || "SPONSORED"}
              </span>
            </div>
            <h4 className="text-white text-xs font-bold truncate group-hover:text-purple-300 transition-colors">{promo.title}</h4>
            <p className="text-slate-500 text-[10px] truncate">{promo.description}</p>
          </div>
          <ArrowRight size={14} className="text-slate-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all shrink-0" />
        </a>
        <button
          onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-700 transition-all opacity-0 group-hover:opacity-100"
          aria-label="Tutup iklan"
        >
          <X size={10} />
        </button>
      </div>
    );
  }

  if (variant === "featured") {
    return (
      <div ref={containerRef} className={`group relative animate-fade-scale ${className}`}>
        <a
          href={promo.linkUrl}
          onClick={handleClick}
          target={promo.isExternal ? "_blank" : "_self"}
          rel={promo.isExternal ? "noopener noreferrer" : ""}
          className="block relative overflow-hidden rounded-[2rem] border border-white/10 hover:border-purple-500/30 transition-all duration-500 bg-[#0c0c14] shadow-2xl hover:shadow-[0_0_40px_rgba(124,58,237,0.2)]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-cyan-500/10 group-hover:opacity-100 opacity-50 transition-opacity duration-500" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 p-8 md:p-12">
            <div className="flex-1 space-y-4 min-w-0 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white backdrop-blur-md shadow-[0_0_15px_rgba(124,58,237,0.3)]">
                <Sparkles size={12} className="text-purple-400" />
                {promo.badgeText || "FEATURED PROMOTION"}
              </div>
              <h3 className="text-white font-black text-2xl md:text-4xl leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-cyan-400 transition-all duration-300">
                 {promo.title}
              </h3>
              <p className="text-slate-400 text-sm md:text-base line-clamp-3 leading-relaxed max-w-2xl">
                 {promo.description}
              </p>
              
              <div className="pt-4 flex justify-center md:justify-start">
                 <div className="btn-primary !px-8 !py-3.5 flex items-center gap-2 group/btn shadow-lg shadow-purple-500/20 text-xs font-black tracking-widest uppercase">
                    Pelajari Lebih Lanjut
                    {promo.isExternal ? <ExternalLink size={14} /> : <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />}
                 </div>
              </div>
            </div>

            {promo.imageUrl && (
              <div className="relative w-full md:w-[400px] aspect-video rounded-2xl overflow-hidden border border-white/10 shrink-0 shadow-2xl skew-y-0 md:-skew-y-3 md:group-hover:skew-y-0 transition-transform duration-700">
                <Image
                  src={promo.imageUrl}
                  alt={promo.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            )}
          </div>
        </a>

        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100 z-20"
          aria-label="Tutup iklan"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  // Inline variant — blends between page sections
  return (
    <div ref={containerRef} className={`group relative animate-fade-scale ${className}`}>
      <a
        href={promo.linkUrl}
        onClick={handleClick}
        target={promo.isExternal ? "_blank" : "_self"}
        rel={promo.isExternal ? "noopener noreferrer" : ""}
        className="block relative overflow-hidden rounded-2xl border border-white/5 hover:border-purple-500/20 transition-all duration-500 bg-gradient-to-br from-purple-900/[0.06] via-transparent to-cyan-900/[0.04]"
      >
        <div className="absolute inset-0 bg-grid-white/[0.01] pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-purple-500/5 blur-[80px] rounded-full group-hover:bg-purple-500/10 transition-all duration-700 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-8">
          {promo.imageUrl && (
            <div className="relative w-full sm:w-36 h-28 sm:h-24 rounded-xl overflow-hidden border border-white/5 shrink-0 shadow-lg">
              <Image
                src={promo.imageUrl}
                alt={promo.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}

          <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[8px] font-black uppercase tracking-[0.2em] text-purple-400">
              <Sparkles size={9} />
              {promo.badgeText || "PROMOTED"}
            </div>
            <h3 className="text-white font-bold text-base sm:text-lg leading-tight group-hover:text-purple-300 transition-colors">{promo.title}</h3>
            <p className="text-slate-400 text-xs sm:text-sm line-clamp-2 leading-relaxed">{promo.description}</p>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-black text-purple-400 uppercase tracking-[0.15em] shrink-0 group-hover:gap-3 transition-all">
            Pelajari
            {promo.isExternal ? <ExternalLink size={12} /> : <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />}
          </div>
        </div>
      </a>

      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 w-6 h-6 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-slate-500 hover:text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100 z-20"
        aria-label="Tutup iklan"
      >
        <X size={12} />
      </button>
    </div>
  );
}
