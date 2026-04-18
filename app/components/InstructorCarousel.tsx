"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Star, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { type Instructor } from "@/lib/data";

interface InstructorCarouselProps {
  instructors: Instructor[];
}

export default function InstructorCarousel({ instructors }: InstructorCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [visibleItems, setVisibleItems] = useState(4);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Responsive logic to handle visible items based on screen width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setVisibleItems(1);
      else if (window.innerWidth < 1024) setVisibleItems(2);
      else if (window.innerWidth < 1280) setVisibleItems(3);
      else setVisibleItems(4);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const totalItems = instructors.length;
  // Constraint: One-by-one movement means we can slide up to the last visible window
  const maxIndex = Math.max(0, totalItems - visibleItems);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev >= maxIndex) return 0; // Loop back to start
      return prev + 1;
    });
  }, [maxIndex]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev <= 0) return maxIndex; // Loop back to end
      return prev - 1;
    });
  }, [maxIndex]);

  useEffect(() => {
    if (!isPaused && totalItems > visibleItems) {
      timerRef.current = setInterval(nextSlide, 6000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, nextSlide, totalItems, visibleItems]);

  if (!instructors || instructors.length === 0) return null;

  return (
    <div
      className="relative group px-2"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="overflow-hidden py-4">
        <div
          className="flex transition-transform duration-700 cubic-bezier(0.4, 0, 0.2, 1) gap-6"
          style={{
            transform: `translateX(-${currentIndex * (100 / visibleItems)}%)`,
          }}
        >
          {instructors.map((instructor) => (
            <div
              key={instructor.id}
              className="card p-6 text-center group/card flex flex-col h-auto"
              style={{
                width: `calc((100% / ${visibleItems}) - ${(6 * (visibleItems - 1)) / visibleItems}px)`,
                flexShrink: 0
              }}
            >
              {/* Avatar with dynamic colors/initials */}
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-400 mx-auto mb-6 flex items-center justify-center text-white text-2xl font-bold group-hover/card:scale-110 transition-transform duration-500 shadow-xl shadow-purple-500/10 overflow-hidden border border-white/10">
                {instructor.avatar ? (
                  <img src={instructor.avatar} alt={instructor.name} className="w-full h-full object-cover" />
                ) : (
                  instructor.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                )}
              </div>

              <Link
                href={`/profile/${instructor.slug}`}
                className="inline-block group/link"
              >
                <h3 className="text-white font-bold text-lg mb-1 group-hover/link:text-purple-400 transition-colors cursor-pointer line-clamp-1">
                  {instructor.name}
                </h3>
              </Link>

              <p className="text-purple-400 text-sm font-medium mb-3">
                {instructor.expertise}
              </p>

              <p className="text-slate-400 text-sm leading-relaxed mb-6 line-clamp-2 h-10 italic">
                &quot;{instructor.bio}&quot;
              </p>

              <div className="mt-auto flex justify-center gap-3 text-xs text-slate-400 pt-5 border-t border-white/5">
                <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                  <Star
                    size={13}
                    className="text-yellow-400 fill-yellow-400"
                  />
                  <span className="text-slate-200 font-bold">{instructor.rating}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                  <Users size={13} className="text-cyan-400" />
                  <span className="text-slate-200 font-medium">
                    {formatNumber(instructor.totalStudents)} <span className="text-slate-500 ml-0.5">Siswa</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Controls - Only show if enough items */}
      {totalItems > visibleItems && (
        <>
          <button
            onClick={prevSlide}
            aria-label="Previous instructor"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 w-12 h-12 rounded-full glass-strong flex items-center justify-center text-white hover:bg-purple-500/20 hover:border-purple-500/30 transition-all duration-300 z-20 shadow-2xl"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Next instructor"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 w-12 h-12 rounded-full glass-strong flex items-center justify-center text-white hover:bg-purple-500/20 hover:border-purple-500/30 transition-all duration-300 z-20 shadow-2xl"
          >
            <ChevronRight size={24} />
          </button>

          {/* Progress Indicators */}
          <div className="flex justify-center gap-2 mt-10">
            {Array.from({ length: totalItems }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(Math.min(i, maxIndex))}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-500 ${currentIndex === i
                  ? "w-8 bg-gradient-to-r from-purple-500 to-cyan-400 shadow-[0_0_15px_rgba(124,58,237,0.5)]"
                  : "w-2 bg-white/10 hover:bg-white/20"
                  }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
