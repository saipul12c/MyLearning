import { supabase } from "./supabase";
import { normalizeQuery } from "./search-utils";

// ============================================
// Error Code Constants
// ============================================
export const EVENT_ERROR_CODES = {
  EVENT_NOT_FOUND: "EVENT_NOT_FOUND",
  EVENT_NOT_PUBLISHED: "EVENT_NOT_PUBLISHED",
  REGISTRATION_CLOSED: "REGISTRATION_CLOSED",
  DUPLICATE_REGISTRATION: "DUPLICATE_REGISTRATION",
  CAPACITY_FULL: "CAPACITY_FULL",
  INVALID_USER: "INVALID_USER",
  PAYMENT_REQUIRED: "PAYMENT_REQUIRED",
  SLUG_REQUIRED: "SLUG_REQUIRED",
  INVALID_FILE: "INVALID_FILE",
} as const;

export const EVENT_ERROR_MESSAGES: Record<string, Record<string, string>> = {
  id: {
    EVENT_NOT_FOUND: "Event tidak ditemukan",
    EVENT_NOT_PUBLISHED: "Event belum dipublikasikan",
    REGISTRATION_CLOSED: "Pendaftaran untuk event ini sudah ditutup",
    DUPLICATE_REGISTRATION: "Anda sudah terdaftar untuk event ini",
    CAPACITY_FULL: "Event penuh - Anda masuk waiting list",
    INVALID_USER: "User tidak valid",
    PAYMENT_REQUIRED: "Pembayaran diperlukan untuk event ini",
    SLUG_REQUIRED: "Slug event tidak boleh kosong",
    INVALID_FILE: "File tidak valid",
  },
  en: {
    EVENT_NOT_FOUND: "Event not found",
    EVENT_NOT_PUBLISHED: "Event is not published",
    REGISTRATION_CLOSED: "Registration for this event has closed",
    DUPLICATE_REGISTRATION: "You are already registered for this event",
    CAPACITY_FULL: "Event is full - you are in the waiting list",
    INVALID_USER: "Invalid user",
    PAYMENT_REQUIRED: "Payment is required for this event",
    SLUG_REQUIRED: "Event slug cannot be empty",
    INVALID_FILE: "Invalid file",
  },
};

// ============================================
// File Upload Constants
// ============================================
export const FILE_UPLOAD_CONFIG = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ["application/pdf", "image/jpeg", "image/png"],
  ALLOWED_EXTENSIONS: ["pdf", "jpg", "jpeg", "png"],
} as const;

// ============================================
// Logger Utility
// ============================================
const logger = {
  error: (message: string, error?: any) => {
    if (process.env.NODE_ENV === "development") {
      console.error(`[Events] ${message}`, error);
    }
    // TODO: Send to error tracking service (Sentry, LogRocket)
  },
  warn: (message: string) => {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[Events] ${message}`);
    }
  },
  info: (message: string) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[Events] ${message}`);
    }
  },
};

// ============================================
// Interfaces
// ============================================
export interface PlatformEvent {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  thumbnailUrl?: string;
  bannerUrl?: string;
  eventDate: string;
  eventEndDate?: string;
  registrationDeadline?: string;
  location: string;
  registrationLink?: string;
  price: number;
  isPublished: boolean;
  isFeatured: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  // Extra fields
  category?: string;
  level?: string;
  maxSlots?: number;
  confirmedRegistrations?: number; // New: only registered (excludes waitlist)
  speakerInfo?: any[]; // Array of speaker objects
  registrationCount?: number; // Total including waitlist
  recordingUrl?: string;
  tags?: string[];
  themeColor?: string; // Hex code or named color
  prizes?: any[]; // Array of prizes (e.g. { rank: 1, reward: 'Rp 1.000.000' })
  sponsors?: any[]; // Array of sponsors (e.g. { name: 'Company', logoUrl: '...' })
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  status: "registered" | "attended" | "cancelled" | "waitlisted";
  paymentStatus?: "free" | "pending" | "waiting_verification" | "paid" | "rejected";
  paymentAmount?: number;
  paymentProofUrl?: string;
  submissionUrl?: string;
  adminNotes?: string;
  certificateUrl?: string;
  waitlistPosition?: number;
  createdAt: string;
  updatedAt?: string; // New: for tracking status changes
  event?: PlatformEvent;
}

