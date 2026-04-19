"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/AuthContext";
import { getInstructorProfile } from "@/lib/instructor";
import { type Course, type Category } from "@/lib/data";
import { formatPrice, formatNumber } from "@/lib/utils";
import { getCoursesWithCount, getCategories } from "@/lib/courses";
import { getLevelLabel, getLevelBg, enrollCourse, getActiveEnrollment, getExpiryDays } from "@/lib/enrollment";
import { Star, Users, Clock, BookOpen, Search, X, AlertCircle, CheckCircle, Megaphone, Loader2, Sparkles, Filter } from "lucide-react";

export default function DashboardCoursesPage() {

  const [instructorProfileId, setInstructorProfileId] = useState<string | null>(null);
  const { user, isAdmin, isInstructor } = useAuth();
  
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeEnrollment, setActiveEnrollment] = useState<any>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  
  // Pagination & Scalability State
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 12;

  // Intersection Observer Ref
  const loaderRef = useRef<HTMLDivElement>(null);
  
  // Debounced search query
  const [searchQuery, setSearchQuery] = useState("");
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const fetchCategories = async () => {
      const categoriesData = await getCategories();
      setCategories([{ id: "all", name: "Semua", slug: "all", icon: "📚", courseCount: 0 }, ...categoriesData]);
    };
    fetchCategories();

    if (isInstructor && user) {
      getInstructorProfile(user.id).then(prof => {
        if (prof) setInstructorProfileId(prof.id);
      });
    }
  }, [isInstructor, user]);

  // Initial Fetch & Filter Reset
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setPage(1);
      try {
        const { data, count } = await getCoursesWithCount({
          search: searchQuery,
          category: category,
          page: 1,
          pageSize: PAGE_SIZE
        });
        setCourses(data);
        setTotalCount(count);
        setHasMore(data.length < count);
        
        if (user) {
          getActiveEnrollment(user.id).then(setActiveEnrollment);
        }
      } catch (err) {
        console.error("Error fetching courses:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, searchQuery, category]);

  // Load More Function
  const loadMore = useCallback(async () => {
    if (fetchingMore || !hasMore) return;
    
    setFetchingMore(true);
    const nextPage = page + 1;
    
    try {
      const { data, count } = await getCoursesWithCount({
        search: searchQuery,
        category: category,
        page: nextPage,
        pageSize: PAGE_SIZE
      });
      
      setCourses(prev => [...prev, ...data]);
      setPage(nextPage);
      setHasMore(prev => courses.length + data.length < count);
    } catch (err) {
      console.error("Error loading more courses:", err);
    } finally {
      setFetchingMore(false);
    }
  }, [fetchingMore, hasMore, page, searchQuery, category, courses.length]);

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !fetchingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, fetchingMore, loadMore]);

  const filtered = useMemo(() => {
    return courses.filter((c) => c.isPublished);
  }, [courses]);

  const handleEnroll = async (course: typeof courses[0]) => {
    if (!user) return;
    const result = await enrollCourse(user.id, course.slug, course.title, course.totalLessons, course.level);
    if (result.success) {
      setMessage({ type: "success", text: `Berhasil mendaftar ke "${course.title}"!` });
      setTimeout(() => router.push("/dashboard/my-courses"), 1500);
    } else {
      setMessage({ type: "error", text: result.error || "Gagal mendaftar." });
    }
  };

  return (
    <div className="max-w-6xl space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            Jelajahi <span className="gradient-text">Kursus</span>
            {totalCount > 1000 && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
                <Sparkles size={12} /> Enterprise Scale
              </span>
            )}
          </h1>
          <p className="text-slate-400 text-sm mt-1">Pilih kursus untuk memulai perjalanan belajar Anda</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
            {loading ? "Menghitung..." : `${formatNumber(totalCount)} Kursus Tersedia`}
          </span>
        </div>
      </div>

      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
          message.type === "success" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border border-red-500/20 text-red-400"
        }`}>
          {message.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      {activeEnrollment && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />
          Anda sudah memiliki kursus aktif: <strong>{activeEnrollment.courseTitle}</strong>. Selesaikan terlebih dahulu.
        </div>
      )}

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kursus dari jutaan pilihan..."
            className="input !pl-11 !pr-10"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => setCategory(cat.slug)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              category === cat.slug
                ? "bg-gradient-to-r from-purple-600 to-cyan-500 text-white"
                : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Course Grid */}
      {loading && page === 1 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="card h-80 animate-pulse bg-white/5 border-white/5" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((course) => (
              <div key={course.id} className="card overflow-hidden group hover:border-purple-500/30 transition-all">
                <div className="relative h-36 bg-gradient-to-br from-purple-900/40 to-cyan-900/30 flex items-center justify-center overflow-hidden">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 group-hover:opacity-100" />
                  ) : (
                    <BookOpen size={32} className="text-purple-400/40" />
                  )}
                  <span className="absolute top-2 left-2 badge badge-primary text-[10px] uppercase font-black tracking-widest">{course.category}</span>
                  <span className={`absolute top-2 right-2 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${getLevelBg(course.level)}`}>
                    {getLevelLabel(course.level)}
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  <h3 className="text-white font-bold text-sm leading-snug line-clamp-2 group-hover:text-purple-300 transition-colors uppercase tracking-tight">{course.title}</h3>
                  <p className="text-slate-500 text-xs font-medium">{course.instructor}</p>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                    <span className="flex items-center gap-1"><Star size={12} className="text-yellow-400 fill-yellow-400" /> {course.rating}</span>
                    <span>({formatNumber(course.totalReviews)})</span>
                    <span className="flex items-center gap-1"><Users size={12} /> {formatNumber(course.totalStudents)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <Clock size={12} /> {course.durationHours}j • {course.totalLessons} pelajaran
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      {course.discountPrice ? (
                        <>
                          <span className="text-white font-black text-sm">{formatPrice(course.discountPrice)}</span>
                          <span className="text-slate-500 text-[10px] line-through">{formatPrice(course.price)}</span>
                        </>
                      ) : (
                        <span className="text-white font-black text-sm">{formatPrice(course.price)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {(isAdmin || (isInstructor && course.instructorId === instructorProfileId)) && (
                        <button
                            onClick={() => router.push(`/dashboard/ads/create?mode=course&courseId=${course.id}`)}
                            className="p-2 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-white transition-all"
                            title="Promosi Kursus"
                        >
                            <Megaphone size={14} />
                        </button>
                      )}
                      <button
                          onClick={() => handleEnroll(course)}
                          disabled={!!activeEnrollment}
                          className={`text-[10px] px-4 py-2 rounded-xl font-black uppercase tracking-widest transition-all ${
                          activeEnrollment
                              ? "bg-white/5 text-slate-600 cursor-not-allowed"
                              : "bg-purple-500 text-white shadow-lg shadow-purple-500/20 hover:scale-105 active:scale-95"
                          }`}
                      >
                          Ambil Kursus
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Infinite Scroll Trigger & Loader */}
          {hasMore && (
            <div ref={loaderRef} className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="text-purple-500 animate-spin" size={32} />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]"> sinkronisasi data global...</p>
            </div>
          )}

          {!hasMore && filtered.length > 0 && (
            <div className="py-12 text-center">
              <div className="w-12 h-[1px] bg-slate-800 mx-auto mb-4" />
              <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">Semua aset telah dimuat ({formatNumber(totalCount)})</p>
            </div>
          )}
        </>
      )}

      {filtered.length === 0 && !loading && (
        <div className="text-center py-20 bg-white/[0.02] rounded-[3rem] border border-dashed border-white/5">
          <Filter size={48} className="text-slate-700 mx-auto mb-4 opacity-20" />
          <p className="text-white font-black uppercase tracking-widest text-lg">Basis Data Kosong</p>
          <p className="text-slate-500 text-xs mt-2 font-medium">Tidak ada kursus yang sesuai dengan kriteria filter Anda.</p>
          <button 
            onClick={() => { setSearch(""); setCategory("all"); }}
            className="mt-6 text-purple-400 text-[10px] font-black uppercase tracking-widest border-b border-purple-500/30 hover:text-white transition-colors"
          >
            Reset Filter Pencarian
          </button>
        </div>
      )}


    </div>
  );
}
