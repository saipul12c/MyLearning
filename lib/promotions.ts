import { supabase } from "./supabase";

export type PromotionLocation = 
  | "homepage_banner" 
  | "homepage_inline"
  | "dashboard_card" 
  | "course_sidebar" 
  | "course_listing" 
  | "global_announcement" 
  | "verify_page" 
  | "search_recovery" 
  | "quiz_success" 
  | "lesson_sidebar"
  | "course_listing_spotlight"
  | "footer_native"
  | "sticky_bottom"
  | "interstitial"
  | "video_card";

export interface Promotion {
  id: string;
  courseId?: string;
  userId?: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  location: PromotionLocation;
  badgeText?: string; // Optional custom text for the badge (e.g. "PARTNER", "DISCOUNT")
  brandName?: string; // Optional brand name for native ads
  isActive: boolean;
  isExternal: boolean;
  priority: number;
  bgColor?: string;
  videoUrl?: string;
  
  // Impressions & Analytics
  targetImpressions: number;
  currentImpressions: number;
  currentClicks: number;
  startDate?: string;
  endDate?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface PromotionRequest {
  id: string;
  userId: string;
  courseId: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  location: PromotionLocation;
  targetImpressions: number;
  durationDays: number;
  totalPrice: number;
  amountPaid: number;
  paymentProofUrl?: string;
  status: "draft" | "waiting_verification" | "active" | "completed" | "rejected";
  adminNotes?: string;
  currentImpressions?: number;
  currentClicks?: number;
  createdAt: string;
  updatedAt: string;
}

// Pricing Constants
export const CPM_BASE = 10000; // 20k+ Views
export const CPM_MID = 13000;  // 5k-20k Views
export const CPM_MAX = 16000;  // 1k-5k Views

export const LOCATION_MULTIPLIERS: Record<PromotionLocation, number> = {
  homepage_banner: 1.3,
  homepage_inline: 1.2,
  dashboard_card: 1.1,
  course_sidebar: 1.0,
  course_listing: 1.2,
  global_announcement: 1.6, // Most expensive
  verify_page: 1.0,
  search_recovery: 1.1,
  quiz_success: 1.2,
  lesson_sidebar: 1.0,
  course_listing_spotlight: 1.4,
  footer_native: 0.8,
  sticky_bottom: 1.5,
  interstitial: 2.0,
  video_card: 1.5,
};

// Pricing Calculator Logic with Volume Discount (Semakin banyak beli, semakin murah rate-nya)
export function calculateAdPrice(views: number, days: number, location: PromotionLocation): number {
  // Volume Discount logic
  let baseRate = CPM_MAX;
  if (views >= 20000) baseRate = CPM_BASE;
  else if (views >= 5000) baseRate = CPM_MID;
  
  const locationMult = LOCATION_MULTIPLIERS[location] || 1.0;
  
  // Base CPM Cost
  const cpmCost = (views / 1000) * baseRate * locationMult;
  
  // Duration Fee (higher for longer days as requested)
  // Reasonable but flexible: Rp 2,000 per day
  const durationFee = days * 2000;
  
  return Math.round(cpmCost + durationFee);
}

export function mapDbToPromotion(db: any): Promotion {
  return {
    id: db.id,
    courseId: db.course_id,
    userId: db.user_id,
    title: db.title,
    description: db.description,
    imageUrl: db.image_url,
    linkUrl: db.link_url,
    location: db.location,
    badgeText: db.badge_text,
    isActive: db.is_active,
    isExternal: db.is_external,
    priority: db.priority,
    bgColor: db.bg_color,
    videoUrl: db.video_url,
    targetImpressions: db.target_impressions,
    currentImpressions: db.current_impressions,
    currentClicks: db.current_clicks || 0,
    startDate: db.start_date,
    endDate: db.end_date,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export function mapDbToRequest(db: any): PromotionRequest {
  return {
    id: db.id,
    userId: db.user_id,
    courseId: db.course_id,
    title: db.title,
    description: db.description,
    imageUrl: db.image_url,
    linkUrl: db.link_url,
    location: db.location,
    targetImpressions: db.target_impressions,
    durationDays: db.duration_days,
    totalPrice: db.total_price,
    amountPaid: db.amount_paid,
    paymentProofUrl: db.payment_proof_url,
    status: db.status,
    adminNotes: db.admin_notes,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export async function getActivePromotions(location: PromotionLocation, categoryId?: string): Promise<Promotion[]> {
  try {
    const { data, error } = await supabase.rpc("get_active_promotions_optimized", {
      p_location: location,
      p_category_id: categoryId
    });

    if (error) throw error;
    
    // If no specific match, get a random one for fallback logic
    if (!data || data.length === 0) {
        return getRandomFallbackPromotions();
    }

    return data.map(mapDbToPromotion);
  } catch (err) {
    console.error(`Error fetching promotions for ${location}:`, err);
    return [];
  }
}

export async function trackImpressionsBatch(promoIds: string[]) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.rpc("increment_ad_impressions_batch", { 
      promo_ids: promoIds, 
      p_user_id: user?.id 
    });
    if (error) throw error;
  } catch (err) {
    console.error("Error tracking batch impressions:", err);
  }
}

async function getRandomFallbackPromotions(): Promise<Promotion[]> {
   // Fallback logic can also use the RPC but with a generic location or limit
   const { data } = await supabase.rpc("get_active_promotions_optimized", {
      p_location: "homepage_banner" // Fallback to homepage ads
   });
   
   return (data || []).slice(0, 3).map(mapDbToPromotion);
}

export async function trackImpression(promoId: string) {
  try {
    // We pass user_id if available, SQL function handles IP via headers
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.rpc("increment_ad_impressions", { 
      promo_id: promoId, 
      p_user_id: user?.id 
    });

    if (error) throw error;
  } catch (err) {
    console.error("Error tracking impression:", err);
  }
}

export async function trackClick(promoId: string) {
  try {
    const { error } = await supabase.rpc("increment_ad_click", { promo_id: promoId });
    if (error) throw error;
  } catch (err) {
    console.error("Error tracking click:", err);
  }
}

export async function trackDismiss(promoId: string) {
  try {
    // Track dismissals in sessionStorage to prevent re-showing
    const dismissKey = `ad_dismissed_${promoId}`;
    sessionStorage.setItem(dismissKey, 'true');
    
    // Optionally track to backend for analytics (non-critical)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('ad_events').insert({
        promotion_id: promoId,
        event_type: 'dismiss',
        user_id: user?.id,
      });
    } catch {
      // Backend tracking is optional
    }
  } catch (err) {
    // Silently fail — dismissal tracking is non-critical
  }
}

