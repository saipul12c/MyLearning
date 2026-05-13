import { Metadata } from "next";
import { getTiers, getAchievements } from "@/lib/tiers";
import PringClient from "@/app/pring/PringPricing";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getPublicSentinelConfigs } from "@/lib/sentinel/actions";

export const metadata: Metadata = {
    title: "Pricing & Membership | MyLearning Premium",
    description: "Invest in your future with MyLearning Premium. Choose the perfect tier and unlock exclusive courses, AI features, and industry-recognized certificates.",
    openGraph: {
        title: "MyLearning Premium - Invest in Your Future",
        description: "One-time investment for lifetime access to the most advanced learning ecosystem.",
        images: ["/og-pricing.png"],
    }
};

export default async function PringPage() {
    // 1. Sentinel Gatekeeper Check
    const sentinel = await getPublicSentinelConfigs();
    if (sentinel.module_tiers_enabled === false) {
        redirect("/maintenance?reason=tiers_disabled");
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
        const { data: profile } = await supabase.from("user_profiles").select("role").eq("user_id", user.id).single();
        if (profile?.role === 'admin' || profile?.role === 'instructor') {
            redirect("/dashboard");
        }
    }

    const tiers = await getTiers();
    const achievements = await getAchievements();

    return (
        <div className="min-h-screen bg-slate-950">
            <PringClient tiers={tiers} achievements={achievements} />
        </div>
    );
}
