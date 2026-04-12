"use client";

import { useState, useEffect } from "react";
import { Settings, Info, Database, Globe, QrCode, User as UserIcon, Link2, Save, CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/app/components/AuthContext";
import { getInstructorProfile } from "@/lib/instructor";
import Image from "next/image";

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [success, setSuccess] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [formData, setFormData] = useState({
    bio: "",
    website: "",
    linkedin: "",
    qrisUrl: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=Default-Pay"
  });
  
  useEffect(() => {
    async function loadProfile() {
      if (!user?.id) return;
      
      try {
        const profile = await getInstructorProfile(user.id);
        if (profile) {
          setFormData({
            bio: profile.bio || "",
            website: profile.website_url || "https://mylearning.io",
            linkedin: profile.linkedin_url || "https://linkedin.com/in/mylearning",
            qrisUrl: profile.qris_url || "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=Default-Pay"
          });
        }
      } catch (err) {
        console.error("Failed to load instructor profile:", err);
      } finally {
        setLoadingProfile(false);
      }
    }

    loadProfile();
  }, [user?.id]);

  const handleSave = () => {
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    // In real app, this would save to Supabase via API
    console.log("Saving instructor settings:", formData);
  };

  if (loadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-purple-500" />
        <p className="text-sm">Memuat profil...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Pengaturan <span className="gradient-text">Platform</span></h1>
        <p className="text-slate-400 text-sm mt-1">Konfigurasi dan informasi platform</p>
      </div>

      {/* Instructor Profile (QRIS Management) */}
      <div className="card p-6 border-purple-500/20">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <UserIcon size={18} className="text-purple-400" /> Profil Profesional & Pembayaran
          </h3>
          {success && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full animate-in fade-in zoom-in duration-300">
              <CheckCircle size={12} /> Tersimpan
            </span>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-widest mb-2 block">Bio Instruktur</label>
            <textarea 
              className="input text-sm"
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              placeholder="Ceritakan pengalaman Anda..."
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-widest mb-2 block">Website / Portfolio</label>
              <div className="relative">
                <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text" 
                  className="input !pl-9 text-sm" 
                  value={formData.website} 
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-widest mb-2 block">LinkedIn</label>
              <div className="relative">
                <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text" 
                  className="input !pl-9 text-sm" 
                  value={formData.linkedin}
                  onChange={(e) => setFormData({...formData, linkedin: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <label className="text-xs text-slate-500 uppercase tracking-widest mb-2 block flex items-center gap-2">
                  <QrCode size={14} className="text-cyan-400" /> Foto QRIS Pembayaran
                </label>
                <p className="text-[11px] text-slate-500 mb-4 italic">
                  QRIS ini akan muncul kepada siswa saat mereka mendaftar kursus Anda. Masukkan URL gambar QRIS Anda.
                </p>
                <input 
                  type="text" 
                  className="input text-sm mb-4" 
                  placeholder="URL Gambar QRIS..."
                  value={formData.qrisUrl}
                  onChange={(e) => setFormData({...formData, qrisUrl: e.target.value})}
                />
                <button 
                  onClick={handleSave}
                  className="btn-primary !py-2 text-sm w-full md:w-auto px-8"
                >
                  Simpan Perubahan <Save size={16} />
                </button>
              </div>
              
              <div className="w-full md:w-40" key="qris-preview">
                <div className="bg-white p-2 rounded-lg aspect-square flex items-center justify-center shadow-lg shadow-purple-500/10">
                  <Image 
                    src={formData.qrisUrl} 
                    alt="Current QRIS" 
                    width={150} 
                    height={150} 
                    className="object-contain"
                  />
                </div>
                <p className="text-center text-[10px] text-slate-500 mt-2">Pratinjau QRIS Aktif</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Info */}
      <div className="card p-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Info size={18} className="text-purple-400" /> Informasi Platform</h3>
        <div className="space-y-3">
          {[
            { label: "Nama Platform", value: "MyLearning" },
            { label: "Versi", value: "2.0.0" },
            { label: "Framework", value: "Next.js 16 + React 19" },
            { label: "Database", value: "Supabase (PostgreSQL)" },
            { label: "Bahasa", value: "Bahasa Indonesia" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <span className="text-sm text-slate-400">{item.label}</span>
              <span className="text-sm text-white font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card p-6 border-red-500/20">
        <h3 className="text-red-400 font-semibold mb-4">Zona Berbahaya</h3>
        <p className="text-slate-400 text-sm mb-4">Tindakan berikut bersifat permanen dan tidak dapat dibatalkan.</p>
        <button
          onClick={() => {
            if (confirm("Hapus SEMUA data? Ini akan menghapus semua user, enrollment, dan pesan. Tidak bisa dibatalkan!")) {
              localStorage.clear();
              window.location.reload();
            }
          }}
          className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
        >
          Reset Semua Data
        </button>
      </div>
    </div>
  );
}