export function isAdDismissed(promoId: string): boolean {
  try {
    return sessionStorage.getItem(`ad_dismissed_${promoId}`) === 'true';
  } catch {
    return false;
  }
}

export function isAdDismissedPersistent(promoId: string): boolean {
  try {
    return localStorage.getItem(`ad_dismissed_persist_${promoId}`) === 'true';
  } catch {
    return false;
  }
}

export function hasSeenInterstitialThisSession(): boolean {
  try {
    return sessionStorage.getItem('interstitial_ad_seen') === 'true';
  } catch {
    return false;
  }
}

export function markInterstitialAsSeen() {
  try {
    sessionStorage.setItem('interstitial_ad_seen', 'true');
  } catch {
    // Silently fail
  }
}

export function dismissAdPersistent(promoId: string) {
  try {
    localStorage.setItem(`ad_dismissed_persist_${promoId}`, 'true');
  } catch {
    // Silently fail
  }
}

// Admin & User Ops
export async function getAllPromotionRequests(): Promise<PromotionRequest[]> {
    const { data } = await supabase
      .from("promotion_requests")
      .select("*")
      .order("created_at", { ascending: false });
    return (data || []).map(mapDbToRequest);
}

export async function getMyPromotionRequests(userId: string): Promise<PromotionRequest[]> {
    const { data } = await supabase
      .from("promotion_requests")
      .select(`
        *,
        promotions:id (
          current_impressions,
          current_clicks
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
      
    return (data || []).map(db => {
      const base = mapDbToRequest(db);
      if (db.promotions) {
          return {
              ...base,
              currentImpressions: db.promotions.current_impressions || 0,
              currentClicks: db.promotions.current_clicks || 0
          };
      }
      return base;
    });
}

export async function upsertPromotionRequest(req: Partial<PromotionRequest>): Promise<{ success: boolean; error?: string }> {
    try {
      const calculatedPrice = calculateAdPrice(req.targetImpressions || 0, req.durationDays || 0, req.location as PromotionLocation);
      
      const dbData = {
        user_id: req.userId,
        course_id: req.courseId,
        title: req.title,
        description: req.description,
        image_url: req.imageUrl,
        link_url: req.linkUrl,
        location: req.location,
        target_impressions: req.targetImpressions,
        duration_days: req.durationDays,
        total_price: calculatedPrice,
        amount_paid: calculatedPrice, // Force full payment for now
        payment_proof_url: req.paymentProofUrl,
        status: req.status,
      };

      if (req.id) {
          await supabase.from("promotion_requests").update(dbData).eq("id", req.id);
      } else {
          await supabase.from("promotion_requests").insert(dbData);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
}

export async function getAllPromotionsAdmin(): Promise<Promotion[]> {
  try {
    const { data, error } = await supabase
      .from("promotions")
      .select("*")
      .order("location", { ascending: true })
      .order("priority", { ascending: false });

    if (error) throw error;
    return (data || []).map(mapDbToPromotion);
  } catch (err) {
    console.error("Error fetching admin promotions:", err);
    return [];
  }
}

export async function upsertPromotion(promo: Partial<Promotion>): Promise<{ success: boolean; data?: Promotion; error?: string }> {
  try {
    const dbData = {
      course_id: promo.courseId,
      user_id: promo.userId,
      title: promo.title,
      description: promo.description,
      image_url: promo.imageUrl,
      link_url: promo.linkUrl,
      location: promo.location,
      badge_text: promo.badgeText,
      is_active: promo.isActive,
      is_external: promo.isExternal,
      priority: promo.priority,
      bg_color: promo.bgColor,
      video_url: promo.videoUrl,
      target_impressions: promo.targetImpressions,
      current_impressions: promo.currentImpressions,
      current_clicks: promo.currentClicks,
      start_date: promo.startDate,
      end_date: promo.endDate,
    };

    let query;
    if (promo.id) {
      query = supabase.from("promotions").update({ ...dbData, updated_at: new Date().toISOString() }).eq("id", promo.id);
    } else {
      query = supabase.from("promotions").insert(dbData);
    }

    const { data, error } = await query.select().single();
    if (error) throw error;

    return { success: true, data: mapDbToPromotion(data) };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deletePromotion(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("promotions").delete().eq("id", id);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getAdPerformanceSummary(userId?: string) {
  try {
    let query = supabase.from("promotions").select("id, status, target_impressions, current_impressions, current_clicks, location, is_active");
    if (userId) {
      query = query.eq("user_id", userId);
    }
    const { data, error } = await query;
    if (error) throw error;

    const summary = {
      totalImpressions: 0,
      totalClicks: 0,
      activeCampaigns: 0,
      averageCtr: 0,
    };

    if (data && data.length > 0) {
      data.forEach(p => {
        summary.totalImpressions += (p.current_impressions || 0);
        summary.totalClicks += (p.current_clicks || 0);
        if (p.is_active) summary.activeCampaigns++;
      });
      if (summary.totalImpressions > 0) {
        summary.averageCtr = (summary.totalClicks / summary.totalImpressions) * 100;
      }
    }

    return { success: true, data: summary };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
