"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Tier, Achievement, purchaseTier, TierPurchase, getUserPendingTierPurchases } from "@/lib/tiers";
import { useAuth } from "@/app/components/AuthContext";
import {
    Zap, Target, CheckCircle, Calendar, Layout, Flame,
    FileText, Wind, Flag, MessageSquare, Award, Gem,
    Crown, Brain, Star, Rocket, Shield, Lock, ArrowRight,
    Clock, AlertCircle, Loader2, Sparkles, ChevronRight,
    Trophy, Coins, TrendingUp, LayoutDashboard, MessageCircle,
    Bookmark, Globe, ShieldCheck, Download, Video, UserPlus,
    HelpCircle, Users2, FileUser, Route, Code2, Briefcase,
    Box, Layers, Radar, RefreshCw, Moon, Heart,
    Activity, Search, UserCircle, Tablet, Info, ExternalLink,
    ChevronDown, Minus, Plus
} from "lucide-react";


import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import TierPaymentModal from "@/app/components/TierPaymentModal";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { FEATURES_MANIFEST, FeatureDefinition } from "@/lib/features";

interface Props {
    tiers: Tier[];
    achievements: Achievement[];
}

const ICON_MAP: Record<string, any> = {
    Zap, Target, CheckCircle, Calendar, Layout, Flame,
    FileText, Wind, Flag, MessageSquare, Award, Gem,
    Crown, Brain, Star, Rocket, Shield, Trophy, Sparkles,
    TrendingUp, Coins, LayoutDashboard, MessageCircle,
    Bookmark, Globe, ShieldCheck, Download, Video, UserPlus,
    HelpCircle, Users2, FileUser, Route, Code2, Briefcase,
    Box, Layers, Radar, RefreshCw, Moon, Heart,
    Activity, Search, UserCircle, Tablet
};

