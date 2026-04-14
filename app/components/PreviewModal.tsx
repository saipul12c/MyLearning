"use client";

import { useEffect, useState, useRef } from "react";
import { X, Play, Zap, CheckCircle2, ChevronRight, ChevronLeft, Lock } from "lucide-react";
import { Lesson } from "@/lib/data";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface PreviewModalProps {
  lesson: Lesson;
  allPreviews: Lesson[];
  courseTitle: string;
  onClose: () => void;
  onLessonChange: (lesson: Lesson) => void;
  onEnroll: () => void;
}

export default function PreviewModal({ 
  lesson, 
  allPreviews, 
  courseTitle, 
  onClose, 
  onLessonChange, 
  onEnroll 
}: PreviewModalProps) {
  const [timeLimitReached, setTimeLimitReached] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Reset limit when lesson changes
  useEffect(() => {
    setTimeLimitReached(false);
    
    // If it's a video (and specifically YouTube or similar via iframe)
    // we use a generic timer as a fallback since iframe events are restricted
    if (lesson.videoUrl && !lesson.videoUrl.match(/\.(mp4|webm|ogg)$/)) {
      const timer = setTimeout(() => {
        setTimeLimitReached(true);
      }, 60000); // 60 seconds
      return () => clearTimeout(timer);
    }
  }, [lesson.id, lesson.videoUrl]);

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (e.currentTarget.currentTime >= 60) {
      setTimeLimitReached(true);
      if (videoRef.current) {
        videoRef.current.pause();
      }
    }
  };

  
  const currentIndex = allPreviews.findIndex(p => p.id === lesson.id);
  const nextLesson = currentIndex < allPreviews.length - 1 ? allPreviews[currentIndex + 1] : null;
  const prevLesson = currentIndex > 0 ? allPreviews[currentIndex - 1] : null;

  // Truncation logic (500 chars)
  const fullContent = lesson.description || "Detail materi sedang dipersiapkan untuk preview ini.";
  const isTruncated = fullContent.length > 500;
  const displayContent = isTruncated ? fullContent.substring(0, 500) + "..." : fullContent;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-[#0f0f1a] rounded-2xl border border-white/10 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl scale-in-center">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block">Free Preview</span>
              {allPreviews.length > 1 && (
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">
                  {currentIndex + 1} of {allPreviews.length}
                </span>
              )}
            </div>
            <h2 className="text-white font-bold text-lg leading-tight">{lesson.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          {/* Video Placeholder or Embed */}
          <div className="aspect-video bg-black relative border-b border-white/5 overflow-hidden">
            {lesson.videoUrl ? (
              <>
                {lesson.videoUrl.match(/\.(mp4|webm|ogg)$/) ? (
                  <video
                    key={lesson.videoUrl}
                    ref={videoRef}
                    src={lesson.videoUrl}
                    onTimeUpdate={handleTimeUpdate}
                    controls
                    autoPlay
                    className="absolute inset-0 w-full h-full z-10"
                  />
                ) : (
                  <iframe
                    key={lesson.videoUrl}
                    src={`${lesson.videoUrl}${lesson.videoUrl.includes('?') ? '&' : '?'}autoplay=1&controls=1`}
                    className="absolute inset-0 w-full h-full border-0 z-10"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                )}

                {/* Video Lock Overlay */}
                {timeLimitReached && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-500 p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-4 border border-purple-500/30">
                      <Lock size={32} className="text-purple-400" />
                    </div>
                    <h3 className="text-white font-bold text-xl mb-2">Pratinjau Berakhir</h3>
                    <p className="text-slate-400 text-sm max-w-xs mb-6">Sisa materi ini dikunci untuk pratinjau gratis. Daftar sekarang untuk akses penuh.</p>
                    <button 
                      onClick={onEnroll}
                      className="px-8 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/25"
                    >
                      Daftar Kursus Sekarang
                    </button>
                  </div>
                )}
              </>
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

          {/* Content Area */}
          <div className="p-8">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-yellow-400/10 flex items-center justify-center">
                    <Zap size={18} className="text-yellow-400" />
                  </div>
                  <h3 className="text-white font-bold text-lg">Intisari Pelajaran</h3>
                </div>
                
                <div className="prose prose-invert max-w-none prose-sm 
                  prose-p:text-slate-300 prose-p:leading-relaxed prose-p:mb-5
                  prose-headings:text-white prose-headings:mt-8 prose-headings:mb-4 prose-headings:font-bold
                  prose-li:text-slate-300 prose-li:my-2
                  prose-strong:text-purple-400 prose-strong:font-bold
                  prose-code:text-cyan-300 prose-code:bg-cyan-500/10 prose-code:px-1 prose-code:rounded
                  prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/5 prose-pre:p-4
                ">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {displayContent}
                  </ReactMarkdown>
                </div>

                {isTruncated && (
                    <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 relative overflow-hidden group">
                        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                                    <Lock size={18} className="text-purple-400" />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-sm">Ingin materi lengkap?</h4>
                                    <p className="text-xs text-slate-400">Daftar kursus untuk mengakses seluruh isi materi ini.</p>
                                </div>
                            </div>
                            <button 
                                onClick={onEnroll}
                                className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-purple-500/20"
                            >
                                Daftar Sekarang
                            </button>
                        </div>
                        {/* Decorative blur */}
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-purple-500/10 blur-3xl rounded-full"></div>
                    </div>
                )}
              </div>

              {/* Sidebar Info */}
              <div className="lg:w-72 space-y-6">
                <div className="card !bg-white/5 p-5 border-white/10">
                  <h4 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    Benefit Kursus
                  </h4>
                  <ul className="space-y-3">
                    {["Materi Up-to-date", "Project Based", "Akses Selamanya", "Sertifikat Digital"].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-[11px] text-slate-400">
                        <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2">
                    <div className="text-[10px] text-slate-500 mb-4 text-center italic uppercase tracking-tighter">
                        Bersiap untuk Mahir di {courseTitle}
                    </div>
                    <button 
                        onClick={onEnroll}
                        className="btn-primary w-full flex items-center justify-center gap-2 !py-4 font-bold group shadow-xl shadow-purple-500/10"
                    >
                        Daftar Sekarang <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Footer */}
        {allPreviews.length > 1 && (
            <div className="px-6 py-4 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
                <button 
                    disabled={!prevLesson}
                    onClick={() => prevLesson && onLessonChange(prevLesson)}
                    className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                    <ChevronLeft size={16} /> Materi Sebelumnya
                </button>
                <div className="hidden sm:flex items-center gap-1.5">
                    {allPreviews.map((p, idx) => (
                        <div 
                            key={p.id} 
                            className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentIndex ? "bg-purple-500 w-4" : "bg-white/10"}`}
                        ></div>
                    ))}
                </div>
                <button 
                    disabled={!nextLesson}
                    onClick={() => nextLesson && onLessonChange(nextLesson)}
                    className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                    Materi Berikutnya <ChevronRight size={16} />
                </button>
            </div>
        )}
      </div>
    </div>
  );
}
