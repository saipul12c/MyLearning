"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { ChevronDown, HelpCircle, MessageCircle, Search, Bot, Send, Sparkles, Loader2, X, History, Lightbulb, TrendingUp } from "lucide-react";
import Link from "next/link";
import { getFAQGeminiResponse } from "@/lib/gemini";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import NativeAdCard from "@/app/components/NativeAdCard";
import { fuzzyMatch } from "@/lib/search-utils";
import SearchHighlight from "@/app/components/SearchHighlight";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  name: string;
  icon: string;
  items: FAQItem[];
}

const faqData: FAQCategory[] = [
  {
    name: "Umum",
    icon: "📌",
    items: [
      {
        question: "Apa itu MyLearning?",
        answer:
          "MyLearning adalah platform belajar online yang menyediakan kursus berkualitas dalam berbagai bidang seperti pemrograman, data science, desain, bisnis, dan banyak lagi. Semua kursus dibuat oleh instruktur berpengalaman dan praktisi industri.",
      },
      {
        question: "Apakah MyLearning cocok untuk pemula?",
        answer:
          "Tentu! Kami menyediakan kursus untuk semua level, dari pemula hingga lanjutan. Setiap kursus memiliki label level (Pemula, Menengah, Lanjutan) sehingga Anda bisa memilih yang sesuai dengan kemampuan Anda.",
      },
      {
        question: "Bagaimana cara memulai belajar di MyLearning?",
        answer:
          "Cukup buat akun gratis, pilih kursus yang diminati, lakukan pembayaran, dan Anda langsung bisa mulai belajar. Kursus bisa diakses kapan saja dan dari mana saja.",
      },
      {
        question: "Apakah ada kursus gratis?",
        answer:
          "Ya! Beberapa kursus memiliki pelajaran preview gratis yang bisa Anda akses tanpa perlu membeli. Kami juga sering mengadakan promo dan diskon spesial.",
      },
    ],
  },
  {
    name: "Pembayaran",
    icon: "💳",
    items: [
      {
        question: "Metode pembayaran apa saja yang tersedia?",
        answer:
          "Kami menerima pembayaran melalui transfer bank (BCA, BNI, BRI, Mandiri), e-wallet (GoPay, OVO, Dana), kartu kredit/debit (Visa, Mastercard), dan virtual account.",
      },
      {
        question: "Apakah pembayaran aman?",
        answer:
          "Sangat aman. Semua transaksi diproses melalui payment gateway yang terenkripsi dan bersertifikasi PCI-DSS. Data pembayaran Anda tidak pernah disimpan di server kami.",
      },
      {
        question: "Apakah ada garansi uang kembali?",
        answer:
          "Ya! Kami memberikan garansi uang kembali 30 hari. Jika Anda tidak puas dengan kursus yang dibeli, hubungi tim support kami untuk proses refund penuh.",
      },
      {
        question: "Apakah bisa bayar cicilan?",
        answer:
          "Untuk kursus tertentu, kami menyediakan opsi cicilan 0% melalui kartu kredit. Informasi cicilan tersedia di halaman detail kursus.",
      },
    ],
  },
  {
    name: "Teknis",
    icon: "⚙️",
    items: [
      {
        question: "Apakah bisa belajar di HP/tablet?",
        answer:
          "Ya, platform MyLearning fully responsive dan bisa diakses melalui browser di smartphone dan tablet. Kami juga sedang mengembangkan aplikasi mobile untuk pengalaman belajar yang lebih baik.",
      },
      {
        question: "Apakah perlu koneksi internet untuk belajar?",
        answer:
          "Ya, Anda memerlukan koneksi internet untuk streaming video kursus. Kami merekomendasikan koneksi minimal 5 Mbps untuk pengalaman streaming yang lancar.",
      },
      {
        question: "Berapa lama akses ke kursus yang sudah dibeli?",
        answer:
          "Akses kursus yang sudah dibeli berlaku seumur hidup! Anda bisa menonton ulang materi kapan saja, termasuk semua update konten yang akan datang.",
      },
      {
        question: "Apakah ada subtitle atau transkrip?",
        answer:
          "Sebagian besar kursus dilengkapi dengan subtitle bahasa Indonesia. Kami terus menambahkan subtitle dan transkrip ke kursus-kursus yang belum memilikinya.",
      },
    ],
  },
  {
    name: "Sertifikat",
    icon: "🏆",
    items: [
      {
        question: "Apakah saya mendapat sertifikat?",
        answer:
          "Ya! Setiap kursus yang berhasil diselesaikan akan mendapatkan sertifikat digital yang bisa diunduh dan dibagikan di LinkedIn atau CV Anda.",
      },
      {
        question: "Apakah sertifikat diakui industri?",
        answer:
          "Sertifikat MyLearning menunjukkan bahwa Anda telah menyelesaikan pelatihan profesional. Banyak perusahaan mitra kami yang mengakui sertifikat ini sebagai bukti kompetensi.",
      },
    ],
  },
];

