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

import { faqData, type FAQItem, type FAQCategory } from "./data/faqData";

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
      "Sertifikat": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      "Privasi & Keamanan": "bg-blue-500/10 text-blue-400 border-blue-500/20",
      "Instruktur & Pengajaran": "bg-amber-500/10 text-amber-400 border-amber-500/20",
      "Fitur & Komunitas": "bg-pink-500/10 text-pink-400 border-pink-500/20"
    };

    const getRandomItems = () => {
      const selected: { text: string, color: string }[] = [];
      const usedCategories = new Set<string>();

      // Try to get one from different categories for variety
      const shuffledCategories = [...faqData].sort(() => Math.random() - 0.5);

      shuffledCategories.forEach((cat: FAQCategory) => {
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
    faqData.forEach((cat: FAQCategory, catIdx: number) => {
      cat.items.forEach((item: FAQItem, idx: number) => {
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
      <section className="pt-24 pb-16 sm:pt-32 sm:pb-20 relative overflow-hidden flex flex-col items-center justify-center border-b border-white/5">
        {/* Clean Background */}
        <div className="absolute inset-0 bg-[#09090f] z-0" />
        <div className="absolute top-0 w-full h-[500px] bg-gradient-to-b from-purple-900/10 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay z-0" />

        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center w-full animate-fade-in-up">
          <h1 className="text-4xl sm:text-6xl font-extrabold mb-6 tracking-tight text-white">
            Pusat Bantuan MyLearning
          </h1>
          <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10">
            Temukan jawaban untuk pertanyaan umum, atau gunakan asisten AI kami untuk pencarian pintar.
          </p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto space-y-4 text-left">
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-400 transition-colors" size={20} />
              <input
                type="text"
                placeholder="Cari artikel atau pertanyaan..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setAiMessage(e.target.value);
                }}
                className="w-full bg-[#0c0c14] border border-white/10 rounded-2xl py-4 pl-14 pr-32 text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-slate-500 text-base shadow-sm hover:border-white/20"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button
                  onClick={() => handleAskAI()}
                  disabled={!searchQuery.trim() || isAiLoading}
                  className="px-4 py-2 bg-white/5 hover:bg-purple-600/20 text-slate-300 hover:text-purple-300 rounded-xl transition-colors text-sm font-medium flex items-center gap-1.5 disabled:opacity-50 disabled:hover:bg-white/5 disabled:hover:text-slate-300"
                >
                  {isAiLoading ? <Loader2 size={16} className="animate-spin" /> : <Bot size={16} />}
                  <span className="hidden sm:inline">Tanya AI</span>
                </button>
              </div>
            </div>

            {/* Suggestions & History */}
            <div className="flex flex-wrap items-center justify-between gap-y-4 px-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-slate-500 mr-1">
                  Saran:
                </span>
                <div className="flex flex-wrap gap-2">
                  {suggestions.slice(0, 3).map((s, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSearchQuery(s.text);
                        setAiMessage(s.text);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-transparent transition-colors text-xs text-slate-400 hover:text-slate-200"
                    >
                      {s.text}
                    </button>
                  ))}
                </div>
              </div>

              {history.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <History size={14} /> Riwayat
                  </button>

                  {/* History Dropdown */}
                  {showHistory && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-[#12121a] border border-white/10 rounded-xl p-2 z-50 shadow-xl">
                      <div className="flex items-center justify-between px-2 py-1.5 mb-1">
                        <span className="text-xs font-medium text-slate-500">Terakhir Dicari</span>
                        <button
                          onClick={() => { setHistory([]); localStorage.removeItem("faq_search_history"); }}
                          className="text-[10px] text-red-400/80 hover:text-red-400"
                        >
                          Hapus Semua
                        </button>
                      </div>
                      <div className="space-y-0.5">
                        {history.map((h, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setSearchQuery(h);
                              setAiMessage(h);
                              setShowHistory(false);
                            }}
                            className="w-full text-left px-2 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-slate-300 hover:text-white truncate flex items-center gap-2"
                          >
                            <Search size={12} className="text-slate-500 shrink-0" />
                            <span className="truncate">{h}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* AI Result Card Section */}
      {showAIResult && (
        <section ref={aiResultRef} className="py-8 animate-in fade-in duration-500 px-4">
          <div className="max-w-3xl mx-auto bg-[#12121a] border border-white/10 rounded-2xl relative shadow-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#1a1a24]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                  <Bot size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Asisten AI</h2>
                  <p className="text-slate-500 text-[10px] uppercase tracking-wider font-medium">Berdasarkan pusat bantuan</p>
                </div>
              </div>
              <button onClick={() => setShowAIResult(false)} className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* User Message */}
              <div className="flex flex-col items-end gap-2 animate-in slide-in-from-right-4 duration-300">
                <div className="bg-purple-600 text-white rounded-2xl rounded-tr-sm px-5 py-3 max-w-[85%] text-sm sm:text-base shadow-sm">
                  {currentAIResult?.question}
                </div>
              </div>

              {/* AI Response */}
              <div className="flex flex-col items-start gap-2 animate-in slide-in-from-left-4 duration-500">
                <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-sm px-5 py-4 max-w-[90%] text-sm sm:text-base">
                  {isAiLoading ? (
                    <div className="flex items-center gap-3 text-slate-400 py-2">
                      <Loader2 className="animate-spin" size={16} />
                      <span className="text-sm">Mencari jawaban...</span>
                    </div>
                  ) : (
                    <article className="prose prose-invert prose-p:leading-relaxed prose-p:text-slate-300 prose-p:mb-4 last:prose-p:mb-0 prose-strong:text-white prose-li:text-slate-300 max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {currentAIResult?.answer || ""}
                      </ReactMarkdown>
                    </article>
                  )}
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-6 py-3 bg-[#0c0c14] border-t border-white/5 flex items-center justify-between">
              <p className="text-[11px] text-slate-500">
                AI dapat membuat kesalahan. Harap periksa kembali informasinya.
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
                {faqData.map((cat: FAQCategory, idx: number) => (
                  <button
                    key={cat.name}
                    onClick={() => setActiveCategory(idx)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${activeCategory === idx
                      ? "bg-white/10 text-white border border-white/10"
                      : "bg-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
                      }`}
                  >
                    <span className="opacity-80">{cat.icon}</span> 
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* FAQ Items */}
              <div className="max-w-3xl mx-auto space-y-2">
                {faqData[activeCategory].items.map((item: FAQItem, idx: number) => {
                  const key = `${activeCategory}-${idx}`;
                  const isOpen = openItems.has(key);
                  return (
                    <div
                      key={key}
                      className="border-b border-white/5 last:border-0"
                    >
                      <button
                        onClick={() => toggleItem(key)}
                        className="w-full flex items-center justify-between py-5 text-left group"
                        id={`faq-item-${activeCategory}-${idx}`}
                      >
                        <span className={`font-medium text-base sm:text-lg pr-8 transition-colors ${isOpen ? "text-white" : "text-slate-300 group-hover:text-white"}`}>
                          {item.question}
                        </span>
                        <ChevronDown 
                          size={20} 
                          className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-purple-400" : "text-slate-500 group-hover:text-slate-300"}`} 
                        />
                      </button>
                      <div
                        className={`transition-all duration-200 ease-in-out overflow-hidden ${isOpen ? "max-h-[800px] opacity-100 pb-6" : "max-h-0 opacity-0"}`}
                      >
                        <div className="text-slate-400 text-base leading-relaxed pr-8">
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
                <div className="max-w-3xl mx-auto space-y-2">
                  {filteredResults.map((res, i) => {
                    const key = `search-${res.catIdx}-${res.idx}`;
                    const isOpen = openItems.has(key);
                    return (
                      <div
                        key={key}
                        className="border-b border-white/5 last:border-0"
                      >
                        <button
                          onClick={() => toggleItem(key)}
                          className="w-full flex items-center justify-between py-5 text-left group"
                        >
                          <div className="flex flex-col gap-1 pr-8">
                            <span className="text-xs text-purple-400/80 font-medium">{res.category}</span>
                            <span className={`font-medium text-base sm:text-lg transition-colors ${isOpen ? "text-white" : "text-slate-300 group-hover:text-white"}`}>
                              <SearchHighlight text={res.item.question} query={searchQuery} className="bg-purple-500/20 text-white rounded px-0.5" />
                            </span>
                          </div>
                          <ChevronDown 
                            size={20} 
                            className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-purple-400" : "text-slate-500 group-hover:text-slate-300"}`} 
                          />
                        </button>
                        <div
                          className={`transition-all duration-200 ease-in-out overflow-hidden ${isOpen ? "max-h-[800px] opacity-100 pb-6" : "max-h-0 opacity-0"}`}
                        >
                          <div className="text-slate-400 text-base leading-relaxed pr-8">
                            <SearchHighlight
                              text={res.item.answer}
                              query={searchQuery}
                              className="bg-purple-500/20 text-white rounded px-0.5"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="max-w-3xl mx-auto text-center py-20 bg-[#0c0c14] border border-white/5 rounded-2xl">
                  <HelpCircle size={40} className="mx-auto text-slate-600 mb-4" />
                  <p className="text-slate-400 mb-2">Tidak menemukan jawaban yang pas?</p>
                  <button
                    onClick={() => handleAskAI()}
                    className="text-purple-400 hover:text-purple-300 font-medium text-sm flex items-center justify-center gap-2 mx-auto"
                  >
                    <Bot size={16} /> Tanya Asisten AI kami
                  </button>

                  {/* Search Recovery Ad */}
                  <div className="mt-8 max-w-md mx-auto px-4">
                    <NativeAdCard location="search_recovery" variant="compact" initialPromo={initialSearchRecoveryPromo} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Still have questions? */}
          <div className="mt-24 text-center pb-12 max-w-3xl mx-auto">
            <div className="bg-[#0c0c14] border border-white/10 rounded-3xl p-8 sm:p-12">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
                  <MessageCircle size={28} className="text-slate-300" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Masih punya pertanyaan?
                </h3>
                <p className="text-slate-400 text-base mb-8 max-w-md">
                  Jika Anda tidak dapat menemukan apa yang Anda cari, jangan ragu untuk menghubungi tim support kami.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link href="/contact" className="px-6 py-2.5 rounded-xl bg-white text-[#09090f] hover:bg-slate-200 transition-colors font-medium text-sm">
                    Hubungi Dukungan
                  </Link>
                  <button onClick={() => handleAskAI()} className="px-6 py-2.5 rounded-xl bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors font-medium text-sm flex items-center gap-2">
                    <Bot size={16} />
                    Tanya AI
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
