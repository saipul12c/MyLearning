import { supabase } from "./supabase";

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
  speakerInfo?: any[]; // Array of speaker objects
  registrationCount?: number;
  recordingUrl?: string;
  tags?: string[];
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
  event?: PlatformEvent;
}

// ---------- Utility ----------

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100);
}

// ---------- Public Functions ----------

// Optimized: only select columns needed for listing (no description)
const LISTING_COLUMNS = `
  id, title, slug, short_description, thumbnail_url, banner_url,
  event_date, event_end_date, registration_deadline, location, 
  registration_link, price, is_published, is_featured, category, level,
  max_slots, registration_count, recording_url, tags, created_by, 
  created_at, updated_at
`;

export async function getEvents(): Promise<PlatformEvent[]> {
  const { data, error } = await supabase
    .from("platform_events")
    .select(LISTING_COLUMNS)
    .eq("is_published", true)
    .order("event_date", { ascending: true });

  if (error) {
    console.error("Error fetching events:", error);
    return [];
  }

  return (data || []).map(formatEvent);
}

export async function getEventBySlug(slug: string): Promise<PlatformEvent | null> {
  const { data, error } = await supabase
    .from("platform_events")
    .select("*, registrationCount:event_registrations(count)")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error) {
    console.error("Error fetching event:", error);
    return null;
  }

  return formatEvent(data);
}

// ---------- User Registration Functions (RPC-based, server-validated) ----------

export async function registerForEvent(eventId: string, userId: string) {
  const { data, error } = await supabase.rpc("register_for_event_safe", {
    p_event_id: eventId,
    p_user_id: userId,
  });

  if (error) throw error;

  const result = data as any;
  if (!result.success) {
    throw new Error(result.error);
  }

  return result;
}

export async function cancelRegistration(registrationId: string, userId: string) {
  const { data, error } = await supabase.rpc("cancel_event_registration", {
    p_registration_id: registrationId,
    p_user_id: userId,
  });

  if (error) throw error;

  const result = data as any;
  if (!result.success) {
    throw new Error(result.error);
  }

  return result;
}

export async function updateRegistrationProof(
  registrationId: string,
  userId: string,
  field: "payment_proof" | "submission",
  filePath: string
) {
  const { data, error } = await supabase.rpc("update_event_registration_proof", {
    p_registration_id: registrationId,
    p_user_id: userId,
    p_field: field,
    p_file_path: filePath,
  });

  if (error) throw error;

  const result = data as any;
  if (!result.success) {
    throw new Error(result.error);
  }

  return result;
}

export async function updateRegistration(id: string, updates: any) {
  const { data, error } = await supabase
    .from("event_registrations")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function checkIfRegistered(eventId: string, userId: string): Promise<{ registered: boolean; status?: string; registrationId?: string }> {
  const { data, error } = await supabase
    .from("event_registrations")
    .select("id, status")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") { // PGRST116 is 'not found'
    console.error("Error checking registration:", error);
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
      *,
      event:platform_events(*),
      profile:user_profiles(*)
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

export async function adminGetEvents(): Promise<PlatformEvent[]> {
  const { data, error } = await supabase
    .from("platform_events")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching admin events:", error);
    return [];
  }

  return (data || []).map(formatEvent);
}

export async function instructorGetEvents(instructorUserId: string): Promise<PlatformEvent[]> {
  const { data, error } = await supabase
    .from("platform_events")
    .select("*")
    .eq("created_by", instructorUserId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching instructor events:", error);
    return [];
  }

  return (data || []).map(formatEvent);
}

export async function createEvent(eventData: Partial<PlatformEvent>) {
  const payload = deformatEvent(eventData);
  const { data, error } = await supabase
    .from("platform_events")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return formatEvent(data);
}

export async function updateEvent(id: string, eventData: Partial<PlatformEvent>) {
  const payload = deformatEvent(eventData);
  const { data, error } = await supabase
    .from("platform_events")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return formatEvent(data);
}

export async function deleteEvent(id: string) {
  const { error } = await supabase
    .from("platform_events")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return true;
}

export async function getEventRegistrants(eventId: string) {
    const { data, error } = await supabase
      .from("event_registrations")
      .select(`
        *,
        profile:user_profiles(*)
      `)
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });
  
    if (error) {
      console.error("Error fetching event registrants:", error);
      return [];
    }
  
    return data || [];
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
    speakerInfo: item.speaker_info,
    registrationCount: item.registration_count ?? item.registrationCount?.[0]?.count ?? 0,
    recordingUrl: item.recording_url,
    tags: item.tags,
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
  return mapped;
}
