"use client";

import { useState, useEffect, useRef } from "react";
import { Settings, Info, Database, Globe, QrCode, User as UserIcon, Link2, Save, CheckCircle, Loader2, AlertTriangle, Shield, HardDrive, Smartphone, ChevronRight, Upload } from "lucide-react";
import { useAuth } from "@/app/components/AuthContext";
import { getInstructorProfile } from "@/lib/instructor";
import { uploadQrisImage } from "@/lib/storage";
import Image from "next/image";

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [success, setSuccess] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('profile');
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const { url, error } = await uploadQrisImage(file);
      if (error) throw error;
      if (url) {
        setFormData(prev => ({ ...prev, qrisUrl: url }));
      }
    } catch (err: any) {
      alert("Gagal mengupload gambar: " + (err.message || "Kesalahan server"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    // In real app, this would save to Supabase via API
    console.log("Saving instructor settings:", formData);
  };

  if (loadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <div className="relative">
          <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full"></div>
          <Loader2 className="w-10 h-10 animate-spin relative z-10 text-purple-400" />
        </div>
        <p className="text-sm mt-6 text-slate-400 animate-pulse">Memuat pengaturan platform...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Header Section */}
      <div className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900/40 via-[#0f0a1a] to-[#0a1628] border border-white/5 p-8 md:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium mb-4">
              <Settings size={14} />
              <span>Sistem Manajemen</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Pengaturan <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Platform</span>
            </h1>
            <p className="text-slate-400 max-w-lg leading-relaxed">
              Konfigurasi profil profesional, informasi pembayaran, dan pengaturan sistem inti MyLearning.
            </p>
          </div>
          
          <div className="flex-shrink-0 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-[0_0_15px_rgba(124,58,237,0.5)]">
                {user?.email?.charAt(0).toUpperCase() || "A"}
              </div>
              <div>
                <p className="text-sm text-slate-400">Login sebagai</p>
                <p className="font-semibold text-white">{user?.email || "Administrator"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="glass-card rounded-2xl p-2 sticky top-24">
            <nav className="space-y-1">
              {[
                { id: 'profile', icon: UserIcon, label: 'Profil & Pembayaran', desc: 'Identitas & QRIS' },
                { id: 'system', icon: Database, label: 'Sistem Platform', desc: 'Versi & Engine' },
                { id: 'security', icon: Shield, label: 'Keamanan & Data', desc: 'Reset & Backup' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left flex items-start gap-3 p-3 rounded-xl transition-all duration-300 ${
                    activeTab === tab.id 
                      ? 'bg-purple-500/15 border border-purple-500/30 text-white shadow-[0_0_15px_rgba(124,58,237,0.1)]' 
                      : 'hover:bg-white/5 text-slate-400 border border-transparent'
                  }`}
                >
                  <div className={`mt-0.5 ${activeTab === tab.id ? 'text-purple-400' : 'text-slate-500'}`}>
                    <tab.icon size={18} />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{tab.label}</div>
                    <div className="text-[11px] opacity-70 mt-0.5">{tab.desc}</div>
                  </div>
                  {activeTab === tab.id && (
                    <ChevronRight size={14} className="ml-auto mt-1 text-purple-400" />
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          {/* TAB: PROFILE & PAYMENT */}
          {activeTab === 'profile' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              <div className="glass-strong rounded-3xl p-1 overflow-hidden">
                <div className="bg-[#0f0a1a] rounded-[22px] p-6 md:p-8">
                  <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
                        Profil Profesional
                      </h2>
                      <p className="text-sm text-slate-400">Informasi publik yang akan dilihat oleh siswa.</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5 block flex items-center gap-2">
                        Bio Instruktur
                      </label>
                      <textarea 
                        className="input-premium bg-white/[0.02] min-h-[120px] resize-y"
                        value={formData.bio}
                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        placeholder="Ceritakan pengalaman, keahlian, dan latar belakang Anda..."
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="group">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5 block flex items-center gap-2">
                          Website Portfolio
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-purple-400 transition-colors">
                            <Globe size={16} />
                          </div>
                          <input 
                            type="text" 
                            className="input-premium bg-white/[0.02] pl-11" 
                            value={formData.website} 
                            onChange={(e) => setFormData({...formData, website: e.target.value})}
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                      <div className="group">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5 block flex items-center gap-2">
                          Profil LinkedIn
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-purple-400 transition-colors">
                            <Link2 size={16} />
                          </div>
                          <input 
                            type="text" 
                            className="input-premium bg-white/[0.02] pl-11" 
                            value={formData.linkedin}
                            onChange={(e) => setFormData({...formData, linkedin: e.target.value})}
                            placeholder="https://linkedin.com/in/..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-strong rounded-3xl p-1 overflow-hidden">
                <div className="bg-gradient-to-br from-[#0f0a1a] to-[#1a1025] rounded-[22px] p-6 md:p-8 relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[60px] rounded-full pointer-events-none"></div>
                  
                  <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5 relative z-10">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
                        Integrasi Pembayaran
                      </h2>
                      <p className="text-sm text-slate-400">Pengaturan QRIS untuk menerima pembayaran dari siswa.</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                      <Smartphone size={20} />
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row gap-8 relative z-10">
                    <div className="flex-1 order-2 lg:order-1">
                      <label className="text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-2.5 block flex items-center gap-2">
                        <QrCode size={14} /> Gambar QRIS Aktif
                      </label>
                      <p className="text-sm text-slate-400 mb-5 leading-relaxed">
                        Gambar QRIS ini akan ditampilkan secara otomatis pada halaman checkout ketika siswa mendaftar ke kursus premium Anda. Pastikan gambar jelas dan mudah dipindai.
                      </p>
                      
                      <div className="mb-8">
                        <input 
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl border-2 border-dashed border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all duration-300 text-cyan-400 group relative overflow-hidden"
                        >
                          {isUploading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Upload size={18} />
                              </div>
                              <span className="font-medium text-sm">Klik untuk Mengunggah Gambar QRIS</span>
                            </>
                          )}
                        </button>
                        <div className="mt-4">
                          <label className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 block">Atau masukkan URL Manual</label>
                          <input 
                            type="text" 
                            className="input-premium bg-white/[0.02] border-cyan-500/20 focus:border-cyan-400 py-2.5 text-sm" 
                            placeholder="https://..."
                            value={formData.qrisUrl}
                            onChange={(e) => setFormData({...formData, qrisUrl: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={handleSave}
                          className="btn-primary flex-1 sm:flex-none justify-center px-8 py-3.5 shadow-[0_0_20px_rgba(124,58,237,0.2)] hover:shadow-[0_0_30px_rgba(124,58,237,0.4)]"
                        >
                          <Save size={18} />
                          <span>Simpan Perubahan</span>
                        </button>
                        
                        {success && (
                          <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-4 py-3 rounded-xl animate-in fade-in slide-in-from-left-4">
                            <CheckCircle size={18} />
                            <span className="text-sm font-medium">Berhasil disimpan</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="lg:w-48 order-1 lg:order-2 flex flex-col items-center">
                      <div className="relative w-full aspect-square bg-white rounded-2xl p-3 shadow-xl shadow-cyan-900/20 border-4 border-white/10 group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"></div>
                        <Image 
                          src={formData.qrisUrl} 
                          alt="QRIS Preview" 
                          fill
                          className="object-contain p-2"
                        />
                      </div>
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400 bg-white/5 px-3 py-1.5 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                        Pratinjau Langsung
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SYSTEM INFO */}
          {activeTab === 'system' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="glass-strong rounded-3xl p-1">
                <div className="bg-[#0f0a1a] rounded-[22px] p-6 md:p-8">
                  <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
                        Informasi Platform
                      </h2>
                      <p className="text-sm text-slate-400">Detail teknis sistem yang sedang berjalan.</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                      <Info size={20} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: "Nama Platform", value: "MyLearning OS", icon: Globe },
                      { label: "Versi Sistem", value: "v2.5.0 (Build 8421)", icon: HardDrive },
                      { label: "Frontend Stack", value: "Next.js 16 (App Router) + React 19", icon: Smartphone },
                      { label: "Backend / Database", value: "Supabase (PostgreSQL 15)", icon: Database },
                      { label: "Environment", value: "Production", icon: Server },
                      { label: "Regional", value: "Asia Pacific (Jakarta)", icon: MapPin },
                    ].map((item, idx) => (
                      <div key={idx} className="bg-white/5 border border-white/5 rounded-2xl p-5 hover:bg-white/[0.07] transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="text-slate-500">
                            <item.icon size={16} />
                          </div>
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{item.label}</span>
                        </div>
                        <div className="text-white font-medium text-lg ml-7">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SECURITY & DANGER */}
          {activeTab === 'security' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="rounded-3xl p-1 bg-gradient-to-b from-red-500/20 to-transparent border border-red-500/10">
                <div className="bg-[#0f0a1a] rounded-[22px] p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-red-400">Zona Berbahaya</h2>
                      <p className="text-sm text-red-500/70">Tindakan berikut bersifat permanen dan berdampak pada seluruh sistem.</p>
                    </div>
                  </div>

                  <div className="mt-8 border border-red-500/20 rounded-2xl p-6 bg-red-500/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <h3 className="text-white font-medium mb-1">Reset Database</h3>
                      <p className="text-sm text-slate-400 max-w-md">
                        Menghapus semua data pengguna, kursus, transaksi, dan log. Tindakan ini tidak dapat dibatalkan dan akan mengembalikan platform ke status awal (kosong).
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm("PERINGATAN KRITIS: Apakah Anda yakin ingin menghapus SEMUA data? Ini akan menghapus semua user, enrollment, dan pesan. Tindakan ini tidak bisa dibatalkan!")) {
                          localStorage.clear();
                          window.location.reload();
                        }
                      }}
                      className="px-6 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500 hover:text-white transition-all duration-300 whitespace-nowrap"
                    >
                      Reset Semua Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Missing icons
function Server(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
      <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
      <line x1="6" x2="6.01" y1="6" y2="6" />
      <line x1="6" x2="6.01" y1="18" y2="18" />
    </svg>
  );
}

function MapPin(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

