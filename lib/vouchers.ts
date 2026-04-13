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
  isActive: boolean;
  createdAt: string;
}

export async function validateVoucher(
  code: string, 
  courseId: string, 
  instructorId: string,
  price: number
): Promise<{ success: boolean; discountAmount?: number; voucher?: Voucher; error?: string }> {
  try {
    const { data: voucher, error } = await supabase
      .from("vouchers")
      .select("*")
      .eq("code", code)
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw error;
    if (!voucher) return { success: false, error: "Kode voucher tidak valid atau sudah tidak aktif." };

    // 1. Expiry Check
    if (voucher.expiry_date && new Date(voucher.expiry_date) < new Date()) {
      return { success: false, error: "Kode voucher sudah kadaluarsa." };
    }

    // 2. Usage Limit Check
    if (voucher.usage_limit > 0 && voucher.used_count >= voucher.usage_limit) {
      return { success: false, error: "Kuota voucher sudah habis." };
    }

    // 3. Min Purchase Check
    if (voucher.min_purchase > 0 && price < voucher.min_purchase) {
      return { success: false, error: `Minimal pembelian untuk voucher ini adalah Rp ${voucher.min_purchase.toLocaleString('id-ID')}` };
    }

    // 4. Scope Check (Course)
    if (voucher.course_id && voucher.course_id !== courseId) {
      return { success: false, error: "Voucher ini tidak berlaku untuk kursus ini." };
    }

    // 5. Scope Check (Instructor)
    if (voucher.instructor_id && voucher.instructor_id !== instructorId) {
      return { success: false, error: "Voucher ini tidak berlaku untuk kursus dari instruktur ini." };
    }

    // Calculate Discount
    let discountAmount = 0;
    if (voucher.discount_type === 'percentage') {
      discountAmount = Math.floor((price * voucher.discount_value) / 100);
    } else {
      discountAmount = voucher.discount_value;
    }

    // Ensure discount doesn't exceed price
    discountAmount = Math.min(discountAmount, price);

    return { 
      success: true, 
      discountAmount, 
      voucher: mapDbToVoucher(voucher) 
    };
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
    isActive: v.is_active,
    createdAt: v.created_at
  };
}
