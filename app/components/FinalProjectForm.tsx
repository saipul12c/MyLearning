"use client";

import { useState } from "react";
import { Send, Link as LinkIcon, FileText, CheckCircle, MessageSquare, AlertCircle } from "lucide-react";
import { submitFinalProject } from "@/lib/enrollment";

interface FinalProjectFormProps {
  enrollmentId: string;
  projectTitle: string;
  isCompleted: boolean;
  existingUrl?: string;
  existingNotes?: string;
  adminFeedback?: string;
  onSuccess: () => void;
}

export default function FinalProjectForm({
  enrollmentId,
  projectTitle,
  isCompleted,
  existingUrl,
  existingNotes,
  adminFeedback,
  onSuccess
}: FinalProjectFormProps) {
  const [url, setUrl] = useState(existingUrl || "");
  const [notes, setNotes] = useState(existingNotes || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      setError("Mohon masukkan URL proyek Anda (GitHub, Drive, atau Portfolio).");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await submitFinalProject(enrollmentId, url, notes);
      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || "Gagal mengirim proyek akhir. Silakan coba lagi.");
        setLoading(false); // Reset loading on error
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan sistem saat menyimpan proyek.");
      setLoading(false); // Reset loading on catch
    }
    // We don't reset loading in finally if onSuccess() is called to avoid UI flicker 
    // before the page content updates via the parent refresh.
  };

  if (isCompleted) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 text-emerald-400 mb-4">
            <CheckCircle size={24} />
            <h4 className="font-bold">Proyek Akhir Telah Dikirim</h4>
          </div>
          
          <div className="space-y-4">
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold">Tautan Proyek</p>
              <a 
                href={existingUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-cyan-400 text-sm hover:underline flex items-center gap-2 break-all"
              >
                <LinkIcon size={14} /> {existingUrl}
              </a>
            </div>

            {existingNotes && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold">Catatan Anda</p>
                <p className="text-slate-300 text-sm italic">"{existingNotes}"</p>
              </div>
            )}
          </div>
        </div>

        {adminFeedback && (
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-6 animate-in slide-in-from-top-2 duration-700">
            <div className="flex items-center gap-3 text-purple-400 mb-3">
              <MessageSquare size={20} />
              <h4 className="font-bold">Feedback Instruktur</h4>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{adminFeedback}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      <div className="space-y-4">
        <div className="relative group">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block ml-1">
            URL Submission <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors">
              <LinkIcon size={18} />
            </div>
            <input 
              type="text" 
              placeholder="https://github.com/username/project"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.07] transition-all"
            />
          </div>
        </div>

        <div className="relative group">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block ml-1">
            Catatan Tambahan (Opsional)
          </label>
          <div className="relative">
            <div className="absolute left-4 top-4 text-slate-500 group-focus-within:text-purple-400 transition-colors">
              <FileText size={18} />
            </div>
            <textarea 
              placeholder="Berikan detail cara menjalankan proyek atau informasi relevan lainnya..."
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.07] transition-all resize-none"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs animate-shake">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full !py-4 text-sm font-black uppercase tracking-[.2em] flex items-center justify-center gap-2 group shadow-xl shadow-purple-500/10"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            KIRIM PROYEK SEKARANG <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </>
        )}
      </button>

      <p className="text-[10px] text-slate-600 text-center italic">
        Catatan: Setelah dikirim, Anda dapat memperbarui tautan sebelum diverifikasi oleh instruktur.
      </p>
    </form>
  );
}
