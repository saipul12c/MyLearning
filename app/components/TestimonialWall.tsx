"use client";

import { Star, Quote, PlayCircle } from "lucide-react";
import Link from "next/link";
import VerifiedBadge from "./VerifiedBadge";

interface Testimonial {
  id: string;
  userName: string;
  userBio: string;
  courseTitle: string;
  courseSlug: string;
  comment: string;
  rating: number;
  userId?: string;
  userRole?: string;
}

interface TestimonialWallProps {
  testimonials: Testimonial[];
}

export default function TestimonialWall({ testimonials }: TestimonialWallProps) {
  if (!testimonials || testimonials.length === 0) return null;

  // Split into 3 chunks for varied rows
  const rowCount = 3;
  const perRow = Math.ceil(testimonials.length / rowCount);
  const rows = [
    testimonials.slice(0, perRow),
    testimonials.slice(perRow, perRow * 2),
    testimonials.slice(perRow * 2)
  ];

  const TestimonialCard = ({ t }: { t: Testimonial }) => (
    <div className="w-[380px] flex-shrink-0 group relative bg-[#12121a] border border-white/10 rounded-[2.5rem] p-8 hover:bg-[#161622] hover:border-purple-500/40 transition-all duration-500 hover:-translate-y-1 shadow-2xl whitespace-normal">
      {/* Decorative background icon - Made more subtle */}
      <Quote className="absolute -top-4 -right-4 w-32 h-32 text-white/[0.03] group-hover:text-purple-500/10 transition-colors duration-500 -rotate-12 pointer-events-none" />
      
      <div className="relative z-10">
        {/* Stars */}
        <div className="flex gap-1 mb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star 
              key={i} 
              size={12} 
              className={`${i < t.rating ? "fill-yellow-400 text-yellow-400" : "text-white/10"}`} 
            />
          ))}
        </div>

        {/* Content - Improved contrast and weight */}
        <p className="text-slate-200 text-[15px] leading-relaxed mb-8 italic font-medium min-h-[4.5rem]">
          &ldquo;{t.comment}&rdquo;
        </p>

        {/* Author Info */}
        <div className="flex items-center justify-between pt-6 border-t border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-400 p-[1px]">
               <div className="w-full h-full rounded-2xl bg-[#12121a] flex items-center justify-center text-white font-black text-sm">
                  {t.userName.split(" ").map(n => n[0]).slice(0, 2).join("")}
               </div>
            </div>
            <div className="min-w-0">
              <Link 
                href={`/profile/${t.userId}`}
                className="text-white font-bold text-sm flex items-center gap-1.5 hover:text-purple-400 transition-colors"
              >
                {t.userName}
                {(t.userRole === 'admin' || t.userRole === 'instructor') && <VerifiedBadge size={10} />}
              </Link>
              <div className="text-slate-400 text-[11px] font-medium truncate">{t.userBio}</div>
            </div>
          </div>
        </div>

        {/* Course Source */}
        <Link 
          href={`/courses/${t.courseSlug}`}
          className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:bg-purple-500/10 hover:text-purple-300 transition-all group/link"
        >
          <PlayCircle size={12} className="text-purple-500/50 group-hover/link:text-purple-400" />
          <span className="truncate">{t.courseTitle}</span>
        </Link>
      </div>
    </div>
  );

  const MarqueeRow = ({ items, reverse = false, duration = "50s" }: { items: Testimonial[], reverse?: boolean, duration?: string }) => {
    // Duplicate items to ensure smooth infinite loop
    const displayItems = [...items, ...items, ...items];
    
    return (
      <div className="flex overflow-hidden mask-fade py-4 marquee-row">
        <div 
          className={`flex gap-8 whitespace-nowrap marquee-track ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'}`}
          style={{ '--duration': duration } as any}
        >
          {displayItems.map((t, i) => (
            <TestimonialCard key={`${t.id}-${i}`} t={t} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="relative space-y-4 py-8 overflow-hidden select-none">
      {/* Top row */}
      <MarqueeRow items={rows[0]} duration="80s" />
      
      {/* Middle row - reversed */}
      {rows[1] && rows[1].length > 0 && (
        <MarqueeRow items={rows[1]} reverse duration="100s" />
      )}
      
      {/* Bottom row */}
      {rows[2] && rows[2].length > 0 && (
        <MarqueeRow items={rows[2]} duration="90s" />
      )}

      {/* Side Gradients for depth */}
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#09090f] to-transparent z-20 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#09090f] to-transparent z-20 pointer-events-none" />
    </div>
  );
}
