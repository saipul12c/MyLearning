"use server";
import { getGeminiResponse, type UserContext } from "./gemini";
import { sendLiveMessage, getChatMessages, type ChatMessage } from "./live_chat";
import { supabase } from "./supabase";

/**
 * Generates AI suggestions for an agent based on current chat history
 */
export async function getAgentAISuggestions(chatId: string): Promise<string[]> {
  const messages = await getChatMessages(chatId);
  if (messages.length === 0) return [];

  const chatHistory = messages.map(msg => ({
    role: (msg.senderType === "user" ? "user" : "model") as "user" | "model",
    parts: [{ text: msg.content }]
  }));

  const lastUserMessage = [...messages].reverse().find(m => m.senderType === "user")?.content || "";

  const systemPrompt = `
    Anda adalah asisten cerdas untuk agen CS MyLearning. 
    Tugas Anda adalah memberikan 3 saran balasan singkat, profesional, dan membantu untuk pesan terakhir pengguna.
    
    ATURAN:
    1. Berikan tepat 3 saran.
    2. Pisahkan setiap saran dengan karakter pipe (|).
    3. Gunakan Bahasa Indonesia yang ramah.
    4. Singkat saja (maksimal 15 kata per saran).
    
    Contoh output: Halo, ada yang bisa saya bantu? | Baik, mohon tunggu sebentar ya kami cek dulu. | Terima kasih atas pertanyaannya, kami akan segera proses.
  `;

  try {
    const response = await getGeminiResponse(
      chatHistory.slice(0, -1),
      `SYSTEM_INSTRUCTION: ${systemPrompt}\n\nPESAN TERAKHIR USER: ${lastUserMessage}`
    );

    return response.split("|").map(s => s.trim()).filter(s => s.length > 0).slice(0, 3);
  } catch (error) {
    console.error("Error getting AI suggestions:", error);
    return ["Halo, ada yang bisa kami bantu?", "Mohon tunggu sebentar ya.", "Terima kasih sudah menghubungi kami."];
  }
}

/**
 * Triggers an AI auto-reply to a chat if it's currently unattended
 */
export async function triggerAutoAIReply(chatId: string, userMessage: string, context?: any) {
  // Check if chat is still open (unattended by agent)
  const { data: chat } = await supabase
    .from("live_chats")
    .select("status, user_id, guest_name, guest_email")
    .eq("id", chatId)
    .single();

  if (!chat || chat.status !== "open") return;

  const messages = await getChatMessages(chatId);
  const chatHistory = messages.map(msg => ({
    role: (msg.senderType === "user" ? "user" : "model") as "user" | "model",
    parts: [{ text: msg.content }]
  }));

  const userContext: UserContext = {
    fullName: chat.guest_name,
    isLoggedIn: !!chat.user_id,
    enrolledCourseIds: [], // Ideally fetch this if user_id exists
    currentPage: context?.currentPage,
    activeContext: context?.activeContext
  };

  const aiResponse = await getGeminiResponse(chatHistory, userMessage, userContext);
  
  await sendLiveMessage(chatId, aiResponse, "bot");
}

export interface ChatInsights {
  sentiment: "positif" | "negatif" | "netral" | "bingung";
  summary: string;
  labels: string[];
  satisfactionScore: number; // 0-100
}

/**
 * Gets AI-generated insights about a chat session
 */
export async function getChatInsights(chatId: string): Promise<ChatInsights | null> {
  const messages = await getChatMessages(chatId);
  if (messages.length === 0) return null;

  const chatText = messages
    .map(m => `${m.senderType.toUpperCase()}: ${m.content}`)
    .join("\n");

  const systemPrompt = `
    Anda adalah analis percakapan cerdas. Analisis percakapan chat antara pengguna dan agen/bot di bawah ini.
    
    TUGAS:
    1. Tentukan SENTIMEN pengguna (pilih satu: positif, negatif, netral, bingung).
    2. Buat RINGKASAN percakapan (maksimal 20 kata).
    3. Berikan LABEL kategori (maksimal 3 label, contoh: Billing, Kursus, Teknis).
    4. Prediksi SKOR KEPUASAN (0-100) berdasarkan alur percakapan.
    
    FORMAT OUTPUT HARUS JSON:
    {
      "sentiment": "...",
      "summary": "...",
      "labels": ["...", "..."],
      "satisfactionScore": 85
    }
  `;

  try {
    const response = await getGeminiResponse([], `SYSTEM_INSTRUCTION: ${systemPrompt}\n\nPERCAKAPAN:\n${chatText}`);
    
    // Attempt to extract JSON from response (using compatible non-s flag regex)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error("Error getting chat insights:", error);
    return null;
  }
}

/**
 * Translates a message to Indonesian if it's in another language
 */
export async function translateMessage(text: string): Promise<string | null> {
  const prompt = `
    Terjemahkan teks di bawah ini ke Bahasa Indonesia yang ramah dan sopan. 
    Jika teks SUDAH dalam Bahasa Indonesia, kembalikan teks asli.
    Jangan berikan penjelasan, hanya hasil terjemahan.
    
    TEKS: "${text}"
  `;

  try {
    const response = await getGeminiResponse([], prompt);
    if (response.trim().toLowerCase() === text.trim().toLowerCase()) return null;
    return response.trim();
  } catch (error) {
    return null;
  }
}

/**
 * Searches the platform knowledge base (courses, lessons) to help agents answer technical questions
 */
export async function searchKnowledgeBase(query: string): Promise<string> {
  const systemPrompt = `
    Anda adalah asisten pakar internal MyLearning. Gunakan data katalog kursus yang Anda miliki untuk menjawab pertanyaan teknis agen CS.
    Jawaban harus padat, akurat, dan siap untuk dikirimkan ke pengguna.
    Sertakan link kursus jika relevan.
  `;

  try {
    return await getGeminiResponse([], `SYSTEM_INSTRUCTION: ${systemPrompt}\n\nPERTANYAAN AGEN: ${query}`);
  } catch (error) {
    return "Maaf, gagal mencari di knowledge base saat ini.";
  }
}
