"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/components/AuthContext";
import { getActiveEnrollment, getUserEnrollments, getAllEnrollmentsAdmin, getRemainingDays, getContactMessages, getContactMessageStats } from "@/lib/enrollment";
import { getAllRegisteredUsers, getUserCount, type SafeUser } from "@/lib/auth";
import { getCourses, getCourseCount } from "@/lib/courses";
import { getLevelLabel, type Enrollment } from "@/lib/enrollment";
import Link from "next/link";
import { BookOpen, Users, Award, Clock, TrendingUp, AlertTriangle, ArrowRight, CheckCircle, XCircle, MessageSquare, Loader2 } from "lucide-react";
import Skeleton, { SkeletonCircle } from "../components/ui/Skeleton";
import InstructorDashboard from "../components/InstructorDashboard";
import ErrorState from "../components/ui/ErrorState";
import SignatureManager from "../components/SignatureManager";

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();

  if (!user) return null;

  if (isAdmin) return <AdminDashboard userId={user.id} />;
  if (user.role === "instructor") return <InstructorDashboard userId={user.id} userName={user.fullName} />;
  return <UserDashboard userId={user.id} userName={user.fullName} />;
}

function UserDashboard({ userId, userName }: { userId: string; userName: string }) {
  const [activeEnrollment, setActiveEnrollment] = useState<Enrollment | null>(null);
  const [allEnrollments, setAllEnrollments] = useState<Enrollment[]>([]);
  const [courseCount, setCourseCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [active, all, count] = await Promise.all([
        getActiveEnrollment(userId),
        getUserEnrollments(userId),
        getCourseCount()
      ]);
      setActiveEnrollment(active);
      setAllEnrollments(all);
      setCourseCount(count);
    } catch (err: any) {
      console.error("Dashboard error:", err);
      setError("Gagal memuat data dashboard. Silakan coba lagi nanti.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  if (error) {
    return (
      <div className="py-12">
        <ErrorState 
          message={error} 
          onRetry={() => fetchData()} 
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-5xl space-y-8 animate-fade-in">
        <div className="space-y-2">
          <Skeleton className="w-64 h-8" />
          <Skeleton className="w-48 h-4 rounded-full" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
        <div className="grid sm:grid-cols-2 gap-4">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </div>
    );
  }

  const completed = allEnrollments.filter((e) => e.status === "completed").length;
  const expired = allEnrollments.filter((e) => e.status === "expired").length;
  const remaining = activeEnrollment ? getRemainingDays(activeEnrollment) : 0;

  return (
    <div className="max-w-5xl space-y-8 animate-fade-in">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Selamat Datang, <span className="gradient-text">{userName.split(" ")[0]}</span>! 👋
        </h1>
        <p className="text-slate-400 text-sm mt-1">Lihat progress belajar Anda hari ini</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: BookOpen, label: "Total Kursus", value: allEnrollments.length, color: "text-purple-400", bg: "from-purple-500/15 to-purple-500/5" },
          { icon: CheckCircle, label: "Selesai", value: completed, color: "text-emerald-400", bg: "from-emerald-500/15 to-emerald-500/5" },
          { icon: XCircle, label: "Expired", value: expired, color: "text-red-400", bg: "from-red-500/15 to-red-500/5" },
          { icon: Clock, label: "Aktif", value: activeEnrollment ? 1 : 0, color: "text-cyan-400", bg: "from-cyan-500/15 to-cyan-500/5" },
        ].map((stat) => (
          <div key={stat.label} className="card p-5 group hover:border-white/20 transition-all duration-300">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <stat.icon size={20} className={stat.color} />
            </div>
            <p className="text-2xl font-bold text-white tracking-tight">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-widest">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Active Course */}
      {activeEnrollment ? (
        <div className="card p-6 border-purple-500/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h2 className="text-lg font-bold text-white">Kursus Aktif Saat Ini</h2>
            <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full glass ${remaining <= 5 ? "text-red-400 border-red-500/20" : "text-amber-400 border-amber-500/20"}`}>
              <Clock size={14} />
              {remaining} hari tersisa
            </div>
          </div>
          <h3 className="text-white font-bold text-xl mb-4 relative z-10">{activeEnrollment.courseTitle}</h3>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="flex-1 h-3 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 shadow-[0_0_10px_rgba(168,85,247,0.5)] transition-all duration-1000 ease-out"
                style={{ width: `${activeEnrollment.progress}%` }}
              />
            </div>
            <span className="text-sm font-bold text-white">{activeEnrollment.progress}%</span>
          </div>
          <p className="text-xs text-slate-500 mb-6 font-medium">
            <span className="text-white font-bold">{activeEnrollment.completedLessons.length}</span> / {activeEnrollment.totalLessons} pelajaran selesai
          </p>
          <Link href="/dashboard/my-courses" className="btn-primary text-sm !py-2.5 px-6 inline-flex w-auto relative z-10 font-bold">
            Lanjutkan Belajar <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="card p-10 text-center relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
            <BookOpen size={32} className="text-slate-600 group-hover:text-purple-400 transition-colors" />
          </div>
          <h3 className="text-white font-bold text-lg mb-2">Belum Ada Kursus Aktif</h3>
          <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">Mulai perjalanan belajar Anda dengan mengambil kursus pertama yang menarik!</p>
          <Link href="/dashboard/courses" className="btn-primary text-sm !py-2.5 px-8 inline-flex w-auto font-bold">
            Jelajahi Kursus <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/dashboard/courses" className="card p-6 group flex items-center gap-4 hover:border-purple-500/30 transition-all">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform group-hover:bg-purple-500/20">
            <BookOpen size={24} className="text-purple-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-base group-hover:text-purple-300 transition-colors">Jelajahi Kursus</h3>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{courseCount} kursus tersedia</p>
          </div>
        </Link>
        <Link href="/dashboard/my-courses" className="card p-6 group flex items-center gap-4 hover:border-cyan-500/30 transition-all">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center group-hover:scale-110 transition-transform group-hover:bg-cyan-500/20">
            <Award size={24} className="text-cyan-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-base group-hover:text-cyan-300 transition-colors">Riwayat & Sertifikat</h3>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{completed} sertifikat tersedia</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

function AdminDashboard({ userId }: { userId: string }) {
  const [allUsers, setAllUsers] = useState<SafeUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [allEnrollments, setAllEnrollments] = useState<Enrollment[]>([]);
  const [totalEnrollments, setTotalEnrollments] = useState(0);
  const [messages, setMessages] = useState<any[]>([]);
  const [courseCount, setCourseCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [userCountValue, enrollResult, msgStats, count] = await Promise.all([
        getUserCount(),
        getAllEnrollmentsAdmin(),
        getContactMessageStats(),
        getCourseCount()
      ]);
      
      setTotalUsers(userCountValue);
      setAllUsers([]); // Keeping for compatibility, but count is prioritized
      setAllEnrollments(enrollResult.data);
      setTotalEnrollments(enrollResult.totalCount);
      setMessages({ length: msgStats.total, unread: msgStats.unread } as any);
      setCourseCount(count);
    } catch (err: any) {
      console.error("Admin Dashboard error:", err);
      setError("Gagal memuat data statistik admin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const unread = (messages as any).unread || 0;

  if (error) {
    return (
      <div className="py-20">
        <ErrorState 
          message={error} 
          onRetry={() => fetchData()} 
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="w-56 h-8" />
            <Skeleton className="w-40 h-4 rounded-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="w-32 h-10 rounded-xl" />
            <Skeleton className="w-32 h-10 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Admin <span className="gradient-text">Dashboard</span></h1>
          <p className="text-slate-400 text-sm mt-1">Overview & Real-time Platform Statistics</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/admin/courses" className="btn-primary text-xs !py-2.5 px-4 flex items-center gap-2 font-bold group">
            <BookOpen size={14} className="group-hover:scale-110 transition-transform" />
            Manajemen Kursus
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: "Total Pengguna", value: totalUsers, color: "text-purple-400", bg: "from-purple-500/15 to-purple-500/5" },
          { icon: BookOpen, label: "Total Kursus", value: courseCount, color: "text-cyan-400", bg: "from-cyan-500/15 to-cyan-500/5" },
          { icon: TrendingUp, label: "Total Enrollment", value: totalEnrollments, color: "text-emerald-400", bg: "from-emerald-500/15 to-emerald-500/5" },
          { icon: MessageSquare, label: "Pesan Baru", value: unread, color: "text-amber-400", bg: "from-amber-500/15 to-amber-500/5" },
        ].map((stat) => (
          <div key={stat.label} className="card p-5 group hover:border-white/20 transition-all duration-300">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <stat.icon size={20} className={stat.color} />
            </div>
            <p className="text-2xl font-bold text-white tracking-tight">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-widest">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Enrollments & Signature */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card p-8 relative overflow-hidden group h-full">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-3xl rounded-full" />
            <div className="flex items-center justify-between mb-6 relative z-10 border-b border-white/5 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                 <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
                 Enrollment Terbaru
              </h2>
              <Link href="/dashboard/admin/enrollments" className="text-xs font-bold text-purple-400 hover:text-purple-300 uppercase tracking-widest flex items-center gap-1 group">
                 Lihat Semua 
                 <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            {allEnrollments.length > 0 ? (
              <div className="space-y-1 relative z-10">
                {allEnrollments.slice(0, 5).map((enr: Enrollment) => {
                  return (
                    <div key={enr.id} className="flex items-center justify-between py-4 border-b border-white/5 last:border-0 hover:bg-white/5 -mx-4 px-4 rounded-xl transition-colors group/item">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-slate-400 group-hover/item:border-purple-500/30 border border-transparent transition-colors">
                          {enr.userName?.substring(0, 2).toUpperCase() || "??"}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{enr.userName || "Siswa"}</p>
                          <p className="text-xs text-slate-500 font-medium">{enr.courseTitle}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full glass ${
                        enr.status === "active" ? "text-cyan-400 border-cyan-500/20" :
                        enr.status === "completed" ? "text-emerald-400 border-emerald-500/20" :
                        enr.status === "waiting_verification" ? "text-amber-400 border-amber-500/20" :
                        "text-red-400 border-red-500/20"
                      }`}>
                        {enr.status === "active" ? "Aktif" : enr.status === "completed" ? "Selesai" : 
                         enr.status === "waiting_verification" ? "Verifikasi" : enr.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 relative z-10">
                <TrendingUp size={48} className="text-slate-800 mx-auto mb-4" />
                <p className="text-sm text-slate-500 font-medium font-bold uppercase tracking-tighter">Belum ada enrollment yang tercatat</p>
              </div>
            )}
          </div>
        </div>
        <div className="lg:col-span-1">
          <SignatureManager userId={userId} role="admin" />
        </div>
      </div>
    </div>
  );
}
