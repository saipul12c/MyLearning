import { supabase } from "./supabase";

export interface Voucher {
  id: string;
  code: string;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  instructorId?: string;
  courseId?: string;
  minPurchase: number;
  usageLimit: number;
  usedCount: number;
  expiryDate?: string;
  maxDiscount: number;
  isActive: boolean;
  createdAt: string;
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
  const { data, error } = await supabase
    .from("vouchers")
    .insert(voucherData)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: mapDbToVoucher(data) };
}

function mapDbToVoucher(v: any): Voucher {
  return {
    id: v.id,
    code: v.code,
    discountType: v.discount_type,
    discountValue: v.discount_value,
    instructorId: v.instructor_id,
    courseId: v.course_id,
    minPurchase: v.min_purchase,
    usageLimit: v.usage_limit,
    usedCount: v.used_count,
    expiryDate: v.expiry_date,
    maxDiscount: v.max_discount || 0,
    isActive: v.is_active,
    createdAt: v.created_at
  };
}
