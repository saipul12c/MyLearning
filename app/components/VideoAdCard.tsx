"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { type Promotion, trackClick, trackImpressionsBatch } from "@/lib/promotions";
import { Volume2, VolumeX, ExternalLink, Play, Sparkles } from "lucide-react";

interface VideoAdCardProps {
  promotion: Promotion;
  className?: string;
  autoPlay?: boolean;
}

export default function VideoAdCard({ promotion, className = "", autoPlay = true }: VideoAdCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Impression tracking using IntersectionObserver
  useEffect(() => {
    if (!containerRef.current || hasTrackedImpression) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          trackImpressionsBatch([promotion.id]);
          setHasTrackedImpression(true);
          
          if (autoPlay && videoRef.current) {
            videoRef.current.play().catch(() => {
              // Autoplay failed usually due to browser policy, handle gracefully
              setIsPlaying(false);
            });
            setIsPlaying(true);
          }
          
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [promotion.id, hasTrackedImpression, autoPlay]);

  const handleClick = (e: React.MouseEvent) => {
    // If clicking on controls, don't trigger the ad click
    if ((e.target as HTMLElement).closest('.controls-layer')) {
      return;
    }
    
    e.preventDefault();
    trackClick(promotion.id);
    window.open(promotion.linkUrl, '_blank');
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`card overflow-hidden group relative transition-all duration-500 hover:shadow-[0_0_30px_rgba(124,58,237,0.15)] hover:border-purple-500/30 cursor-pointer flex flex-col ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Video Container */}
      <div className="relative aspect-video w-full bg-[#0c0c14] overflow-hidden shrink-0">
        {promotion.videoUrl ? (
          <video
            ref={videoRef}
            src={promotion.videoUrl}
            className={`w-full h-full object-cover transition-transform duration-700 ${isHovered ? 'scale-105' : 'scale-100'}`}
            muted={isMuted}
            loop
            playsInline
            poster={promotion.imageUrl}
          />
        ) : (
          <Image
            src={promotion.imageUrl}
            alt={promotion.title}
            fill
            className={`object-cover transition-transform duration-700 ${isHovered ? 'scale-105' : 'scale-100'}`}
          />
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10"></div>
        
        {/* Labels & Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
           <span className="badge bg-purple-500 text-white border-none shadow-lg text-[9px] font-black uppercase tracking-widest px-2 py-1 flex items-center gap-1">
             <Sparkles size={10} /> Ad
           </span>
        </div>
        
        {/* Controls Layer */}
        {promotion.videoUrl && (
          <div className={`absolute inset-0 controls-layer flex items-center justify-center transition-opacity duration-300 ${isHovered || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
            <button 
              onClick={togglePlay}
              className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/20 hover:bg-white/20 hover:scale-110 transition-all"
            >
              <Play size={20} className={`${isPlaying ? 'hidden' : 'block ml-1'}`} />
              <div className={`w-3 h-3 bg-white ${isPlaying ? 'block' : 'hidden'}`} style={{ clipPath: 'polygon(0 0, 30% 0, 30% 100%, 0 100%, 70% 0, 100% 0, 100% 100%, 70% 100%)' }}></div>
            </button>
            
            <button 
              onClick={toggleMute}
              className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/20 hover:bg-white/20 transition-colors"
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-white font-bold text-base leading-snug mb-2 group-hover:text-purple-300 transition-colors line-clamp-2">
            {promotion.title}
          </h3>
          <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 mb-4">
            {promotion.description}
          </p>
        </div>
        
        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{promotion.brandName || "Promosi"}</span>
          <span className="flex items-center gap-1 text-[10px] font-black text-purple-400 uppercase tracking-widest group-hover:underline decoration-2 underline-offset-4 decoration-purple-500/30">
            Pelajari <ExternalLink size={12} className="ml-0.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </span>
        </div>
      </div>
      
      {/* Animated Bottom Border Glow on Hover */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center"></div>
    </div>
  );
}
