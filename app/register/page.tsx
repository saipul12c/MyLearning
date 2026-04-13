"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, UserIcon } from "lucide-react";
import { useAuth } from "@/app/components/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoggedIn } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      router.push("/dashboard");
    }
  }, [isLoggedIn, router]);

  if (isLoggedIn) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Password dan konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      const result = await register(fullName, email, password);
      if (result.success) {
        router.push("/dashboard");
      } else {
        setError(result.error || "Registrasi gagal.");
      }
    } catch (err: any) {
      setError("Terjadi kesalahan koneksi saat mendaftarkan akun.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center hero-bg grid-pattern py-12 px-4">
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center">
              <BookOpen size={24} className="text-white" />
            </div>
            <span className="text-2xl font-bold">
              <span className="gradient-text">My</span>
              <span className="text-white">Learning</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-4">Buat Akun Baru</h1>
          <p className="text-slate-400 text-sm mt-1">Mulai perjalanan belajar Anda bersama kami</p>
        </div>

        {/* Form Card */}
        <div className="card p-8">
          {error && (
            <div className="flex items-center gap-2 p-3 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Nama Lengkap</label>
              <div className="relative">
                <UserIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="register-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  className="input !pl-11"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="input !pl-11"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="input !pl-11 !pr-11"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Konfirmasi Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="register-confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password"
                  className="input !pl-11"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full !py-3 text-base"
              id="register-submit"
            >
              {loading ? "Memproses..." : "Daftar Sekarang"}
              <ArrowRight size={18} />
            </button>
            <p className="text-[11px] text-slate-500 text-center leading-relaxed">
              Dengan mendaftar, Anda menyetujui{" "}
              <Link href="/privasi" className="text-purple-400 hover:text-purple-300 underline underline-offset-4 decoration-purple-400/30">Kebijakan Privasi & Layanan</Link>
              {" "}kami.
            </p>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              Sudah punya akun?{" "}
              <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                Masuk
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
