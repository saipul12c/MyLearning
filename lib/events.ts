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
  location: string;
  registrationLink?: string;
  price: number;
  isPublished: boolean;
  isFeatured: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  // Extra fields
  registrationCount?: number;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  status: "registered" | "attended" | "cancelled";
  paymentStatus?: "free" | "pending" | "waiting_verification" | "paid" | "rejected";
  paymentAmount?: number;
  paymentProofUrl?: string;
  submissionUrl?: string;
  adminNotes?: string;
  createdAt: string;
  event?: PlatformEvent;
}

// ---------- Public Functions ----------

export async function getEvents(): Promise<PlatformEvent[]> {
  const { data, error } = await supabase
    .from("platform_events")
    .select("*")
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
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("Error fetching event:", error);
    return null;
  }

  return formatEvent(data);
}

// ---------- User Registration Functions ----------

export async function registerForEvent(eventId: string, userId: string, price: number = 0) {
  const isPaid = price > 0;
  const initialPaymentStatus = isPaid ? 'pending' : 'free';

  const { data, error } = await supabase
    .from("event_registrations")
    .insert({
      event_id: eventId,
      user_id: userId,
      status: "registered",
      payment_status: initialPaymentStatus,
      payment_amount: price
    })
    .select()
    .single();

  if (error) throw error;
  return data;
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

export async function checkIfRegistered(eventId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("event_registrations")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") { // PGRST116 is 'not found'
    console.error("Error checking registration:", error);
  }

  return !!data;
}

export async function getMyRegistrations(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("event_registrations")
    .select(`
      *,
      event:platform_events(*)
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
    .select("*, registrationCount:event_registrations(count)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching admin events:", error);
    return [];
  }

  return (data || []).map(item => ({
    ...formatEvent(item),
    registrationCount: item.registrationCount?.[0]?.count || 0
  }));
}

export async function instructorGetEvents(instructorUserId: string): Promise<PlatformEvent[]> {
  const { data, error } = await supabase
    .from("platform_events")
    .select("*, registrationCount:event_registrations(count)")
    .eq("created_by", instructorUserId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching instructor events:", error);
    return [];
  }

  return (data || []).map(item => ({
    ...formatEvent(item),
    registrationCount: item.registrationCount?.[0]?.count || 0
  }));
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
    location: item.location,
    registrationLink: item.registration_link,
    price: item.price,
    isPublished: item.is_published,
    isFeatured: item.is_featured,
    createdBy: item.created_by,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
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
  if (item.location !== undefined) mapped.location = item.location;
  if (item.registrationLink !== undefined) mapped.registration_link = item.registrationLink;
  if (item.price !== undefined) mapped.price = item.price;
  if (item.isPublished !== undefined) mapped.is_published = item.isPublished;
  if (item.isFeatured !== undefined) mapped.is_featured = item.isFeatured;
  if (item.createdBy !== undefined) mapped.created_by = item.createdBy;
  return mapped;
}