export interface EventSubmission {
  id: string;
  eventId: string;
  userId: string;
  teamName?: string;
  submissionUrl: string;
  description?: string;
  status: "submitted" | "graded" | "rejected";
  score?: number;
  rank?: number;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
  profile?: any;
}

export interface GetEventsOptions {
  page?: number;
  limit?: number;
  status?: "all" | "draft" | "published" | "archived";
  search?: string;
  category?: string;
  level?: string;
}

// ============================================
// Utility Functions
// ============================================

export function generateSlug(title: string): string {
  if (!title || title.trim().length === 0) {
    return "";
  }

  let slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);

  return slug;
}

/**
 * Validate file for upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: getErrorMessage("INVALID_FILE") };
  }

  // Check file size
  if (file.size > FILE_UPLOAD_CONFIG.MAX_SIZE) {
    return {
      valid: false,
      error: `File terlalu besar (max ${FILE_UPLOAD_CONFIG.MAX_SIZE / 1024 / 1024}MB)`,
    };
  }

  // Check file type
  if (!FILE_UPLOAD_CONFIG.ALLOWED_TYPES.includes(file.type as any)) {
    return {
      valid: false,
      error: `Tipe file tidak didukung (PDF, JPEG, PNG)`,
    };
  }

  // Check extension
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !(FILE_UPLOAD_CONFIG.ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
    return { valid: false, error: "Ekstensi file tidak valid" };
  }

  return { valid: true };
}

/**
 * Get localized error message
 */
export function getErrorMessage(
  code: string,
  locale: string = "id"
): string {
  const messages =
    EVENT_ERROR_MESSAGES[locale as keyof typeof EVENT_ERROR_MESSAGES] ||
    EVENT_ERROR_MESSAGES.id;
  return messages[code as keyof typeof messages] || code;
}

// ---------- Public Functions ----------

// Optimized: only select columns needed for listing (no description)
const LISTING_COLUMNS = `
  id, title, slug, short_description, thumbnail_url, banner_url,
  event_date, event_end_date, registration_deadline, location, 
  registration_link, price, is_published, is_featured, category, level,
  max_slots, registration_count, confirmed_registrations, recording_url, tags, created_by, 
  created_at, updated_at
`;

export async function getEvents(options?: GetEventsOptions): Promise<{
  data: PlatformEvent[];
  total: number;
  hasMore: boolean;
}> {
  const {
    page = 1,
    limit = 20,
    search = "",
    category = "all",
    level = "all",
  } = options || {};

  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from("platform_events")
      .select(LISTING_COLUMNS, { count: "exact" })
      .eq("is_published", true)
      .order("event_date", { ascending: true });

    // Filter by category
    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    // Filter by level
    if (level && level !== "all") {
      query = query.eq("level", level);
    }

    // Search by title
    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      logger.error("Failed to fetch events", error);
      return { data: [], total: 0, hasMore: false };
    }

    return {
      data: (data || []).map(formatEvent),
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    };
  } catch (error) {
    logger.error("Unexpected error fetching events", error);
    return { data: [], total: 0, hasMore: false };
  }
}

export async function getEventBySlug(slug: string): Promise<PlatformEvent | null> {
  try {
    const { data, error } = await supabase
      .from("platform_events")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (error) {
      logger.error("Failed to fetch event by slug", error);
      return null;
    }

    if (!data) return null;

    return formatEvent(data);
  } catch (error) {
    logger.error("Unexpected error fetching event detail", error);
    return null;
  }
}

// ---------- User Registration Functions (RPC-based, server-validated) ----------

