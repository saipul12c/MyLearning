import { supabase } from "./supabase";
import { type SafeUser } from "./auth";

export interface LiveChatSession {
  id: string;
  userId?: string;
  guestName?: string;
  guestEmail?: string;
  status: "open" | "active" | "closed";
  agentId?: string;
  metadata?: any;
  lastMessageAt: string;
  unreadCountAgent: number;
  unreadCountUser: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId?: string;
  senderType: "user" | "agent" | "bot";
  content: string;
  isRead: boolean;
  createdAt: string;
}

export async function checkOnlineAgents(): Promise<{ adminOnline: boolean; instructorOnline: boolean; totalOnline: number }> {
  try {
    const { data: onlineProfiles } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("is_online", true)
      .in("role", ["admin", "instructor"]);

    if (!onlineProfiles) return { adminOnline: false, instructorOnline: false, totalOnline: 0 };

    const admins = onlineProfiles.filter(p => p.role === "admin").length;
    const instructors = onlineProfiles.filter(p => p.role === "instructor").length;

    return {
      adminOnline: admins > 0,
      instructorOnline: instructors > 0,
      totalOnline: onlineProfiles.length
    };
  } catch (error) {
    console.error("Error checking online agents:", error);
    return { adminOnline: false, instructorOnline: false, totalOnline: 0 };
  }
}

export async function createChatSession(userData: { userId?: string, name: string, email: string, metadata?: any, fingerprint?: string }): Promise<LiveChatSession | null> {
  const { data, error } = await supabase
    .from("live_chats")
    .insert({
      user_id: userData.userId,
      guest_name: userData.name,
      guest_email: userData.email,
      metadata: userData.metadata || {},
      fingerprint: userData.fingerprint,
      status: "open"
    })
    .select()
    .single();


  if (error) {
    console.error("Error creating chat session:", error);
    return null;
  }

  // Notify Admins
  try {
    const { notifyAdmins } = await import("./notifications");
    await notifyAdmins(
        "Sesi Live Chat Baru 💬",
        `${userData.name} telah memulai sesi bantuan langsung.`,
        `/dashboard/admin/live-cs`
    );
  } catch (ignore) {}

  return data;
}

export async function sendLiveMessage(chatId: string, content: string, senderType: "user" | "agent" | "bot", senderId?: string): Promise<boolean> {
  const { error } = await supabase
    .from("live_chat_messages")
    .insert({
      chat_id: chatId,
      sender_id: senderId,
      sender_type: senderType,
      content
    });

  /*
  if (!error && (senderType === "agent" || senderType === "bot")) {
    // Notify user via email (async, don't wait)
    // DISABLED FOR NOW (UNDER DEVELOPMENT)
    (async () => {
        try {
            const { data: chat } = await supabase.from("live_chats").select("guest_name, guest_email").eq("id", chatId).single();
            if (chat?.guest_email) {
                const { sendChatNotification } = await import("./email");
                await sendChatNotification({
                    userName: chat.guest_name || "User",
                    userEmail: chat.guest_email,
                    agentName: senderType === "bot" ? "Assistant AI" : "Agen MyLearning",
                    messagePreview: content.length > 100 ? content.substring(0, 100) + "..." : content
                });
            }
        } catch (e) {}
    })();
  }
  */

  return !error;
}

export async function getChatMessages(chatId: string): Promise<ChatMessage[]> {
  const { data } = await supabase
    .from("live_chat_messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  return data || [];
}

export async function getOpenChatsForAdmin(): Promise<LiveChatSession[]> {
  const { data } = await supabase
    .from("live_chats")
    .select("*")
    .in("status", ["open", "active"])
    .order("last_message_at", { ascending: false });

  return data || [];
}

export async function resetUnreadCount(chatId: string, type: "agent" | "user"): Promise<void> {
    await supabase.rpc("reset_chat_unread_count", {
        chat_uuid: chatId,
        target_type: type
    });
}

export async function markMessagesAsRead(chatId: string, senderType: "user" | "agent"): Promise<void> {
  // Mark messages from the OTHER party as read
  const targetType = senderType === "user" ? "agent" : "user";
  await supabase
    .from("live_chat_messages")
    .update({ is_read: true })
    .eq("chat_id", chatId)
    .eq("sender_type", targetType)
    .eq("is_read", false);
}

export async function updateInternalNotes(chatId: string, notes: string): Promise<boolean> {
  const { data: chat } = await supabase.from("live_chats").select("metadata").eq("id", chatId).single();
  const metadata = { ...(chat?.metadata || {}), internal_notes: notes };
  
  const { error } = await supabase
    .from("live_chats")
    .update({ metadata })
    .eq("id", chatId);
    
  return !error;
}

export async function transferChat(chatId: string, targetAgentId: string): Promise<boolean> {
  const { error } = await supabase
    .from("live_chats")
    .update({ 
      agent_id: targetAgentId,
      status: "active" 
    })
    .eq("id", chatId);
    
  return !error;
}

export async function getAvailableAgents(): Promise<{ id: string; fullName: string; role: string }[]> {
  const { data } = await supabase
    .from("user_profiles")
    .select("id, full_name, role")
    .in("role", ["admin", "instructor"])
    .eq("is_online", true);
    
  return (data || []).map(d => ({
    id: d.id,
    fullName: d.full_name,
    role: d.role
  }));
}

