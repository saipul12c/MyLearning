"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ChevronRight, ChevronLeft, CheckCircle, PlayCircle, BookOpen, Clock, ArrowRight } from "lucide-react";
import { type Lesson } from "@/lib/data";
import DiscussionSection from "./DiscussionSection";

interface LessonPlayerProps {
  courseTitle: string;
  lessons: Lesson[];
  currentLessonId: string;
  completedLessonIds: string[];
  onClose: () => void;
  onToggleComplete: (lessonId: string) => Promise<void>;
  onNavigate: (lessonId: string) => void;
}

export default function LessonPlayer({
  courseTitle,
  lessons,
  currentLessonId,
  completedLessonIds,
  onClose,
  onToggleComplete,
  onNavigate,
}: LessonPlayerProps) {
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const found = lessons.find((l) => l.id === currentLessonId) || lessons[0];
    setActiveLesson(found);
  }, [currentLessonId, lessons]);

  if (!activeLesson) return null;

  const currentIndex = lessons.findIndex((l) => l.id === activeLesson.id);
  const nextLesson = lessons[currentIndex + 1];
  const prevLesson = lessons[currentIndex - 1];
  const isCompleted = completedLessonIds.includes(activeLesson.id);

  const handleToggleComplete = async () => {
    setIsSyncing(true);
    await onToggleComplete(activeLesson.id);
    setIsSyncing(false);
  };

  // Enhanced Markdown-lite Parser
  const parseContent = (content: string) => {
    if (!content) return null;
    
    return content.split("\n").map((line, i) => {
      let processed = line;
      
      // Handle Headings
      if (processed.startsWith("# ")) {
        return <h1 key={i} className="text-3xl font-black text-white mt-10 mb-6 border-b border-white/10 pb-4">{processed.replace("# ", "").trim()}</h1>;
      }
      if (processed.startsWith("## ")) {
        return <h2 key={i} className="text-2xl font-bold text-white mt-8 mb-4">{processed.replace("## ", "").trim()}</h2>;
      }
      if (processed.startsWith("### ")) {
        return <h3 key={i} className="text-xl font-bold text-slate-200 mt-6 mb-3">{processed.replace("### ", "").trim()}</h3>;
      }
      
      // Handle Lists
      if (processed.trim().startsWith("- ")) {
        return (
          <li key={i} className="flex gap-3 text-slate-400 mb-2 items-start ml-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 shrink-0" />
            <span>{processInline(processed.trim().replace("- ", ""))}</span>
          </li>
        );
      }
      if (/^\d+\./.test(processed.trim())) {
        const match = processed.trim().match(/^(\d+)\.(.*)/);
        return (
          <li key={i} className="flex gap-3 text-slate-400 mb-2 items-start ml-2">
            <span className="text-purple-400 font-bold min-w-[1.25rem]">{match?.[1]}.</span>
            <span>{processInline(match?.[2] || "")}</span>
          </li>
        );
      }
      
      // Empty line
      if (!processed.trim()) return <div key={i} className="h-4" />;
      
      // Normal Paragraph
      return <p key={i} className="text-slate-400 leading-relaxed mb-4">{processInline(processed)}</p>;
    });
  };

  // Helper for inline formatting (Bold, Italic, Links)
  const processInline = (text: string) => {
    let elements: (string | any)[] = [text];
    
    // Bold: **text**
    elements = elements.flatMap(el => {
      if (typeof el !== 'string') return el;
      const parts = el.split(/(\*\*.*?\*\*)/g);
      return parts.map((p, idx) => p.startsWith('**') && p.endsWith('**') ? <strong key={idx} className="text-white font-black">{p.slice(2, -2)}</strong> : p);
    });

    // Italic: *text*
    elements = elements.flatMap(el => {
      if (typeof el !== 'string') return el;
      const parts = el.split(/(\*.*?\*)/g);
      return parts.map((p, idx) => p.startsWith('*') && p.endsWith('*') ? <em key={idx} className="text-slate-200 italic">{p.slice(1, -1)}</em> : p);
    });

    // Links: [text](url)
    elements = elements.flatMap(el => {
      if (typeof el !== 'string') return el;
      const parts = el.split(/(\[.*?\]\(.*?\))/g);
      return parts.map((p, idx) => {
        const match = p.match(/\[(.*?)\]\((.*?)\)/);
        return match ? <a key={idx} href={match[2]} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline underline-offset-4 decoration-purple-500/30 transition-colors font-medium">{match[1]}</a> : p;
      });
    });

    return elements;
  };

  return typeof document !== "undefined" ? createPortal(
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col lg:flex-row animate-fade-in overflow-hidden">
      {/* Sidebar - Video & Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar">
        {/* Header Area */}
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
              <X size={20} />
            </button>
            <div className="hidden sm:block">
              <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">{courseTitle}</p>
              <h1 className="text-sm font-bold text-white truncate max-w-[300px]">{activeLesson.title}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="hidden md:flex items-center gap-2 mr-4">
                <div className="h-1.5 w-32 bg-white/5 rounded-full overflow-hidden">
                   <div 
                    className="h-full bg-purple-500 rounded-full transition-all duration-500" 
                    style={{ width: `${(completedLessonIds.length / lessons.length) * 100}%` }}
                   />
                </div>
                <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">
                  {completedLessonIds.length}/{lessons.length} SELESAI
                </span>
             </div>
             <button 
              onClick={handleToggleComplete}
              disabled={isSyncing}
              className={`btn-primary !py-2 !px-4 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 ${isCompleted ? "!bg-emerald-500 !text-white" : ""}`}
             >
              {isSyncing ? "Syncing..." : isCompleted ? (
                <><CheckCircle size={14} /> Selesai</>
              ) : (
                "Tandai Selesai"
              )}
             </button>
          </div>
        </div>

        {/* Video Area */}
        <div className="bg-black aspect-video w-full relative group">
          {activeLesson.videoUrl ? (
            <iframe
              src={activeLesson.videoUrl.includes("youtube.com/embed") 
                ? activeLesson.videoUrl 
                : activeLesson.videoUrl.replace("watch?v=", "embed/")}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-500">
               <PlayCircle size={64} className="mb-4 opacity-20" />
               <p className="text-sm font-medium">Video tidak tersedia untuk materi ini</p>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="max-w-4xl mx-auto w-full p-8 md:p-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-8 border-b border-white/5">
             <div>
               <h2 className="text-3xl font-bold text-white mb-2">{activeLesson.title}</h2>
               <div className="flex items-center gap-4 text-sm text-slate-500">
                 <span className="flex items-center gap-1.5"><Clock size={16} /> {activeLesson.durationMinutes} Menit</span>
                 <span className="flex items-center gap-1.5"><BookOpen size={16} /> Pelajaran {currentIndex + 1} of {lessons.length}</span>
               </div>
             </div>
             
             <div className="flex gap-2">
                <button 
                  disabled={!prevLesson}
                  onClick={() => onNavigate(prevLesson!.id)}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  disabled={!nextLesson}
                  onClick={() => onNavigate(nextLesson!.id)}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={20} />
                </button>
             </div>
          </div>

          <div className="prose prose-invert max-w-none">
             {activeLesson.description ? (
                parseContent(activeLesson.description)
             ) : (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                   <BookOpen size={48} className="text-slate-700 mx-auto mb-4" />
                   <p className="text-slate-500 italic">Materi tertulis tidak tersedia untuk sesi ini. Silakan tonton video di atas untuk memahami isi pelajaran.</p>
                </div>
             )}
          </div>

          {nextLesson && (
            <div className="mt-16 p-8 rounded-3xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 flex flex-col md:flex-row items-center justify-between gap-6 group">
               <div>
                 <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-2">Selanjutnya</p>
                 <h4 className="text-xl font-bold text-white">{nextLesson.title}</h4>
               </div>
               <button 
                onClick={() => onNavigate(nextLesson.id)}
                className="btn-primary !py-3 !px-8 flex items-center gap-2 font-bold group-hover:scale-105 transition-transform"
               >
                 Lanjut Belajar <ArrowRight size={18} />
               </button>
            </div>
          )}

          <DiscussionSection lessonId={activeLesson.id} />
        </div>
      </div>

      {/* Sidebar - Lesson List */}
      <div className="w-full lg:w-[350px] bg-slate-900 border-l border-white/5 flex flex-col h-full overflow-hidden shrink-0">
         <div className="p-6 border-b border-white/5">
            <h3 className="text-white font-bold text-lg mb-1">Daftar Materi</h3>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{lessons.length} Materi Kursus</p>
         </div>
         
         <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
            {lessons.map((lesson, idx) => {
              const isCurrent = lesson.id === activeLesson.id;
              const isDone = completedLessonIds.includes(lesson.id);
              
              return (
                <button
                  key={lesson.id}
                  onClick={() => onNavigate(lesson.id)}
                  className={`w-full flex items-start gap-4 p-4 rounded-2xl transition-all group relative ${
                    isCurrent ? "bg-purple-500/15 border border-purple-500/30 ring-1 ring-purple-500/20" : 
                    "hover:bg-white/5 border border-transparent"
                  }`}
                >
                  {isCurrent && <div className="absolute left-0 top-4 bottom-4 w-1 bg-purple-500 rounded-r-full" />}
                  <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 border text-[10px] font-bold transition-colors ${
                    isDone ? "bg-emerald-500 border-emerald-500 text-white" : 
                    isCurrent ? "border-purple-500 text-purple-400" : 
                    "border-slate-700 text-slate-500 group-hover:border-slate-500"
                  }`}>
                    {isDone ? <CheckCircle size={14} /> : idx + 1}
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-bold transition-colors ${
                      isCurrent ? "text-white" : "text-slate-400 group-hover:text-slate-300"
                    }`}>
                      {lesson.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-slate-600 uppercase tracking-tighter">
                      <span className="flex items-center gap-1"><Clock size={10} /> {lesson.durationMinutes} Min</span>
                      {lesson.isFreePreview && <span className="text-amber-500/80 border border-amber-500/20 px-1.5 rounded">Free</span>}
                    </div>
                  </div>
                </button>
              );
            })}
         </div>

         <div className="p-6 border-t border-white/5 bg-slate-900/80 backdrop-blur-sm">
            <button 
              onClick={onClose}
              className="w-full btn-secondary !py-3 flex items-center justify-center gap-2 font-bold text-xs"
            >
              Kembali ke Dashboard
            </button>
         </div>
      </div>
    </div>,
    document.body
  ) : null;
}