export async function registerForEvent(eventId: string, userId: string) {
  try {
    // ✅ Check rate limit first
    const rateLimitResult = await checkRegistrationRateLimit(userId, eventId, 3, 5);
    if (!rateLimitResult.allowed) {
      const error = new Error(rateLimitResult.message);
      (error as any).code = "RATE_LIMIT_EXCEEDED";
      throw error;
    }

    const { data, error } = await supabase.rpc("register_for_event_safe", {
      p_event_id: eventId,
      p_user_id: userId,
    });

    if (error) {
      logger.error("RPC error during registration", error);
      throw new Error(error.message || "Gagal mendaftar event");
    }

    const result = data as any;
    if (!result.success) {
      // RPC returns error_code if no success
      const errorMsg = result.error || getErrorMessage(result.error_code || "DUPLICATE_REGISTRATION");
      const error = new Error(errorMsg);
      (error as any).code = result.error_code;
      throw error;
    }

    // ✅ Send registration confirmation email
    sendRegistrationEmail(userId, eventId);

    return result;
  } catch (error: any) {
    logger.error("Error registering for event", error);
    throw error;
  }
}

export async function cancelRegistration(registrationId: string, userId: string) {
  try {
    const { data, error } = await supabase.rpc("cancel_event_registration", {
      p_registration_id: registrationId,
      p_user_id: userId,
    });

    if (error) {
      logger.error("RPC error during cancellation", error);
      throw new Error(error.message || "Gagal membatalkan registrasi");
    }

    const result = data as any;
    if (!result.success) {
      throw new Error(result.error || "Gagal membatalkan registrasi");
    }

    return result;
  } catch (error: any) {
    logger.error("Error cancelling registration", error);
    throw error;
  }
}

export async function updateRegistrationProof(
  registrationId: string,
  userId: string,
  field: "payment_proof" | "submission",
  filePath: string
) {
  try {
    const { data, error } = await supabase.rpc("update_event_registration_proof", {
      p_registration_id: registrationId,
      p_user_id: userId,
      p_field: field,
      p_file_path: filePath,
    });

    if (error) {
      logger.error("RPC error updating proof", error);
      throw new Error(error.message || "Gagal mengunggah file");
    }

    const result = data as any;
    if (!result.success) {
      throw new Error(result.error || "Gagal mengunggah file");
    }

    return result;
  } catch (error: any) {
    logger.error("Error updating registration proof", error);
    throw error;
  }
}

/**
 * Admin/Instructor-only function to update registration status.
 * Uses RPC to validate caller has permission on this event.
 */
export async function updateRegistration(id: string, updates: any) {
  // ✅ SECURITY: Use RPC to validate ownership/admin before updating
  const { data: callerCheck, error: checkError } = await supabase.rpc('validate_event_manager', {
    p_registration_id: id,
  });

  // Fallback: if RPC doesn't exist yet, proceed with RLS protection
  if (checkError && checkError.code !== '42883') {
    // 42883 = function does not exist — fallback gracefully
    throw new Error(checkError.message || 'Gagal memvalidasi izin.');
  }

  if (callerCheck && !callerCheck.allowed) {
    throw new Error('Anda tidak memiliki izin untuk mengubah registrasi ini.');
  }

  // Sanitize: only allow known admin fields
  const safeUpdates: any = {};
  const allowedFields = ['status', 'payment_status', 'admin_notes', 'certificate_url'];
  for (const key of allowedFields) {
    if (updates[key] !== undefined) {
      safeUpdates[key] = updates[key];
    }
  }

  const { data, error } = await supabase
    .from("event_registrations")
    .update(safeUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  // ✅ Generate certificate if marking as attended
  if (safeUpdates.status === 'attended' && data) {
    generateEventCertificate(id, data.user_id, data.event_id);
  }

  // ✅ Send payment approved email
  if (safeUpdates.payment_status === 'paid' && data) {
    sendPaymentApprovedEmail(data.user_id, data.event_id);
  }

  return data;
}

export async function checkIfRegistered(eventId: string, userId: string): Promise<{ registered: boolean; status?: string; registrationId?: string }> {
  const { data, error } = await supabase
    .from("event_registrations")
    .select("id, status")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error checking registration:", error);
    return { registered: false };
  }

  if (data) {
    return { registered: true, status: data.status, registrationId: data.id };
  }
  return { registered: false };
}

