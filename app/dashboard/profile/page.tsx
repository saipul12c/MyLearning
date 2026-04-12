"use client";

import { useState } from "react";
import { useAuth } from "@/app/components/AuthContext";
import { User, Mail, Phone, FileText, Lock, CheckCircle, AlertCircle, Shield, Calendar, Award, Upload, Loader2 } from "lucide-react";
import { uploadAvatar } from "@/lib/storage";

export default function ProfilePage() {
  const { user, updateProfile, changePassword } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [isUploading, setIsUploading] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passMsg, setPassMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!user) return null;

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    const result = await updateProfile({ fullName, phone, bio, avatarUrl });
    setProfileMsg(result.success
      ? { type: "success", text: "Profil berhasil diperbarui!" }
      : { type: "error", text: result.error || "Gagal memperbarui profil." }
    );
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);
    if (newPassword !== confirmPassword) {
      setPassMsg({ type: "error", text: "Password baru tidak cocok." });
      return;
    }
    const result = await changePassword(newPassword);
    if (result.success) {
      setPassMsg({ type: "success", text: "Password berhasil diubah! Sesi Anda tetap aktif." });
      setOldPassword(""); setNewPassword(""); setConfirmPassword("");
    } else {
      setPassMsg({ type: "error", text: result.error || "Gagal mengubah password." });
    }
  };

  const initials = user.fullName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const { url, error } = await uploadAvatar(file);
    setIsUploading(false);
    if (error) {
      setProfileMsg({ type: "error", text: "Gagal mengunggah foto: " + error.message });
    } else if (url) {
      setAvatarUrl(url);
      setProfileMsg({ type: "success", text: "Foto diunggah! Jangan lupa klik Simpan Perubahan." });
    }
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Pengaturan <span className="gradient-text">Profil</span></h1>
        <p className="text-slate-400 text-sm mt-1">Kelola informasi akun Anda</p>
      </div>

      {/* Avatar + Info */}
      <div className="card p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
        <div className="relative group shrink-0">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center text-white text-2xl font-bold border-2 border-white/10">
            {avatarUrl ? (
               <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
            ) : (
               initials
            )}
          </div>
          <label className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity backdrop-blur-sm">
            {isUploading ? <Loader2 size={24} className="animate-spin text-white" /> : <Upload size={24} className="text-white" />}
            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploading} />
          </label>
        </div>
        <div className="flex-1">
          <h2 className="text-white font-semibold text-lg">{user.fullName}</h2>
          <p className="text-slate-400 text-sm">{user.email}</p>
          <div className="flex items-center gap-2 mt-1">
            {user.role === "admin" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-xs font-medium">
                <Shield size={10} /> Admin
              </span>
            )}
            {user.role === "instructor" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 text-xs font-medium border border-purple-500/10">
                <Award size={10} /> Instructor
              </span>
            )}
            <span className="text-xs text-slate-600 flex items-center gap-1">
              <Calendar size={10} /> Bergabung: {new Date(user.createdAt).toLocaleDateString("id-ID")}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Profile */}
      <div className="card p-6">
        <h3 className="text-white font-semibold mb-5">Informasi Profil</h3>
        {profileMsg && (
          <div className={`flex items-center gap-2 p-3 mb-5 rounded-xl text-sm ${
            profileMsg.type === "success" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border border-red-500/20 text-red-400"
          }`}>
            {profileMsg.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />} {profileMsg.text}
          </div>
        )}
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Nama Lengkap</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input !pl-10" required />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="email" value={email} disabled className="input !pl-10 opacity-50 cursor-not-allowed" />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Email tidak dapat diubah dari panel ini.</p>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Telepon</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input !pl-10" placeholder="+62 xxx" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="input" rows={3} placeholder="Ceritakan tentang diri Anda..." />
          </div>
          <button type="submit" className="btn-primary text-sm !py-2.5">Simpan Perubahan</button>
        </form>
      </div>

      {/* Change Password */}
      <div className="card p-6">
        <h3 className="text-white font-semibold mb-5">Ubah Password</h3>
        {passMsg && (
          <div className={`flex items-center gap-2 p-3 mb-5 rounded-xl text-sm ${
            passMsg.type === "success" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border border-red-500/20 text-red-400"
          }`}>
            {passMsg.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />} {passMsg.text}
          </div>
        )}
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Password Lama</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className="input !pl-10" required />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Password Baru</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input !pl-10" required minLength={6} />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Konfirmasi Password Baru</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input !pl-10" required minLength={6} />
            </div>
          </div>
          <button type="submit" className="btn-primary text-sm !py-2.5">Ubah Password</button>
        </form>
      </div>
    </div>
  );
}
