import { supabase } from "./supabase";
import { type SafeUser } from "./auth";

export interface LiveChatSession {
  id: string;
  userId?: string;
  guestName?: string;
  guestEmail?: string;
  status: "open" | "active" | "closed";
  agentId?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId?: string;
  senderType: "user" | "agent" | "bot";
  content: string;
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

export async function createChatSession(userData: { userId?: string, name: string, email: string }): Promise<LiveChatSession | null> {
  const { data, error } = await supabase
    .from("live_chats")
    .insert({
      user_id: userData.userId,
      guest_name: userData.name,
      guest_email: userData.email,
      status: "open"
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating chat session:", error);
    return null;
  }
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
    .order("created_at", { ascending: false });

  return data || [];
}
