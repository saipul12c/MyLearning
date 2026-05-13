"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Tier, Achievement, purchaseTier, TierPurchase, getUserPendingTierPurchases } from "@/lib/tiers";
import { useAuth } from "@/app/components/AuthContext";
import { 
    Zap, Target, CheckCircle, Calendar, Layout, Flame, 
    FileText, Wind, Flag, MessageSquare, Award, Gem, 
    Crown, Brain, Star, Rocket, Shield, Lock, ArrowRight,
    Clock, AlertCircle, Loader2, Sparkles, ChevronRight,
    Trophy, Coins, TrendingUp
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import TierPaymentModal from "@/app/components/TierPaymentModal";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";

interface Props {
    tiers: Tier[];
    achievements: Achievement[];
}

const ICON_MAP: Record<string, any> = {
    Zap, Target, CheckCircle, Calendar, Layout, Flame, 
    FileText, Wind, Flag, MessageSquare, Award, Gem, 
    Crown, Brain, Star, Rocket, Shield
};

export default function PringClient({ tiers, achievements }: Props) {
    const { user, isLoggedIn } = useAuth();
    const [loading, setLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [userPurchases, setUserPurchases] = useState<TierPurchase[]>([]);
    const [activePurchase, setActivePurchase] = useState<TierPurchase | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [activeCategory, setActiveCategory] = useState<"starter" | "elite" | "legend">("elite");
    const router = useRouter();

    const fetchPurchases = useCallback(async () => {
        if (user) {
            const data = await getUserPendingTierPurchases(user.id);
            setUserPurchases(data);
        }
    }, [user]);

    useEffect(() => {
        fetchPurchases();
    }, [fetchPurchases]);

    // Grouping tiers for better UX
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
        <div className="relative min-h-screen bg-[#06060a] text-white selection:bg-purple-500/30">
            {/* --- ADVANCED BACKGROUND --- */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] brightness-100 contrast-150" />
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full animate-pulse-slow" />
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full animate-pulse-slow delay-1000" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.03)_0%,transparent_70%)]" />
            </div>

            <div className="relative z-10">
                {/* --- HERO SECTION --- */}
                <section className="pt-32 pb-20 px-4">
                    <div className="max-w-7xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl mb-8 animate-fade-in">
                            <Sparkles size={14} className="text-purple-400" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Membership System 2.0</span>
                        </div>
                        
                        <h1 className="text-6xl md:text-[7rem] font-black tracking-tighter leading-[0.85] mb-8 animate-slide-up">
                            Investasi <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-300 to-slate-500">Masa Depan</span>
                        </h1>
                        
                        <p className="max-w-2xl mx-auto text-slate-400 text-lg md:text-xl font-medium leading-relaxed mb-12 animate-slide-up delay-100">
                            Pilih jalur pembelajaran Anda. Satu kali investasi untuk akses tanpa batas ke kurikulum industri terbaik seumur hidup.
                        </p>

                        {/* --- USER JOURNEY (IF LOGGED IN) --- */}
                        {isLoggedIn && user && (
                            <div className="max-w-3xl mx-auto mb-20 p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-2xl animate-fade-in delay-200">
                                <div className="flex flex-col md:flex-row items-center gap-8">
                                    <div className="relative shrink-0">
                                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-purple-500/20">
                                            <Trophy size={36} className="text-white" />
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-slate-900 border-2 border-white/10 flex items-center justify-center text-[10px] font-black text-amber-400">
                                            Lv.5
                                        </div>
                                    </div>
                                    <div className="flex-1 text-center md:text-left">
                                        <h4 className="text-xl font-black mb-1">Halo, {user.email?.split('@')[0]}!</h4>
                                        <p className="text-slate-400 text-sm mb-4">Anda saat ini berada di tier <span className="text-purple-400 font-bold uppercase tracking-widest">{tiers.find(t => t.id === user.tierId)?.name || 'Basic'}</span></p>
                                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 w-[65%] rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
                                        </div>
                                        <div className="flex justify-between mt-2">
                                            <span className="text-[10px] font-black text-slate-500 uppercase">Progress Ke Tier Berikutnya</span>
                                            <span className="text-[10px] font-black text-purple-400">65% Completed</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="text-center px-6 py-4 rounded-2xl bg-white/5 border border-white/10">
                                            <span className="block text-xl font-black">1.2k</span>
                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">XP Earned</span>
                                        </div>
                                        <div className="text-center px-6 py-4 rounded-2xl bg-white/5 border border-white/10">
                                            <span className="block text-xl font-black">12</span>
                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Badges</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- CATEGORY TOGGLE --- */}
                        <div className="inline-flex p-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl mb-16">
                            {(["starter", "elite", "legend"] as const).map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                                        activeCategory === cat 
                                        ? "bg-white text-slate-950 shadow-xl scale-105" 
                                        : "text-slate-500 hover:text-white"
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* --- TIERS SECTION --- */}
                <section className="px-4 mb-40">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {groupedTiers[activeCategory].map((tier, idx) => {
                                const Icon = ICON_MAP[tier.icon_name] || Award;
                                const isCurrentTier = user?.tierId === tier.id;
                                const purchase = userPurchases.find(p => p.tier_id === tier.id);
                                
                                return (
                                    <div 
                                        key={tier.id}
                                        className={`group relative flex flex-col p-8 md:p-10 rounded-[3rem] border transition-all duration-700 hover:-translate-y-2 ${
                                            isCurrentTier 
                                            ? "bg-purple-500/10 border-purple-500/50 shadow-[0_20px_80px_rgba(139,92,246,0.15)]" 
                                            : "bg-white/[0.02] border-white/10 hover:border-white/20"
                                        } overflow-hidden`}
                                    >
                                        {/* Glow Background */}
                                        <div className="absolute -top-20 -right-20 w-48 h-48 blur-[80px] rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-700"
                                             style={{ backgroundColor: tier.color_hex }} />
                                        
                                        <div className="relative z-10 flex-1">
                                            <div className="flex justify-between items-start mb-8">
                                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-700 group-hover:scale-110 group-hover:rotate-6"
                                                     style={{ backgroundColor: `${tier.color_hex}20`, color: tier.color_hex }}>
                                                    <Icon size={32} strokeWidth={2.5} />
                                                </div>
                                                {tier.price > 1000000 && (
                                                    <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                                                        <Crown size={10} /> Popular
                                                    </div>
                                                )}
                                            </div>

                                            <h3 className="text-3xl font-black mb-2 tracking-tight">{tier.name}</h3>
                                            <p className="text-slate-500 text-xs font-medium leading-relaxed mb-8">{tier.description}</p>

                                            <div className="mb-10">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-4xl font-black">{formatPrice(tier.price)}</span>
                                                </div>
                                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Lifetime Access</span>
                                            </div>

                                            <div className="space-y-4 mb-12">
                                                {tier.benefits?.map((benefit, i) => (
                                                    <div key={i} className="flex items-start gap-3 group/benefit">
                                                        <div className="w-5 h-5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5 group-hover/benefit:border-emerald-500/30 group-hover/benefit:bg-emerald-500/10 transition-all">
                                                            <CheckCircle size={10} className="text-emerald-500" />
                                                        </div>
                                                        <span className="text-xs text-slate-400 font-medium leading-tight group-hover/benefit:text-white transition-colors">{benefit}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="relative z-10 mt-auto">
                                            {purchase?.status === 'waiting_verification' ? (
                                                <div className="w-full py-5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3">
                                                    <Clock size={16} className="animate-spin-slow" /> Sedang Diverifikasi
                                                </div>
                                            ) : isCurrentTier ? (
                                                <div className="w-full py-5 rounded-2xl bg-white/5 border border-white/10 text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3">
                                                    <Shield size={16} /> Tier Saat Ini
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handlePurchase(tier)}
                                                    disabled={loading === tier.id}
                                                    className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-3 ${
                                                        activeCategory === 'legend' 
                                                        ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-xl shadow-amber-500/10" 
                                                        : "bg-white text-slate-950 hover:bg-white/90"
                                                    } disabled:opacity-50`}
                                                >
                                                    {loading === tier.id ? <Loader2 size={16} className="animate-spin" /> : "Mulai Upgrade"}
                                                    <ArrowRight size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* --- ACHIEVEMENTS VAULT --- */}
                <section className="px-4 py-32 bg-gradient-to-b from-transparent via-purple-900/5 to-transparent relative overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full" />
                    <div className="absolute top-1/2 right-0 -translate-y-1/2 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full" />

                    <div className="max-w-7xl mx-auto relative z-10">
                        <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8">
                            <div className="text-left">
                                <div className="inline-flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                                    <Trophy size={14} /> Rewards & Recognition
                                </div>
                                <h2 className="text-4xl md:text-6xl font-black tracking-tighter">Achievement <span className="text-emerald-400">Vault</span></h2>
                            </div>
                            <p className="max-w-md text-slate-500 text-sm font-medium leading-relaxed">
                                Buktikan keahlian Anda melalui tantangan harian. Kumpulkan lencana unik yang dapat dipamerkan di profil Anda.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                            {achievements.map((ach) => {
                                const Icon = ICON_MAP[ach.icon_name] || Star;
                                return (
                                    <div key={ach.id} className="group relative aspect-square p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 transition-all duration-500 flex flex-col items-center justify-center text-center overflow-hidden">
                                        {/* Holographic Effect Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-white/[0.05] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                        
                                        <div className="relative mb-6">
                                            <div className="w-20 h-20 rounded-2xl bg-slate-900/50 border border-white/5 flex items-center justify-center text-slate-600 group-hover:text-emerald-400 group-hover:border-emerald-500/30 group-hover:bg-emerald-500/5 transition-all duration-700 relative">
                                                <Icon size={36} strokeWidth={1.5} />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px] rounded-2xl group-hover:opacity-0 transition-opacity duration-500">
                                                    <Lock size={16} className="text-slate-700" />
                                                </div>
                                            </div>
                                            <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-emerald-500 text-[8px] font-black text-slate-950 shadow-lg">
                                                +{ach.xp_reward} XP
                                            </div>
                                        </div>
                                        
                                        <h4 className="text-xs font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">{ach.name}</h4>
                                        <p className="text-[10px] text-slate-600 font-medium line-clamp-2">{ach.description}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* --- FINAL CTA --- */}
                <section className="py-48 px-4">
                    <div className="max-w-5xl mx-auto">
                        <div className="relative p-12 md:p-24 rounded-[4rem] bg-gradient-to-br from-indigo-600 to-purple-700 overflow-hidden shadow-[0_40px_100px_rgba(79,70,229,0.2)] group">
                            {/* Animated Shapes */}
                            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 animate-pulse-slow" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 blur-[60px] rounded-full translate-y-1/2 -translate-x-1/2" />
                            
                            <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                                <div className="flex-1 text-center md:text-left">
                                    <div className="inline-flex items-center gap-2 text-white/70 text-[10px] font-black uppercase tracking-[0.4em] mb-6">
                                        <TrendingUp size={14} /> Exponential Growth
                                    </div>
                                    <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter leading-tight">Siap Melangkah Ke Level Berikutnya?</h2>
                                    <p className="text-indigo-100 text-lg md:text-xl font-medium leading-relaxed opacity-80">
                                        Jangan biarkan potensi Anda terbatas. Bergabunglah sekarang dan nikmati ekosistem pembelajaran tercanggih.
                                    </p>
                                </div>
                                <div className="shrink-0">
                                    <button className="px-10 py-6 bg-white text-indigo-700 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300">
                                        Mulai Sekarang
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- FOOTER --- */}
                <footer className="pb-20 text-center">
                    <div className="w-px h-24 bg-gradient-to-b from-white/10 to-transparent mx-auto mb-12" />
                    <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.5em]">MyLearning Professional Ecosystem</p>
                </footer>
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
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.2; transform: scale(1); }
                    50% { opacity: 0.4; transform: scale(1.1); }
                }
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
                .animate-spin-slow { animation: spin-slow 12s linear infinite; }
                
                .animate-fade-in {
                    animation: fadeIn 0.8s ease-out forwards;
                }
                .animate-slide-up {
                    animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .delay-100 { animation-delay: 100ms; }
                .delay-200 { animation-delay: 200ms; }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                ::-webkit-scrollbar {
                    width: 8px;
                }
                ::-webkit-scrollbar-track {
                    background: transparent;
                }
                ::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                ::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
            `}</style>
        </div>
    );
}
