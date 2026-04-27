"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Plus, Trash2, Clock, StickyNote, Send, 
  ChevronRight, MessageSquare, Edit3, X 
} from "lucide-react";
import { 
  getLessonNotes, saveLessonNote, deleteLessonNote, 
  formatTimestamp, type LessonNote 
} from "@/lib/notes";

interface LessonNotesProps {
  userId: string;
  lessonId: string;
  onSeek: (seconds: number) => void;
  currentTimestamp: number;
}

export default function LessonNotes({ userId, lessonId, onSeek, currentTimestamp }: LessonNotesProps) {
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchNotes();
  }, [lessonId, userId]);

  const fetchNotes = async () => {
    setLoading(true);
    const data = await getLessonNotes(userId, lessonId);
    setNotes(data);
    setLoading(false);
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setSubmitting(true);
    
    const { success, data } = await saveLessonNote({
      userId,
      lessonId,
      content: newNote.trim(),
      videoTimestamp: Math.floor(currentTimestamp)
    });

    if (success && data) {
      setNotes(prev => [...prev, data].sort((a, b) => a.video_timestamp - b.video_timestamp));
      setNewNote("");
      setIsAdding(false);
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus catatan ini?")) return;
    const { success } = await deleteLessonNote(id, userId);
    if (success) {
      setNotes(prev => prev.filter(n => n.id !== id));
    }
  };

  return (
    <div className="mt-12 pt-12 border-t border-white/5">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
            <StickyNote size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Catatan Belajar</h3>
            <p className="text-xs text-slate-500 font-medium">Simpan poin penting berdasarkan waktu video</p>
          </div>
        </div>
        
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="btn-primary !py-2 !px-4 text-[11px] font-bold uppercase tracking-widest flex items-center gap-2"
          >
            <Plus size={16} /> Tambah Catatan
          </button>
        )}
      </div>

      {isAdding && (
        <div className="card p-6 border-cyan-500/20 bg-cyan-500/[0.02] mb-8 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-widest">
                <Clock size={14} /> {formatTimestamp(currentTimestamp)}
             </div>
             <button onClick={() => setIsAdding(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={16} />
             </button>
          </div>
          <textarea
            ref={textareaRef}
            autoFocus
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Tulis apa yang Anda pelajari di menit ini..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-all resize-none h-32 mb-4"
          />
          <div className="flex justify-end gap-3">
            <button 
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-white transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleAddNote}
              disabled={submitting || !newNote.trim()}
              className="btn-primary !py-2 !px-6 flex items-center gap-2 text-xs font-bold"
            >
              {submitting ? "Menyimpan..." : <><Send size={14} /> Simpan Catatan</>}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center py-10 gap-3">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500">Memuat catatan...</p>
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-16 bg-white/[0.01] rounded-[2rem] border border-dashed border-white/5">
          <Edit3 size={48} className="text-slate-800 mx-auto mb-4" />
          <p className="text-slate-500 italic text-sm max-w-xs mx-auto">Belum ada catatan. Klik tombol di atas untuk mencatat poin penting dari video.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {notes.map((note) => (
            <div key={note.id} className="group card p-5 border-white/5 hover:border-cyan-500/30 bg-white/[0.01] transition-all flex gap-5 items-start">
              <button 
                onClick={() => onSeek(note.video_timestamp)}
                className="w-14 h-14 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 flex flex-col items-center justify-center border border-cyan-500/20 shrink-0 transition-colors group-hover:scale-105"
                title="Klik untuk putar video di waktu ini"
              >
                <Clock size={16} className="mb-0.5" />
                <span className="text-[10px] font-black">{formatTimestamp(note.video_timestamp)}</span>
              </button>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-300 leading-relaxed pt-1">
                  {note.content}
                </p>
                <div className="flex items-center justify-between mt-4">
                   <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                      Dibuat {new Date(note.created_at).toLocaleDateString()}
                   </span>
                   <button 
                    onClick={() => handleDelete(note.id)}
                    className="text-slate-700 hover:text-red-400 p-1.5 opacity-0 group-hover:opacity-100 transition-all"
                    title="Hapus Catatan"
                   >
                     <Trash2 size={14} />
                   </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
