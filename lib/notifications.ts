import { supabase } from "./supabase";

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export async function getUserNotifications(userId: string): Promise<Notification[]> {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(n => ({
      id: n.id,
      userId: n.user_id,
      title: n.title,
      message: n.message,
      type: n.type,
      linkUrl: n.link_url,
      isRead: n.is_read,
      createdAt: n.created_at
    }));
  } catch (err) {
    console.error("Error fetching notifications:", err);
    return [];
  }
}

export async function createNotification(payload: {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  linkUrl?: string;
}): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabase
      .from("notifications")
      .insert({
        user_id: payload.userId,
        title: payload.title,
        message: payload.message,
        type: payload.type || 'info',
        link_url: payload.linkUrl,
      });

    return { success: !error, error };
  } catch (err) {
    return { success: false, error: err };
  }
}

export async function markAsRead(notificationId: string): Promise<{ success: boolean }> {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);
    return { success: !error };
  } catch {
    return { success: false };
  }
}

export async function markAllAsRead(userId: string): Promise<{ success: boolean }> {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    return { success: !error };
  } catch {
    return { success: false };
  }
}

export async function deleteNotification(notificationId: string): Promise<{ success: boolean }> {
  try {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);
    return { success: !error };
  } catch {
    return { success: false };
  }
}

// Admin Helper: Notify all admins
export async function notifyAdmins(title: string, message: string, linkUrl?: string) {
    // 1. Get all admin user IDs
    const { data: admins } = await supabase
        .from("user_profiles")
        .select("user_id")
        .eq("role", "admin");
    
    if (admins && admins.length > 0) {
        const payloads = admins.map(a => ({
            user_id: a.user_id,
            title,
            message,
            type: 'info' as NotificationType,
            link_url: linkUrl
        }));

        await supabase.from("notifications").insert(payloads);
    }
}
