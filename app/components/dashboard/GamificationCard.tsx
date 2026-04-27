"use client";

import { useEffect, useState } from "react";
import { Flame, Trophy, Star, Zap, ChevronRight, Award } from "lucide-react";
import { 
  getUserGamification, 
  getUserBadges, 
  calculateLevelProgress, 
  UserGamification, 
  UserBadge,
  getRarityColor
} from "@/lib/gamification";
import Link from "next/link";

interface GamificationCardProps {
  userId: string;
}

export default function GamificationCard({ userId }: GamificationCardProps) {
  const [stats, setStats] = useState<UserGamification | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [s, b] = await Promise.all([
        getUserGamification(userId),
        getUserBadges(userId)
      ]);
      setStats(s);
      setBadges(b);
      setLoading(false);
    }
    fetchData();
  }, [userId]);

  if (loading) {
    return (
      <div className="card p-6 border-white/5 animate-pulse">
        <div className="h-20 bg-white/5 rounded-2xl mb-4"></div>
        <div className="h-24 bg-white/5 rounded-2xl"></div>
      </div>
    );
  }

  if (!stats) return null;

  const progress = calculateLevelProgress(stats.xp, stats.level);

  return (
    <div className="space-y-6">
      {/* Level & XP Card */}
      <div className="card !bg-gradient-to-br from-purple-900/40 to-indigo-900/40 p-6 border-purple-500/20 relative overflow-hidden group">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/10 blur-[50px] rounded-full group-hover:bg-purple-500/20 transition-all duration-700"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 shadow-2xl relative">
                <Star className="text-yellow-400 fill-yellow-400" size={28} />
                <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-purple-400">
                  LVL {stats.level}
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Status Pembelajar</h3>
                <p className="text-xs text-purple-300 font-medium uppercase tracking-widest">Mastery Progress</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
              <Flame className="text-orange-500" size={16} />
              <span className="text-sm font-black text-white">{stats.streak_count} Hari</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-[10px] text-purple-300 font-bold uppercase tracking-widest">Next Level: {progress.xpRemaining} XP</span>
              <span className="text-xs font-black text-white">{stats.xp} / {progress.nextLevelXP} XP</span>
            </div>
            <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Badges Preview */}
      <div className="card p-6 border-white/5 bg-white/[0.02]">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Award className="text-cyan-400" size={18} /> Pencapaian Terbaru
          </h4>
          <Link href="/dashboard/badges" className="text-[10px] font-bold text-slate-500 hover:text-white transition-colors flex items-center gap-1 uppercase tracking-widest">
            Semua <ChevronRight size={12} />
          </Link>
        </div>

        {badges.length > 0 ? (
          <div className="grid grid-cols-4 gap-3">
            {badges.slice(0, 4).map((badge) => (
              <div 
                key={badge.id} 
                className={`aspect-square rounded-2xl border flex flex-col items-center justify-center p-2 group transition-all hover:scale-110 cursor-help ${getRarityColor(badge.rarity)}`}
                title={`${badge.name}: ${badge.description}`}
              >
                <Zap size={20} className="mb-1" />
                <span className="text-[8px] font-black uppercase text-center leading-tight line-clamp-1">{badge.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center border-2 border-dashed border-white/5 rounded-2xl">
            <Trophy className="mx-auto text-slate-800 mb-2" size={24} />
            <p className="text-[10px] text-slate-600 font-medium">Selesaikan kursus untuk mendapatkan badge!</p>
          </div>
        )}
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-4 border-white/5 bg-white/[0.01] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/10">
            <Zap size={18} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Pelajaran</p>
            <p className="text-lg font-black text-white">{stats.total_lessons_completed}</p>
          </div>
        </div>
        <div className="card p-4 border-white/5 bg-white/[0.01] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 border border-cyan-500/10">
            <Flame size={18} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Streak</p>
            <p className="text-lg font-black text-white">{stats.streak_count}d</p>
          </div>
        </div>
      </div>
      {/* Leaderboard Link */}
      <Link 
        href="/dashboard/leaderboard" 
        className="btn-secondary w-full !py-3 flex items-center justify-center gap-2 group border-purple-500/30 hover:border-purple-500/60"
      >
        <Trophy size={16} className="text-purple-400 group-hover:scale-110 transition-transform" />
        <span className="text-xs font-black uppercase tracking-widest">Lihat Papan Peringkat</span>
      </Link>
    </div>
  );
}