import type { Promotion } from "@/lib/promotions";

export default function FaqClient({ initialSearchRecoveryPromo }: { initialSearchRecoveryPromo?: Promotion | null }) {
  const [activeCategory, setActiveCategory] = useState(0);
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // AI States
  const [showAIResult, setShowAIResult] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [currentAIResult, setCurrentAIResult] = useState<{ question: string; answer: string } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const aiResultRef = useRef<HTMLDivElement>(null);

  const [suggestions, setSuggestions] = useState<{ text: string, color: string }[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load history and random suggestions on mount
  useEffect(() => {
    // 1. Load History
    const savedHistory = localStorage.getItem("faq_search_history");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory).slice(0, 5));
    }

    // 2. Generate Random Suggestions
    const categoryColors: Record<string, string> = {
      "Umum": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
      "Pembayaran": "bg-orange-500/10 text-orange-400 border-orange-500/20",
      "Teknis": "bg-purple-500/10 text-purple-400 border-purple-500/20",
      "Sertifikat": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    };

    const getRandomItems = () => {
      const selected: { text: string, color: string }[] = [];
      const usedCategories = new Set<string>();
      
      // Try to get one from different categories for variety
      const shuffledCategories = [...faqData].sort(() => Math.random() - 0.5);
      
      shuffledCategories.forEach(cat => {
        if (selected.length < 3) {
          const randomItem = cat.items[Math.floor(Math.random() * cat.items.length)];
          selected.push({
            text: randomItem.question,
            color: categoryColors[cat.name] || "bg-white/5 text-slate-400 border-white/10"
          });
        }
      });
      
      return selected;
    };

    setSuggestions(getRandomItems());
  }, []);

  const addToHistory = (query: string) => {
    if (!query.trim()) return;
    const newHistory = [query, ...history.filter(h => h !== query)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem("faq_search_history", JSON.stringify(newHistory));
  };

  const toggleItem = (key: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return null;

    const results: { category: string; item: FAQItem; idx: number; catIdx: number }[] = [];
    faqData.forEach((cat, catIdx) => {
      cat.items.forEach((item, idx) => {
        if (
          fuzzyMatch(item.question, searchQuery) ||
          fuzzyMatch(item.answer, searchQuery)
        ) {
          results.push({ category: cat.name, item, idx, catIdx });
        }
      });
    });
    return results;
  }, [searchQuery]);

  const handleAskAI = async (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const query = customMsg || aiMessage;
    if (!query.trim() || isAiLoading) return;

    setAiMessage("");
    setIsAiLoading(true);
    setShowAIResult(true);
    setCurrentAIResult({ question: query, answer: "" }); // Placeholder for loading

    // Scroll to result card
    setTimeout(() => {
      aiResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);

    try {
      addToHistory(query);
      const response = await getFAQGeminiResponse(query, faqData);
      setCurrentAIResult({ question: query, answer: response });
    } catch (error) {
      setCurrentAIResult({ question: query, answer: "Maaf, terjadi kesalahan teknis. Silakan coba lagi nanti." });
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <>
      {/* Hero */}
      <section className="hero-bg grid-pattern py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-6xl pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-purple-600/10 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px] animate-pulse [animation-delay:2s]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <span className="badge badge-primary mb-4 inline-block">Bantuan</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
            Apa yang Bisa Kami{" "}
            <span className="gradient-text">Bantu Hari Ini?</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10">
            Cari jawaban cepat melalui pusat bantuan kami atau gunakan asisten cerdas kami untuk bantuan instan.
          </p>

          {/* Search bar & AI Button */}
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input
                  type="text"
                  placeholder="Cari pertanyaan kamu di sini..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setAiMessage(e.target.value);
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:text-slate-600 shadow-xl font-medium"
                />
              </div>
              <button
                onClick={() => handleAskAI()}
                className="btn-primary py-4 px-8 flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_25px_rgba(147,51,234,0.5)] transition-all font-bold"
              >
                <Sparkles size={18} className="group-hover:animate-pulse" />
                Tanya AI Boss
              </button>
            </div>

            {/* Suggestions & History Chips */}
            <div className="relative pt-3 px-1">
              <div className="flex flex-wrap items-center justify-between gap-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] flex items-center gap-1.5 mr-2 opacity-70">
                    <Sparkles size={10} className="text-amber-500 animate-pulse" /> Saran:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSearchQuery(s.text);
                          setAiMessage(s.text);
                          handleAskAI(undefined, s.text);
                        }}
                        className={`group px-3.5 py-1.5 rounded-full border transition-all hover:brightness-125 active:scale-95 text-[10px] font-bold flex items-center gap-2 backdrop-blur-md shadow-sm hover:shadow-md ${s.color}`}
                      >
                        <Lightbulb size={11} className="opacity-60 group-hover:opacity-100 transition-opacity" /> 
                        <span className="truncate max-w-[150px] sm:max-w-none">{s.text}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <button 
                    onClick={() => setShowHistory(!showHistory)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                      showHistory ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <History size={12} className={showHistory ? "animate-spin-slow" : ""} /> 
                    Riwayat
                  </button>

                  {/* History Dropdown */}
                  {showHistory && history.length > 0 && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-[#0c0c14]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 z-50 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 mb-1">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Aktivitas Terakhir</span>
                        <button 
                          onClick={() => { setHistory([]); localStorage.removeItem("faq_search_history"); }}
                          className="text-[7px] text-red-400/60 hover:text-red-400 uppercase font-black"
                        >
                          Hapus
                        </button>
                      </div>
                      <div className="space-y-1">
                        {history.map((h, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setSearchQuery(h);
                              setAiMessage(h);
                              handleAskAI(undefined, h);
                              setShowHistory(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 transition-colors text-[11px] text-slate-400 hover:text-white truncate flex items-center gap-3 group"
                          >
                            <Search size={10} className="opacity-30 group-hover:opacity-100" />
                            {h}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Result Card Section */}
      {showAIResult && (
        <section ref={aiResultRef} className="py-8 animate-in slide-in-from-top-4 duration-500 px-4">
          <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 md:py-12 bg-[#041a16]/40 backdrop-blur-3xl border border-emerald-500/20 rounded-[3rem] relative shadow-3xl shadow-emerald-900/10">
            {/* Confidence Badge */}
            <div className="absolute top-8 right-8 flex items-center gap-4">
              <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-4 py-2">
                <TrendingUp size={14} className="animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">Confidence: 98%</span>
              </div>
              <button onClick={() => setShowAIResult(false)} className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Header */}
            <div className="flex items-center gap-4 mb-10">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <Bot size={28} className="text-emerald-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-emerald-400 tracking-tight">Jawaban AI</h2>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-[0.2em]">Pencarian cerdas melalui basis data & FAQ</p>
              </div>
            </div>

            <div className="space-y-8">
              {/* User Message */}
              <div className="animate-in fade-in duration-700">
                <p className="text-[10px] font-black text-emerald-500/50 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Pertanyaan Anda:
                </p>
                <div className="bg-white/2 border border-white/5 rounded-[2rem] p-8 md:p-10 font-black italic text-white/40 text-lg md:text-xl leading-relaxed">
                  &quot;{currentAIResult?.question}&quot;
                </div>
              </div>

              {/* AI Response */}
              <div className="animate-in fade-in duration-1000 slide-in-from-bottom-2">
                <p className="text-[10px] font-black text-emerald-500/50 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Jawaban AI:
                </p>
                <div className="bg-[#0c1214] border border-white/5 rounded-[2rem] p-8 md:p-12 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />

                  {isAiLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                      <Loader2 className="animate-spin text-emerald-400" size={32} />
                      <p className="text-emerald-400/50 text-[10px] font-black uppercase tracking-widest animate-pulse">Menghimpun jawaban terbaik...</p>
                    </div>
                  ) : (
                    <article className="prose prose-invert prose-emerald max-w-none prose-p:leading-[1.8] prose-p:text-slate-300 prose-p:font-medium prose-strong:text-emerald-400 prose-li:text-slate-400">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {currentAIResult?.answer || ""}
                      </ReactMarkdown>
                    </article>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Info */}
            <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <div className="w-1 h-1 bg-emerald-500 rounded-full" /> Dijawab Oleh Model LearningAI Berdasarkan Data MyLearning
              </p>
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                SESSIONID: 0V5T7
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="py-16 min-h-[600px]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {!searchQuery && (
            <>
              {/* Category tabs */}
              <div className="flex flex-wrap gap-2 mb-10 justify-center">
                {faqData.map((cat, idx) => (
                  <button
                    key={cat.name}
                    onClick={() => setActiveCategory(idx)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${activeCategory === idx
                        ? "bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-lg shadow-purple-500/20"
                        : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5"
                      }`}
                  >
                    <span>{cat.icon}</span> {cat.name}
                  </button>
                ))}
              </div>

              {/* FAQ Items */}
              <div className="space-y-3">
                {faqData[activeCategory].items.map((item, idx) => {
                  const key = `${activeCategory}-${idx}`;
                  const isOpen = openItems.has(key);
                  return (
                    <div
                      key={key}
                      className="card overflow-hidden group hover:border-purple-500/30 transition-colors"
                    >
                      <button
                        onClick={() => toggleItem(key)}
                        className="w-full flex items-center justify-between p-5 text-left"
                        id={`faq-item-${activeCategory}-${idx}`}
                      >
                        <span className="text-white font-medium text-sm sm:text-base pr-4">
                          {item.question}
                        </span>
                        <ChevronDown
                          size={18}
                          className={`text-slate-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-purple-400" : ""
                            }`}
                        />
                      </button>
                      <div
                        className={`transition-all duration-300 ease-in-out ${isOpen
                            ? "max-h-96 opacity-100"
                            : "max-h-0 opacity-0"
                          } overflow-hidden`}
                      >
                        <div className="px-5 pb-5 text-slate-400 text-sm leading-relaxed border-t border-white/5 pt-4">
                          {item.answer}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {searchQuery && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-white">
                  Hasil pencarian untuk "{searchQuery}"
                </h3>
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  <X size={14} /> Bersihkan
                </button>
              </div>

              {filteredResults && filteredResults.length > 0 ? (
                <div className="space-y-3">
                  {filteredResults.map((res, i) => {
                    const key = `search-${res.catIdx}-${res.idx}`;
                    const isOpen = openItems.has(key);
                    return (
                      <div
                        key={key}
                        className="card overflow-hidden"
                      >
                        <button
                          onClick={() => toggleItem(key)}
                          className="w-full flex items-center justify-between p-5 text-left"
                        >
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase tracking-wider text-purple-400 font-bold">{res.category}</span>
                            <span className="text-white font-medium text-sm sm:text-base pr-4">
                              <SearchHighlight text={res.item.question} query={searchQuery} />
                            </span>
                          </div>
                          <ChevronDown
                            size={18}
                            className={`text-slate-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""
                              }`}
                          />
                        </button>
                        <div
                          className={`transition-all duration-300 ease-in-out ${isOpen
                              ? "max-h-96 opacity-100"
                              : "max-h-0 opacity-0"
                            } overflow-hidden`}
                        >
                          <div className="px-5 pb-5 text-slate-400 text-sm leading-relaxed border-t border-white/5 pt-4">
                            <SearchHighlight 
                              text={res.item.answer} 
                              query={searchQuery} 
                              className="bg-cyan-500/20 text-cyan-200 rounded-sm px-0.5"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20 card bg-white/5 border-dashed border-white/10">
                  <HelpCircle size={48} className="mx-auto text-slate-600 mb-4" />
                  <p className="text-slate-500">Maaf, kami tidak menemukan jawaban yang sesuai.</p>
                  <button
                    onClick={() => handleAskAI()}
                    className="mt-4 text-purple-400 hover:underline font-medium"
                  >
                    Coba tanya Asisten AI kami?
                  </button>
                  
                  {/* Search Recovery Ad */}
                  <div className="mt-8 max-w-md mx-auto">
                    <NativeAdCard location="search_recovery" variant="compact" initialPromo={initialSearchRecoveryPromo} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Still have questions? */}
          <div className="mt-20 text-center">
            <div className="card p-8 sm:p-12 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-cyan-900/10 opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
                  <MessageCircle
                    size={32}
                    className="text-purple-400"
                  />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Punya Pertanyaan Spesifik?
                </h3>
                <p className="text-slate-400 text-base mb-8 max-w-md">
                  Tim support kami siap membantu Anda 24/7. Hubungi kami untuk bantuan lebih lanjut.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link href="/contact" className="btn-primary px-8">
                    Hubungi Kami
                  </Link>
                  <button onClick={() => handleAskAI()} className="px-8 py-3 rounded-xl bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-all font-medium">
                    Asisten AI
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Modal removed in favor of inline result card */}
    </>
  );
}
