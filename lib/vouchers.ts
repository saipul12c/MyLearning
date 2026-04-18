import { supabase } from "./supabase";

export interface Voucher {
  id: string;
  code: string;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  instructorId?: string;
  courseId?: string;
  categorySlug?: string;
  targetUserId?: string;
  minPurchase: number;
  usageLimit: number;
  usedCount: number;
  startDate: string;
  expiryDate?: string;
  maxDiscount: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  instructorName?: string;
}

export async function validateVoucher(
  code: string, 
  courseId: string, 
  instructorId: string,
  price: number,
  userId?: string
): Promise<{ success: boolean; discountAmount?: number; voucher?: Voucher; error?: string }> {
  try {
    const { data, error } = await supabase.rpc("validate_voucher_optimized", {
      p_code: code,
      p_course_id: courseId,
      p_instructor_id: instructorId,
      p_price: price,
      p_user_id: userId
    });

    if (error) throw error;
    
    if (!data.success) {
      return { success: false, error: data.error };
    }

    return { 
      success: true, 
      discountAmount: data.discount_amount, 
      voucher: mapDbToVoucher(data.voucher) 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Increment usage count atomically via RPC
 */
export async function incrementVoucherUsage(pVoucherId: string, pUserId: string, pEnrollId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('redeem_voucher_by_id', {
      p_voucher_id: pVoucherId,
      p_user_id: pUserId,
      p_enroll_id: pEnrollId
    });

    if (error) throw error;
    return { success: data.success, error: data.error };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getVouchersForInstructor(userId: string): Promise<Voucher[]> {
   // First get instructor profile
   const { data: inst } = await supabase.from("instructors").select("id").eq("user_id", userId).single();
   if (!inst) return [];

   const { data, error } = await supabase
    .from("vouchers")
    .select("*")
    .eq("instructor_id", inst.id)
    .order("created_at", { ascending: false });
    
   if (error) return [];
   return data.map(mapDbToVoucher);
}

export async function getAllVouchersAdmin(): Promise<Voucher[]> {
    const { data, error } = await supabase
     .from("vouchers")
     .select("*, instructors(name)")
     .order("created_at", { ascending: false });
     
    if (error) return [];
    return data.map(v => ({
       ...mapDbToVoucher(v),
       instructorName: v.instructors?.name
    }));
}

export async function deleteVoucher(id: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from("vouchers").delete().eq("id", id);
  return { success: !error, error: error?.message };
}

export async function toggleVoucherStatus(id: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from("vouchers").update({ is_active: isActive }).eq("id", id);
  return { success: !error, error: error?.message };
}

export async function createVoucher(voucherData: any): Promise<{ success: boolean; data?: Voucher; error?: string }> {
  try {
    // 1. If course_id is provided, verify ownership for instructors
    if (voucherData.course_id && voucherData.instructor_id) {
       const { data: course, error: cErr } = await supabase
        .from("courses")
        .select("instructor_id")
        .eq("id", voucherData.course_id)
        .single();
        
       if (cErr || !course) return { success: false, error: "Kursus tidak ditemukan." };
       if (course.instructor_id !== voucherData.instructor_id) {
          return { success: false, error: "Anda tidak memiliki izin untuk membuat voucher untuk kursus ini." };
       }
    }

    const { data, error } = await supabase
      .from("vouchers")
      .insert(voucherData)
      .select()
      .single();
  
    if (error) return { success: false, error: error.message };
    return { success: true, data: mapDbToVoucher(data) };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Gets active vouchers that a specific user can use (Optimized via RPC)
 */
export async function getAvailableVouchersForUser(userId: string): Promise<Voucher[]> {
  try {
    const { data, error } = await supabase.rpc("get_vouchers_for_user_v2", {
      p_user_id: userId
    });

    if (error) throw error;
    
    return (data || []).map((v: any) => ({
        ...mapDbToVoucher(v),
        instructorName: v.instructor_name // instructor_name is joined in RPC
    }));
  } catch (err) {
    console.error("Error fetching available vouchers:", err);
    return [];
  }
}

/**
 * Get vouchers specifically for a course page
 */
export async function getVouchersForCourse(courseId: string, instructorId: string, categorySlug: string): Promise<Voucher[]> {
  const { data, error } = await supabase
    .from("vouchers")
    .select("*, instructors(name)")
    .eq("is_active", true)
    .lte("start_date", new Date().toISOString())
    .or(`expiry_date.gt.${new Date().toISOString()},expiry_date.is.null`)
    .or(`course_id.eq.${courseId},instructor_id.eq.${instructorId},category_slug.eq.${categorySlug},and(course_id.is.null,instructor_id.is.null,category_slug.is.null)`)
    .is("target_user_id", null) // Only show public vouchers on course page
    .order("discount_value", { ascending: false });

  if (error) return [];
  return data
    .filter(v => v.usage_limit === 0 || v.used_count < v.usage_limit)
    .map(v => ({
      ...mapDbToVoucher(v),
      instructorName: v.instructors?.name
    }));
}

function mapDbToVoucher(v: any): Voucher {
  return {
    id: v.id,
    code: v.code,
    discountType: v.discount_type,
    discountValue: v.discount_value,
    instructorId: v.instructor_id,
    courseId: v.course_id,
    categorySlug: v.category_slug,
    targetUserId: v.target_user_id,
    minPurchase: v.min_purchase,
    usageLimit: v.usage_limit,
    usedCount: v.used_count,
    startDate: v.start_date,
    expiryDate: v.expiry_date,
    maxDiscount: v.max_discount || 0,
    isActive: v.is_active,
    isFeatured: v.is_featured || false,
    createdAt: v.created_at
  };
}
