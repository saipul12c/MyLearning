import { supabase } from "./supabase";

export interface CertificateDetails {
  id: string;
  certificateNumber: string;
  issuedAt: string;
  courseTitle: string;
  userName: string;
  instructorName: string;
  courseSlug: string;
  instructorSignatureId: string | null;
  adminSignatureId: string | null;
  isValid: boolean;
  revisionStatus?: "pending" | "approved" | "rejected" | null;
  requestedName?: string | null;
  revisionCount?: number;
}

export async function getCertificateByNumber(certificateNumber: string): Promise<CertificateDetails | null> {
  try {
    const { data, error } = await supabase
      .from("certificates")
      .select(`
        *,
        enrollments (
          certificate_valid_until,
          course_slug
        )
      `)
      .eq("certificate_number", certificateNumber)
      .maybeSingle();

    if (error || !data) {
      console.error("Certificate not found or error:", error);
      return null;
    }

    const validUntil = data.enrollments?.certificate_valid_until;
    const isValid = !validUntil || new Date(validUntil) > new Date();

    return {
      id: data.id,
      certificateNumber: data.certificate_number,
      issuedAt: data.issued_at,
      courseTitle: data.course_title,
      userName: data.user_name,
      instructorName: data.instructor_name,
      courseSlug: data.enrollments?.course_slug || "",
      instructorSignatureId: data.instructor_signature_id,
      adminSignatureId: data.admin_signature_id,
      isValid,
      // Added fields
      revisionStatus: data.revision_status,
      requestedName: data.requested_name,
      revisionCount: data.revision_count
    };
  } catch (error) {
    console.error("Error in getCertificateByNumber:", error);
    return null;
  }
}

/**
 * Request a revision for a certificate's recipient name.
 * Limited to 1x by checking revision_count.
 */
export async function requestCertificateRevision(
  certificateId: string, 
  newName: string, 
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Anda harus login untuk mengajukan perbaikan.");

    const { data: cert, error: fetchError } = await supabase
      .from("certificates")
      .select("revision_count, issued_at, user_id")
      .eq("id", certificateId)
      .single();

    if (fetchError || !cert) throw new Error("Sertifikat tidak ditemukan.");

    // Ownership check
    if (cert.user_id !== user.id) {
      throw new Error("Anda tidak memiliki akses untuk mengubah sertifikat ini.");
    }

    // Check revision count
    if (cert.revision_count >= 1) {
      return { success: false, error: "Jatah revisi untuk sertifikat ini sudah habis." };
    }

    // Check 30 days window
    const issuedDate = new Date(cert.issued_at);
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now.getTime() - issuedDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays > 30) {
      return { success: false, error: "Batas waktu pengajuan revisi (30 hari) sudah berakhir." };
    }

    const { error: updateError } = await supabase
      .from("certificates")
      .update({
        requested_name: newName.trim(), // Trim whitespace
        revision_reason: reason,
        revision_status: "pending",
        admin_notes: null, // Clear old notes if resubmitting (though limited to 1x)
        processed_at: null,
        processed_by: null
      })
      .eq("id", certificateId);

    if (updateError) throw updateError;

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get all pending certificate revisions for Admin Dashboard
 */
export async function getPendingCertificateRevisions() {
  const { data, error } = await supabase
    .from("certificates")
    .select(`
      id,
      certificate_number,
      user_name,
      requested_name,
      revision_reason,
      issued_at,
      course_title,
      user_profiles (full_name, email)
    `)
    .eq("revision_status", "pending")
    .order("issued_at", { ascending: false });

  if (error) {
    console.error("Error fetching revisions:", error);
    return [];
  }
  return data;
}

/**
 * Approve or Reject a revision request
 */
export async function processCertificateRevision(
  certificateId: string,
  status: "approved" | "rejected",
  adminNotes?: string
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Verify Admin/Instructor Role
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profile?.role !== "admin" && profile?.role !== "instructor") {
      throw new Error("Forbidden: Hanya Admin yang dapat memproses revisi.");
    }

    const { error } = await supabase
      .from("certificates")
      .update({ 
        revision_status: status,
        admin_notes: adminNotes,
        processed_at: new Date().toISOString(),
        processed_by: user.id
      })
      .eq("id", certificateId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get Revision History (Approved/Rejected) for Admin Dashboard
 */
export async function getCertificateRevisionHistory() {
  const { data, error } = await supabase
    .from("certificates")
    .select(`
      id,
      certificate_number,
      user_name,
      requested_name,
      revision_reason,
      revision_status,
      admin_notes,
      issued_at,
      processed_at,
      course_title,
      user_profiles (full_name, email)
    `)
    .not("revision_status", "is", null)
    .neq("revision_status", "pending")
    .order("processed_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching revision history:", error);
    return [];
  }
  return data;
}

/**
 * Get certificate details by enrollment ID.
 */
export async function getCertificateByEnrollmentId(enrollmentId: string): Promise<CertificateDetails | null> {
  try {
    const { data, error } = await supabase
      .from("certificates")
      .select(`
        *,
        enrollments (
          certificate_valid_until,
          course_slug
        )
      `)
      .eq("enrollment_id", enrollmentId)
      .maybeSingle();

    if (error || !data) return null;

    const validUntil = data.enrollments?.certificate_valid_until;
    const isValid = !validUntil || new Date(validUntil) > new Date();

    return {
      id: data.id,
      certificateNumber: data.certificate_number,
      issuedAt: data.issued_at,
      courseTitle: data.course_title,
      userName: data.user_name,
      instructorName: data.instructor_name,
      courseSlug: data.enrollments?.course_slug || "",
      instructorSignatureId: data.instructor_signature_id,
      adminSignatureId: data.admin_signature_id,
      isValid,
      revisionStatus: data.revision_status,
      requestedName: data.requested_name,
      revisionCount: data.revision_count
    };
  } catch (err) {
    console.error("Error in getCertificateByEnrollmentId:", err);
    return null;
  }
}