const formatXP = (xp: number) => {
    if (xp >= 1000) {
        return (xp / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    }
    return xp.toString();
};

export default function PringClient({ tiers, achievements }: Props) {
    const { user, isLoggedIn } = useAuth();
    const [loading, setLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [userPurchases, setUserPurchases] = useState<TierPurchase[]>([]);
    const [activePurchase, setActivePurchase] = useState<TierPurchase | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [activeCategory, setActiveCategory] = useState<"starter" | "elite" | "legend">("elite");
    const [showComparison, setShowComparison] = useState(false);
    const [userAchievements, setUserAchievements] = useState<string[]>([]);
    const router = useRouter();

    // Intersection Observer for scroll animations
    const sectionRefs = useRef<(HTMLElement | null)[]>([]);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                }
            });
        }, { threshold: 0.1 });

        sectionRefs.current.forEach(ref => {
            if (ref) observer.observe(ref);
        });

        return () => observer.disconnect();
    }, []);

    const fetchPurchases = useCallback(async () => {
        if (user) {
            const data = await getUserPendingTierPurchases(user.id);
            setUserPurchases(data);
        }
    }, [user]);

    useEffect(() => {
        fetchPurchases();
        const fetchUserAchievements = async () => {
            if (user) {
                const { getUserAchievements } = await import("@/lib/tiers");
                const data = await getUserAchievements(user.id);
                setUserAchievements(data);
            }
        };
        fetchUserAchievements();
    }, [fetchPurchases, user]);

    const groupedTiers = useMemo(() => {
        return {
            starter: tiers.slice(0, 3), // Bronze, Silver, Gold
            elite: tiers.slice(3, 6),   // Platinum, Diamond, Emerald
            legend: tiers.slice(6),      // Ruby, Sapphire, Mastermind
        };
    }, [tiers]);

    const handlePurchase = async (tier: Tier) => {
        if (!isLoggedIn) {
            router.push("/login");
            return;
        }

        const existing = userPurchases.find(p => p.tier_id === tier.id);
        if (existing?.status === 'waiting_verification') return;

        setLoading(tier.id);
        setError(null);
        try {
            const res = await purchaseTier(user!.id, tier.id);
            if (res.success && res.purchaseId) {
                const p: TierPurchase = {
                    id: res.purchaseId,
                    user_id: user!.id,
                    tier_id: tier.id,
                    amount: tier.price,
                    status: 'pending',
                    created_at: new Date().toISOString()
                };
                setActivePurchase(p);
                setShowPaymentModal(true);
                fetchPurchases();
            } else {
                setError(res.error || "Gagal melakukan pembelian.");
            }
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="relative min-h-screen bg-[#030307] text-white selection:bg-purple-500/30 overflow-x-hidden">
            {/* --- PREMIUM BACKGROUND ENGINE --- */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                {/* Grainy Texture */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] brightness-100 contrast-150 mix-blend-overlay" />

                {/* Moving Nebula Orbs */}
                <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full animate-orb-float" />
                <div className="absolute bottom-[10%] right-[-5%] w-[50%] h-[50%] bg-blue-600/15 blur-[150px] rounded-full animate-orb-float-reverse" />
                <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-indigo-600/10 blur-[100px] rounded-full animate-orb-pulse" />

                {/* Grid Overlay with Fade */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
            </div>

            <div className="relative z-10">
                {/* --- HERO SECTION --- */}
                <section
                    ref={el => { sectionRefs.current[0] = el }}
                    className="pt-40 pb-24 px-4 scroll-reveal"
                >
                    <div className="max-w-7xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl mb-8 animate-fade-in shadow-2xl">
                            <div className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Exclusive Membership 2024</span>
                        </div>

                        <h1 className="text-5xl md:text-8xl lg:text-[9rem] font-black tracking-tighter leading-[0.8] mb-8 animate-title-reveal">
                            Unlock <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40">Excellence.</span>
                        </h1>

                        <p className="max-w-2xl mx-auto text-slate-400 text-lg md:text-xl font-medium leading-relaxed mb-12 animate-slide-up delay-300">
                            Pilih jalur pembelajaran masa depan Anda. Investasi satu kali untuk akses ke kurikulum industri premium, mentor ahli, dan jaringan global seumur hidup.
                        </p>

                        {/* --- USER JOURNEY CARD --- */}
                        {isLoggedIn && user && (
                            <div className="max-w-4xl mx-auto mb-20 p-px rounded-[2.5rem] bg-gradient-to-b from-white/10 to-transparent animate-fade-in delay-500">
                                <div className="bg-[#0a0a14]/80 backdrop-blur-3xl rounded-[2.5rem] p-8 md:p-10 border border-white/5 shadow-2xl">
                                    <div className="flex flex-col md:flex-row items-center gap-10">
                                        <div className="relative shrink-0">
                                            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-700 flex items-center justify-center shadow-[0_0_50px_rgba(79,70,229,0.3)] group-hover:scale-105 transition-transform duration-500">
                                                <Trophy size={48} className="text-white drop-shadow-lg" />
                                            </div>
                                            <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-2xl bg-[#030307] border-2 border-white/10 flex items-center justify-center text-[12px] font-black text-amber-400 shadow-xl">
                                                Lv.{user.level || 1}
                                            </div>
                                        </div>
                                        <div className="flex-1 text-center md:text-left">
                                            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                                                <h4 className="text-2xl font-black">Halo, {user.email?.split('@')[0]}</h4>
                                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest w-fit mx-auto md:mx-0">
                                                    {tiers.find(t => t.id === user.tierId)?.name || 'Basic Member'}
                                                </span>
                                            </div>
                                            <p className="text-slate-400 text-sm mb-6 max-w-md">Anda selangkah lagi menuju <span className="text-white font-bold">Elite Status</span>. Tingkatkan tier Anda untuk membuka 12+ fitur eksklusif.</p>

                                            <div className="space-y-3">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Learning Progress</span>
                                                    <span className="text-xs font-black text-purple-400">{user.xp || 0} / {(user.level || 1) * 1000} XP</span>
                                                </div>
                                                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 rounded-full shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all duration-1000"
                                                        style={{ width: `${Math.min(((user.xp || 0) / ((user.level || 1) * 1000)) * 100, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="text-center px-6 py-5 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors">
                                                <span className="block text-2xl font-black mb-1">{formatXP(user.xp || 0)}</span>
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total XP</span>
                                            </div>
                                            <div className="text-center px-6 py-5 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors">
                                                <span className="block text-2xl font-black mb-1">{userAchievements.length.toString().padStart(2, '0')}</span>
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Badges</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- CATEGORY SELECTOR --- */}
                        <div className="relative inline-flex p-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-2xl mb-16 shadow-2xl">
                            {/* Animated Background Slider */}
                            <div
                                className="absolute h-[calc(100%-12px)] top-1.5 rounded-xl bg-white transition-all duration-500 ease-out shadow-xl"
                                style={{
                                    width: 'calc(33.333% - 8px)',
                                    left: activeCategory === 'starter' ? '6px' : activeCategory === 'elite' ? '33.333%' : '66.666%'
                                }}
                            />
                            {(["starter", "elite", "legend"] as const).map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`relative z-10 px-10 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 min-w-[140px] ${activeCategory === cat
                                            ? "text-slate-950"
                                            : "text-slate-500 hover:text-slate-300"
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* --- TIERS GRID --- */}
                <section
                    ref={el => { sectionRefs.current[1] = el }}
                    className="px-4 mb-32 scroll-reveal"
                >
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                            {groupedTiers[activeCategory].map((tier, idx) => {
                                const Icon = ICON_MAP[tier.icon_name] || Award;
                                const isCurrentTier = user?.tierId === tier.id;
                                const purchase = userPurchases.find(p => p.tier_id === tier.id);
                                const isPremium = tier.slug === 'platinum' || tier.slug === 'mastermind' || tier.slug === 'legendary';

                                return (
                                    <div
                                        key={tier.id}
                                        className={`group relative flex flex-col p-10 rounded-[3.5rem] border transition-all duration-700 hover:-translate-y-4 ${isCurrentTier
                                                ? "bg-purple-500/5 border-purple-500/40 shadow-[0_30px_100px_rgba(139,92,246,0.1)]"
                                                : isPremium
                                                    ? "bg-white/[0.03] border-white/20 shadow-2xl"
                                                    : "bg-white/[0.01] border-white/10 hover:border-white/20"
                                            } overflow-hidden`}
                                    >
                                        {/* Premium Animated Border for Top Tiers */}
                                        {isPremium && (
                                            <div className="absolute inset-[-2px] border-2 border-transparent rounded-[3.5rem] overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="absolute inset-[-200%] bg-[conic-gradient(from_0deg,transparent_0_340deg,#7c3aed_360deg)] animate-[spin_4s_linear_infinite]" />
                                            </div>
                                        )}

                                        {/* Dynamic Glow Background */}
                                        <div className="absolute -top-32 -right-32 w-80 h-80 blur-[100px] rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none"
                                            style={{ backgroundColor: tier.color_hex }} />

                                        <div className="relative z-10 flex-1">
                                            <div className="flex justify-between items-start mb-10">
                                                <div
                                                    className="w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-700 group-hover:scale-110 group-hover:rotate-6 shadow-xl shadow-black/20"
                                                    style={{
                                                        background: `linear-gradient(135deg, ${tier.color_hex}40, ${tier.color_hex}10)`,
                                                        color: tier.color_hex,
                                                        border: `1px solid ${tier.color_hex}30`
                                                    }}
                                                >
                                                    <Icon size={40} strokeWidth={2} />
                                                </div>

                                                {isPremium && (
                                                    <div className="px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                                                        <Crown size={12} /> Elite Tier
                                                    </div>
                                                )}
                                            </div>

                                            <h3 className="text-4xl font-black mb-3 tracking-tight group-hover:tracking-normal transition-all">{tier.name}</h3>
                                            <p className="text-slate-400 text-sm font-medium leading-relaxed mb-10 min-h-[48px]">{tier.description}</p>

                                            <div className="mb-10 p-6 rounded-[2rem] bg-white/[0.03] border border-white/5">
                                                <div className="flex items-baseline gap-2 mb-1">
                                                    <span className="text-4xl font-black tracking-tighter">{formatPrice(tier.price)}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Lifetime Access Locked</span>
                                                </div>
                                            </div>

                                            <div className="space-y-4 mb-10">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Key Privileges</span>

                                                {/* Tier-Specific Features */}
                                                {FEATURES_MANIFEST.filter(f => f.tier_required === tier.slug).slice(0, 5).map((feat) => (
                                                    <div key={feat.key} className="group/feat flex items-center gap-4">
                                                        <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-slate-400 group-hover/feat:text-white group-hover/feat:bg-purple-500/20 group-hover/feat:border-purple-500/30 transition-all">
                                                            {(() => {
                                                                const Icon = ICON_MAP[feat.icon_name] || Star;
                                                                return <Icon size={18} strokeWidth={1.5} />;
                                                            })()}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-xs font-bold text-slate-200 truncate">{feat.name}</h4>
                                                        </div>
                                                        <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                                                    </div>
                                                ))}

                                                {/* Legacy Benefits Fallback */}
                                                {FEATURES_MANIFEST.filter(f => f.tier_required === tier.slug).length === 0 && tier.benefits?.map((benefit, i) => (
                                                    <div key={i} className="flex items-center gap-4 group/benefit">
                                                        <div className="w-9 h-9 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center shrink-0">
                                                            <CheckCircle size={14} className="text-emerald-500" />
                                                        </div>
                                                        <span className="text-xs text-slate-400 font-medium group-hover/benefit:text-white transition-colors">{benefit}</span>
                                                    </div>
                                                ))}

                                                {/* Progressive Inheritance Link */}
                                                <div className="pt-4 mt-6 border-t border-white/5">
                                                    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 group-hover:bg-indigo-500/10 transition-colors">
                                                        <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                                                            <Sparkles size={14} />
                                                        </div>
                                                        <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest leading-tight">
                                                            Incl. All {tier.slug === 'bronze' ? 'Basic' : 'Previous'} Perks
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="relative z-10 mt-auto pt-6">
                                            {purchase?.status === 'waiting_verification' ? (
                                                <div className="w-full py-6 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                                                    <Loader2 size={18} className="animate-spin" /> Sedang Diverifikasi
                                                </div>
                                            ) : isCurrentTier ? (
                                                <div className="w-full py-6 rounded-3xl bg-white/5 border border-white/10 text-slate-500 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3">
                                                    <Shield size={18} /> Tier Saat Ini
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handlePurchase(tier)}
                                                    disabled={loading === tier.id}
                                                    className={`w-full py-6 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-3 group/btn relative overflow-hidden ${activeCategory === 'legend'
                                                            ? "bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 text-white shadow-[0_15px_40px_rgba(249,115,22,0.3)]"
                                                            : "bg-white text-slate-950 hover:bg-white/90 shadow-xl"
                                                        } disabled:opacity-50 active:scale-95`}
                                                >
                                                    <span className="relative z-10 flex items-center gap-2">
                                                        {loading === tier.id ? <Loader2 size={18} className="animate-spin" /> : "Mulai Upgrade"}
                                                        <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                                                    </span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* --- VIEW COMPARISON TOGGLE --- */}
                        <div className="mt-20 text-center">
                            <button
                                onClick={() => setShowComparison(!showComparison)}
                                className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-[11px] font-black uppercase tracking-[0.2em] group"
                            >
                                <Info size={18} className="text-purple-400" />
                                {showComparison ? "Hide Comparison Table" : "Compare All Features"}
                                <ChevronDown size={18} className={`transition-transform duration-500 ${showComparison ? 'rotate-180' : ''}`} />
                            </button>
                        </div>
                    </div>
                </section>

                {/* --- COMPARISON TABLE (EXPANDABLE) --- */}
                {showComparison && (
                    <section className="px-4 mb-32 animate-fade-scale">
                        <div className="max-w-7xl mx-auto">
                            <div className="bg-white/[0.02] border border-white/10 rounded-[3rem] overflow-hidden backdrop-blur-3xl shadow-3xl">
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-white/10">
                                                <th className="p-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 min-w-[300px]">Feature Matrix</th>
                                                {tiers.map(t => (
                                                    <th key={t.id} className="p-10 text-center min-w-[150px]">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 text-slate-400 mb-2">
                                                                {(() => {
                                                                    const Icon = ICON_MAP[t.icon_name] || Star;
                                                                    return <Icon size={20} />;
                                                                })()}
                                                            </div>
                                                            <span className="text-[12px] font-black uppercase tracking-widest">{t.name}</span>
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {FEATURES_MANIFEST.filter(f => f.category !== 'free').map((feat, idx) => (
                                                <tr key={feat.key} className={`border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors ${idx % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                                                    <td className="p-8">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 shrink-0">
                                                                {(() => {
                                                                    const Icon = ICON_MAP[feat.icon_name] || Info;
                                                                    return <Icon size={18} strokeWidth={1.5} />;
                                                                })()}
                                                            </div>
                                                            <div>
                                                                <h5 className="text-sm font-bold text-white mb-1">{feat.name}</h5>
                                                                <p className="text-[10px] text-slate-500 font-medium leading-tight max-w-xs">{feat.description}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {tiers.map(t => {
                                                        const tierOrder = ['free', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'emerald', 'ruby', 'sapphire', 'mastermind', 'legendary'];
                                                        const hasAccess = tierOrder.indexOf(t.slug) >= tierOrder.indexOf(feat.tier_required || 'free');
                                                        return (
                                                            <td key={`${t.id}-${feat.key}`} className="p-8 text-center">
                                                                {hasAccess ? (
                                                                    <div className="flex items-center justify-center">
                                                                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                                                            <CheckCircle size={16} />
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center justify-center">
                                                                        <Minus size={16} className="text-slate-800" />
                                                                    </div>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* --- COMMON FOUNDATION (FREE FEATURES MARQUEE) --- */}
                <section
                    ref={el => { sectionRefs.current[2] = el }}
                    className="py-24 px-4 overflow-hidden scroll-reveal"
                >
                    <div className="max-w-7xl mx-auto mb-16 text-center">
                        <div className="inline-flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-[0.5em] mb-4">
                            <ShieldCheck size={14} /> Core Foundation
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black tracking-tighter">Essential For Everyone.</h2>
                    </div>

                    <div className="flex flex-col gap-6">
                        {/* First Marquee Row */}
                        <div className="flex gap-6 animate-marquee-row hover:pause-marquee">
                            {[...FEATURES_MANIFEST.filter(f => f.category === 'free'), ...FEATURES_MANIFEST.filter(f => f.category === 'free')].map((feat, i) => {
                                const Icon = ICON_MAP[feat.icon_name] || Star;
                                return (
                                    <div key={`${feat.key}-${i}`} className="shrink-0 w-[280px] p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-emerald-500/30 transition-all duration-500 group/free">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6 group-hover/free:scale-110 transition-transform shadow-lg">
                                            <Icon size={24} strokeWidth={1.5} />
                                        </div>
                                        <h4 className="text-sm font-black text-white mb-2 tracking-tight">{feat.name}</h4>
                                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{feat.description}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* --- ACHIEVEMENTS VAULT --- */}
                <section
                    ref={el => { sectionRefs.current[3] = el }}
                    className="px-4 py-40 bg-gradient-to-b from-transparent via-purple-950/10 to-transparent relative overflow-hidden scroll-reveal"
                >
                    <div className="max-w-7xl mx-auto relative z-10">
                        <div className="flex flex-col md:flex-row items-end justify-between mb-24 gap-8">
                            <div className="text-left">
                                <div className="inline-flex items-center gap-3 text-emerald-400 text-[11px] font-black uppercase tracking-[0.4em] mb-6">
                                    <div className="w-10 h-px bg-emerald-500" />
                                    Legacy Rewards
                                </div>
                                <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-4">Achievement <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">Vault.</span></h2>
                                <p className="text-slate-400 text-lg font-medium max-w-xl">Buktikan dedikasi Anda. Kumpulkan lencana legendaris dan buka reward eksklusif di setiap milestone.</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="px-6 py-4 rounded-3xl bg-white/[0.03] border border-white/5 text-center">
                                    <span className="block text-2xl font-black">{isLoggedIn && user ? userAchievements.length : achievements.length}</span>
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Badges</span>
                                </div>
                                <div className="px-6 py-4 rounded-3xl bg-white/[0.03] border border-white/5 text-center">
                                    <span className="block text-2xl font-black">{isLoggedIn && user ? formatXP(user.xp || 0) : "2.4k"}</span>
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Available XP</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                            {achievements.map((ach) => {
                                const Icon = ICON_MAP[ach.icon_name] || Star;
                                const isUnlocked = userAchievements.includes(ach.id);
                                return (
                                    <div key={ach.id} className="group relative aspect-square p-px rounded-[3rem] bg-gradient-to-b from-white/10 to-transparent transition-all duration-700 hover:-translate-y-2">
                                        <div className="h-full w-full bg-[#0a0a14] rounded-[3rem] p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
                                            {/* Glow Effect */}
                                            <div className={`absolute inset-0 bg-emerald-500/5 transition-opacity duration-700 ${isUnlocked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />

                                            <div className="relative mb-6">
                                                <div className={`w-24 h-24 rounded-[2rem] bg-white/[0.02] border border-white/5 flex items-center justify-center transition-all duration-700 shadow-inner ${isUnlocked ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5' : 'text-slate-600 group-hover:text-emerald-400 group-hover:border-emerald-500/30 group-hover:bg-emerald-500/5'}`}>
                                                    <Icon size={44} strokeWidth={1} />
                                                    {/* Locked Overlay */}
                                                    {!isUnlocked && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-[#05050a]/60 backdrop-blur-[2px] rounded-[2rem] group-hover:opacity-0 transition-opacity duration-500 border border-white/5">
                                                            <Lock size={20} className="text-slate-800" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="absolute -top-3 -right-3 px-3 py-1 rounded-2xl bg-emerald-500 text-[10px] font-black text-slate-950 shadow-[0_5px_15px_rgba(16,185,129,0.3)] border border-white/10">
                                                    +{ach.xp_reward} XP
                                                </div>
                                            </div>

                                            <h4 className={`text-sm font-black mb-2 transition-colors ${isUnlocked ? 'text-emerald-400' : 'text-white group-hover:text-emerald-400'}`}>{ach.name}</h4>
                                            <p className={`text-[10px] font-bold leading-tight transition-all duration-500 ${isUnlocked ? 'text-emerald-400/70 opacity-100 translate-y-0' : 'text-slate-500 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0'}`}>{ach.description}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* --- TESTIMONIALS / TRUST --- */}
                <section className="py-32 px-4">
                    <div className="max-w-7xl mx-auto text-center mb-20">
                        <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-4">Trusted by Industry Pioneers.</h2>
                        <p className="text-slate-500 font-medium">Ribuan profesional telah mengupgrade karir mereka melalui MyLearning.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {[
                            { name: "Andi Pratama", role: "Fullstack Developer", content: "Tier Platinum memberikan saya akses ke networking yang belum pernah saya temukan di platform lain. Worth every penny." },
                            { name: "Siti Rahma", role: "UI/UX Designer", content: "Mastermind tier adalah game changer. Mentorship langsung dari expert benar-benar mempercepat growth saya 10x lipat." },
                            { name: "Budi Santoso", role: "Data Scientist", content: "Akses seumur hidup adalah investasi terbaik yang pernah saya buat untuk pendidikan saya. Materi selalu terupdate." }
                        ].map((t, i) => (
                            <div key={i} className="p-10 rounded-[3rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                                <div className="flex gap-1 text-amber-500 mb-6">
                                    {[...Array(5)].map((_, j) => <Star key={j} size={16} fill="currentColor" />)}
                                </div>
                                <p className="text-slate-300 font-medium leading-relaxed mb-8 italic">"{t.content}"</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-black text-xs">
                                        {t.name[0]}
                                    </div>
                                    <div>
                                        <h5 className="text-sm font-black text-white">{t.name}</h5>
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{t.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* --- FINAL CTA --- */}
                <section
                    ref={el => { sectionRefs.current[4] = el }}
                    className="py-48 px-4 scroll-reveal"
                >
                    <div className="max-w-6xl mx-auto">
                        <div className="relative p-12 md:p-24 rounded-[5rem] bg-[#0a0a14] border border-white/10 overflow-hidden shadow-3xl group">
                            {/* Animated Background Elements */}
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-indigo-700/10 to-transparent pointer-events-none" />
                            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-600/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2 animate-pulse" />

                            <div className="relative z-10 flex flex-col md:flex-row items-center gap-16 text-center md:text-left">
                                <div className="flex-1">
                                    <div className="inline-flex items-center gap-3 text-indigo-400 text-[11px] font-black uppercase tracking-[0.5em] mb-8">
                                        <Rocket size={18} /> Future-Proof Your Career
                                    </div>
                                    <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter leading-[0.9]">Siap Menjadi <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Tak Terhentikan?</span></h2>
                                    <p className="text-slate-400 text-xl font-medium leading-relaxed max-w-2xl">
                                        Jangan biarkan potensi Anda terbatas oleh biaya bulanan. Bergabunglah dengan elite circle kami hari ini.
                                    </p>
                                </div>
                                <div className="shrink-0 flex flex-col items-center gap-6">
                                    <button className="group/cta relative px-12 py-8 bg-white text-slate-950 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(255,255,255,0.15)] hover:scale-105 active:scale-95 transition-all duration-500 overflow-hidden">
                                        <span className="relative z-10 flex items-center gap-3">
                                            Mulai Sekarang <ExternalLink size={20} />
                                        </span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-white via-slate-100 to-white opacity-0 group-hover/cta:opacity-100 transition-opacity" />
                                    </button>
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Satu Kali Bayar, Akses Selamanya</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* Payment Modal Portal */}
            {showPaymentModal && activePurchase && (
                createPortal(
                    <TierPaymentModal
                        purchase={activePurchase}
                        tierName={tiers.find(t => t.id === activePurchase.tier_id)?.name || "Tier Upgrade"}
                        price={activePurchase.amount}
                        onClose={() => setShowPaymentModal(false)}
                        onSuccess={() => {
                            setShowPaymentModal(false);
                            fetchPurchases();
                        }}
                    />,
                    document.body
                )
            )}

            <style jsx global>{`
                @keyframes orb-float {
                    0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.2; }
                    33% { transform: translate(10%, 15%) scale(1.1); opacity: 0.3; }
                    66% { transform: translate(-5%, 10%) scale(0.9); opacity: 0.2; }
                }
                @keyframes orb-float-reverse {
                    0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.15; }
                    50% { transform: translate(-15%, -10%) scale(1.2); opacity: 0.25; }
                }
                @keyframes orb-pulse {
                    0%, 100% { opacity: 0.1; transform: scale(1); }
                    50% { opacity: 0.2; transform: scale(1.1); }
                }
                .animate-orb-float { animation: orb-float 20s ease-in-out infinite; }
                .animate-orb-float-reverse { animation: orb-float-reverse 25s ease-in-out infinite; }
                .animate-orb-pulse { animation: orb-pulse 15s ease-in-out infinite; }
                
                @keyframes title-reveal {
                    from { opacity: 0; transform: translateY(50px) skewY(5deg); filter: blur(10px); }
                    to { opacity: 1; transform: translateY(0) skewY(0); filter: blur(0); }
                }
                .animate-title-reveal {
                    animation: title-reveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }

                .scroll-reveal {
                    opacity: 0;
                    transform: translateY(40px);
                    transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .scroll-reveal.is-visible {
                    opacity: 1;
                    transform: translateY(0);
                }

                @keyframes marquee-row {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee-row {
                    display: flex;
                    width: max-content;
                    animation: marquee-row 40s linear infinite;
                }
                .hover\:pause-marquee:hover {
                    animation-play-state: paused;
                }

                .custom-scrollbar::-webkit-scrollbar {
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.02);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(124, 58, 237, 0.2);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(124, 58, 237, 0.4);
                }

                /* Text Gradient Animation */
                @keyframes text-shine {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 100% 50%; }
                }
                .animate-text-shine {
                    background-size: 200% auto;
                    animation: text-shine 3s linear infinite;
                }
            `}</style>
        </div>
    );
}
