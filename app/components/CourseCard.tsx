"use client";

import Link from "next/link";
import { Star, Users, Clock, BookOpen, ChevronRight, Award } from "lucide-react";
import { type Course } from "@/lib/data";
import { formatPrice, formatNumber } from "@/lib/utils";
import { getLevelLabel, getLevelBg } from "@/lib/enrollment";

interface CourseCardProps {
  course: Course;
  variant?: "default" | "compact" | "horizontal";
}

export default function CourseCard({ course, variant = "default" }: CourseCardProps) {
  if (variant === "compact") {
    return (
      <Link href={`/courses/${course.slug}`} className="group block">
        <div className="card p-4 flex items-center gap-4 hover:border-purple-500/30 transition-all bg-white/[0.01]">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-900/40 to-indigo-900/30 shrink-0 overflow-hidden border border-white/5 relative">
            {course.thumbnail ? (
              <img src={course.thumbnail} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-500" />
            ) : (
              <BookOpen size={20} className="text-purple-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1">{course.category}</p>
            <h3 className="text-white font-bold text-sm truncate group-hover:text-purple-300 transition-colors">{course.title}</h3>
            <div className="flex items-center gap-2 mt-1">
               <span className="text-[10px] text-slate-500 flex items-center gap-1 font-bold">
                 <Star size={10} className="text-yellow-400 fill-yellow-400" /> {course.rating}
               </span>
               <span className="w-1 h-1 rounded-full bg-slate-800" />
               <span className="text-[10px] text-white font-black">{course.discountPrice ? formatPrice(course.discountPrice) : formatPrice(course.price)}</span>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-700 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
        </div>
      </Link>
    );
  }

  return (
    <div className="card overflow-hidden group hover:border-purple-500/30 transition-all bg-white/[0.02]">
      <div className="relative h-40 bg-gradient-to-br from-purple-900/40 to-cyan-900/30 flex items-center justify-center overflow-hidden">
        {course.thumbnail ? (
          <img 
            src={course.thumbnail} 
            alt="" 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 group-hover:opacity-100" 
          />
        ) : (
          <BookOpen size={32} className="text-purple-400/40" />
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="badge badge-primary text-[10px] uppercase font-black tracking-widest px-2.5 py-1">
            {course.category}
          </span>
        </div>
        <span className={`absolute top-3 right-3 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border shadow-lg ${getLevelBg(course.level as any)}`}>
          {getLevelLabel(course.level as any)}
        </span>
      </div>
      
      <div className="p-5 space-y-4">
        <div>
          <h3 className="text-white font-bold text-base leading-snug line-clamp-2 group-hover:text-purple-300 transition-colors uppercase tracking-tight mb-2">
            {course.title}
          </h3>
          <p className="text-slate-500 text-xs font-medium flex items-center gap-1">
            By <span className="text-slate-300">{course.instructor}</span>
          </p>
        </div>

        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest border-y border-white/5 py-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-400">
              <Star size={12} className="text-yellow-400 fill-yellow-400" /> {course.rating}
            </span>
            <span className="text-slate-600">({formatNumber(course.totalReviews)})</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <Users size={12} /> {formatNumber(course.totalStudents)} Siswa
          </div>
        </div>

        <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
          <span className="flex items-center gap-1.5"><Clock size={14} className="text-purple-400" /> {course.durationHours} Jam</span>
          <span className="w-1 h-1 rounded-full bg-slate-800" />
          <span className="flex items-center gap-1.5"><Award size={14} className="text-cyan-400" /> {course.totalLessons} Materi</span>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex flex-col">
            {course.discountPrice ? (
              <>
                <span className="text-white font-black text-lg leading-none">{formatPrice(course.discountPrice)}</span>
                <span className="text-slate-500 text-[10px] line-through mt-1">{formatPrice(course.price)}</span>
              </>
            ) : (
              <span className="text-white font-black text-lg">{formatPrice(course.price)}</span>
            )}
          </div>
          <Link 
            href={`/courses/${course.slug}`} 
            className="btn-primary text-[10px] !py-2.5 px-6 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-purple-500/20 hover:scale-105 active:scale-95"
          >
            Detail <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
