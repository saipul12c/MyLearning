"use client";

import { Promotion, trackImpression, trackClick } from "@/lib/promotions";
import { useEffect, useState } from "react";
import { ExternalLink, ArrowRight, Sparkles } from "lucide-react";
import Image from "next/image";

interface PromotionCardProps {
  promotion: Promotion;
  variant?: "banner" | "card" | "spotlight";
  isPreview?: boolean;
  priorityLabel?: boolean;
}

export default function PromotionCard({ promotion, variant = "banner", isPreview = false, priorityLabel = false }: PromotionCardProps) {
  const [hasTracked, setHasTracked] = useState(false);
  const isExternal = promotion.isExternal;

  useEffect(() => {
    if (promotion && !hasTracked && !isPreview) {
      // Fraud Prevention: Don't track if seen in this session
      const sessionKey = `ad_seen_${promotion.id}`;
      if (sessionStorage.getItem(sessionKey)) {
        setHasTracked(true);
        return;
      }

      const timer = setTimeout(() => {
        trackImpression(promotion.id);
        sessionStorage.setItem(sessionKey, 'true');
        setHasTracked(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [promotion, hasTracked, isPreview]);

  const handleClick = () => {
    if (isPreview) return;
    
    // Fraud Prevention for clicks
    const clickKey = `ad_clicked_${promotion.id}`;
    if (!sessionStorage.getItem(clickKey)) {
      trackClick(promotion.id);
      sessionStorage.setItem(clickKey, 'true');
    }
  };
  
  if (variant === "banner") {
    return (
      <div 
        className="relative overflow-hidden rounded-[2.5rem] border border-white/10 group transition-all duration-500 hover:border-purple-500/30"
        style={{ 
          background: promotion.bgColor || 'linear-gradient(135deg, rgba(88, 28, 135, 0.1) 0%, rgba(15, 23, 42, 0.4) 100%)' 
        }}
      >
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[center_top_-1px]" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/10 blur-[100px] rounded-full group-hover:bg-purple-500/20 transition-all duration-700" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 p-8 md:p-12">
          {promotion.imageUrl && (
            <div className="relative w-full md:w-64 aspect-video md:aspect-square rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
              <Image 
                src={promotion.imageUrl} 
                alt={promotion.title} 
                fill 
                priority={priorityLabel}
                className="object-cover group-hover:scale-110 transition-transform duration-700"
              />
            </div>
          )}
          
          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">
              <Sparkles size={12} />
              {promotion.badgeText || "FEATURED PARTNER"}
            </div>
            
            <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
              {promotion.title}
            </h2>
            
            <p className="text-slate-400 text-sm md:text-lg leading-relaxed max-w-xl">
              {promotion.description}
            </p>
            
            <a 
              href={promotion.linkUrl}
              onClick={handleClick}
              target={isExternal ? "_blank" : "_self"}
              rel={isExternal ? "noopener noreferrer" : ""}
              className="btn-primary !py-4 px-8 inline-flex items-center gap-2 group/btn shadow-xl shadow-purple-500/20"
            >
              Learn More
              {isExternal ? <ExternalLink size={18} /> : <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />}
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <a 
        href={promotion.linkUrl}
        onClick={handleClick}
        target={isExternal ? "_blank" : "_self"}
        rel={isExternal ? "noopener noreferrer" : ""}
        className="card flex flex-col p-0 overflow-hidden group hover:border-purple-500/40 transition-all duration-500"
      >
        <div className="relative h-32 w-full bg-[#0c0c14]">
          {promotion.imageUrl ? (
            <Image 
              src={promotion.imageUrl} 
              alt={promotion.title} 
              fill 
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-cyan-900/30 flex items-center justify-center">
               <Sparkles size={32} className="text-purple-400/30" />
            </div>
          )}
          <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[8px] font-black text-purple-400 uppercase tracking-widest">
            {promotion.badgeText || "PROMO"}
          </div>
        </div>
        <div className="p-4 space-y-2">
          <h3 className="text-white font-bold text-sm leading-tight group-hover:text-purple-400 transition-colors">
            {promotion.title}
          </h3>
          <p className="text-slate-500 text-[11px] line-clamp-2 leading-relaxed italic">
            {promotion.description}
          </p>
          <div className="pt-2 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
              PROMOTED <ExternalLink size={10} />
            </span>
            <ArrowRight size={14} className="text-purple-500 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
          </div>
        </div>
      </a>
    );
  }

  // Spotlight Variant (Sidebar)
  return (
    <div className="card p-5 border-cyan-500/10 hover:border-cyan-500/30 transition-all group overflow-hidden relative">
      <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-cyan-500/5 blur-2xl rounded-full" />
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
           <span className="text-[9px] font-black text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded uppercase tracking-[0.1em]">
            {promotion.badgeText || "SPOTLIGHT"}
           </span>
           {isExternal && <ExternalLink size={12} className="text-slate-600" />}
        </div>
        <div className="space-y-1">
          <h4 className="text-white font-bold text-sm">{promotion.title}</h4>
          <p className="text-slate-500 text-xs leading-relaxed italic">{promotion.description}</p>
        </div>
        <a 
          href={promotion.linkUrl}
          onClick={handleClick}
          target={isExternal ? "_blank" : "_self"}
          rel={isExternal ? "noopener noreferrer" : ""}
          className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest text-center hover:bg-white/10 hover:border-cyan-500/40 transition-all block"
        >
          Check Details
        </a>
      </div>
    </div>
  );
}
