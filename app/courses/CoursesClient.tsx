"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Star, Users, Clock, BookOpen, X, SlidersHorizontal, Filter, ChevronLeft, ChevronRight, Sparkles, Tag } from "lucide-react";
import { type Course, type Category } from "@/lib/data";
import { formatPrice, formatNumber, formatDuration } from "@/lib/utils";
import { getLevelLabel, getLevelBg } from "@/lib/enrollment";
import { type Promotion, trackImpressionsBatch } from "@/lib/promotions";
import { useEffect } from "react";
import PromotionCard from "../components/PromotionCard";

interface CoursesClientProps {
  initialCourses: Course[];
  initialCategories: Category[];
  initialCategory?: string;
  promotions?: Promotion[];
  spotlightPromo?: Promotion;
}

const ITEMS_PER_PAGE = 8;


export default function CoursesClient({ initialCourses, initialCategories, initialCategory, promotions, spotlightPromo }: CoursesClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || "all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasTrackedBatch, setHasTrackedBatch] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Calculate top courses once
  const topCourses = useMemo(() => {
    if (initialCourses.length === 0) return [];
    return [...initialCourses]
      .sort((a,b) => (b.rating * b.totalStudents) - (a.rating * a.totalStudents))
      .slice(0, 5);
  }, [initialCourses]);

  // Auto-slide every 6 seconds
  useEffect(() => {
    if (topCourses.length <= 1 || spotlightPromo) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % topCourses.length);
    }, 6000);
    
    return () => clearInterval(interval);
  }, [topCourses, spotlightPromo]);

  const featuredCourse = topCourses[currentIndex] || null;

  // Batch Tracking for Ads
  useEffect(() => {
    if (promotions && promotions.length > 0 && !hasTrackedBatch) {
      const timer = setTimeout(() => {
        const promoIds = promotions.map(p => p.id);
        trackImpressionsBatch(promoIds);
        setHasTrackedBatch(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [promotions, hasTrackedBatch]);


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
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl animate-fade-in-up">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6 leading-tight">
                Eksplorasi <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Potensi Digital</span> Anda
              </h1>
              <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                Temukan ribuan kursus berkualitas tinggi yang dipandu oleh praktisi industri terbaik dunia. Mulai perjalanan karir baru Anda hari ini.
              </p>

              <div className="flex flex-col sm:row gap-4 mb-8">
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

              {/* Platform Stats Row */}
              {!searchQuery && (
                <div className="flex flex-wrap items-center gap-4 mt-2 animate-fade-in stagger-child">
                   {[
                     { label: "Siswa Aktif", value: initialCourses.reduce((sum, c) => sum + c.totalStudents, 0).toLocaleString() + "+", icon: Users, color: "text-cyan-400" },
                     { label: "Kursus Expert", value: initialCourses.length.toString(), icon: BookOpen, color: "text-purple-400" },
                     { label: "Rating Platform", value: "4.9/5", icon: Star, color: "text-yellow-400" }
                   ].map((stat, i) => (
                     <div key={i} className="flex items-center gap-3 py-2 px-4 rounded-xl bg-white/[0.03] border border-white/5 backdrop-blur-md hover:bg-white/[0.05] transition-colors">
                        <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                          <stat.icon size={16} />
                        </div>
                        <div>
                          <div className="text-white font-black text-sm">{stat.value}</div>
                          <div className="text-slate-500 text-[9px] font-black uppercase tracking-widest">{stat.label}</div>
                        </div>
                     </div>
                   ))}
                </div>
              )}
            </div>

            {/* Right Column: Visuals & Social Proof */}
            <div className="hidden lg:flex relative h-full items-center justify-center animate-fade-in scale-in-center delay-300">
               {/* Background Decorative Glow */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
               
               {/* Main Illustration */}
               <div className="relative z-10 w-full max-w-md animate-float">
                  <Image 
                    src="/hero_learning_illustration_1776143119072.png" 
                    alt="Learning illustration" 
                    width={500} 
                    height={500}
                    priority
                    className="object-contain drop-shadow-[0_20px_50px_rgba(124,58,237,0.2)]"
                  />
                  
                  {/* Floating Social Proof Card 1 */}
                  <div className="absolute -top-4 -right-8 glass-strong p-4 rounded-2xl animate-float delay-1000 shadow-2xl flex items-center gap-3">
                     <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-500 p-0.5">
                           <div className="w-full h-full rounded-full bg-[#0c0c14] flex items-center justify-center overflow-hidden">
                              <Users size={20} className="text-white" />
                           </div>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-success rounded-full border-2 border-[#09090f] animate-pulse"></div>
                     </div>
                     <div>
                        <div className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">Live Activity</div>
                        <div className="text-xs text-slate-400 font-bold whitespace-nowrap">122+ Siswa sedang belajar</div>
                     </div>
                  </div>

                  {/* Floating Path Card 2 */}
                  <div className="absolute -bottom-8 -left-4 glass p-4 rounded-2xl animate-float delay-500 shadow-2xl flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400">
                       <Sparkles size={20} />
                    </div>
                    <div>
                       <div className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">Premium Path</div>
                       <div className="text-xs text-slate-400 font-bold">100% Curriculum Validated</div>
                    </div>
                  </div>
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

          {/* Spotlight / Featured Course (Only on home view) */}
          {!searchQuery && selectedCategory === "all" && paginatedCourses.length > 0 && currentPage === 1 && (featuredCourse || spotlightPromo) && (
            <div className="mb-12 group">
              <div className="flex items-center gap-3 mb-4">
                 <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>
                 <span className="flex items-center gap-2 text-[10px] font-black uppercase text-purple-400 tracking-[0.2em]">
                    <Sparkles size={14} /> {spotlightPromo ? (spotlightPromo.badgeText || "SPECIAL OFFER") : "Pilihan Minggu Ini"}
                 </span>
                 <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>
              </div>
              
              {/* If we have a promotion, use its logic, otherwise use the random featured course */}
              {spotlightPromo ? (
                <PromotionCard promotion={spotlightPromo} variant="banner" priorityLabel={true} />
              ) : featuredCourse ? (
                <Link 
                  href={`/courses/${featuredCourse.slug}`}
                  className="relative flex flex-col md:flex-row gap-6 p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-purple-500/30 transition-all group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  {/* Image Section */}
                  <div className="relative w-full md:w-80 h-48 md:h-64 rounded-2xl overflow-hidden shrink-0">
                    <Image 
                      src={featuredCourse.thumbnail}
                      alt="Spotlight"
                      fill
                      priority
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-4 left-4">
                       <span className="badge badge-accent shadow-xl shadow-cyan-500/20">TRENDING</span>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center py-2 relative z-10 w-full">
                     <div className="flex items-center justify-between mb-2">
                       <div className="text-purple-400 text-xs font-bold uppercase tracking-widest">
                         {featuredCourse.category}
                       </div>
                       {/* Indicator dots for carousel */}
                       <div className="flex gap-1.5">
                         {topCourses.map((_, idx) => (
                           <div 
                             key={idx} 
                             className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-purple-500 w-3' : 'bg-white/10'}`} 
                           />
                         ))}
                       </div>
                     </div>
                     <h3 className="text-2xl md:text-3xl font-black text-white mb-4 leading-tight group-hover:text-purple-300 transition-colors">
                       {featuredCourse.title}
                     </h3>
                     <p className="text-slate-400 text-sm mb-6 line-clamp-2 max-w-xl">
                       {featuredCourse.description}
                     </p>
                     
                     <div className="flex items-center gap-6 mt-auto">
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-cyan-400" />
                          <span className="text-white font-bold text-sm">{featuredCourse.totalStudents.toLocaleString()} Siswa</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star size={16} className="text-yellow-400 fill-yellow-400" />
                          <span className="text-white font-bold text-sm">{featuredCourse.rating}</span>
                        </div>
                        <div className="ml-auto">
                          <span className="text-xl font-black text-white">{formatPrice(featuredCourse.price)}</span>
                        </div>
                     </div>
                  </div>
                </Link>
              ) : null}
            </div>
          )}

          {paginatedCourses.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative">
              {/* Background Glows for Grid */}
              <div className="absolute top-1/4 -right-20 w-80 h-80 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>
              <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none"></div>

              {paginatedCourses.map((course, index) => {
                const adIndex = Math.floor((index + 1) / 4) - 1;
                const showAd = (index + 1) % 4 === 0 && promotions && promotions[adIndex + 1];

                return (
                  <>
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
                      <span className="absolute top-3 left-3 badge badge-primary text-[10px] font-black tracking-widest uppercase shadow-xl shadow-purple-500/20">{course.category}</span>
                      {course.totalStudents > 100 && (
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-amber-500/50 text-amber-400 text-[10px] font-black tracking-widest uppercase shadow-xl">
                           <Sparkles size={10} className="animate-pulse" /> Best Seller
                        </div>
                      )}
                      <span className={`absolute bottom-3 left-3 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border backdrop-blur-md shadow-lg ${getLevelBg(course.level)}`}>
                        {getLevelLabel(course.level)}
                      </span>
                      {course.availableVouchers && course.availableVouchers.length > 0 && (
                        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[9px] font-black tracking-widest uppercase shadow-xl backdrop-blur-md">
                           <Tag size={10} /> Voucher
                        </div>
                      )}
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

                  {/* Interleaved Ad Slot */}
                  {showAd && (
                    <div className="sm:col-span-1 lg:col-span-1 xl:col-span-1 animate-fade-in">
                       <PromotionCard variant="card" promotion={promotions[adIndex + 1]} isPreview={true} />
                    </div>
                  )}
                  </>
                );
              })}
            </div>
          ) : (
            <div className="space-y-16">
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                  <Search size={40} className="text-slate-700" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Tidak ada kursus ditemukan</h3>
                <p className="text-slate-500 text-sm max-w-xs mx-auto">Coba gunakan kata kunci lain atau jelajahi kategori rekomendasi di bawah.</p>
                <button 
                  onClick={clearFilters}
                  className="mt-6 text-purple-400 hover:text-purple-300 font-bold text-sm tracking-wide uppercase"
                >
                  Tampilkan Semua Kursus
                </button>
              </div>

              {/* Premium Fallback Recommendation */}
              <div className="animate-fade-in pt-16 border-t border-white/5">
                <div className="flex items-center gap-3 mb-8">
                   <div className="w-8 h-1 bg-purple-500 rounded-full" />
                   <h3 className="text-white font-black uppercase tracking-[0.2em] text-[10px]">Pilihan Partner Untuk Anda</h3>
                </div>
                <div className="grid gap-8">
                   {promotions && promotions.length > 0 ? (
                      <PromotionCard promotion={promotions[0]} variant="banner" />
                   ) : (
                      <div className="card p-12 text-center text-slate-700 bg-white/[0.01] border-dashed border-white/5">
                         <Sparkles size={32} className="mx-auto mb-4 opacity-20" />
                         <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Belum Ada Promo Aktif</p>
                      </div>
                   )}
                </div>
              </div>
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
