import { supabase } from "./supabase";

/**
 * Service to handle file uploads to Supabase Storage
 */

const MAX_VIDEO_SIZE = 1024 * 1024 * 1024; // 1 GB 

export async function uploadThumbnail(file: File): Promise<{ url: string | null; error: any }> {
  return uploadToBucket(file, "thumbnails", "course-thumbnails");
}

export async function uploadAvatar(file: File): Promise<{ url: string | null; error: any }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { url: null, error: "Authentication required" };
  return uploadToBucket(file, "avatars", `${user.id}/user-avatars`);
}

export async function uploadChatFile(file: File): Promise<{ url: string | null; error: any }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { url: null, error: "Authentication required" };
  return uploadToBucket(file, "chat_attachments", `${user.id}/attachments`);
}

export async function uploadPaymentProofToStorage(file: File): Promise<{ url: string | null; error: any }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { url: null, error: "Authentication required" };
  // Path must start with user ID for RLS: [user.id]/proofs/[filename]
  return uploadToBucket(file, "payments", `${user.id}/proofs`);
}

export async function uploadSubmission(file: File): Promise<{ url: string | null; error: any }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { url: null, error: "Authentication required" };
  return uploadToBucket(file, "submissions", `${user.id}/student-submissions`);
}

/**
 * Enhanced Video Upload with 1GB limit
 */
export async function uploadVideo(
  file: File, 
  folder: string = "course-videos",
  onProgress?: (progress: number) => void
): Promise<{ url: string | null; error: any }> {
  try {
    if (file.size > MAX_VIDEO_SIZE) {
      return { url: null, error: new Error("File terlalu besar. Maksimal 1 GB.") };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("videos")
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) return { url: null, error: uploadError };

    const { data: { publicUrl } } = supabase.storage
      .from("videos")
      .getPublicUrl(filePath);

    return { url: publicUrl, error: null };
  } catch (err) {
    return { url: null, error: err };
  }
}

export async function uploadPromotionVideo(file: File): Promise<{ url: string | null; error: any }> {
  return uploadVideo(file, "promos");
}

/**
 * Generic Upload Helper
 */

// Allowed image MIME types and their safe extensions
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB

async function uploadToBucket(file: File, bucket: string, folder: string): Promise<{ url: string | null; error: any }> {
  try {
    // 1. Validate file size
    if (file.size > MAX_IMAGE_SIZE) {
      return { url: null, error: new Error("File terlalu besar. Maksimal 10 MB.") };
    }

    // 2. Validate and sanitize file type
    // Use MIME type (more reliable than extension) to determine safe extension
    const safeExt = ALLOWED_IMAGE_TYPES[file.type];
    const rawExt = file.name.split('.').pop()?.toLowerCase();

    // For non-image buckets (like submissions), allow any file
    const isImageBucket = ['thumbnails', 'payments', 'avatars'].includes(bucket);
    
    let fileExt: string;
    if (isImageBucket) {
      if (!safeExt) {
        const blockedFormats = ['.ico', '.bmp', '.tiff', '.svg', '.psd'];
        const extStr = rawExt ? `.${rawExt}` : 'unknown';
        return { 
          url: null, 
          error: new Error(
            `Format file "${extStr}" tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.`
          ) 
        };
      }
      fileExt = safeExt;
    } else {
      fileExt = rawExt || 'bin';
    }

    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) return { url: null, error: uploadError };

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return { url: publicUrl, error: null };
  } catch (err) {
    return { url: null, error: err };
  }
}

export async function uploadPromotionImage(file: File): Promise<{ url: string | null; error: any }> {
  return uploadToBucket(file, "thumbnails", "promos");
}

export async function deleteFileFromUrl(url: string, bucket: string = "thumbnails"): Promise<{ success: boolean; error: any }> {
  try {
    // Extract path from URL
    // Format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
    const pathParts = url.split(`${bucket}/`);
    if (pathParts.length < 2) return { success: false, error: "Invalid URL format" };
    
    const filePath = pathParts[1];
    const { error } = await supabase.storage.from(bucket).remove([filePath]);
    
    return { success: !error, error };
  } catch (err) {
    return { success: false, error: err };
  }
}
