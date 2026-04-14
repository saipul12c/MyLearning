"use client";

import { useState, useEffect } from "react";
import { getInstructorCourses, getInstructorStats } from "@/lib/instructor";
import { type Course } from "@/lib/data";
import Link from "next/link";
import { BookOpen, Users, Star, ArrowRight, Plus, Clock, TrendingUp, Award, ExternalLink, Megaphone } from "lucide-react";
import Skeleton from "./ui/Skeleton";
import SignatureManager from "./SignatureManager";

interface InstructorDashboardProps {
  userId: string;
  userName: string;
}

export default function InstructorDashboard({ userId, userName }: InstructorDashboardProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState({ totalStudents: 0, totalCourses: 0, rating: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [coursesData, statsData] = await Promise.all([
        getInstructorCourses(userId),
        getInstructorStats(userId)
      ]);
      setCourses(coursesData);
      setStats(statsData);
      setLoading(false);
    };
    fetchData();
  }, [userId]);

  if (loading) {
    return (
      <div className="max-w-6xl space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <Skeleton className="w-64 h-8" />
          <Skeleton className="w-32 h-10 rounded-xl" />
        </div>
        <div className="grid grid-cols-3 gap-4">
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
          <h1 className="text-2xl font-bold text-white tracking-tight">Instructor <span className="gradient-text">Panel</span></h1>
          <p className="text-slate-400 text-sm mt-1">Hello, Instructor {userName.split(" ")[0]}! Kelola materi dan murid Anda.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/ads" className="btn-secondary text-xs !py-2.5 px-4 flex items-center gap-2 font-bold group border-white/10 hover:border-purple-500/30">
            <Megaphone size={14} className="group-hover:scale-110 transition-transform text-purple-400" />
            Promosi Saya
          </Link>
          <Link href="/dashboard/admin/courses/new" className="btn-primary text-xs !py-2.5 px-4 flex items-center gap-2 font-bold group">
            <Plus size={14} className="group-hover:rotate-90 transition-transform" />
            Buat Kursus Baru
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: "Total Murid", value: stats.totalStudents, color: "text-purple-400", bg: "from-purple-500/15 to-purple-500/5" },
          { icon: BookOpen, label: "Kursus Diajar", value: stats.totalCourses, color: "text-cyan-400", bg: "from-cyan-500/15 to-cyan-500/5" },
          { icon: Star, label: "Rating Instruktur", value: stats.rating.toFixed(1), color: "text-amber-400", bg: "from-amber-500/15 to-amber-500/5" },
          { icon: TrendingUp, label: "Status Akun", value: stats.totalCourses > 0 ? "Aktif" : "Menunggu Kursus", color: stats.totalCourses > 0 ? "text-emerald-400" : "text-amber-400", bg: stats.totalCourses > 0 ? "from-emerald-500/15 to-emerald-500/5" : "from-amber-500/15 to-amber-500/5" },
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

      {/* Course Management */}
      <div className="card p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-3xl rounded-full" />
        <div className="flex items-center justify-between mb-6 relative z-10 border-b border-white/5 pb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
             <div className="w-1.5 h-6 bg-cyan-500 rounded-full" />
             Kursus Yang Anda Kelola
          </h2>
          <Link href="/dashboard/admin/courses" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-widest flex items-center gap-1 group">
             Manajemen Penuh 
             <ExternalLink size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {courses.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-4 relative z-10">
            {courses.map((course) => (
              <div key={course.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group/item flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${course.isPublished ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' : 'text-slate-500 border-white/5 bg-white/5'}`}>
                      {course.isPublished ? "PUBLISHED" : "DRAFT"}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{course.level}</span>
                  </div>
                  <h3 className="text-white font-bold text-sm mb-4 line-clamp-1">{course.title}</h3>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Users size={14} className="text-purple-400" />
                      <span>{course.totalStudents} Murid</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Star size={14} className="text-amber-400" />
                      <span>{course.rating.toFixed(1)} Rating</span>
                    </div>
                  </div>
                </div>
                <Link 
                  href={`/dashboard/admin/courses/${course.id}`}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-white transition-all border border-white/5"
                >
                  Edit Materi <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 relative z-10">
            <BookOpen size={48} className="text-slate-800 mx-auto mb-4" />
            <p className="text-sm text-slate-500 font-medium font-bold uppercase tracking-tighter">Anda belum memiliki kursus yang diajar</p>
            <Link href="/dashboard/admin/courses/new" className="text-cyan-400 text-xs mt-2 inline-block hover:underline">Mulai Buat Kursus Sekarang</Link>
          </div>
        )}
      </div>

      {/* Quick Tips & Signature */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4 h-full">
            <div className="card p-6 bg-purple-500/5 border-purple-500/10">
               <h4 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                 <Clock size={16} className="text-purple-400" /> Tips Instruktur
               </h4>
               <p className="text-slate-400 text-xs leading-relaxed">
                 Pastikan materi video Anda memiliki kualitas audio yang jelas. Siswa cenderung memberikan rating lebih tinggi pada kursus dengan audio jernih.
               </p>
            </div>
            <div className="card p-6 bg-cyan-500/5 border-cyan-500/10">
               <h4 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                 <Award size={16} className="text-cyan-400" /> Engagement Siswa
               </h4>
               <p className="text-slate-400 text-xs leading-relaxed">
                 Gunakan Proyek Akhir untuk menguji kreativitas siswa. Nilai hasil kerja mereka untuk memberikan pengalaman belajar yang personal.
               </p>
            </div>
          </div>
        </div>
        <div className="lg:col-span-1">
          <SignatureManager userId={userId} role="instructor" />
        </div>
      </div>
    </div>
  );
}
