"use client";

import { useState, useEffect } from "react";
import { getCourses, deleteCourse } from "@/lib/courses";
import { type Course } from "@/lib/data";
import Link from "next/link";
import { Plus, Edit2, Trash2, Search, ArrowLeft, ExternalLink } from "lucide-react";

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    setLoading(true);
    const data = await getCourses();
    setCourses(data);
    setLoading(false);
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus kursus "${title}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    const res = await deleteCourse(id);
    if (res.success) {
      alert("Kursus berhasil dihapus");
      setCourses(courses.filter(c => String(c.id) !== id));
    } else {
      alert("Gagal menghapus: " + res.error?.message);
    }
  };

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.instructor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10">
            <ArrowLeft size={20} className="text-white" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Manajemen <span className="gradient-text">Kursus</span></h1>
            <p className="text-slate-400 text-sm">Kelola katalog kursus di platform</p>
          </div>
        </div>
        <Link href="/dashboard/admin/courses/new" className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          Tambah Kursus Baru
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Cari kursus atau instruktur..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Course List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Memuat data kursus...</div>
        ) : filteredCourses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Kursus</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Kategori & Level</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Harga</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredCourses.map((course: any) => (
                  <tr key={course.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-white/5 overflow-hidden flex-shrink-0">
                          {course.thumbnail ? (
                            <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600">No Image</div>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm line-clamp-1">{course.title}</p>
                          <p className="text-xs text-slate-500">{course.instructor}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-white">{course.category}</span>
                        <span className="text-[10px] text-slate-500">{course.level}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium text-white">
                        {course.price === 0 ? "Gratis" : `Rp ${course.price.toLocaleString("id-ID")}`}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        course.isPublished ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                      }`}>
                        {course.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/courses/${course.slug}`} 
                          target="_blank"
                          className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                        >
                          <ExternalLink size={16} />
                        </Link>
                        <Link 
                          href={`/dashboard/admin/courses/${course.id}/edit`}
                          className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10"
                        >
                          <Edit2 size={16} />
                        </Link>
                        <button 
                          onClick={() => handleDelete(course.id, course.title)}
                          className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <p className="text-slate-500">Tidak ada kursus ditemukan.</p>
          </div>
        )}
      </div>
    </div>
  );
}
