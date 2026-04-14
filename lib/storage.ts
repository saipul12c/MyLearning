import { supabase } from "./supabase";

/**
 * Service to handle file uploads to Supabase Storage
 */

const MAX_VIDEO_SIZE = 1024 * 1024 * 1024; // 1 GB 

export async function uploadThumbnail(file: File): Promise<{ url: string | null; error: any }> {
  return uploadToBucket(file, "thumbnails", "course-thumbnails");
}

export async function uploadAvatar(file: File): Promise<{ url: string | null; error: any }> {
  return uploadToBucket(file, "avatars", "user-avatars");
}

export async function uploadChatFile(file: File): Promise<{ url: string | null; error: any }> {
  return uploadToBucket(file, "chat_attachments", "attachments");
}

export async function uploadPaymentProofToStorage(file: File): Promise<{ url: string | null; error: any }> {
  return uploadToBucket(file, "payments", "proofs");
}

export async function uploadSubmission(file: File): Promise<{ url: string | null; error: any }> {
  return uploadToBucket(file, "submissions", "student-submissions");
}

/**
 * Enhanced Video Upload with 1GB limit
 */
export async function uploadVideo(
  file: File, 
  onProgress?: (progress: number) => void
): Promise<{ url: string | null; error: any }> {
  try {
    if (file.size > MAX_VIDEO_SIZE) {
      return { url: null, error: new Error("File terlalu besar. Maksimal 1 GB.") };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `course-videos/${fileName}`;

    // Supabase JS client doesn't have a direct native XHR progress hook in the standard 'upload' call 
    // unless using TUS or a custom implementation. 
    // For now, we provide the scaffolding for progress.
    const { error: uploadError, data } = await supabase.storage
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

/**
 * Generic Upload Helper
 */
async function uploadToBucket(file: File, bucket: string, folder: string): Promise<{ url: string | null; error: any }> {
  try {
    const fileExt = file.name.split('.').pop();
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
