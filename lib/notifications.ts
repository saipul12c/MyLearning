import { supabase } from "./supabase";

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  userId?: string; // Optional for global notifications
  title: string;
  message: string;
  type: NotificationType;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}


export async function getUserNotifications(userId: string, includeGlobal = true): Promise<Notification[]> {
  try {
    const query = supabase
      .from("notifications")
      .select("*");
    
    if (includeGlobal) {
        query.or(`user_id.eq.${userId},user_id.is.null`);
    } else {
        query.eq("user_id", userId);
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(50);

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

export async function getGlobalNotifications(): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .is("user_id", null)
        .order("created_at", { ascending: false })
        .limit(20);
  
      if (error) throw error;
      return (data || []).map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        linkUrl: n.link_url,
        isRead: false, // Global is always technically unread at fetch unless local storage says otherwise
        createdAt: n.created_at
      }));
    } catch (err) {
      console.error("Error fetching global notifications:", err);
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

export async function deleteAllNotifications(userId: string): Promise<{ success: boolean }> {
  try {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", userId);
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

export async function createGlobalNotification(title: string, message: string, type: NotificationType = 'info', linkUrl?: string) {
    const { data, error } = await supabase.rpc("broadcast_notification", {
        p_title: title,
        p_message: message,
        p_type: type,
        p_link_url: linkUrl
    });
    return { success: !error, data };
}

