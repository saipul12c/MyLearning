"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";
import { useAuth } from "@/app/components/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoggedIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        router.push("/dashboard");
      } else {
        setError(result.error || "Login gagal.");
      }
    } catch (err: any) {
      setError("Terjadi kesalahan koneksi.");
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
          <h1 className="text-2xl font-bold text-white mt-4">Selamat Datang Kembali</h1>
          <p className="text-slate-400 text-sm mt-1">Masuk ke akun Anda untuk melanjutkan belajar</p>
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
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="login-email"
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
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input !pl-11 !pr-11"
                  required
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

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full !py-3 text-base"
              id="login-submit"
            >
              {loading ? "Memproses..." : "Masuk"}
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              Belum punya akun?{" "}
              <Link href="/register" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                Daftar Sekarang
              </Link>
            </p>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-xs text-slate-500 font-medium mb-2">Demo Admin:</p>
            <p className="text-xs text-slate-400">Email: admin@mylearning.id</p>
            <p className="text-xs text-slate-400">Password: admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
