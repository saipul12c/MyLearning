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
    };
  } catch (error) {
    console.error("Error in getCertificateByNumber:", error);
    return null;
  }
}
