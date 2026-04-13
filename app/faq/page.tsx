"use client";

import { useState, useMemo } from "react";
import { ChevronDown, HelpCircle, MessageCircle, Search, Bot, Send, Sparkles, Loader2, X } from "lucide-react";
import Link from "next/link";
import { getFAQGeminiResponse } from "@/lib/gemini";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState(0);
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  
  // AI States
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [aiHistory, setAiHistory] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

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
          item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.answer.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          results.push({ category: cat.name, item, idx, catIdx });
        }
      });
    });
    return results;
  }, [searchQuery]);

  const handleAskAI = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiMessage.trim() || isAiLoading) return;

    const userMsg = aiMessage;
    setAiMessage("");
    setAiHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsAiLoading(true);

    try {
      const response = await getFAQGeminiResponse(userMsg, faqData);
      setAiHistory(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setAiHistory(prev => [...prev, { role: 'assistant', content: "Maaf, terjadi kesalahan teknis. Silakan coba lagi nanti." }]);
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
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input
                type="text"
                placeholder="Cari pertanyaan kamu di sini..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:text-slate-600 shadow-xl"
              />
            </div>
            <button 
              onClick={() => setIsAIOpen(true)}
              className="btn-primary py-4 px-6 flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_25px_rgba(147,51,234,0.5)]"
            >
              <Sparkles size={18} className="group-hover:animate-pulse" />
              Tanya AI Boss
            </button>
          </div>
        </div>
      </section>

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
                    className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      activeCategory === idx
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
                          className={`text-slate-400 flex-shrink-0 transition-transform duration-300 ${
                            isOpen ? "rotate-180 text-purple-400" : ""
                          }`}
                        />
                      </button>
                      <div
                        className={`transition-all duration-300 ease-in-out ${
                          isOpen
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
                              {res.item.question}
                            </span>
                          </div>
                          <ChevronDown
                            size={18}
                            className={`text-slate-400 flex-shrink-0 transition-transform duration-300 ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        <div
                          className={`transition-all duration-300 ease-in-out ${
                            isOpen
                              ? "max-h-96 opacity-100"
                              : "max-h-0 opacity-0"
                          } overflow-hidden`}
                        >
                          <div className="px-5 pb-5 text-slate-400 text-sm leading-relaxed border-t border-white/5 pt-4">
                            {res.item.answer}
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
                    onClick={() => setIsAIOpen(true)}
                    className="mt-4 text-purple-400 hover:underline font-medium"
                  >
                    Coba tanya Asisten AI kami?
                  </button>
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
                  <button onClick={() => setIsAIOpen(true)} className="px-8 py-3 rounded-xl bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-all font-medium">
                    Asisten AI
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Chat Drawer/Modal */}
      {isAIOpen && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setIsAIOpen(false)}
          />
          
          <div className="relative w-full max-w-lg h-[600px] max-h-[85vh] glass-strong rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-500">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-purple-600 to-cyan-500 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                  <Bot size={22} />
                </div>
                <div>
                  <h4 className="font-bold text-sm">FAQ Smart Assistant</h4>
                  <p className="text-[10px] opacity-80 uppercase tracking-widest font-bold">Online & Ready</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAIOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0f0a1a]/40 custom-scrollbar">
              {aiHistory.length === 0 && (
                <div className="text-center py-10 px-6">
                  <Bot size={48} className="mx-auto text-purple-400/50 mb-4" />
                  <p className="text-slate-300 font-medium mb-1">Halo! Saya asisten pintar MyLearning.</p>
                  <p className="text-slate-500 text-xs">Tanyakan apa saja seputar platform kami, saya akan menjawab berdasarkan FAQ resmi kami.</p>
                  
                  <div className="mt-8 flex flex-wrap justify-center gap-2">
                    {["Cara daftar?", "Metode bayar?", "Ada sertifikat?", "Bisa belajar di HP?"].map(suggest => (
                      <button 
                        key={suggest}
                        onClick={() => {
                          setAiMessage(suggest);
                        }}
                        className="text-[10px] px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-purple-500/50 transition-all"
                      >
                        {suggest}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {aiHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in`}>
                  <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-purple-600 text-white rounded-br-none' 
                      : 'bg-white/10 text-slate-100 rounded-bl-none border border-white/5'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <article className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-black/50">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </article>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}

              {isAiLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 rounded-2xl px-4 py-3 border border-white/5 flex items-center gap-2 text-slate-400 text-sm">
                    <Loader2 size={16} className="animate-spin text-purple-400" />
                    <span>AI sedang berpikir...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-[#0f0a1a]/80 backdrop-blur-md">
              <form onSubmit={handleAskAI} className="flex gap-2 relative">
                <input
                  type="text"
                  value={aiMessage}
                  onChange={(e) => setAiMessage(e.target.value)}
                  placeholder="Ketik pertanyaanmu..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all"
                />
                <button
                  type="submit"
                  disabled={isAiLoading || !aiMessage.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-purple-500 hover:text-cyan-400 disabled:text-slate-600 transition-colors"
                >
                  <Send size={20} />
                </button>
              </form>
              <p className="text-[10px] text-slate-500 text-center mt-3">
                Powered by Gemini Flash • Berdasarkan FAQ MyLearning
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
