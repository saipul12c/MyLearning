"use client";

import { useState, useEffect, useRef } from "react";
import { type Promotion } from "@/lib/promotions";
import PromotionCard from "./PromotionCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AdCarouselProps {
  promotions: Promotion[];
  interval?: number;
  variant?: 'banner' | 'card';
  className?: string;
}

export default function AdCarousel({ promotions, interval = 8000, variant = 'banner', className = "" }: AdCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (promotions.length <= 1 || isHovered) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promotions.length);
    }, interval);

    return () => clearInterval(timer);
  }, [promotions.length, interval, isHovered]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + promotions.length) % promotions.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % promotions.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX.current) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
    touchStartX.current = null;
  };

  if (!promotions || promotions.length === 0) return null;

  if (promotions.length === 1) {
    return (
      <div className={className}>
        <PromotionCard promotion={promotions[0]} variant={variant} />
      </div>
    );
  }

  return (
    <div 
      className={`relative group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="overflow-hidden rounded-3xl relative">
        <div 
          className="flex transition-transform duration-700 cubic-bezier(0.4, 0, 0.2, 1)"
          style={{ transform: `translateX(-${currentIndex * 100}%)`, width: `${promotions.length * 100}%` }}
        >
          {promotions.map((promo, idx) => (
            <div key={`${promo.id}-${idx}`} className="w-full shrink-0 px-2" style={{ width: `${100 / promotions.length}%` }}>
               <div className="mx-auto" style={{ maxWidth: variant === 'banner' ? '100%' : '400px' }}>
                 <PromotionCard promotion={promo} variant={variant} isPreview={false} />
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <button 
        onClick={(e) => { e.preventDefault(); handlePrev(); }}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 hover:bg-white/10"
        aria-label="Previous promotional slide"
      >
        <ChevronLeft size={20} />
      </button>
      
      <button 
        onClick={(e) => { e.preventDefault(); handleNext(); }}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 hover:bg-white/10"
        aria-label="Next promotional slide"
      >
        <ChevronRight size={20} />
      </button>

      {/* Indicator Dots */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {promotions.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`transition-all duration-300 rounded-full ${currentIndex === idx ? 'w-4 h-1.5 bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]' : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'}`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
