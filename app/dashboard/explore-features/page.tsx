"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, Users, MessageCircle, Search, Activity, 
  UserCircle, Zap, Tablet, Bookmark, Vote,
  Award, ShieldCheck, Download, Video, UserPlus, 
  HelpCircle, FileText, Users2, FileUser, Route,
  Sparkles, Code2, Briefcase, Box, Layers, 
  Radar, RefreshCw, Moon, Trophy, Lock,
  ArrowRight, Check, Star, Globe, Heart
} from "lucide-react";

import { FEATURES_MANIFEST, FeatureDefinition } from "@/lib/features";
import { useAuth } from "@/app/components/AuthContext";
import { getTiers, Tier } from "@/lib/tiers";


const ICON_MAP: Record<string, any> = {
  LayoutDashboard, Users, MessageCircle, Search, Activity, 
  UserCircle, Zap, Tablet, Bookmark, Vote,
  Award, ShieldCheck, Download, Video, UserPlus, 
  HelpCircle, FileText, Users2, FileUser, Route,
  Sparkles, Code2, Briefcase, Box, Layers, 
  Radar, RefreshCw, Moon, Trophy, Lock,
  ArrowRight, Check, Star, Globe, Heart
};
export default function ExploreFeaturesPage() {

  const { user } = useAuth();
  const [tiers, setTiers] = React.useState<Tier[]>([]);

  React.useEffect(() => {
    getTiers().then(setTiers);
  }, []);

  const isUnlocked = (feat: FeatureDefinition) => {
    if (feat.category === 'free') return true;
    if (!user) return false;
    if (user.role?.toLowerCase() === 'admin' || user.role?.toLowerCase() === 'instructor') return true;
    
    const userTier = tiers.find(t => t.id === user.tierId);
    if (!userTier) return false;

    const tierOrder = ['free', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'emerald', 'ruby', 'sapphire', 'mastermind', 'legendary'];
    const userTierIndex = tierOrder.indexOf(userTier.slug || 'free');
    const requiredTierIndex = tierOrder.indexOf(feat.tier_required || 'free');

    return userTierIndex >= requiredTierIndex;
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-widest">
            <Sparkles size={14} />
            Feature Universe
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            Eksplorasi <span className="gradient-text">30 Fitur Unggulan</span> MyLearning
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg font-medium">
            Temukan berbagai alat bantu cerdas yang dirancang khusus untuk mempercepat perjalanan belajar Anda dari pemula hingga ahli.
          </p>
        </div>

        {/* Free Section */}
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <Heart className="text-purple-400 fill-purple-400/20" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Fitur Gratis (Starter)</h2>
              <p className="text-slate-500 text-sm font-medium">Tersedia untuk seluruh pengguna tanpa biaya tambahan.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {FEATURES_MANIFEST.filter(f => f.category === 'free').map((f) => (
              <FeatureCard key={f.key} feature={f} color="purple" unlocked={isUnlocked(f)} />
            ))}
          </div>
        </div>

        {/* Paid Section */}
        <div className="space-y-8 relative">
           <div className="absolute inset-0 bg-amber-500/5 blur-[100px] -z-10 rounded-full opacity-50" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <Star className="text-amber-400 fill-amber-400/20" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Fitur Berbayar (Premium)</h2>
              <p className="text-slate-500 text-sm font-medium">Optimalkan pengalaman belajar dengan fitur eksklusif.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {FEATURES_MANIFEST.filter(f => f.category === 'paid').map((f) => (
              <FeatureCard key={f.key} feature={f} color="amber" isPremium unlocked={isUnlocked(f)} />
            ))}
          </div>
        </div>

        {/* Special Section */}
        <div className="space-y-8 relative">
           <div className="absolute inset-0 bg-cyan-500/5 blur-[100px] -z-10 rounded-full opacity-50" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/30">
              <Zap className="text-cyan-400 fill-cyan-400/20" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Fitur Khusus (Elite AI)</h2>
              <p className="text-slate-500 text-sm font-medium">Teknologi mutakhir untuk hasil belajar maksimal.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {FEATURES_MANIFEST.filter(f => f.category === 'special').map((f) => (
              <FeatureCard key={f.key} feature={f} color="cyan" isSpecial unlocked={isUnlocked(f)} />
            ))}
          </div>
        </div>


        {/* CTA */}
        <div className="card p-12 text-center space-y-6 border-white/5 bg-gradient-to-br from-white/5 to-transparent relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-cyan-400 to-emerald-400" />
          <div className="max-w-xl mx-auto space-y-4">
            <h2 className="text-3xl font-bold text-white">Siap Meningkatkan Tier Anda?</h2>
            <p className="text-slate-400">Dapatkan akses ke seluruh 30 fitur hari ini dan rasakan transformasi cara Anda belajar secara profesional.</p>
            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard/vouchers" className="btn-primary px-8">
                Lihat Paket Berlangganan <ArrowRight size={18} />
              </Link>
              <Link href="/dashboard/my-courses" className="btn-secondary px-8">
                Mulai Belajar Sekarang
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function FeatureCard({ feature, color, isPremium, isSpecial, unlocked }: { feature: FeatureDefinition, color: string, isPremium?: boolean, isSpecial?: boolean, unlocked: boolean }) {
  const Icon = ICON_MAP[feature.icon_name] || Star;
  
  const colorMap: any = {
    purple: "group-hover:text-purple-400 bg-purple-500/10 border-purple-500/20",
    amber: "group-hover:text-amber-400 bg-amber-500/10 border-amber-500/20",
    cyan: "group-hover:text-cyan-400 bg-cyan-500/10 border-cyan-500/20"
  };

  const iconColorMap: any = {
    purple: "text-purple-400",
    amber: "text-amber-400",
    cyan: "text-cyan-400"
  };

  return (
    <div className={`card p-6 flex flex-col items-center text-center space-y-4 group transition-all duration-300 border-white/5 relative overflow-hidden ${
      unlocked ? "hover:scale-[1.03] hover:-translate-y-1" : "opacity-60 grayscale hover:grayscale-0 hover:opacity-100"
    }`}>
      {isPremium && (
        <div className="absolute top-2 right-2">
          <div className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-black text-amber-500 uppercase tracking-tighter">Pro</div>
        </div>
      )}
      {isSpecial && (
        <div className="absolute top-2 right-2">
          <div className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-black text-cyan-500 uppercase tracking-tighter">Elite</div>
        </div>
      )}
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${colorMap[color]} group-hover:scale-110 shadow-lg group-hover:shadow-${color}-500/20 relative`}>
        <Icon size={28} className={`${iconColorMap[color]} group-hover:animate-pulse`} />
        {!unlocked && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center">
            <Lock size={12} className="text-slate-600" />
          </div>
        )}
      </div>
      <div className="space-y-2">
        <h3 className="text-white font-bold text-sm tracking-tight group-hover:text-white transition-colors">{feature.name}</h3>
        <p className="text-slate-500 text-[11px] leading-relaxed font-medium">{feature.description}</p>
      </div>
      {unlocked && (
        <div className="pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
           <div className={`w-8 h-1 rounded-full bg-${color === 'purple' ? 'purple-500' : color === 'amber' ? 'amber-500' : 'cyan-500'}/50 mx-auto`} />
        </div>
      )}
    </div>
  );
}

