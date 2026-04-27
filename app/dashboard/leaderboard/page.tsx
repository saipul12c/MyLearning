"use client";

import { useState, useEffect } from "react";
import { getLeaderboard, type LeaderboardEntry } from "@/lib/gamification";
import { Trophy, Medal, Crown, ArrowLeft, Loader2, Star, TrendingUp } from "lucide-react";
import Link from "next/link";
import Skeleton from "../../components/ui/Skeleton";

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      const data = await getLeaderboard(50);
      setLeaderboard(data);
      setLoading(false);
    };
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-8 animate-fade-in">
        <Skeleton className="w-48 h-8" />
        <div className="grid grid-cols-3 gap-6">
           <Skeleton className="h-64 rounded-3xl" />
           <Skeleton className="h-80 rounded-3xl" />
           <Skeleton className="h-64 rounded-3xl" />
        </div>
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  const topThree = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12">
        <div>
          <Link href="/dashboard" className="text-xs font-bold text-slate-500 hover:text-purple-400 flex items-center gap-2 mb-4 transition-colors uppercase tracking-widest group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Kembali ke Dashboard
          </Link>
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Trophy className="text-white" size={24} />
            </div>
            Papan <span className="gradient-text">Peringkat</span>
          </h1>
          <p className="text-slate-400 text-sm mt-3 font-medium">Lihat siapa yang memimpin dalam semangat belajar bulan ini!</p>
        </div>
        
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
           <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <TrendingUp size={20} className="text-purple-400" />
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total XP Terdistribusi</p>
              <p className="text-xl font-bold text-white">{leaderboard.reduce((acc, curr) => acc + curr.xp, 0).toLocaleString()}</p>
           </div>
        </div>
      </div>

      {/* Podium for Top 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12 items-end">
        {/* 2nd Place */}
        {topThree[1] && (
          <div className="order-2 sm:order-1 card p-8 bg-slate-900/50 border-white/5 relative group hover:border-slate-400/20 transition-all">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-400 flex items-center justify-center shadow-lg">
              <Medal size={16} className="text-slate-900" />
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-br from-slate-300 to-slate-500 mb-4">
                <div className="w-full h-full rounded-full bg-slate-900 overflow-hidden border-2 border-[#0f0f1a]">
                  {topThree[1].avatar_url ? (
                    <img src={topThree[1].avatar_url} alt={topThree[1].full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-slate-400">
                      {topThree[1].full_name[0]}
                    </div>
                  )}
                </div>
              </div>
              <h3 className="text-white font-bold text-lg mb-1 truncate w-full">{topThree[1].full_name}</h3>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">Level {topThree[1].level}</p>
              <div className="px-4 py-2 rounded-xl bg-slate-500/10 text-slate-300 font-black text-sm">
                {topThree[1].xp.toLocaleString()} XP
              </div>
            </div>
          </div>
        )}

        {/* 1st Place */}
        {topThree[0] && (
          <div className="order-1 sm:order-2 card p-10 bg-purple-500/5 border-purple-500/20 relative group hover:border-purple-500/40 transition-all scale-105 sm:scale-110 z-10">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-xl shadow-amber-500/20">
              <Crown size={24} className="text-white" />
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 mb-6 shadow-2xl shadow-amber-500/20">
                <div className="w-full h-full rounded-full bg-slate-900 overflow-hidden border-2 border-[#0f0f1a]">
                  {topThree[0].avatar_url ? (
                    <img src={topThree[0].avatar_url} alt={topThree[0].full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-amber-500">
                      {topThree[0].full_name[0]}
                    </div>
                  )}
                </div>
              </div>
              <h3 className="text-white font-black text-xl mb-1 truncate w-full">{topThree[0].full_name}</h3>
              <p className="text-amber-500 text-xs font-black uppercase tracking-widest mb-6">Level {topThree[0].level}</p>
              <div className="px-6 py-3 rounded-2xl bg-amber-500/20 text-amber-400 font-black text-base shadow-inner">
                {topThree[0].xp.toLocaleString()} XP
              </div>
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {topThree[2] && (
          <div className="order-3 card p-8 bg-amber-900/10 border-amber-900/20 relative group hover:border-amber-700/20 transition-all">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-amber-700 flex items-center justify-center shadow-lg">
              <Medal size={16} className="text-white" />
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-br from-amber-600 to-amber-900 mb-4">
                <div className="w-full h-full rounded-full bg-slate-900 overflow-hidden border-2 border-[#0f0f1a]">
                  {topThree[2].avatar_url ? (
                    <img src={topThree[2].avatar_url} alt={topThree[2].full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-amber-700">
                      {topThree[2].full_name[0]}
                    </div>
                  )}
                </div>
              </div>
              <h3 className="text-white font-bold text-lg mb-1 truncate w-full">{topThree[2].full_name}</h3>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">Level {topThree[2].level}</p>
              <div className="px-4 py-2 rounded-xl bg-amber-900/20 text-amber-600 font-black text-sm">
                {topThree[2].xp.toLocaleString()} XP
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table for Remaining */}
      <div className="card overflow-hidden border-white/5 bg-[#0c0c14]/50">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
           <h2 className="text-white font-bold flex items-center gap-2">
              <Star size={18} className="text-purple-400" />
              Peringkat Teratas
           </h2>
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Update Real-time</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Peringkat</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Pengguna</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Level</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Total XP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {remaining.map((entry) => (
                <tr key={entry.user_id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-sm font-black text-slate-500 group-hover:text-white transition-colors">#{entry.rank}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 overflow-hidden border border-white/10 shrink-0">
                        {entry.avatar_url ? (
                          <img src={entry.avatar_url} alt={entry.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500">
                            {entry.full_name[0]}
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">{entry.full_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Lvl {entry.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-black text-white">{entry.xp.toLocaleString()}</span>
                  </td>
                </tr>
              ))}
              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium italic">
                    Belum ada data peringkat untuk ditampilkan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
