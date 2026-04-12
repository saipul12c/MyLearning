"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/components/AuthContext";
import { getActiveEnrollment, getUserEnrollments, getAllEnrollmentsAdmin, getRemainingDays, getContactMessages } from "@/lib/enrollment";
import { getAllRegisteredUsers, type SafeUser } from "@/lib/auth";
import { syncDataToDatabase } from "@/lib/sync-db";
import { getCourses } from "@/lib/courses";
import { getLevelLabel, type Enrollment } from "@/lib/enrollment";
import Link from "next/link";
import { BookOpen, Users, Award, Clock, TrendingUp, AlertTriangle, ArrowRight, CheckCircle, XCircle, MessageSquare, Loader2 } from "lucide-react";
import Skeleton, { SkeletonCircle } from "../components/ui/Skeleton";
import InstructorDashboard from "../components/InstructorDashboard";

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();

  if (!user) return null;

  if (isAdmin) return <AdminDashboard />;
  if (user.role === "instructor") return <InstructorDashboard userId={user.id} userName={user.fullName} />;
  return <UserDashboard userId={user.id} userName={user.fullName} />;
}

function UserDashboard({ userId, userName }: { userId: string; userName: string }) {
  const [activeEnrollment, setActiveEnrollment] = useState<Enrollment | null>(null);
  const [allEnrollments, setAllEnrollments] = useState<Enrollment[]>([]);
  const [courseCount, setCourseCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [active, all, dbCourses] = await Promise.all([
        getActiveEnrollment(userId),
        getUserEnrollments(userId),
        getCourses()
      ]);
      setActiveEnrollment(active);
      setAllEnrollments(all);
      setCourseCount(dbCourses.length);
      setLoading(false);
    };
    fetchData();
  }, [userId]);

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

function AdminDashboard() {
  const [allUsers, setAllUsers] = useState<SafeUser[]>([]);
  const [allEnrollments, setAllEnrollments] = useState<Enrollment[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [courseCount, setCourseCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    if (!confirm("Sinkronisasi semua data dari lib/data.ts ke Database? Tindakan ini akan meng-update metadata kursus Anda.")) return;
    setSyncing(true);
    const res = await syncDataToDatabase();
    setSyncing(false);
    if (res.success) alert("Sinkronisasi berhasil!");
    else alert("Gagal: " + res.error);
  };

  useEffect(() => {
    const fetchData = async () => {
      const [users, enrollments, msgs, dbCourses] = await Promise.all([
        getAllRegisteredUsers(),
        getAllEnrollmentsAdmin(),
        getContactMessages(),
        getCourses()
      ]);
      
      setAllUsers(users);
      setAllEnrollments(enrollments);
      setMessages(msgs);
      setCourseCount(dbCourses.length);
      setLoading(false);
    };
    fetchData();
  }, []);

  const unread = messages.filter((m: any) => m.status === "unread").length;

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
          <button 
            onClick={handleSync}
            disabled={syncing}
            className="btn-secondary text-xs !py-2.5 px-4 flex items-center gap-2 font-bold group"
          >
            <TrendingUp size={14} className={syncing ? "animate-spin" : "group-hover:scale-110 transition-transform"} />
            {syncing ? "Syncing..." : "Sync Lokal ke Database"}
          </button>
          <Link href="/dashboard/admin/courses" className="btn-primary text-xs !py-2.5 px-4 flex items-center gap-2 font-bold group">
            <BookOpen size={14} className="group-hover:scale-110 transition-transform" />
            Manajemen Kursus
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: "Total Pengguna", value: allUsers.length, color: "text-purple-400", bg: "from-purple-500/15 to-purple-500/5" },
          { icon: BookOpen, label: "Total Kursus", value: courseCount, color: "text-cyan-400", bg: "from-cyan-500/15 to-cyan-500/5" },
          { icon: TrendingUp, label: "Total Enrollment", value: allEnrollments.length, color: "text-emerald-400", bg: "from-emerald-500/15 to-emerald-500/5" },
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

      {/* Recent Enrollments */}
      <div className="card p-8 relative overflow-hidden group">
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
            {allEnrollments.slice(-5).reverse().map((enr: Enrollment) => {
              const enrollUser = allUsers.find((u: SafeUser) => u.id === enr.userId);
              return (
                <div key={enr.id} className="flex items-center justify-between py-4 border-b border-white/5 last:border-0 hover:bg-white/5 -mx-4 px-4 rounded-xl transition-colors group/item">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-slate-400 group-hover/item:border-purple-500/30 border border-transparent transition-colors">
                      {enrollUser?.fullName?.substring(0, 2).toUpperCase() || "??"}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{enrollUser?.fullName || "Akun Terhapus"}</p>
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
  );
}
