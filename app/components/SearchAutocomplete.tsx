"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, X, ArrowRight, History } from "lucide-react";
import SearchHighlight from "./SearchHighlight";

interface Suggestion {
  id: string;
  title: string;
  slug: string;
  category?: string;
}

interface SearchAutocompleteProps {
  placeholder?: string;
  initialValue?: string;
  onSearch: (value: string) => void;
  getSuggestions: (query: string) => Promise<Suggestion[]>;
  onSuggestionClick?: (suggestion: Suggestion) => void;
  className?: string;
  historyKey?: string;
}

export default function SearchAutocomplete({
  placeholder = "Cari sesuatu...",
  initialValue = "",
  onSearch,
  getSuggestions,
  onSuggestionClick,
  className = "",
  historyKey = "general_search_history",
}: SearchAutocompleteProps) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load history
  useEffect(() => {
    if (historyKey) {
      const saved = localStorage.getItem(historyKey);
      if (saved) {
        try {
          setHistory(JSON.parse(saved).slice(0, 5));
        } catch (e) {
          console.error("Failed to parse search history");
        }
      }
    }
  }, [historyKey]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && 
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsLoading(true);
        const results = await getSuggestions(query);
        setSuggestions(results);
        setIsLoading(false);
        setShowDropdown(true);
      } else {
        setSuggestions([]);
        if (query.trim().length === 0 && history.length > 0) {
          setShowDropdown(true);
        } else {
          setShowDropdown(false);
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, getSuggestions, history.length]);

  const saveToHistory = (q: string) => {
    if (!q.trim()) return;
    const newHistory = [q, ...history.filter((h) => h !== q)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem(historyKey, JSON.stringify(newHistory));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      setActiveIndex((prev) => (prev < suggestions.length + (query === "" ? history.length : 0) - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0) {
        const selected = query === "" && history.length > 0 
          ? { id: 'history', title: history[activeIndex], slug: '' }
          : suggestions[activeIndex];
        
        if (selected) {
          handleSelect(selected as Suggestion);
        }
      } else {
        onSearch(query);
        saveToHistory(query);
        setShowDropdown(false);
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  const handleSelect = (s: Suggestion) => {
    if (s.id === 'history') {
      setQuery(s.title);
      onSearch(s.title);
    } else if (onSuggestionClick) {
      onSuggestionClick(s);
    } else {
      setQuery(s.title);
      onSearch(s.title);
    }
    saveToHistory(s.title);
    setShowDropdown(false);
  };

  const clearQuery = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
        <div className="relative flex bg-[#0c0c14] border border-white/10 rounded-2xl overflow-hidden focus-within:border-purple-500/50 transition-all shadow-lg">
          <div className="flex items-center pl-4 text-slate-500 group-focus-within:text-purple-400 transition-colors">
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowDropdown(true)}
            placeholder={placeholder}
            className="w-full bg-transparent border-none focus:ring-0 px-3 py-3.5 text-sm font-medium placeholder:text-slate-600 text-white"
          />
          {query && (
            <button
              onClick={clearQuery}
              className="px-3 text-slate-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          )}
          <button
            onClick={() => {
              onSearch(query);
              saveToHistory(query);
              setShowDropdown(false);
            }}
            className="bg-purple-600/10 hover:bg-purple-600 px-5 text-purple-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border-l border-white/5"
          >
            Cari
          </button>
        </div>
      </div>

      {/* Dropdown */}
      {showDropdown && (suggestions.length > 0 || (query === "" && history.length > 0)) && (
        <div
          ref={dropdownRef}
          className="absolute z-[100] mt-2 w-full bg-[#0c0c14]/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-top-2 duration-300"
        >
          {query === "" && history.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                Riwayat Pencarian
                <button 
                  onClick={() => { setHistory([]); localStorage.removeItem(historyKey); }}
                  className="hover:text-red-400 transition-colors"
                >
                  Hapus
                </button>
              </div>
              {history.map((h, i) => (
                <button
                  key={`h-${i}`}
                  onClick={() => handleSelect({ id: 'history', title: h, slug: '' })}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all text-left ${
                    activeIndex === i ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  }`}
                >
                  <History size={14} className="opacity-50" />
                  {h}
                </button>
              ))}
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Saran Hasil
              </div>
              {suggestions.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => handleSelect(s)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl text-sm transition-all text-left group/item ${
                    activeIndex === i ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium line-clamp-1">
                      <SearchHighlight text={s.title} query={query} className="bg-purple-500/30 text-purple-300" />
                    </span>
                    {s.category && (
                      <span className="text-[10px] text-slate-500 uppercase tracking-tighter">{s.category}</span>
                    )}
                  </div>
                  <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-purple-500" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
