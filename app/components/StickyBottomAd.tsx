"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getActivePromotions, type Promotion, trackImpression, trackClick, trackDismiss } from "@/lib/promotions";
import { X, ExternalLink, ArrowRight, Sparkles, Clock } from "lucide-react";
import Image from "next/image";

export default function StickyBottomAd({ initialPromo = null }: { initialPromo?: Promotion | null }) {
  const [promo, setPromo] = useState<Promotion | null>(null);
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [hasTracked, setHasTracked] = useState(false);
  const DURATION_MS = 20000; // 20 seconds
  const [timeLeft, setTimeLeft] = useState(DURATION_MS);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Set ad from initialPromo
  useEffect(() => {
    if (initialPromo) {
      try {
        // Check if already dismissed this session
        const dismissedAll = sessionStorage.getItem("sticky_ad_dismissed");
        if (dismissedAll) return;
        setPromo(initialPromo);
      } catch {
        // Silently fail
      }
    }
  }, [initialPromo]);

  // Show after 60% scroll
  useEffect(() => {
    if (!promo || dismissed) return;

    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent > 60) {
        setShow(true);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [promo, dismissed]);

  // Track impression when shown
  useEffect(() => {
    if (!show || !promo || hasTracked) return;

    const sessionKey = `ad_seen_${promo.id}`;
    if (sessionStorage.getItem(sessionKey)) {
      setHasTracked(true);
      return;
    }

    const timer = setTimeout(() => {
      trackImpression(promo.id);
      sessionStorage.setItem(sessionKey, "true");
      setHasTracked(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [show, promo, hasTracked]);

  // Auto-hide countdown
  useEffect(() => {
    if (!show || dismissed || isExiting) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 100) {
          handleDismiss();
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [show, dismissed, isExiting]);

  const handleClick = useCallback(() => {
    if (!promo) return;
    const clickKey = `ad_clicked_${promo.id}`;
    if (!sessionStorage.getItem(clickKey)) {
      trackClick(promo.id);
      sessionStorage.setItem(clickKey, "true");
    }
  }, [promo]);

  const removeComponent = useCallback(() => {
    setDismissed(true);
    setShow(false);
  }, []);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    if (promo) trackDismiss(promo.id);
    sessionStorage.setItem("sticky_ad_dismissed", "true");
    setTimeout(removeComponent, 400); // Wait for animation
  }, [promo, removeComponent]);

  const handleRemindLater = useCallback(() => {
    setIsExiting(true);
    // don't set to dismissed forever, just hide for now
    setTimeout(() => {
       setShow(false);
       setIsExiting(false);
       setTimeLeft(DURATION_MS);
    }, 400);
  }, []);

  if (!promo || dismissed || !show) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-[80] pointer-events-none ${isExiting ? 'animate-slide-down-exit' : 'animate-slide-up-bounce'}`}>
      <div className="max-w-3xl mx-auto px-4 pb-4 pointer-events-auto">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c14]/90 backdrop-blur-xl shadow-2xl shadow-black/50 group">
          {/* Animated Gradient Border Overlay */}
          <div className="absolute inset-0 z-0 p-[1px] rounded-2xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500">
             <div className="animate-gradient-border-rotate absolute -inset-[200px]" />
             <div className="absolute inset-[1px] bg-[#0c0c14]/95 rounded-2xl" />
          </div>

          <div className="relative z-10">
             {/* Gradient accent top border */}
             <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/5">
                <div 
                   className="h-full bg-gradient-to-r from-purple-500 via-cyan-400 to-emerald-400 transition-all duration-100 ease-linear"
                   style={{ width: `${(timeLeft / DURATION_MS) * 100}%` }}
                />
             </div>
             
             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 p-4">
               {/* Image */}
               {promo.imageUrl && (
                 <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/5 shrink-0 hidden sm:block">
                   <Image src={promo.imageUrl} alt={promo.title} fill className="object-cover" />
                 </div>
               )}

               {/* Content */}
               <div className="flex-1 min-w-0 pr-2">
                 <div className="flex items-center gap-2 mb-1">
                   <span className="text-[7px] font-black text-purple-400 uppercase tracking-[0.2em] bg-purple-500/10 px-1.5 py-0.5 rounded-md border border-purple-500/20 flex items-center gap-1">
                     <Sparkles size={7} /> PROMOTED
                   </span>
                 </div>
                 <h4 className="text-white text-sm font-bold truncate group-hover:text-purple-300 transition-colors">{promo.title}</h4>
                 <p className="text-slate-400 text-[11px] truncate hidden sm:block">{promo.description}</p>
                 <p className="text-slate-400 text-[11px] truncate block sm:hidden mt-0.5">{promo.brandName}</p>
               </div>

               {/* Actions */}
               <div className="flex items-center gap-2 mt-2 sm:mt-0 justify-end">
                  <button
                    onClick={handleRemindLater}
                    className="shrink-0 p-2 hidden md:flex rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
                    aria-label="Ingatkan Nanti"
                    title="Ingatkan Nanti"
                  >
                    <Clock size={16} />
                  </button>

                  <a
                    href={promo.linkUrl}
                    onClick={handleClick}
                    target={promo.isExternal ? "_blank" : "_self"}
                    rel={promo.isExternal ? "noopener noreferrer" : ""}
                    className="shrink-0 btn-primary !py-2 !px-4 text-xs font-bold flex items-center gap-1.5 !rounded-xl shadow-lg shadow-purple-500/20"
                  >
                    Lihat
                    {promo.isExternal ? <ExternalLink size={12} /> : <ArrowRight size={12} />}
                  </a>

                  <button
                    onClick={handleDismiss}
                    className="shrink-0 p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
                    aria-label="Tutup"
                  >
                    <X size={16} />
                  </button>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
