import { supabase } from "./supabase";
import { createNotification } from "./notifications";

export interface Tier {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    benefits: string[];
    icon_name: string;
    color_hex: string;
    level_required: number;
}

export interface Achievement {
    id: string;
    name: string;
    slug: string;
    description: string;
    icon_name: string;
    xp_reward: number;
    category: string;
}

export async function getTiers(): Promise<Tier[]> {
    const { data, error } = await supabase
        .from("tiers")
        .select("*")
        .order("price", { ascending: true });
    
    if (error) {
        console.error("Error fetching tiers:", error);
        return [];
    }
    return data || [];
}

export async function getAchievements(): Promise<Achievement[]> {
    const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .order("created_at", { ascending: true });
    
    if (error) {
        console.error("Error fetching achievements:", error);
        return [];
    }
    return data || [];
}

export async function getUserAchievements(userId: string): Promise<string[]> {
    const { data, error } = await supabase
        .from("user_achievements")
        .select("achievement_id")
        .eq("user_id", userId);
    
    if (error) return [];
    return data.map(a => a.achievement_id);
}

export interface TierPurchase {
    id: string;
    user_id: string;
    tier_id: string;
    amount: number;
    status: 'pending' | 'waiting_verification' | 'paid' | 'rejected' | 'expired';
    payment_proof_url?: string;
    rejection_reason?: string;
    created_at: string;
}

export async function purchaseTier(userId: string, tierId: string): Promise<{ success: boolean; purchaseId?: string; error?: string }> {
    try {
        const { data: tier, error: tierError } = await supabase
            .from("tiers")
            .select("*")
            .eq("id", tierId)
            .single();
        
        if (tierError || !tier) throw new Error("Tier tidak ditemukan.");

        // 1. Check for existing active purchase to avoid duplicates
        const { data: existing } = await supabase
            .from("tier_purchases")
            .select("id")
            .eq("user_id", userId)
            .eq("tier_id", tierId)
            .in("status", ["pending", "waiting_verification"])
            .maybeSingle();
        
        if (existing) {
            return { success: true, purchaseId: existing.id };
        }

        // 2. Create new pending purchase record
        const { data: purchase, error: purchaseError } = await supabase
            .from("tier_purchases")
            .insert({
                user_id: userId,
                tier_id: tierId,
                amount: tier.price,
                status: "pending"
            })
            .select()
            .single();

        if (purchaseError) throw purchaseError;

        await createNotification({
            userId,
            title: `Upgrade ke ${tier.name} Diproses ⏳`,
            message: `Permintaan upgrade Anda telah diterima. Silakan selesaikan pembayaran sebesar Rp ${tier.price.toLocaleString()} untuk aktivasi.`,
            type: 'info',
            linkUrl: '/pricing'
        });

        return { success: true, purchaseId: purchase.id };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function uploadTierPaymentProof(purchaseId: string, proofUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from("tier_purchases")
            .update({
                payment_proof_url: proofUrl,
                status: "waiting_verification",
                updated_at: new Date().toISOString()
            })
            .eq("id", purchaseId);

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function getUserPendingTierPurchases(userId: string): Promise<TierPurchase[]> {
    const { data, error } = await supabase
        .from("tier_purchases")
        .select("*")
        .eq("user_id", userId)
        .in("status", ["pending", "waiting_verification", "rejected"])
        .order("created_at", { ascending: false });
    
    if (error) return [];
    return data || [];
}

// Function to award achievements via RPC or direct call (used by triggers in SQL)
export async function awardAchievement(userId: string, slug: string): Promise<{ success: boolean }> {
    const { data, error } = await supabase.rpc('check_and_award_achievement', {
        p_user_id: userId,
        p_slug: slug
    });
    
    if (error) {
        console.error("Error awarding achievement:", error);
        return { success: false };
    }
    return { success: true };
}
