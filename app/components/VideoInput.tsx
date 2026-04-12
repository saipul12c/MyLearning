"use client";

import { useState, useRef } from "react";
import { Upload, Link as LinkIcon, X, Loader2, PlayCircle, CheckCircle, FileVideo, AlertCircle } from "lucide-react";
import { uploadVideo } from "@/lib/storage";

interface VideoInputProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
}

export default function VideoInput({ value, onChange, label, placeholder }: VideoInputProps) {
  const [mode, setMode] = useState<"url" | "upload">(value?.startsWith("http") || !value ? "url" : "upload");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);
    
    // 1 GB Limit Check handled by lib/storage.ts but good to check here too
    if (file.size > 1024 * 1024 * 1024) {
      setError("File terlalu besar. Maksimal 1 GB.");
      setIsUploading(false);
      return;
    }

    const { url, error: uploadError } = await uploadVideo(file);
    
    if (uploadError) {
      setError(uploadError.message || "Gagal mengunggah video.");
    } else if (url) {
      onChange(url);
    }
    
    setIsUploading(false);
  };

  const isExternal = value?.startsWith("http");
  const isYoutube = value?.toLowerCase().includes("youtube.com") || value?.toLowerCase().includes("youtu.be");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        {label && <label className="text-sm font-semibold text-slate-300">{label}</label>}
        <div className="flex bg-white/5 p-1 rounded-lg border border-white/5 gap-1">
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
              mode === "url" ? "bg-purple-500 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <LinkIcon size={12} /> External Link
          </button>
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
              mode === "upload" ? "bg-purple-500 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Upload size={12} /> Upload File
          </button>
        </div>
      </div>

      <div className="relative">
        {mode === "url" ? (
          <div className="relative">
            <LinkIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder || "https://youtube.com/watch?v=..."}
              className="input !pl-11 w-full"
            />
          </div>
        ) : (
          <div className="space-y-3">
            {!value || isExternal ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative h-24 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                  isUploading ? "border-purple-500/50 bg-purple-500/5" : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]"
                }`}
              >
                {isUploading ? (
                  <>
                    <Loader2 size={24} className="text-purple-400 animate-spin mb-2" />
                    <p className="text-xs text-purple-400 font-bold animate-pulse uppercase tracking-widest">Mengunggah Video (Maks 1GB)...</p>
                  </>
                ) : (
                  <>
                    <FileVideo size={24} className="text-slate-500 mb-2" />
                    <p className="text-xs text-slate-400 font-medium">Klik untuk pilih video atau drag & drop</p>
                    <p className="text-[10px] text-slate-600 mt-1 uppercase font-bold tracking-tighter">MP4, WebM up to 1GB</p>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept="video/*" 
                />
              </div>
            ) : (
              <div className="card p-4 flex items-center justify-between border-purple-500/20 bg-purple-500/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Video Berhasil Diunggah</p>
                    <p className="text-[10px] text-slate-500 truncate max-w-[200px]">{value}</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => onChange("")}
                  className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 mt-2 text-red-400 text-xs font-medium animate-in fade-in slide-in-from-top-1">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {/* Video Preview Badge */}
        {value && !isUploading && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 w-fit animate-in zoom-in-95 duration-300">
            {isYoutube ? <PlayCircle size={14} className="text-red-400" /> : <PlayCircle size={14} className="text-emerald-400" />}
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">
              Preview Terdeteksi: {isYoutube ? "YouTube Embed" : "Direct Link"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
