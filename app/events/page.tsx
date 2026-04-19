"use client";

import { useState, useEffect } from "react";
import { 
  Calendar, Search, MapPin, Clock, ArrowRight, Sparkles, 
  ChevronRight, Filter, LayoutGrid, List as ListIcon, Loader2
} from "lucide-react";
import Link from "next/link";
import { getEvents, PlatformEvent } from "@/lib/events";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import NativeAdCard from "../components/NativeAdCard";

export default function EventsGalleryPage() {
  const [events, setEvents] = useState<PlatformEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "past">("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const data = await getEvents();
    setEvents(data);
    setLoading(false);
  };

  const filteredEvents = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || e.category === selectedCategory;
    const matchesLevel = selectedLevel === "all" || e.level === selectedLevel;
    
    const eventDate = new Date(e.eventDate);
    const now = new Date();
    
    const matchesTab = activeTab === "all" 
      ? true 
      : activeTab === "upcoming" ? eventDate >= now : eventDate < now;

    return matchesSearch && matchesCategory && matchesLevel && matchesTab;
  });

  return (
    <div className="min-h-screen bg-[#09090f] text-white selection:bg-purple-500/30">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-purple-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-7xl px-4 flex justify-center pointer-events-none">
           <div className="w-[800px] h-[300px] bg-purple-500/20 blur-[120px] rounded-full opacity-30 animate-pulse" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-purple-400 text-xs font-black uppercase tracking-widest mb-6 animate-fade-in-up">
            <Sparkles size={14} /> Platform Event MyLearning
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 animate-fade-in-up [animation-delay:100ms]">
            Upgrade Skill Lewat <span className="gradient-text">Event Eksklusif</span>
          </h1>
          <p className="max-w-2xl mx-auto text-slate-400 text-lg leading-relaxed mb-12 animate-fade-in-up [animation-delay:200ms]">
            Ikuti berbagai webinar, workshop, dan talkshow bersama para expert di bidang teknologi. Dirancang untuk membantu akselerasi karier Anda.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative group animate-fade-in-up [animation-delay:300ms]">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-cyan-400 rounded-3xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
            <div className="relative flex bg-[#0c0c14] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <div className="flex items-center pl-6 text-slate-500">
                  <Search size={20} />
                </div>
                <input 
                  type="text" 
                  placeholder="Cari event menarik (Webinar, UI/UX, Coding...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 px-4 py-5 text-lg font-medium placeholder:text-slate-600"
                />
                <button className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 font-bold uppercase tracking-widest text-xs hover:brightness-110 transition-all">
                  Cari
                </button>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Ad Placement */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-20 relative z-20">
        <NativeAdCard 
          location="event_listing" 
          variant="inline"
          className="shadow-2xl shadow-purple-500/10"
        />
      </div>

      {/* Content Section */}
      <section className="pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filters & View Switches */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 border-b border-white/5 pb-8">
            <div className="flex items-center gap-1 p-1 bg-white/5 rounded-2xl border border-white/10">
              {[
                { id: 'all', label: 'Semua Event' },
                { id: 'upcoming', label: 'Mendatang' },
                { id: 'past', label: 'Selesai' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    activeTab === tab.id ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4">
               {/* Category Filter */}
               <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                  <Filter size={14} className="text-slate-500" />
                  <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-transparent border-none text-xs font-bold uppercase tracking-widest focus:ring-0 cursor-pointer text-slate-300 hover:text-white"
                  >
                    <option value="all" className="bg-[#0c0c14]">Semua Kategori</option>
                    <option value="Webinar" className="bg-[#0c0c14]">Webinar</option>
                    <option value="Workshop" className="bg-[#0c0c14]">Workshop</option>
                    <option value="Competition" className="bg-[#0c0c14]">Competition</option>
                    <option value="Talkshow" className="bg-[#0c0c14]">Talkshow</option>
                  </select>
               </div>

               {/* Level Filter */}
               <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                  <LayoutGrid size={14} className="text-slate-500" />
                  <select 
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="bg-transparent border-none text-xs font-bold uppercase tracking-widest focus:ring-0 cursor-pointer text-slate-300 hover:text-white"
                  >
                    <option value="all" className="bg-[#0c0c14]">Semua Level</option>
                    <option value="Starter" className="bg-[#0c0c14]">Starter</option>
                    <option value="Accelerator" className="bg-[#0c0c14]">Accelerator</option>
                    <option value="Mastery" className="bg-[#0c0c14]">Mastery</option>
                  </select>
               </div>

               <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/10 ml-2">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-purple-400' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white/10 text-purple-400' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <ListIcon size={18} />
                  </button>
               </div>
            </div>
          </div>

          {/* Grid/List Display */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin text-purple-500" size={48} />
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Menyiapkan Event...</p>
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" : "space-y-6"}>
              {filteredEvents.map((event, index) => (
                <EventCard key={event.id} event={event} mode={viewMode} index={index} />
              ))}
            </div>
          ) : (
            <div className="py-32 text-center card bg-white/[0.02] border-white/5 border-dashed">
                <Calendar className="mx-auto text-slate-700 mb-6" size={64} />
                <h3 className="text-xl font-bold text-white mb-2">Belum ada event nih</h3>
                <p className="text-slate-500 max-w-sm mx-auto">Coba cari dengan kata kunci lain atau cek kembali nanti ya!</p>
            </div>
          )}

          {/* Bottom Ad Placement */}
          {!loading && filteredEvents.length > 0 && (
            <div className="mt-20">
              <NativeAdCard 
                location="all" 
                variant="featured" 
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function EventCard({ event, mode, index }: { event: PlatformEvent, mode: 'grid' | 'list', index: number }) {
  const isPast = new Date(event.eventDate) < new Date();

  if (mode === 'list') {
    return (
      <Link 
        href={`/events/${event.slug}`}
        className="group relative flex bg-[#0c0c14] border border-white/5 rounded-3xl overflow-hidden hover:border-purple-500/30 transition-all duration-500 animate-fade-in-up"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <div className="w-48 h-48 flex-shrink-0 relative overflow-hidden">
           {event.thumbnailUrl ? (
             <img src={event.thumbnailUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
           ) : (
             <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-600">
               <Calendar size={32} />
             </div>
           )}
           <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
        
        <div className="flex-1 p-8 flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isPast ? 'bg-slate-500/10 text-slate-500' : 'bg-emerald-500/10 text-emerald-400'}`}>
                {isPast ? 'Selesai' : 'Coming Soon'}
              </span>
              <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-black uppercase tracking-widest border border-purple-500/20">
                {event.category || 'Event'}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1.5 uppercase font-bold tracking-widest ml-1">
                <MapPin size={12} className="text-purple-400" /> {event.location}
              </span>
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors line-clamp-1">{event.title}</h3>
            <p className="text-slate-500 text-sm line-clamp-1 mb-4">{event.shortDescription}</p>
            
            <div className="flex items-center justify-between">
               <div className="text-sm font-bold text-slate-300 flex items-center gap-2">
                 <Clock size={14} className="text-purple-500" />
                 {format(new Date(event.eventDate), "d MMMM yyyy", { locale: id })}
               </div>
               <div className="flex items-center gap-2 text-purple-400 text-xs font-black uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                  Selengkapnya <ArrowRight size={14} />
               </div>
            </div>
        </div>
      </Link>
    );
  }

  return (
    <Link 
      href={`/events/${event.slug}`}
      className="group relative flex flex-col bg-[#0c0c14] border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-purple-500/30 transition-all duration-500 animate-fade-in-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="aspect-[16/9] relative overflow-hidden">
          {event.thumbnailUrl ? (
             <img src={event.thumbnailUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          ) : (
             <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-600 font-bold uppercase tracking-tighter text-3xl">
               EVENT
             </div>
          )}
          <div className="absolute top-4 left-4 flex gap-2">
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border ${isPast ? 'bg-black/50 border-white/5 text-slate-500' : 'bg-emerald-500/20 border-emerald-500/20 text-emerald-400'}`}>
              {isPast ? 'Selesai' : 'Pendaftaran Dibuka'}
            </div>
            <div className="px-3 py-1.5 rounded-full bg-purple-500/80 text-white text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-lg shadow-purple-500/20">
              {event.category || 'Event'}
            </div>
          </div>
          {event.isFeatured && (
             <div className="absolute top-4 right-4 p-2 rounded-full bg-amber-500/20 border border-amber-500/20 text-amber-500">
               <Sparkles size={16} />
             </div>
          )}
      </div>

      <div className="p-8 flex-1 flex flex-col">
          <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 font-bold uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><Calendar size={14} className="text-purple-500" /> {format(new Date(event.eventDate), "d MMM yyyy", { locale: id })}</span>
            <span className="flex items-center gap-1.5"><MapPin size={14} className="text-purple-500" /> {event.location}</span>
          </div>

          <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors line-clamp-2">{event.title}</h3>
          <p className="text-slate-500 text-sm mb-8 line-clamp-2 leading-relaxed">{event.shortDescription}</p>

          <div className="mt-auto flex items-center justify-between pt-6 border-t border-white/5">
              <div className="font-black text-white">
                {event.price === 0 ? <span className="text-emerald-400">GRATIS</span> : `Rp ${event.price.toLocaleString('id-ID')}`}
              </div>
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-all text-slate-500">
                <ChevronRight size={20} />
              </div>
          </div>
      </div>
    </Link>
  );
}
