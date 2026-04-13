import { GoogleGenAI } from "@google/genai";
import { getCourses } from "./courses";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

if (!apiKey) {
  if (process.env.NODE_ENV !== "production") {
    console.warn("Gemini API key is missing. AI features will be disabled locally.");
  } else {
    console.warn("WARNING: Gemini API key missing in Production/Build environment!");
  }
}

// Initialize client with fallback to avoid SDK initialization errors if key is empty
const ai = new GoogleGenAI({
  apiKey: apiKey || "missing-key-dummy",
  apiVersion: 'v1beta'
});

// Helper to handle retries with exponential backoff
async function executeWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      // Extract status code from various possible error formats
      const status = error.status || error.code || (error as any).error?.code;
      const isRetryable = status === 503 || status === 429 || error.message?.includes("high demand") || error.message?.includes("UNAVAILABLE");

      if (isRetryable && i < maxRetries) {
        const delay = Math.pow(2, i) * 1000;
        console.warn(`Gemini API busy/overloaded (Status: ${status}). Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export async function getGeminiResponse(chatHistory: { role: "user" | "model"; parts: { text: string }[] }[], userMessage: string): Promise<string> {
  try {
    if (!apiKey) {
      return "Sistem AI sedang offline. Silakan coba lagi nanti atau hubungi agen.";
    }

    // Fetch dynamic course data
    const courses = await getCourses();
    const catalog = courses
      .map(c => `- **${c.title}**\n  Slug: ${c.slug}\n  Harga: Rp ${c.price.toLocaleString('id-ID')}\n  Deskripsi: ${c.description}`)
      .join('\n\n');

    const systemPrompt = `
Anda adalah asisten layanan pelanggan (CS) cerdas untuk MyLearning, platform pembelajaran online di Indonesia. 
TUGAS ANDA:
1. Jawab pertanyaan pengguna tentang kursus, pendaftaran, dan fitur platform.
2. REKOMENDASIKAN kursus yang relevan dari katalog di bawah ini jika ditanya.
3. Selalu gunakan format Markdown yang rapi (bullet points, bold, dll) agar mudah dibaca.
4. Gunakan Bahasa Indonesia yang ramah dan profesional.
5. Jika pengguna ingin bicara dengan agen manusia, arahkan mereka dengan sopan (Sistem kami akan mendeteksi ini otomatis).

KATALOG KURSUS AKTIF:
${catalog}

INSTRUKSI LINKING:
Jika menyebutkan kursus, berikan link dengan format: [Nama Kursus](/courses/slug). Contoh: [Mastering React](/courses/mastering-react-nextjs).
`;

    // Gemini requires the first message in history to be from the 'user'
    const filteredHistory = chatHistory.filter((item, index) => {
      if (index === 0 && item.role === "model") return false;
      return true;
    });

    const response = await executeWithRetry(() => ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: [
        { role: "user", parts: [{ text: `SYSTEM_INSTRUCTION: ${systemPrompt}` }] },
        { role: "model", parts: [{ text: "Siap, saya adalah Asisten AI MyLearning. Saya akan mematuhi semua instruksi katalog dan format Markdown yang Anda berikan." }] },
        ...filteredHistory,
        { role: "user", parts: [{ text: userMessage }] }
      ],
      config: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      }
    }));

    // Extract text safely using the pattern from the documentation/previous working state
    const responseText = (response as any).text || (response as any).candidates?.[0]?.content?.parts?.[0]?.text || "";

    return responseText || "Maaf, AI tidak memberikan respon. Silakan coba lagi.";
  } catch (error: any) {
    console.error("Gemini AI Error:", error);
    const status = error.status || error.code || (error as any).error?.code;
    if (status === 503 || status === 429) {
      return "Maaf, layanan AI kami sedang sangat sibuk karena permintaan sedang melonjak. Silakan coba lagi dalam 30 detik.";
    }
    return "Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba beberapa saat lagi.";
  }
}

export function detectAgentRequest(text: string): boolean {
  const keywords = ["hubungi agen", "bicara dengan admin", "kontak admin", "instruktur", "manusia", "bantuan langsung", "cs live"];
  return keywords.some(k => text.toLowerCase().includes(k));
}

/**
 * Generates educational content for a course lesson
 */
export async function generateAILessonContent(
  courseTitle: string,
  lessonTitle: string,
  contentType: 'video' | 'article'
): Promise<string> {
  try {
    if (!apiKey) {
      throw new Error("API Key tidak ditemukan");
    }

    const prompt = `
Generate materi pembelajaran untuk kursus online.
KURSUS: ${courseTitle}
JUDUL MATERI: ${lessonTitle}
TIPE KONTEN: ${contentType === 'article' ? 'Artikel Lengkap' : 'Deskripsi & Ringkasan Video'}

INSTRUKSI:
1. Gunakan Bahasa Indonesia yang profesional dan edukatif.
2. Gunakan format Markdown yang kaya (Heading, Bold, List, Code blocks jika perlu).
3. Jika tipe konten adalah 'Artikel Lengkap', berikan penjelasan detail, bab-bab materi, dan kesimpulan.
4. Jangan berikan teks pembuka seperti "Tentu, ini materinya", langsung saja ke isi materi sesuai format Markdown.
5. Buat konten yang mendalam dan berkualitas premium.
`;

    const response = await executeWithRetry(() => ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      }
    }));

    const responseText = (response as any).text || (response as any).candidates?.[0]?.content?.parts?.[0]?.text || "";
    return responseText.trim();
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    const status = error.status || error.code || (error as any).error?.code;
    if (status === 503 || status === 429) {
      throw new Error("Layanan AI sedang sangat sibuk (High Demand). Jika sudah mencoba 3x namun tetap gagal. Silakan tunggu 30 detik lalu klik generate lagi.");
    }
    throw new Error("Gagal generate konten AI. Pastikan koneksi internet stabil atau coba gunakan judul materi yang berbeda.");
  }
}

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  name: string;
  icon: string;
  items: FAQItem[];
}

/**
 * Answers questions based on the FAQ data
 */
export async function getFAQGeminiResponse(userMessage: string, faqData: FAQCategory[]): Promise<string> {
  try {
    if (!apiKey) {
      return "Sistem AI sedang offline. Silakan coba lagi nanti.";
    }

    const faqContext = faqData.map(cat => {
      const items = cat.items.map(item => `Q: ${item.question}\nA: ${item.answer}`).join('\n\n');
      return `### Kategori: ${cat.name}\n${items}`;
    }).join('\n\n---\n\n');

    const prompt = `
Anda adalah pakar bantuan pelanggan untuk MyLearning. Tugas Anda adalah menjawab pertanyaan pengguna HANYA berdasarkan data FAQ di bawah ini.

DOKUMEN FAQ KAMI:
${faqContext}

INSTRUKSI:
1. Jika pertanyaan pengguna ada di FAQ, berikan jawaban yang sesuai secara ramah.
2. Jika pertanyaan TIDAK ada di FAQ, katakan dengan sopan bahwa Anda tidak memiliki informasi tersebut dan anjurkan untuk menghubungi tim support kami melalui halaman Kontak.
3. Selalu gunakan Bahasa Indonesia yang ramah, profesional, dan gunakan format Markdown agar rapi.
4. Jangan memberikan informasi di luar apa yang tertulis di FAQ di atas.

Pertanyaan Pengguna: ${userMessage}
`;

    const response = await executeWithRetry(() => ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.3, // Lower temperature for more factual responses
        maxOutputTokens: 1000,
      }
    }));

    const responseText = (response as any).text || (response as any).candidates?.[0]?.content?.parts?.[0]?.text || "";
    return responseText.trim() || "Maaf, saya tidak bisa menemukan jawaban yang tepat di FAQ kami. Silakan hubungi tim support kami.";
  } catch (error: any) {
    console.error("FAQ AI Error:", error);
    return "Maaf, terjadi kesalahan saat menghubungi asisten AI. Silakan coba lagi nanti.";
  }
}