export async function getMyRegistrations(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("event_registrations")
    .select(`
      id, event_id, user_id, status, payment_status, payment_amount,
      payment_proof_url, submission_url, admin_notes, certificate_url,
      waitlist_position, created_at,
      event:platform_events(
        id, title, slug, short_description, thumbnail_url, event_date,
        event_end_date, registration_deadline, location, registration_link,
        price, is_published, category, level, max_slots, registration_count
      ),
      profile:user_profiles(id, full_name, email, avatar_url)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching my registrations:", error);
    return [];
  }

  return data || [];
}

// ---------- Admin Functions ----------

export async function adminGetEvents(options?: GetEventsOptions): Promise<{
  data: PlatformEvent[];
  total: number;
  hasMore: boolean;
}> {
  const {
    page = 1,
    limit = 20,
    status = "published",
    search = "",
    category = "all",
  } = options || {};

  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from("platform_events")
      .select(LISTING_COLUMNS, { count: "exact" })
      .order("created_at", { ascending: false });

    // Filter by status
    if (status !== "all") {
      if (status === "draft") {
        query = query.eq("is_published", false);
      } else if (status === "published") {
        query = query.eq("is_published", true);
      }
    }

    // Filter by category
    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    // Search
    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      logger.error("Failed to fetch admin events", error);
      return { data: [], total: 0, hasMore: false };
    }

    return {
      data: (data || []).map(formatEvent),
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    };
  } catch (error) {
    logger.error("Unexpected error fetching admin events", error);
    return { data: [], total: 0, hasMore: false };
  }
}

export async function instructorGetEvents(
  instructorUserId: string,
  options?: GetEventsOptions
): Promise<{
  data: PlatformEvent[];
  total: number;
  hasMore: boolean;
}> {
  const { page = 1, limit = 20, search = "" } = options || {};
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from("platform_events")
      .select(LISTING_COLUMNS, { count: "exact" })
      .eq("created_by", instructorUserId)
      .order("created_at", { ascending: false });

    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      logger.error("Failed to fetch instructor events", error);
      return { data: [], total: 0, hasMore: false };
    }

    return {
      data: (data || []).map(formatEvent),
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    };
  } catch (error) {
    logger.error("Unexpected error fetching instructor events", error);
    return { data: [], total: 0, hasMore: false };
  }
}

/**
 * Strips fields that only admin should set (isFeatured, themeColor, etc.)
 * when called from instructor context.
 */
export function stripInstructorOnlyFields(eventData: Partial<PlatformEvent>): Partial<PlatformEvent> {
  const cleaned = { ...eventData };
  delete cleaned.isFeatured;
  return cleaned;
}

export async function createEvent(eventData: Partial<PlatformEvent>) {
  try {
    const payload = deformatEvent(eventData);
    const { data, error } = await supabase
      .from("platform_events")
      .insert(payload)
      .select()
      .single();

    if (error) {
      logger.error("Failed to create event", error);
      throw error;
    }

    logger.info(`Event created: ${data.title}`);
    return formatEvent(data);
  } catch (error: any) {
    logger.error("Error creating event", error);
    throw error;
  }
}

export async function updateEvent(id: string, eventData: Partial<PlatformEvent>) {
  try {
    const payload = deformatEvent(eventData);
    const { data, error } = await supabase
      .from("platform_events")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      logger.error("Failed to update event", error);
      throw error;
    }

    // ✅ Send recording notification to all registrants when recording URL is added
    if (eventData.recordingUrl && data) {
      notifyRegistrantsRecordingAvailable(id);
    }

    logger.info(`Event updated: ${id}`);
    return formatEvent(data);
  } catch (error: any) {
    logger.error("Error updating event", error);
    throw error;
  }
}

/**
 * Notify all active registrants that recording is available (fire-and-forget).
 */
async function notifyRegistrantsRecordingAvailable(eventId: string) {
  try {
    const { data: registrants } = await supabase
      .from("event_registrations")
      .select("user_id")
      .eq("event_id", eventId)
      .in("status", ["registered", "attended"]);

    if (registrants && registrants.length > 0) {
      for (const reg of registrants) {
        sendRecordingAvailableEmail(reg.user_id, eventId);
      }
      logger.info(`notifyRegistrantsRecordingAvailable: Sent to ${registrants.length} users for event ${eventId}`);
    }
  } catch (error) {
    logger.error("notifyRegistrantsRecordingAvailable failed", error);
  }
}

export async function deleteEvent(id: string) {
  try {
    const { error } = await supabase
      .from("platform_events")
      .delete()
      .eq("id", id);

    if (error) {
      logger.error("Failed to delete event", error);
      throw error;
    }

    logger.info(`Event deleted: ${id}`);
    return true;
  } catch (error: any) {
    logger.error("Error deleting event", error);
    throw error;
  }
}

export async function getEventRegistrants(
  eventId: string,
  options?: { page?: number; limit?: number; status?: string }
): Promise<{
  data: any[];
  total: number;
  hasMore: boolean;
}> {
  const { page = 1, limit = 50, status = "all" } = options || {};
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from("event_registrations")
      .select(
        `
        id, status, payment_status, payment_amount, payment_proof_url,
        submission_url, certificate_url, waitlist_position, created_at, updated_at,
        profile:user_profiles(id, full_name, email, avatar_url)
      `,
        { count: "exact" }
      )
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      logger.error("Failed to fetch event registrants", error);
      return { data: [], total: 0, hasMore: false };
    }

    return {
      data: data || [],
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    };
  } catch (error: any) {
    logger.error("Error fetching event registrants", error);
    return { data: [], total: 0, hasMore: false };
  }
}

// ---------- Helpers ----------

function formatEvent(item: any): PlatformEvent {
  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    shortDescription: item.short_description,
    description: item.description,
    thumbnailUrl: item.thumbnail_url,
    bannerUrl: item.banner_url,
    eventDate: item.event_date,
    eventEndDate: item.event_end_date,
    registrationDeadline: item.registration_deadline,
    location: item.location,
    registrationLink: item.registration_link,
    price: item.price,
    isPublished: item.is_published,
    isFeatured: item.is_featured,
    createdBy: item.created_by,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    category: item.category,
    level: item.level,
    maxSlots: item.max_slots,
    confirmedRegistrations: item.confirmed_registrations ?? 0,
    speakerInfo: item.speaker_info,
    registrationCount: item.registration_count ?? 0,
    recordingUrl: item.recording_url,
    tags: item.tags,
    themeColor: item.theme_color,
    prizes: item.prizes,
    sponsors: item.sponsors,
  };
}

export function deformatEvent(item: Partial<PlatformEvent>): any {
  const mapped: any = {};
  if (item.title !== undefined) mapped.title = item.title;
  if (item.slug !== undefined) mapped.slug = item.slug;
  if (item.shortDescription !== undefined) mapped.short_description = item.shortDescription;
  if (item.description !== undefined) mapped.description = item.description;
  if (item.thumbnailUrl !== undefined) mapped.thumbnail_url = item.thumbnailUrl;
  if (item.bannerUrl !== undefined) mapped.banner_url = item.bannerUrl;
  if (item.eventDate !== undefined) mapped.event_date = item.eventDate;
  if (item.eventEndDate !== undefined) mapped.event_end_date = item.eventEndDate || null;
  if (item.registrationDeadline !== undefined) mapped.registration_deadline = item.registrationDeadline || null;
  if (item.location !== undefined) mapped.location = item.location;
  if (item.registrationLink !== undefined) mapped.registration_link = item.registrationLink;
  if (item.price !== undefined) mapped.price = item.price;
  if (item.isPublished !== undefined) mapped.is_published = item.isPublished;
  if (item.isFeatured !== undefined) mapped.is_featured = item.isFeatured;
  if (item.createdBy !== undefined) mapped.created_by = item.createdBy;
  if (item.category !== undefined) mapped.category = item.category;
  if (item.level !== undefined) mapped.level = item.level;
  if (item.maxSlots !== undefined) mapped.max_slots = item.maxSlots;
  if (item.speakerInfo !== undefined) mapped.speaker_info = item.speakerInfo;
  if (item.recordingUrl !== undefined) mapped.recording_url = item.recordingUrl || null;
  if (item.tags !== undefined) mapped.tags = item.tags;
  if (item.themeColor !== undefined) mapped.theme_color = item.themeColor || null;
  if (item.prizes !== undefined) mapped.prizes = item.prizes;
  if (item.sponsors !== undefined) mapped.sponsors = item.sponsors;
  return mapped;
}

// ---------- Event Submissions ----------

export async function submitEventChallenge(eventId: string, userId: string, submissionData: { submissionUrl: string, description?: string, teamName?: string }) {
  try {
    const { data, error } = await supabase
      .from("event_submissions")
      .upsert({
        event_id: eventId,
        user_id: userId,
        submission_url: submissionData.submissionUrl,
        description: submissionData.description,
        team_name: submissionData.teamName,
        status: "submitted",
        updated_at: new Date().toISOString()
      }, { onConflict: 'event_id, user_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error("Error submitting challenge", error);
    throw error;
  }
}

export async function getEventSubmissions(eventId: string, options?: { page?: number; limit?: number }) {
  const { page = 1, limit = 50 } = options || {};
  const offset = (page - 1) * limit;

  try {
    const { data, error, count } = await supabase
      .from("event_submissions")
      .select(`
        id, event_id, user_id, team_name, submission_url, description, status, score, rank, feedback, created_at, updated_at,
        profile:user_profiles(id, full_name, email, avatar_url)
      `, { count: "exact" })
      .eq("event_id", eventId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    };
  } catch (error) {
    logger.error("Error fetching submissions", error);
    return { data: [], total: 0, hasMore: false };
  }
}

export async function gradeEventSubmission(submissionId: string, updates: { score?: number, rank?: number, status?: string, feedback?: string }) {
  try {
    const { data, error } = await supabase
      .from("event_submissions")
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq("id", submissionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error("Error grading submission", error);
    throw error;
  }
}

export async function getUserSubmission(eventId: string, userId: string) {
  try {
    const { data, error } = await supabase
      .from("event_submissions")
      .select("*")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error("Error fetching user submission", error);
    return null;
  }
}

/**
 * Fetches quick suggestions for event search autocomplete.
 */
export async function getEventSearchSuggestions(query: string, limit = 5): Promise<{id: string, title: string, slug: string}[]> {
  if (!query || query.length < 2) return [];
  
  const cleanQuery = normalizeQuery(query);
  
  const { data, error } = await supabase
    .from("platform_events")
    .select("id, title, slug")
    .ilike("title", `%${cleanQuery}%`)
    .eq("is_published", true)
    .limit(limit);

  if (error) {
    console.error("Event suggestions error:", error);
    return [];
  }

  return (data || []) as {id: string, title: string, slug: string}[];
}

// ============================================
// Email Notification Functions
// Hybrid: DB logging (RPC) + actual email sending (EmailJS)
// ============================================

import {
  sendRegistrationConfirmation,
  sendPaymentApproved,
  sendEventReminder,
  sendRecordingNotification,
} from "./email";

/**
 * Helper: Fetch user email and event details for email sending
 */
async function getEmailContext(userId: string, eventId: string) {
  const [userResult, eventResult] = await Promise.all([
    supabase.from("user_profiles").select("full_name, email").eq("user_id", userId).single(),
    supabase.from("platform_events").select("title, slug, event_date, location, recording_url").eq("id", eventId).single(),
  ]);
  return {
    userName: userResult.data?.full_name || "Peserta",
    userEmail: userResult.data?.email || "",
    eventName: eventResult.data?.title || "",
    eventSlug: eventResult.data?.slug || "",
    eventDate: eventResult.data?.event_date || "",
    eventLocation: eventResult.data?.location || "",
    recordingUrl: eventResult.data?.recording_url || "",
  };
}

/**
 * Send registration confirmation email
 */
export async function sendRegistrationEmail(userId: string, eventId: string): Promise<void> {
  try {
    // 1. Log to DB (RPC)
    const { data } = await supabase.rpc('send_registration_email', {
      p_user_id: userId,
      p_event_id: eventId,
    });

    // 2. Actually send via EmailJS
    const ctx = await getEmailContext(userId, eventId);
    if (ctx.userEmail) {
      const result = await sendRegistrationConfirmation({
        userName: ctx.userName,
        userEmail: ctx.userEmail,
        eventName: ctx.eventName,
        eventDate: ctx.eventDate,
        eventLocation: ctx.eventLocation,
        eventSlug: ctx.eventSlug,
      });

      // 3. Update log status
      if (data?.success !== false) {
        markEmailAsSent(data?.id, result.success ? 'sent' : 'failed');
      }
    }

    logger.info(`sendRegistrationEmail: Done for user ${userId}, event ${eventId}`);
  } catch (error) {
    logger.error('sendRegistrationEmail', error);
  }
}

/**
 * Send payment approved email
 */
export async function sendPaymentApprovedEmail(userId: string, eventId: string): Promise<void> {
  try {
    const { data } = await supabase.rpc('send_payment_approved_email', {
      p_user_id: userId,
      p_event_id: eventId,
    });

    const ctx = await getEmailContext(userId, eventId);
    if (ctx.userEmail) {
      const result = await sendPaymentApproved({
        userName: ctx.userName,
        userEmail: ctx.userEmail,
        eventName: ctx.eventName,
        eventSlug: ctx.eventSlug,
      });

      if (data?.success !== false) {
        markEmailAsSent(data?.id, result.success ? 'sent' : 'failed');
      }
    }

    logger.info(`sendPaymentApprovedEmail: Done for user ${userId}, event ${eventId}`);
  } catch (error) {
    logger.error('sendPaymentApprovedEmail', error);
  }
}

/**
 * Send event reminder email (24 hours before)
 */
export async function sendEventReminderEmail(userId: string, eventId: string): Promise<void> {
  try {
    const { data } = await supabase.rpc('send_event_reminder_email', {
      p_user_id: userId,
      p_event_id: eventId,
    });

    const ctx = await getEmailContext(userId, eventId);
    if (ctx.userEmail) {
      const result = await sendEventReminder({
        userName: ctx.userName,
        userEmail: ctx.userEmail,
        eventName: ctx.eventName,
        eventDate: ctx.eventDate,
        eventSlug: ctx.eventSlug,
      });

      if (data?.success !== false) {
        markEmailAsSent(data?.id, result.success ? 'sent' : 'failed');
      }
    }

    logger.info(`sendEventReminderEmail: Reminder done for user ${userId}, event ${eventId}`);
  } catch (error) {
    logger.error('sendEventReminderEmail', error);
  }
}

/**
 * Send recording available email
 */
export async function sendRecordingAvailableEmail(userId: string, eventId: string): Promise<void> {
  try {
    const { data } = await supabase.rpc('send_recording_available_email', {
      p_user_id: userId,
      p_event_id: eventId,
    });

    const ctx = await getEmailContext(userId, eventId);
    if (ctx.userEmail && ctx.recordingUrl) {
      const result = await sendRecordingNotification({
        userName: ctx.userName,
        userEmail: ctx.userEmail,
        eventName: ctx.eventName,
        recordingUrl: ctx.recordingUrl,
      });

      if (data?.success !== false) {
        markEmailAsSent(data?.id, result.success ? 'sent' : 'failed');
      }
    }

    logger.info(`sendRecordingAvailableEmail: Done for user ${userId}, event ${eventId}`);
  } catch (error) {
    logger.error('sendRecordingAvailableEmail', error);
  }
}

/**
 * Mark email as sent (for DB log tracking)
 */
export async function markEmailAsSent(logId: string, status: 'sent' | 'failed' = 'sent'): Promise<void> {
  try {
    if (!logId) return;
    const { error } = await supabase.rpc('mark_email_as_sent', {
      p_log_id: logId,
      p_status: status,
    });

    if (error) {
      logger.error('mark_email_as_sent', error);
      return;
    }

    logger.info(`mark_email_as_sent: Email ${logId} marked as ${status}`);
  } catch (error) {
    logger.error('mark_email_as_sent', error);
  }
}

// ============================================
// Rate Limiting Functions
// ============================================

/**
 * Check if user has exceeded registration rate limit
 */
export async function checkRegistrationRateLimit(
  userId: string,
  eventId: string,
  maxAttempts: number = 3,
  windowMinutes: number = 5
): Promise<{
  allowed: boolean;
  attempts: number;
  message: string;
}> {
  try {
    const { data, error } = await supabase.rpc('check_registration_rate_limit', {
      p_user_id: userId,
      p_event_id: eventId,
      p_max_attempts: maxAttempts,
      p_window_minutes: windowMinutes,
    });

    if (error) {
      logger.error('check_registration_rate_limit', error);
      return {
        allowed: false,
        attempts: 0,
        message: 'Gagal memeriksa rate limit',
      };
    }

    return data as any;
  } catch (error) {
    logger.error('check_registration_rate_limit', error);
    return {
      allowed: false,
      attempts: 0,
      message: 'Error checking rate limit',
    };
  }
}

/**
 * Reset rate limit for a user (admin only)
 */
export async function resetRegistrationRateLimit(userId: string, eventId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('reset_registration_rate_limit', {
      p_user_id: userId,
      p_event_id: eventId,
    });

    if (error) {
      logger.error('reset_registration_rate_limit', error);
      return;
    }

    logger.info(`reset_registration_rate_limit: Rate limit reset for user ${userId}`);
  } catch (error) {
    logger.error('reset_registration_rate_limit', error);
  }
}

/**
 * Clean up expired rate limit entries
 */
export async function cleanupExpiredRateLimits(): Promise<void> {
  try {
    const { error } = await supabase.rpc('cleanup_expired_rate_limits');

    if (error) {
      logger.error('cleanup_expired_rate_limits', error);
      return;
    }

    logger.info('cleanup_expired_rate_limits: Expired rate limits cleaned up');
  } catch (error) {
    logger.error('cleanup_expired_rate_limits', error);
  }
}

// ============================================
// Certificate Generation Functions
// ============================================

/**
 * Generate certificate when user attendance is confirmed
 */
export async function generateEventCertificate(
  registrationId: string,
  userId: string,
  eventId: string
): Promise<{
  success: boolean;
  message: string;
  certificateNumber?: string;
}> {
  try {
    const { data, error } = await supabase.rpc('generate_event_certificate', {
      p_registration_id: registrationId,
      p_user_id: userId,
      p_event_id: eventId,
    });

    if (error) {
      logger.error('generate_event_certificate', error);
      return { success: false, message: error.message };
    }

    return data as any;
  } catch (error) {
    logger.error('generate_event_certificate', error);
    return { success: false, message: 'Error generating certificate' };
  }
}

/**
 * Get certificate for a user and event
 */
export async function getEventCertificate(userId: string, eventId: string): Promise<any> {
  try {
    const { data, error } = await supabase.rpc('get_event_certificate', {
      p_user_id: userId,
      p_event_id: eventId,
    });

    if (error) {
      logger.error('get_event_certificate', error);
      return null;
    }

    return data;
  } catch (error) {
    logger.error('get_event_certificate', error);
    return null;
  }
}

/**
 * List all certificates for a user
 */
export async function listUserCertificates(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase.rpc('list_user_certificates', {
      p_user_id: userId,
    });

    if (error) {
      logger.error('list_user_certificates', error);
      return [];
    }

    return (data || []) as any[];
  } catch (error) {
    logger.error('list_user_certificates', error);
    return [];
  }
}

/**
 * Revoke a certificate (admin only)
 */
export async function revokeCertificate(certificateId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('revoke_event_certificate', {
      p_certificate_id: certificateId,
    });

    if (error) {
      logger.error('revoke_event_certificate', error);
      return false;
    }

    return (data as any)?.success || false;
  } catch (error) {
    logger.error('revoke_event_certificate', error);
    return false;
  }
}
