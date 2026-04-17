"use client";

import { useState, useEffect } from "react";
import { getCourses, deleteCourse } from "@/lib/courses";
import { type Course } from "@/lib/data";
import Link from "next/link";
import { Plus, Edit2, Trash2, Search, ArrowLeft, ExternalLink, Zap, Sparkles, RefreshCw, Loader2, Library, ChevronDown } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/app/components/AuthContext";
import { getInstructorProfile } from "@/lib/instructor";

export default function AdminCoursesPage() {
  const { user, isAdmin, isInstructor } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [refCourses, setRefCourses] = useState<Course[]>([]); // Global reference courses
  const [instructorProfile, setInstructorProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refLoading, setRefLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft'>('all');
  const [refPage, setRefPage] = useState(1);
  const [refTotal, setRefTotal] = useState(0);
  const [stats, setStats] = useState({
    totalCourses: 0,
    activeStudents: 0,
    avgRating: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    if (user) {
      initialFetch();
    }
  }, [user, isAdmin, isInstructor]);

  async function initialFetch() {
    setLoading(true);
    try {
      const { getCourseCount } = await import("@/lib/courses");
      const [count] = await Promise.all([
          getCourseCount(),
          fetchCourses(),
          fetchReferenceCourses(1)
      ]);
      setRefTotal(count);
    } catch (err) {
      console.error("Initial fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCourses() {
    if (!user) return;
    
    try {
      let data: Course[] = [];
      let profile = null;

      if (isInstructor && !isAdmin) {
        const { getInstructorCourses, getInstructorProfile } = await import("@/lib/instructor");
        [data, profile] = await Promise.all([
          getInstructorCourses(user.id),
          getInstructorProfile(user.id)
        ]);
      } else {
        const { getAllCoursesAdmin } = await import("@/lib/courses");
        data = await getAllCoursesAdmin();
      }

      setCourses(data);
      setInstructorProfile(profile);

      const totalStudents = data.reduce((acc, c) => acc + (c.totalStudents || 0), 0);
      const avgRating = data.length > 0 
        ? data.reduce((acc, c) => acc + (c.rating || 0), 0) / data.length 
        : 0;
      
      setStats({
        totalCourses: data.length,
        activeStudents: totalStudents,
        avgRating: avgRating,
        totalRevenue: 0 
      });
    } catch (error) {
      console.error("Error loading courses:", error);
    }
  }

  /**
   * Fetches global reference courses with pagination (Supports billions of rows logic)
   */
  async function fetchReferenceCourses(page: number) {
    if (!user) return;
    setRefLoading(true);
    try {
      const { getCourses } = await import("@/lib/courses");
      const pageSize = 6;
      
      const data = await getCourses({
          page,
          pageSize,
          status: 'published'
      });

      // Replace data for pagination
      setRefCourses(data);
      setRefPage(page);
    } catch (error) {
        console.error("Error fetching reference courses:", error);
    } finally {
        setRefLoading(false);
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus kursus "${title}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    const res = await deleteCourse(id);
    if (res.success) {
      alert("Kursus berhasil dihapus");
      setCourses(courses.filter(c => String(c.id) !== id));
    } else {
      alert("Gagal menghapus: " + JSON.stringify(res.error));
    }
  };

  const filteredCourses = courses.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'active' && c.isPublished) ||
                          (statusFilter === 'draft' && !c.isPublished);
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-6xl space-y-12 pb-20 animate-fade-in relative">
      {/* Background Glow */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-600/10 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute top-1/2 -right-24 w-96 h-96 bg-blue-600/5 blur-[120px] pointer-events-none rounded-full" />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all group border border-white/5">
            <ArrowLeft size={20} className="text-slate-400 group-hover:text-white transition-colors" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Manajemen <span className="gradient-text">Kursus</span></h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-0.5">
              {isAdmin ? "Admin Controller" : "Instructor Workspace"}
            </p>
          </div>
        </div>
        
        <Link href="/dashboard/admin/courses/new" className="btn-primary flex items-center gap-2 !h-12 px-6 !text-[11px] !font-black !uppercase !tracking-[0.2em] shadow-2xl shadow-purple-500/20 active:scale-95 transition-transform">
          <Plus size={18} />
          Tambah Kursus
        </Link>
      </div>

      {/* Stats Overview Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {[
          { label: "Total Asset", value: stats.totalCourses, icon: Edit2, color: "text-purple-400", bg: "bg-purple-500/10" },
          { label: "Total Murid", value: stats.activeStudents, icon: Search, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Engagement", value: `${stats.avgRating.toFixed(1)} ⭐`, icon: Sparkles, color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "Publikasi", value: `${courses.filter(c => c.isPublished).length}/${courses.length}`, icon: ExternalLink, color: "text-emerald-400", bg: "bg-emerald-500/10" },
        ].map((item, i) => (
          <div key={i} className="card p-5 border-white/5 bg-[#0c0c14]/80 backdrop-blur-md group hover:border-white/10 transition-all flex items-center gap-5">
            <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center group-hover:scale-110 transition-all duration-500 rotate-3 group-hover:rotate-0`}>
              <item.icon size={20} />
            </div>
            <div>
               <p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-400/50 mb-0.5">{item.label}</p>
               <p className="text-2xl font-black text-white leading-tight tracking-tighter">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* My Content Area */}
      <div className="space-y-6 relative z-10">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
           <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
              <div className="w-8 h-[1px] bg-slate-800" /> Kurikulum Saya
           </h2>
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:max-w-[200px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" size={14} />
                <input
                type="text"
                placeholder="Cari..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-[11px] text-white font-medium focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-slate-800"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/5 h-fit">
                {['all', 'active', 'draft'].map((btn) => (
                <button 
                    key={btn}
                    onClick={() => setStatusFilter(btn as any)}
                    className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                    statusFilter === btn 
                        ? 'bg-purple-500 text-white shadow-lg' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                    {btn}
                </button>
                ))}
            </div>
          </div>
        </div>

        {/* Course List Table */}
        <div className="card border-white/5 bg-[#0c0c14]/40 backdrop-blur-sm shadow-2xl overflow-hidden rounded-[2rem]">
          {loading ? (
            <div className="p-24 text-center">
              <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-6" />
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Sinkronisasi Database...</p>
            </div>
          ) : filteredCourses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01]">
                    <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] w-[42%]">Entitas Kursus</th>
                    <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] w-[18%]">Spesialisasi</th>
                    <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] w-[15%]">Investasi</th>
                    <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] w-[12%]">Status</th>
                    <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] w-[13%] text-right">Opsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredCourses.map((course: any) => (
                    <tr key={course.id} className="hover:bg-purple-500/[0.03] transition-all group">
                      <td className="p-4">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-9 rounded-xl bg-slate-900 overflow-hidden flex-shrink-0 border border-white/5 group-hover:border-purple-500/30 transition-all group-hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                            {course.thumbnail ? (
                              <Image 
                                src={course.thumbnail} 
                                alt="" 
                                width={56} 
                                height={36} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[7px] font-black uppercase text-slate-800">Media</div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-slate-200 font-black text-sm truncate group-hover:text-white transition-colors uppercase tracking-tight">{course.title}</p>
                            <div className="flex items-center gap-3 mt-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                    <div className="w-1 h-1 rounded-full bg-purple-500" /> ID: {course.slug}
                                </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate group-hover:text-purple-300 transition-colors">{course.category}</span>
                          <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1">
                             <div className="w-1 h-1 rounded-full bg-slate-700" /> {course.level}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-xs font-black text-white bg-slate-900/50 w-fit px-3 py-1.5 rounded-xl border border-white/5 group-hover:border-purple-500/20 transition-all">
                          {course.price === 0 ? "GRATIS" : `IDR ${course.price.toLocaleString("id-ID")}`}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest ${
                          course.isPublished 
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}>
                          <div className={`w-1 h-1 rounded-full ${course.isPublished ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                          {course.isPublished ? "Live" : "Draft"}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                          <Link 
                            href={`/courses/${course.slug}`} 
                            target="_blank"
                            className="p-2.5 rounded-xl bg-white/5 text-slate-500 hover:text-white hover:bg-white/10 transition-all"
                          >
                            <ExternalLink size={14} />
                          </Link>
                          {(isAdmin || (isInstructor && instructorProfile && course.instructorId === instructorProfile.slug)) && (
                            <>
                              <Link 
                                href={`/dashboard/admin/courses/${course.id}/edit`}
                                className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 hover:text-white hover:bg-purple-500 transition-all shadow-xl shadow-purple-500/10"
                              >
                                <Edit2 size={14} />
                              </Link>
                              <button 
                                onClick={() => handleDelete(course.id, course.title)}
                                className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:text-white hover:bg-red-500 transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-32 text-center bg-white/[0.01]">
                <div className="w-20 h-20 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center mx-auto mb-6 opacity-40">
                    <Plus size={32} className="text-slate-600" />
                </div>
                <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-xs">Aset Kosong</p>
                <Link href="/dashboard/admin/courses/new" className="text-purple-400 text-[10px] font-black uppercase tracking-widest mt-4 inline-block hover:text-white underline decoration-2 underline-offset-4">Buat Pertama Kalinya</Link>
            </div>
          )}
        </div>
      </div>

      {/* GLOBAL REFERENCE CATALOG SECTION */}
      {/* Handles massive datasets using estimated window logic + pagination */}
      <div className="space-y-8 relative z-10 pt-10 border-t border-white/5">
         <div className="flex items-center justify-between">
            <div>
               <h2 className="text-base font-black text-white uppercase tracking-[0.4em] flex items-center gap-4">
                  Global <span className="gradient-text">Reference</span> Catalog
               </h2>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                  <Library size={12} className="text-cyan-400" /> 
                  Menampilkan Basis Data Intelektual Global (Skalabilitas Industri)
               </p>
            </div>
            <div className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[8px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                <RefreshCw size={10} className={refLoading ? 'animate-spin' : ''} />
                Cloud Synchronized
            </div>
         </div>

         {/* Reference Grid */}
         <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {refCourses.map((course: any, idx: number) => (
                <div key={`${course.id}-${idx}`} className="group card p-4 bg-[#0c0c14]/60 border-white/5 hover:border-cyan-500/30 transition-all hover:-translate-y-1 shadow-xl">
                   <div className="aspect-[16/9] rounded-xl bg-slate-900 overflow-hidden mb-4 relative border border-white/5">
                      {course.thumbnail ? (
                        <Image src={course.thumbnail} alt="" fill className="object-cover opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />
                      ) : (
                         <div className="w-full h-full flex items-center justify-center text-[8px] font-black text-slate-800 uppercase">Snapshot</div>
                      )}
                      <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[7px] font-black text-white uppercase tracking-widest border border-white/10">
                         {course.category}
                      </div>
                   </div>
                   <h3 className="text-xs font-black text-slate-200 group-hover:text-cyan-400 transition-colors line-clamp-2 uppercase tracking-tight mb-2 leading-relaxed">{course.title}</h3>
                   <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                      <div className="flex items-center gap-2">
                         <div className="w-5 h-5 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-[6px] font-bold text-slate-500">
                             {course.instructor?.[0]}
                         </div>
                         <span className="text-[9px] text-slate-500 font-bold truncate max-w-[80px]">{course.instructor}</span>
                      </div>
                      <Link href={`/courses/${course.slug}`} target="_blank" className="p-1.5 rounded-lg bg-white/5 text-slate-600 hover:text-white hover:bg-cyan-500 transition-all">
                         <ExternalLink size={12} />
                      </Link>
                   </div>
                </div>
            ))}
         </div>

         {/* Pagination - Scalability for billions of rows */}
         <div className="py-10 text-center relative overflow-hidden flex flex-col items-center gap-6">
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                <Library size={150} className="text-cyan-500" />
            </div>

            <div className="flex items-center gap-2 relative z-10">
               {(() => {
                  const totalPages = Math.ceil(refTotal / 6);
                  const pages = [];
                  
                  // Logic for 1 2 3 ... 6 7 8 ... 10 11 12
                  const renderPageButton = (p: number) => (
                    <button
                      key={p}
                      onClick={() => fetchReferenceCourses(p)}
                      disabled={refLoading}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black transition-all border ${
                        refPage === p 
                          ? "bg-cyan-500 border-cyan-400 text-white shadow-lg shadow-cyan-500/20 active:scale-95" 
                          : "bg-white/5 border-white/10 text-slate-500 hover:border-cyan-500/50 hover:text-white"
                      }`}
                    >
                      {p}
                    </button>
                  );

                  const renderEllipsis = (key: string) => (
                    <span key={key} className="px-2 text-slate-700 font-bold select-none">...</span>
                  );

                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) pages.push(renderPageButton(i));
                  } else {
                    // Always show 1
                    pages.push(renderPageButton(1));

                    if (refPage > 3) pages.push(renderEllipsis("start-dot"));

                    // Middle range
                    const start = Math.max(2, refPage - 1);
                    const end = Math.min(totalPages - 1, refPage + 1);

                    for (let i = start; i <= end; i++) {
                      if (i > 1 && i < totalPages) pages.push(renderPageButton(i));
                    }

                    if (refPage < totalPages - 2) pages.push(renderEllipsis("end-dot"));

                    // Always show last
                    if (totalPages > 1) pages.push(renderPageButton(totalPages));
                  }

                  return pages;
               })()}
            </div>
            
            <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em] relative z-10">
               Page {refPage} of {Math.ceil(refTotal / 6)} — {refTotal.toLocaleString()} Entries Synchronized
            </p>
         </div>
      </div>

      {/* Utility Support Section */}
      <div className="grid md:grid-cols-2 gap-8 pt-10 relative z-10 border-t border-white/5">
         <div className="card p-8 bg-gradient-to-br from-indigo-600 to-purple-700 border-none relative overflow-hidden group shadow-2xl shadow-indigo-500/20">
            <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-125 transition-all duration-1000 rotate-12">
               <Zap size={250} />
            </div>
            <div className="relative z-10">
               <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                     <Sparkles size={20} />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">AI Curriculum Assistant</h3>
               </div>
               <p className="text-indigo-100/70 text-xs font-medium mb-8 max-w-[85%] leading-relaxed">
                  Gunakan mesin kecerdasan buatan untuk merancang silabus, deskripsi kursus, dan modul pembelajaran secara instan berdasarkan tren industri global.
               </p>
               <button className="bg-white text-indigo-700 px-8 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl">
                  Bangun Sekarang
               </button>
            </div>
         </div>

         <div className="card p-8 bg-[#0c0c14]/60 border-white/5 flex flex-col justify-between backdrop-blur-md">
            <div>
               <h3 className="text-sm font-black text-slate-400 mb-6 uppercase tracking-[0.2em] flex items-center gap-3">
                  <Library size={16} className="text-purple-500" /> Core Resources
               </h3>
               <div className="space-y-3">
                  {[
                    "Standardisasi Kualitas Video 4K",
                    "Teknik Copywriting Penjualan Kursus",
                    "Arsitektur Modul Pembelajaran Efektif",
                    "Optimasi SEO Katalog Kursus"
                  ].map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-purple-500/20 cursor-pointer transition-all group">
                       <span className="text-[10px] font-black text-slate-500 group-hover:text-white transition-colors uppercase tracking-wider">{doc}</span>
                       <div className="p-1.5 rounded-lg bg-white/5 text-slate-700 group-hover:text-purple-400 group-hover:bg-purple-500/10 transition-all">
                          <ExternalLink size={12} />
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
