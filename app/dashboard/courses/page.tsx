"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/AuthContext";
import { type Course, type Category } from "@/lib/data";
import { formatPrice, formatNumber } from "@/lib/utils";
import { getCourses, getCategories } from "@/lib/courses";
import { getLevelLabel, getLevelBg, enrollCourse, getActiveEnrollment, getExpiryDays } from "@/lib/enrollment";
import { Star, Users, Clock, BookOpen, Search, X, AlertCircle, CheckCircle, Megaphone, Plus } from "lucide-react";
import PromotionRequestModal from "@/app/components/PromotionRequestModal";

export default function DashboardCoursesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeEnrollment, setActiveEnrollment] = useState<any>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [selectedCourseForPromo, setSelectedCourseForPromo] = useState<Course | null>(null);
  
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
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const coursesData = await getCourses({
          search: searchQuery,
          category: category
        });
        setCourses(coursesData);
        
        if (user) {
          getActiveEnrollment(user.id).then(setActiveEnrollment);
        }
      } catch (err) {
        console.error("Error fetching filtered courses:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, searchQuery, category]);

  const filtered = useMemo(() => {
    // Since filtering is now server-side, we just return the fetched courses
    // We only keep isPublished filter as a safeguard
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
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Jelajahi <span className="gradient-text">Kursus</span></h1>
        <p className="text-slate-400 text-sm mt-1">Pilih kursus untuk memulai perjalanan belajar Anda</p>
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
            placeholder="Cari kursus..."
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
      {loading ? (
        <div className="p-12 text-center text-slate-500">Memuat katalog kursus...</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((course) => (
            <div key={course.id} className="card overflow-hidden group">
              <div className="relative h-36 bg-gradient-to-br from-purple-900/40 to-cyan-900/30 flex items-center justify-center">
                <BookOpen size={32} className="text-purple-400/40" />
                <span className="absolute top-2 left-2 badge badge-primary text-xs">{course.category}</span>
                <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full border ${getLevelBg(course.level)}`}>
                  {getLevelLabel(course.level)}
                </span>
              </div>
              <div className="p-4 space-y-3">
                <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2">{course.title}</h3>
                <p className="text-slate-500 text-xs">{course.instructor}</p>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Star size={12} className="text-yellow-400 fill-yellow-400" /> {course.rating}</span>
                  <span>({formatNumber(course.totalReviews)})</span>
                  <span className="flex items-center gap-1"><Users size={12} /> {formatNumber(course.totalStudents)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock size={12} /> {course.durationHours}j • {course.totalLessons} pelajaran • {getExpiryDays(course.level)} hari deadline
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    {course.discountPrice ? (
                      <>
                        <span className="text-white font-bold text-sm">{formatPrice(course.discountPrice)}</span>
                        <span className="text-slate-500 text-xs line-through">{formatPrice(course.price)}</span>
                      </>
                    ) : (
                      <span className="text-white font-bold text-sm">{formatPrice(course.price)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            setSelectedCourseForPromo(course);
                            setIsPromoModalOpen(true);
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg font-bold bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-white transition-all flex items-center gap-1"
                    >
                        <Megaphone size={12} /> Promosi
                    </button>
                    <button
                        onClick={() => handleEnroll(course)}
                        disabled={!!activeEnrollment}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                        activeEnrollment
                            ? "bg-white/5 text-slate-600 cursor-not-allowed"
                            : "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
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
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <BookOpen size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-white font-semibold">Tidak ada kursus ditemukan</p>
          <p className="text-slate-500 text-sm">Coba ubah filter pencarian</p>
        </div>
      )}

      {isPromoModalOpen && selectedCourseForPromo && (
        <PromotionRequestModal 
          course={selectedCourseForPromo}
          onClose={() => setIsPromoModalOpen(false)}
        />
      )}
    </div>
  );
}
