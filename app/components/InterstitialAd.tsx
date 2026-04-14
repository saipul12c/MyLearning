"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { type Promotion, trackClick, markInterstitialAsSeen, hasSeenInterstitialThisSession, dismissAdPersistent } from "@/lib/promotions";
import { X, ExternalLink, Shield } from "lucide-react";

interface InterstitialAdProps {
  promotion: Promotion;
  onClose: () => void;
}

export default function InterstitialAd({ promotion, onClose }: InterstitialAdProps) {
  const [countdown, setCountdown] = useState(5); // Auto close after 5s or allow skip
  const [canSkip, setCanSkip] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (hasSeenInterstitialThisSession()) {
      onClose();
      return;
    }

    // Delay showing slightly for effect
    const showTimer = setTimeout(() => {
      setIsVisible(true);
      markInterstitialAsSeen();
    }, 500);

    return () => clearTimeout(showTimer);
  }, [onClose]);

  useEffect(() => {
    if (!isVisible) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanSkip(true);
    }
  }, [countdown, isVisible]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 400); // Wait for exit animation
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    trackClick(promotion.id);
    handleClose();
    window.open(promotion.linkUrl, '_blank');
  };

  if (!isVisible && countdown === 5) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md transition-opacity duration-400 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`relative max-w-2xl w-full mx-4 rounded-3xl overflow-hidden glass-strong bg-[#09090f]/90 border-white/10 shadow-[0_0_50px_rgba(124,58,237,0.3)] animate-fade-scale`}>
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/5 z-20">
           <div 
             className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-1000 ease-linear"
             style={{ width: `${((5 - countdown) / 5) * 100}%` }}
           />
        </div>

        <div className="absolute top-4 right-4 z-20 flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md text-white text-xs font-bold border border-white/10 flex items-center gap-2">
            Sponsored
            {countdown > 0 ? (
               <span className="text-purple-400">Tutup dalam {countdown}s</span>
            ) : (
               <span className="text-emerald-400">Bisa di-skip</span>
            )}
          </div>
          <button 
            onClick={handleClose}
            disabled={!canSkip}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${canSkip ? 'bg-white/10 hover:bg-white/20 text-white cursor-pointer' : 'bg-white/5 text-slate-500 opacity-50 cursor-not-allowed'}`}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <button 
          onClick={handleClick}
          className="w-full text-left group block relative"
        >
          <div className="relative aspect-video w-full bg-[#0c0c14] overflow-hidden">
            <Image 
              src={promotion.imageUrl} 
              alt={promotion.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="max-w-xl">
               <span className="inline-block px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-black uppercase tracking-widest mb-3 border border-purple-500/30">
                 Special Offer
               </span>
               <h2 className="text-3xl font-black text-white mb-3 leading-tight group-hover:text-purple-300 transition-colors drop-shadow-lg">
                 {promotion.title}
               </h2>
               <p className="text-slate-300 text-sm max-w-lg leading-relaxed drop-shadow-md">
                 {promotion.description}
               </p>
            </div>
          </div>
        </button>

        {/* Action Bar */}
        <div className="p-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
              <Shield size={14} className="text-purple-400" /> Safe & Verified by MyLearning
           </div>
           
           <button 
              onClick={handleClick}
              className="btn-primary !py-2.5 px-6 gap-2 text-sm shadow-lg shadow-purple-500/20"
           >
              Pelajari Lebih Lanjut <ExternalLink size={14} />
           </button>
        </div>
      </div>
    </div>
  );
}
