"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/components/AuthContext";
import { 
  User, Mail, Phone, Lock, CheckCircle, AlertCircle, 
  Shield, Calendar, Award, Upload, Loader2, Link2, 
  Globe, Briefcase, GraduationCap, Eye, Trash2,
  Ticket, ChevronRight, PieChart, ExternalLink
} from "lucide-react";
import SocialIcon from "@/app/components/SocialIcon";
import Link from "next/link";
import { uploadAvatar } from "@/lib/storage";
import { supabase } from "@/lib/supabase";

type TabType = "umum" | "profesional" | "keamanan" | "voucher";

export default function ProfilePage() {
  const { user, updateProfile, changePassword, isAdmin, isInstructor } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("umum");
  
  // General State
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  
  // Professional State
  const [linkedin, setLinkedin] = useState(user?.linkedin || "");
  const [twitter, setTwitter] = useState(user?.twitter || "");
  const [instagram, setInstagram] = useState(user?.instagram || "");
  const [github, setGithub] = useState(user?.github || "");
  const [website, setWebsite] = useState(user?.website || "");
  const [specialization, setSpecialization] = useState(user?.specialization || "");
  const [experience, setExperience] = useState(user?.experience || "");

  // UI State
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [vouchersCount, setVouchersCount] = useState(0);

  useEffect(() => {
    if (user?.id) {
       supabase.from('voucher_wallet')
         .select('id', { count: 'exact', head: true })
         .eq('user_id', user.id)
         .eq('is_used', false)
         .then(({ count }) => setVouchersCount(count || 0));
    }
  }, [user?.id]);

  if (!user) return null;

  const calculateCompleteness = () => {
    let score = 0;
    if (user.avatarUrl) score += 20;
    if (user.fullName) score += 20;
    if (user.phone) score += 15;
    if (user.bio) score += 15;
    if (user.linkedin || user.website || user.twitter || user.instagram || user.github) score += 15;
    if (user.specialization) score += 15;
    return Math.min(100, score);
  };

  const completeness = calculateCompleteness();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsSaving(true);
    
    const updates = { 
      fullName, phone, bio, avatarUrl,
      linkedin, twitter, instagram, github,
      website, specialization, experience
    };

    const result = await updateProfile(updates);
    setIsSaving(false);
    
    setMessage(result.success
      ? { type: "success", text: "Profil berhasil diperbarui!" }
      : { type: "error", text: result.error || "Gagal memperbarui profil." }
    );
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Password baru tidak cocok." });
      return;
    }
    setIsSaving(true);
    const result = await changePassword(newPassword);
    setIsSaving(false);

    if (result.success) {
      setMessage({ type: "success", text: "Password berhasil diubah! Sesi tetap aktif." });
      setOldPassword(""); setNewPassword(""); setConfirmPassword("");
    } else {
      setMessage({ type: "error", text: result.error || "Gagal mengubah password." });
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const { url, error } = await uploadAvatar(file);
    setIsUploading(false);
    if (error) {
      setMessage({ type: "error", text: "Gagal mengunggah foto: " + error.message });
    } else if (url) {
      setAvatarUrl(url);
      setMessage({ type: "success", text: "Foto diunggah! Klik Simpan untuk mempermanenkan." });
    }
  };

  const initials = user.fullName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();

  return (
    <div className="max-w-5xl space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Pengaturan <span className="gradient-text">Profil</span></h1>
          <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-bold">Personal & Professional Identity</p>
        </div>
        <Link 
          href={`/profile/${user.id}`} 
          target="_blank"
          className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all text-sm font-bold group"
        >
          <Eye size={18} className="text-purple-400 group-hover:scale-110 transition-transform" />
          Lihat Profil Publik
          <ExternalLink size={14} className="text-slate-600" />
        </Link>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Sidebar Mini Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card p-8 text-center flex flex-col items-center">
            <div className="relative group mb-6">
              <div className="w-28 h-28 rounded-3xl overflow-hidden bg-gradient-to-br from-purple-500 to-cyan-400 p-1 shadow-2xl shadow-purple-500/20">
                <div className="w-full h-full rounded-[22px] overflow-hidden bg-[#0c0c14] flex items-center justify-center border-4 border-[#0c0c14]">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-black text-white opacity-40">{initials}</span>
                  )}
                </div>
              </div>
              <label className="absolute inset-0 bg-black/60 rounded-3xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all backdrop-blur-sm border-2 border-purple-500/50">
                {isUploading ? <Loader2 size={24} className="animate-spin text-white" /> : <Upload size={24} className="text-white mb-1" />}
                <span className="text-[10px] text-white font-bold uppercase tracking-wider">Ganti Foto</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploading} />
              </label>
            </div>
            
            <h2 className="text-xl font-bold text-white mb-1">{user.fullName}</h2>
            <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
               {isAdmin && <span className="badge badge-primary !text-[9px]"><Shield size={10} className="mr-1" /> Admin</span>}
               {isInstructor && <span className="badge badge-accent !text-[9px]"><Award size={10} className="mr-1" /> Instructor</span>}
               <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-white/5 px-2 py-1 rounded-full flex items-center gap-1">
                 <Calendar size={10} /> Sejak {new Date(user.createdAt).getFullYear()}
               </span>
            </div>

            <div className="w-full space-y-2 mt-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-500 font-bold uppercase tracking-wider">Kelengkapan Profil</span>
                <span className="text-white font-black">{completeness}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-1000"
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </div>
          </div>

          <Link href="/dashboard/vouchers" className="card p-6 flex items-center justify-between group hover:border-purple-500/40 transition-all border-dashed">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400 group-hover:scale-110 transition-transform">
                 <Ticket size={24} />
               </div>
               <div>
                 <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Voucher Tersedia</p>
                 <p className="text-xl font-black text-white">{vouchersCount} <span className="text-xs text-slate-600 font-normal">Klaim</span></p>
               </div>
            </div>
            <ChevronRight className="text-slate-600 group-hover:text-purple-400 transform group-hover:translate-x-1 transition-all" />
          </Link>
        </div>

        {/* Main Forms */}
        <div className="lg:col-span-8 space-y-6">
          {/* Tabs */}
          <div className="flex items-center gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
            {(['umum', 'profesional', 'keamanan', 'voucher'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-shrink-0 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                  activeTab === tab 
                  ? "bg-white/10 text-white shadow-lg border border-white/10" 
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {message && (
            <div className={`flex items-center gap-3 p-4 rounded-2xl text-sm animate-in fade-in slide-in-from-top-4 ${
              message.type === "success" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border border-red-500/20 text-red-400"
            }`}>
              {message.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <p className="font-medium">{message.text}</p>
            </div>
          )}

          <div className="card p-8">
            {activeTab === "umum" && (
              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Nama Lengkap</label>
                    <div className="relative group">
                      <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                      <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-premium !pl-12" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Email</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" />
                      <input type="email" value={user.email} disabled className="input-premium !pl-12 opacity-40 cursor-not-allowed bg-black/20" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Telepon</label>
                  <div className="relative group">
                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-premium !pl-12" placeholder="+62 xxx" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Bio Singkat</label>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="input-premium min-h-[120px]" placeholder="Bagikan sedikit tentang diri Anda..." />
                </div>

                <div className="pt-4">
                  <button type="submit" disabled={isSaving} className="btn-primary w-full md:w-auto min-w-[180px]">
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            )}

            {activeTab === "profesional" && (
              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">LinkedIn Profile</label>
                    <div className="relative group">
                      <Link2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                      <input type="url" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className="input-premium !pl-12" placeholder="https://linkedin.com/in/..." />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Website Pribadi</label>
                    <div className="relative group">
                      <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                      <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className="input-premium !pl-12" placeholder="https://yourwebsite.com" />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Instagram</label>
                    <div className="relative group">
                      <SocialIcon name="instagram" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-pink-500 transition-colors" />
                      <input type="url" value={instagram} onChange={(e) => setInstagram(e.target.value)} className="input-premium !pl-12" placeholder="https://instagram.com/..." />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Twitter (X)</label>
                    <div className="relative group">
                      <SocialIcon name="twitter" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                      <input type="url" value={twitter} onChange={(e) => setTwitter(e.target.value)} className="input-premium !pl-12" placeholder="https://twitter.com/..." />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">GitHub Profile</label>
                   <div className="relative group">
                     <SocialIcon name="github" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white transition-colors" />
                     <input type="url" value={github} onChange={(e) => setGithub(e.target.value)} className="input-premium !pl-12" placeholder="https://github.com/..." />
                   </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Spesialisasi & Keahlian</label>
                  <div className="relative group">
                    <Award size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="text" value={specialization} onChange={(e) => setSpecialization(e.target.value)} className="input-premium !pl-12" placeholder="Contoh: Web Development, Digital Marketing" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Pengalaman Profesional</label>
                  <textarea value={experience} onChange={(e) => setExperience(e.target.value)} className="input-premium min-h-[120px]" placeholder="Ceritakan riwayat karier atau proyek utama Anda..." />
                </div>

                <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                  <p className="text-xs text-amber-500/80 leading-relaxed italic">
                    <Shield size={12} className="inline mr-1" /> Data profesional ini akan ditampilkan secara publik di halaman pengajar/profil untuk meningkatkan kredibilitas Anda.
                  </p>
                </div>

                <div className="pt-4">
                  <button type="submit" disabled={isSaving} className="btn-primary w-full md:w-auto min-w-[180px]">
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : "Update Data Karir"}
                  </button>
                </div>
              </form>
            )}

            {activeTab === "keamanan" && (
              <div className="space-y-8">
                <form onSubmit={handlePasswordChange} className="space-y-6">
                  <h4 className="text-sm font-bold text-white uppercase tracking-widest">Ganti Password</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Password Baru</label>
                      <div className="relative">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-premium !pl-12" required minLength={6} placeholder="Min. 6 karakter" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Konfirmasi Password Baru</label>
                      <div className="relative">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-premium !pl-12" required minLength={6} />
                      </div>
                    </div>
                  </div>
                  <button type="submit" disabled={isSaving} className="btn-primary">
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : "Perbarui Password"}
                  </button>
                </form>

                <div className="pt-8 border-t border-white/5">
                  <h4 className="text-sm font-bold text-red-500 uppercase tracking-widest mb-4">Zona Bahaya</h4>
                  <div className="p-5 bg-red-500/5 border border-red-500/10 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <p className="text-sm text-white font-bold mb-1">Nonaktifkan Akun</p>
                      <p className="text-xs text-slate-500">Seluruh data akses Anda akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.</p>
                    </div>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all text-xs font-bold">
                      <Trash2 size={16} /> Tutup Akun
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "voucher" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <h4 className="text-sm font-bold text-white uppercase tracking-widest">Informasi Voucher</h4>
                   <Link href="/dashboard/vouchers" className="text-xs text-purple-400 font-bold hover:underline flex items-center gap-1">
                     Buka Dompet <ExternalLink size={12} />
                   </Link>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-6 bg-white/[0.02] rounded-3xl border border-white/5">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Voucher Tersedia</p>
                    <p className="text-3xl font-black text-white">{vouchersCount}</p>
                  </div>
                  <div className="p-6 bg-white/[0.02] rounded-3xl border border-white/5">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Efisiensi Belanja</p>
                    <p className="text-3xl font-black text-emerald-400">Premium</p>
                  </div>
                </div>

                <div className="card p-6 border-dashed border-white/10 flex flex-col items-center justify-center text-center">
                  <Ticket size={40} className="text-slate-800 mb-4" />
                  <p className="text-sm text-slate-400 mb-4 px-6 leading-relaxed">Gunakan voucher belanja Anda dari wallet untuk mendapatkan potongan harga spesial setiap kali checkout kursus baru.</p>
                  <Link href="/courses" className="btn-secondary !text-xs !py-2">Jelajahi Kursus</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

