"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Star, Users, Clock, BookOpen, X, SlidersHorizontal, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { type Course, type Category } from "@/lib/data";
import { formatPrice, formatNumber, formatDuration } from "@/lib/utils";
import { getLevelLabel, getLevelBg } from "@/lib/enrollment";

interface CoursesClientProps {
  initialCourses: Course[];
  initialCategories: Category[];
  initialCategory?: string;
}

const ITEMS_PER_PAGE = 8;


export default function CoursesClient({ initialCourses, initialCategories, initialCategory }: CoursesClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || "all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [currentPage, setCurrentPage] = useState(1);


  const filteredCourses = useMemo(() => {
    let result = [...initialCourses];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.title.toLowerCase().includes(q) || 
        c.description.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter((c) => c.categorySlug === selectedCategory);
    }

    // Level filter
    if (selectedLevel !== "all") {
      result = result.filter((c) => c.level === selectedLevel);
    }

    // Sorting
    if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } else if (sortBy === "price-low") {
      result.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
    } else if (sortBy === "price-high") {
      result.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
    } else if (sortBy === "popular") {
      result.sort((a, b) => b.totalStudents - a.totalStudents);
    }

    return result;
  }, [searchQuery, selectedCategory, selectedLevel, sortBy, initialCourses]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);
  const paginatedCourses = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCourses.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCourses, currentPage]);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedLevel, sortBy]);


  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedLevel("all");
    setSortBy("popular");
  };

  return (
    <div className="flex-1 bg-[#08080c]">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(124,58,237,0.1),transparent)] pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(circle_at_70%_70%,rgba(6,182,212,0.1),transparent)] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6 leading-tight">
              Eksplorasi <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Potensi Digital</span> Anda
            </h1>
            <p className="text-slate-400 text-lg mb-10 leading-relaxed">
              Temukan ribuan kursus berkualitas tinggi yang dipandu oleh praktisi industri terbaik dunia. Mulai perjalanan karir baru Anda hari ini.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors" size={20} />
                <input
                  type="text"
                  placeholder="Cari kursus (React, Python, UI/UX...)"
                  className="input-field !pl-12 !py-4 shadow-2xl shadow-purple-500/5 focus:ring-purple-500/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-[#08080c]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filters Bar */}
          <div className="flex flex-col lg:flex-row gap-6 mb-12 items-center justify-between">
            <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full lg:w-auto">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  selectedCategory === "all" ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30" : "bg-white/5 text-slate-400 hover:bg-white/10"
                }`}
              >
                Semua Kategori
              </button>
              {initialCategories.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                    selectedCategory === cat.slug ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30" : "bg-white/5 text-slate-400 hover:bg-white/10"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-4 lg:pt-0 border-white/5">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-slate-500" />
                <select 
                  className="bg-transparent text-slate-300 text-xs font-bold outline-none cursor-pointer focus:text-white transition-colors"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="popular">Terpopuler</option>
                  <option value="newest">Terbaru</option>
                  <option value="price-low">Harga Terendah</option>
                  <option value="price-high">Harga Tertinggi</option>
                </select>
              </div>

              <div className="flex items-center gap-2 border-l border-white/10 pl-4">
                <SlidersHorizontal size={16} className="text-slate-500" />
                <select 
                  className="bg-transparent text-slate-300 text-xs font-bold outline-none cursor-pointer focus:text-white transition-colors"
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                >
                  <option value="all">Semua Level</option>
                  <option value="Starter">Starter</option>
                  <option value="Accelerator">Accelerator</option>
                  <option value="Mastery">Mastery</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {(selectedCategory !== "all" || selectedLevel !== "all" || searchQuery) && (
            <div className="flex items-center gap-2 mb-8 animate-in fade-in slide-in-from-left duration-300">
              <span className="text-slate-500 text-xs">Menampilkan {filteredCourses.length} hasil untuk:</span>
              <div className="flex flex-wrap gap-2">
                {searchQuery && <span className="badge badge-primary py-1">{searchQuery}</span>}
                {selectedCategory !== "all" && <span className="badge bg-white/5 border-white/10 text-slate-300 py-1">{selectedCategory}</span>}
                {selectedLevel !== "all" && <span className="badge bg-white/5 border-white/10 text-slate-300 py-1">{selectedLevel}</span>}
              </div>
              <button onClick={clearFilters} className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 ml-2">
                <X size={12} /> Reset Filter
              </button>
            </div>
          )}

          {paginatedCourses.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedCourses.map((course) => {
                return (
                  <Link href={`/courses/${course.slug}`} key={course.id} className="card group overflow-hidden flex flex-col h-full" id={`course-card-${course.slug}`}>
                    <div className="relative h-44 bg-[#0c0c14] overflow-hidden">
                      {course.thumbnail ? (
                        <Image
                          src={course.thumbnail}
                          alt={course.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                          <BookOpen size={40} className="text-slate-800" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                      {course.discountPrice && (
                        <span className="absolute top-3 right-3 badge badge-success text-xs">
                          {Math.round(((course.price - course.discountPrice) / course.price) * 100)}% OFF
                        </span>
                      )}
                      <span className="absolute top-3 left-3 badge badge-primary text-xs">{course.category}</span>
                      <span className={`absolute bottom-3 left-3 text-xs px-2 py-0.5 rounded-full border ${getLevelBg(course.level)}`}>
                        {getLevelLabel(course.level)}
                      </span>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="text-white font-semibold text-sm leading-snug mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-slate-500 text-xs mb-3">{course.instructor}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                        <span className="flex items-center gap-1">
                          <Star size={12} className={course.totalReviews > 0 ? "text-yellow-400 fill-yellow-400" : "text-slate-700"} /> 
                          {course.totalReviews > 0 ? course.rating : "No reviews"}
                        </span>
                        {course.totalReviews > 0 && <span>({formatNumber(course.totalReviews)})</span>}
                        <span>•</span>
                        <span className="flex items-center gap-1"><Users size={12} /> {formatNumber(course.totalStudents)}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-4 mt-auto">
                        <span className="flex items-center gap-1 text-xs text-slate-400"><Clock size={12} /> {formatDuration(course.durationHours)}</span>
                        <span>•</span>
                        <span className="text-xs text-slate-400">{course.totalLessons} pelajaran</span>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                        {course.discountPrice ? (
                          <>
                            <span className="text-white font-bold text-sm">{formatPrice(course.discountPrice)}</span>
                            <span className="text-slate-500 text-xs line-through">{formatPrice(course.price)}</span>
                          </>
                        ) : (
                          <span className="text-white font-bold text-sm">{formatPrice(course.price)}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen size={40} className="text-slate-700" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Tidak ada kursus ditemukan</h3>
              <p className="text-slate-500">Coba ubah kata kunci pencarian atau filter Anda.</p>
              <button 
                onClick={clearFilters}
                className="mt-6 text-purple-400 hover:text-purple-300 font-bold"
              >
                Tampilkan Semua Kursus
              </button>
            </div>
          )}

          {/* Pagination UI */}
          {totalPages > 1 && (
            <div className="mt-16 flex justify-center items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                aria-label="Previous Page"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Basic logic to show limited page numbers if totalPages is large
                  if (
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-xl font-bold text-xs transition-all ${
                          currentPage === page 
                            ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30" 
                            : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    (page === 2 && currentPage > 3) || 
                    (page === totalPages - 1 && currentPage < totalPages - 2)
                  ) {
                    return <span key={page} className="text-slate-600 px-1">...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="w-10 h-10 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                aria-label="Next Page"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
