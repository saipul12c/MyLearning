"use client";

import { X, Play, Zap, CheckCircle2, ChevronRight } from "lucide-react";
import { Lesson } from "@/lib/data";

interface PreviewModalProps {
  lesson: Lesson;
  courseTitle: string;
  onClose: () => void;
  onEnroll: () => void;
}

export default function PreviewModal({ lesson, courseTitle, onClose, onEnroll }: PreviewModalProps) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-[#0f0f1a] rounded-2xl border border-white/10 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl scale-in-center">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
          <div>
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1 block">Free Preview</span>
            <h2 className="text-white font-bold text-lg leading-tight">{lesson.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          {/* Video Placeholder or Embed */}
          <div className="aspect-video bg-black relative">
            {lesson.videoUrl ? (
              lesson.videoUrl.match(/\.(mp4|webm|ogg)$/) ? (
                <video
                  src={lesson.videoUrl}
                  controls
                  autoPlay
                  className="absolute inset-0 w-full h-full z-10"
                />
              ) : (
                <iframe
                  src={lesson.videoUrl}
                  className="absolute inset-0 w-full h-full border-0 z-10"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              )
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-slate-900 to-slate-800">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <Play size={32} className="text-slate-600" />
                </div>
                <h3 className="text-slate-400 text-lg font-bold mb-1">Materi Preview Tekstual</h3>
                <p className="text-slate-500 max-w-xs text-xs">Pelajaran ini tidak menyertakan cuplikan video. Silakan baca intisari materi di bawah.</p>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <Zap size={18} className="text-yellow-400" />
                  <h3 className="text-white font-bold text-lg">Intisari Pelajaran</h3>
                </div>
                
                <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {lesson.description || "Detail materi sedang dipersiapkan untuk preview ini."}
                </div>
              </div>

              <div className="lg:w-72 space-y-6">
                <div className="card !bg-white/5 p-5 border-white/10">
                  <h4 className="text-white font-bold text-sm mb-4">Kenapa Kursus Ini?</h4>
                  <ul className="space-y-3">
                    {["Materi Up-to-date", "Project Based", "Akses Selamanya"].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-slate-400">
                        <CheckCircle2 size={14} className="text-emerald-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2">
                  <p className="text-xs text-slate-500 mb-4 text-center italic">
                    Dapatkan akses ke {courseTitle} sekarang juga!
                  </p>
                  <button 
                    onClick={onEnroll}
                    className="btn-primary w-full flex items-center justify-center gap-2 !py-3 font-bold group"
                  >
                    Daftar Sekarang <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
