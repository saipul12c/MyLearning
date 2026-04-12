import { supabase } from "./supabase";

export interface SignatureStatus {
  hasSignature: boolean;
  signatureId: string | null;
  lastUpdated: string | null;
  canUpdate: boolean;
  daysUntilNextUpdate: number;
}

/**
 * Service to handle digital signatures for Admins and Instructors
 */

export async function getSignatureStatus(userId: string, role: 'admin' | 'instructor'): Promise<SignatureStatus> {
  const table = role === 'admin' ? 'user_profiles' : 'instructors';
  const idField = role === 'admin' ? 'user_id' : 'user_id';

  const { data, error } = await supabase
    .from(table)
    .select('signature_id, signature_last_updated')
    .eq(idField, userId)
    .single();

  if (error || !data) {
    return { hasSignature: false, signatureId: null, lastUpdated: null, canUpdate: true, daysUntilNextUpdate: 0 };
  }

  const lastUpdated = data.signature_last_updated;
  if (!lastUpdated) {
    return { hasSignature: !!data.signature_id, signatureId: data.signature_id, lastUpdated: null, canUpdate: true, daysUntilNextUpdate: 0 };
  }

  const lastDate = new Date(lastUpdated);
  const now = new Date();
  
  // Calculate if 30 days have passed (approx 1 month)
  const diffTime = Math.abs(now.getTime() - lastDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const waitDays = 30;
  const canUpdate = role === 'admin' || diffDays >= waitDays;
  const daysUntilNextUpdate = Math.max(0, waitDays - diffDays);

  return {
    hasSignature: !!data.signature_id,
    signatureId: data.signature_id,
    lastUpdated,
    canUpdate,
    daysUntilNextUpdate: role === 'admin' ? 0 : daysUntilNextUpdate
  };
}

export async function uploadSignature(
  userId: string, 
  role: 'admin' | 'instructor', 
  file: File
): Promise<{ success: boolean; signatureId?: string; error?: string }> {
  try {
    // 1. Check Rate Limit for Instructors
    const status = await getSignatureStatus(userId, role);
    if (!status.canUpdate) {
      return { success: false, error: `Batas upload tercapai. Tunggu ${status.daysUntilNextUpdate} hari lagi.` };
    }

    // 2. Generate Unique Signature ID
    const signatureId = `SIG-${role.toUpperCase()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    const filePath = `signatures/${fileName}`;

    // 3. Delete Old Signature from Storage (Get old URL first)
    const table = role === 'admin' ? 'user_profiles' : 'instructors';
    const { data: profile } = await supabase.from(table).select('signature_url').eq('user_id', userId).single();
    if (profile?.signature_url) {
      try {
        const oldFile = profile.signature_url.split('/').pop();
        if (oldFile) await supabase.storage.from('signatures').remove([`signatures/${oldFile}`]);
      } catch (e) {
        console.error("Failed to delete old signature file", e);
      }
    }

    // 4. Upload New File
    const { error: uploadError } = await supabase.storage
      .from('signatures')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    // 5. Get Public URL
    const { data: { publicUrl } } = supabase.storage.from('signatures').getPublicUrl(filePath);

    // 6. Update Database
    const { error: dbError } = await supabase
      .from(table)
      .update({
        signature_url: publicUrl,
        signature_id: signatureId,
        signature_last_updated: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (dbError) throw dbError;

    return { success: true, signatureId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function verifySignature(signatureId: string) {
  // Search in instructors first
  const { data: instructor } = await supabase
    .from('instructors')
    .select('name, expertise, signature_last_updated')
    .eq('signature_id', signatureId)
    .maybeSingle();

  if (instructor) {
    return {
      success: true,
      name: instructor.name,
      role: 'Instructor',
      specialization: instructor.expertise,
      signedAt: instructor.signature_last_updated
    };
  }

  // Then search in admins (user_profiles)
  const { data: admin } = await supabase
    .from('user_profiles')
    .select('full_name, signature_last_updated')
    .eq('signature_id', signatureId)
    .eq('role', 'admin')
    .maybeSingle();

  if (admin) {
    return {
      success: true,
      name: admin.full_name,
      role: 'Platform Director',
      signedAt: admin.signature_last_updated
    };
  }

  return { success: false };
}
