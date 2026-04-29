"use client";

import { useState, useEffect, useCallback } from "react";
import { Tier, Achievement, purchaseTier, TierPurchase, getUserPendingTierPurchases } from "@/lib/tiers";
import { useAuth } from "@/app/components/AuthContext";
import { 
    Zap, Target, CheckCircle, Calendar, Layout, Flame, 
    FileText, Wind, Flag, MessageSquare, Award, Gem, 
    Crown, Brain, Star, Rocket, Shield, Lock, ArrowRight,
    Clock, AlertCircle, Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import TierPaymentModal from "@/app/components/TierPaymentModal";

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

    const handlePurchase = async (tier: Tier) => {
        if (!isLoggedIn) {
            router.push("/login");
            return;
        }
        
        // Prevent upgrading to a tier they already have or are waiting for
        const existing = userPurchases.find(p => p.tier_id === tier.id);
        if (existing?.status === 'waiting_verification') return;

        setLoading(tier.id);
        setError(null);
        try {
            const res = await purchaseTier(user!.id, tier.id);
            if (res.success && res.purchaseId) {
                // Find the purchase details
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
        <div className="relative min-h-screen bg-[#0c0c14] overflow-hidden pb-32">
            {/* Dynamic Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse-slow" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse-slow delay-700" />
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-pink-600/5 blur-[120px] rounded-full" />
            </div>

            <div className="max-w-7xl mx-auto px-4 pt-32 pb-10 relative z-10">
                {/* Header Section */}
                <div className="text-center mb-24 relative">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] mb-8 backdrop-blur-md">
                        <Star size={14} className="animate-spin-slow" /> Elite Membership
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-[0.9] lg:max-w-4xl mx-auto">
                        Tingkatkan <span className="text-transparent bg-clip-text bg-gradient-to-br from-purple-400 via-pink-500 to-amber-500">Potensi</span> Tanpa Batas
                    </h1>
                    <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium">
                        Investasi sekali bayar untuk akses seumur hidup ke ekosistem pembelajaran tercanggih. 
                        Buka pintu menuju karir impian Anda hari ini.
                    </p>
                </div>

                {error && (
                    <div className="max-w-md mx-auto mb-16 p-5 rounded-[2rem] bg-red-500/10 border border-red-500/20 text-red-400 text-center text-sm font-bold flex items-center justify-center gap-3 backdrop-blur-xl animate-shake">
                        <AlertCircle size={20} /> {error}
                    </div>
                )}

                {/* Tiers Grid - Changed to 3 columns on LG+ */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-40">
                    {tiers.map((tier, index) => {
                        const Icon = ICON_MAP[tier.icon_name] || Award;
                        const isLegendary = tier.slug === 'legendary';
                        const isMastermind = tier.slug === 'mastermind';
                        const purchase = userPurchases.find(p => p.tier_id === tier.id);
                        const isCurrentTier = user?.tierId === tier.id;
                        
                        return (
                            <div 
                                key={tier.id}
                                className={`group relative p-10 rounded-[3rem] border transition-all duration-700 hover:translate-y-[-8px] flex flex-col overflow-hidden ${
                                    isLegendary 
                                    ? 'bg-gradient-to-br from-amber-500/20 via-orange-600/10 to-slate-900/80 border-amber-500/40 shadow-[0_20px_50px_rgba(245,158,11,0.1)]' 
                                    : isMastermind
                                    ? 'bg-gradient-to-br from-purple-600/20 via-indigo-900/10 to-slate-900/80 border-purple-500/40'
                                    : 'bg-white/[0.03] border-white/10 hover:border-white/20 backdrop-blur-md'
                                } ${isCurrentTier ? 'ring-2 ring-purple-500 shadow-[0_0_40px_rgba(168,85,247,0.2)]' : ''}`}
                            >
                                {/* Decorative Glow */}
                                <div className="absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full transition-opacity duration-700 opacity-0 group-hover:opacity-100"
                                     style={{ backgroundColor: `${tier.color_hex}30` }} />

                                {isLegendary && (
                                    <div className="absolute -top-12 -right-12 w-24 h-24 bg-amber-500/20 blur-[40px] rounded-full" />
                                )}

                                <div className="relative z-10 mb-10">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-700 group-hover:scale-110 group-hover:rotate-[10deg] shadow-2xl`}
                                             style={{ 
                                                backgroundColor: `${tier.color_hex}20`, 
                                                color: tier.color_hex,
                                                boxShadow: `0 15px 30px ${tier.color_hex}20` 
                                             }}>
                                            <Icon size={32} strokeWidth={2.5} />
                                        </div>
                                        
                                        {(isLegendary || isMastermind) && (
                                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-md ${
                                                isLegendary ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' : 'bg-purple-500/20 border-purple-500/30 text-purple-400'
                                            }`}>
                                                {isLegendary ? 'Ultimate' : 'Elite'}
                                            </div>
                                        )}
                                    </div>

                                    {isCurrentTier && (
                                        <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 bg-purple-600/20 border border-purple-500/30 rounded-full text-[9px] font-black text-purple-400 uppercase tracking-widest">
                                            <CheckCircle size={10} /> Aktif Sekarang
                                        </div>
                                    )}

                                    <h3 className="text-3xl font-black text-white mb-3 tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r transition-all duration-500"
                                        style={{ backgroundImage: `linear-gradient(to right, #fff, ${tier.color_hex})` }}>
                                        {tier.name}
                                    </h3>
                                    
                                    <p className="text-slate-400 text-sm leading-relaxed mb-8 min-h-[40px]">
                                        {tier.description}
                                    </p>

                                    <div className="flex flex-col gap-1 mb-10">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-black text-white">Rp {tier.price.toLocaleString()}</span>
                                        </div>
                                        <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Satu Kali Bayar • Selamanya</span>
                                    </div>

                                    <div className="space-y-4 pt-6 border-t border-white/5">
                                        {tier.benefits && Array.isArray(tier.benefits) && tier.benefits.map((benefit, i) => (
                                            <div key={i} className="flex items-start gap-4 text-[12px] text-slate-300 group/item transition-colors hover:text-white">
                                                <div className="w-5 h-5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5 group-hover/item:border-emerald-500/50 group-hover/item:bg-emerald-500/10 transition-all">
                                                    <CheckCircle size={12} className="text-emerald-500" />
                                                </div>
                                                <span className="leading-tight font-medium">{benefit}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-auto relative z-10">
                                    {purchase?.status === 'waiting_verification' ? (
                                        <div className="w-full py-5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 backdrop-blur-md">
                                            <Clock size={18} className="animate-pulse" /> Verifikasi Pending
                                        </div>
                                    ) : isCurrentTier ? (
                                        <div className="w-full py-5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3">
                                            <CheckCircle size={18} /> Membership Aktif
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handlePurchase(tier)}
                                            disabled={loading === tier.id}
                                            className={`w-full py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-3 shadow-2xl ${
                                                isLegendary
                                                ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-[length:200%_auto] hover:bg-[100%_0] text-white shadow-amber-500/20'
                                                : isMastermind
                                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-500/20'
                                                : 'bg-white text-slate-950 hover:bg-transparent hover:text-white hover:border-white/40 border border-transparent'
                                            } disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]`}
                                        >
                                            {loading === tier.id ? (
                                                <Loader2 size={18} className="animate-spin" />
                                            ) : (
                                                <>{purchase?.status === 'rejected' ? "Update Bukti Bayar" : "Pilih Membership"} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                                            )}
                                        </button>
                                    )}
                                    {purchase?.status === 'rejected' && (
                                        <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                                            <AlertCircle size={14} className="text-red-400 shrink-0" />
                                            <p className="text-[10px] text-red-400 font-bold italic line-clamp-1">
                                                {purchase.rejection_reason}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Achievements Section - Also improved for creativity */}
                <div className="text-center mb-24 relative">
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none" />
                    <h2 className="text-4xl md:text-7xl font-black text-white mb-8 tracking-tighter">
                        Koleksi <span className="text-emerald-400">Prestasi</span> Anda
                    </h2>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg md:text-xl font-medium leading-relaxed">
                        Setiap pencapaian adalah bukti dedikasi Anda. Kumpulkan lencana unik dan tunjukkan progres belajar Anda kepada dunia.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {achievements.map((ach) => {
                        const Icon = ICON_MAP[ach.icon_name] || Star;
                        
                        return (
                            <div 
                                key={ach.id}
                                className="group p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-emerald-500/30 transition-all duration-700 text-center relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/0 to-transparent group-hover:via-emerald-500/50 transition-all duration-1000" />
                                
                                <div className="relative mb-8 mx-auto w-24">
                                    <div className="w-24 h-24 rounded-full bg-slate-900/50 border border-white/5 flex items-center justify-center text-slate-500 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 group-hover:border-emerald-500/20 transition-all duration-700 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                                        <Icon size={40} strokeWidth={1.5} />
                                        <div className="absolute inset-0 flex items-center justify-center bg-[#0c0c14]/60 backdrop-blur-[2px] rounded-full opacity-100 group-hover:opacity-0 transition-all duration-500">
                                            <Lock size={20} className="text-slate-600" />
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full text-[9px] font-black text-white shadow-xl border border-white/10 whitespace-nowrap">
                                        +{ach.xp_reward} XP
                                    </div>
                                </div>
                                <h4 className="text-white font-bold text-sm mb-2 group-hover:text-emerald-400 transition-colors tracking-tight">{ach.name}</h4>
                                <p className="text-slate-500 text-[10px] leading-relaxed font-medium">
                                    {ach.description}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Info Box - Major Visual Upgrade */}
                <div className="mt-48 relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-[4rem] blur-xl opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                    <div className="relative p-12 md:p-20 rounded-[4rem] bg-[#0f0f1a] border border-white/10 flex flex-col lg:flex-row items-center gap-16 overflow-hidden">
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 w-full h-full pointer-events-none overflow-hidden">
                            <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-purple-600/10 blur-[100px] rounded-full" />
                            <div className="absolute bottom-[-20%] left-[-10%] w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full" />
                        </div>

                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-purple-400 shrink-0 shadow-inner relative z-10 animate-float">
                            <Rocket size={64} strokeWidth={1.5} />
                        </div>
                        
                        <div className="text-center lg:text-left relative z-10 flex-1">
                            <h3 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tighter leading-tight">Masa Depan Karir Anda <br className="hidden md:block" />Dimulai Dari Sini.</h3>
                            <p className="text-slate-400 text-lg md:text-xl leading-relaxed font-medium max-w-3xl">
                                Bergabunglah dengan ribuan pelajar yang telah mengubah hidup mereka. Sistem keanggotaan MyLearning bukan sekadar akses, tapi partner dalam perjalanan karir Anda.
                            </p>
                        </div>
                        
                        <div className="shrink-0 relative z-10">
                            <button className="group/btn relative px-12 py-6 bg-white text-slate-950 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-purple-500 hover:text-white transition-all duration-500 shadow-[0_20px_50px_rgba(255,255,255,0.1)] active:scale-95">
                                <span className="relative z-10 flex items-center gap-3">
                                    Pelajari Detail <ArrowRight size={20} className="group-hover/btn:translate-x-2 transition-transform" />
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
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
                    0%, 100% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 0.6; transform: scale(1.1); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-20px); }
                }
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes gradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .animate-pulse-slow { animation: pulse-slow 10s ease-in-out infinite; }
                .animate-float { animation: float 6s ease-in-out infinite; }
                .animate-spin-slow { animation: spin-slow 8s linear infinite; }
                .animate-gradient { animation: gradient 3s linear infinite; }
                .animate-shake {
                    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
                }
                @keyframes shake {
                    10%, 90% { transform: translate3d(-1px, 0, 0); }
                    20%, 80% { transform: translate3d(2px, 0, 0); }
                    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                    40%, 60% { transform: translate3d(4px, 0, 0); }
                }
            `}</style>
        </div>
    );
}


