"use server";

import { GoogleGenAI } from "@google/genai";
import { getCourses } from "./courses";
import { supabase } from "./supabase";

const apiKey = process.env.NEXT_GEMINI_API_KEY || "";

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

export interface UserContext {
  fullName?: string;
  isLoggedIn: boolean;
  enrolledCourseIds: string[]; // IDs of courses the user is currently officially enrolled in (paid/completed)
}

export async function getGeminiResponse(
  chatHistory: { role: "user" | "model"; parts: { text: string }[] }[], 
  userMessage: string,
  userContext?: UserContext
): Promise<string> {
  try {
    if (!apiKey) {
      return "Sistem AI sedang offline. Silakan coba lagi nanti atau hubungi agen.";
    }

    // 1. Fetch catalog & potentially restricted lesson materials
    const courses = await getCourses();
    
    // Safety Logic: Filter lesson content based on user access
    // We only share full lesson content with AI if the user has paid for it OR it's a free preview.
    // For recommendation mode, we share only titles and descriptions.
    const { data: lessonData, error: lessonError } = await supabase
      .from("lessons")
      .select("course_id, title, description, content_type, is_free_preview");

    const lessonsByCourseId = (lessonData || []).reduce((acc: any, curr: any) => {
      if (!acc[curr.course_id]) acc[curr.course_id] = [];
      acc[curr.course_id].push(curr);
      return acc;
    }, {});

    const catalog = courses
      .map(c => {
        const userHasAccess = userContext?.isLoggedIn && userContext.enrolledCourseIds.includes(c.id);
        
        // Filter lessons based on user context
        const accessibleLessons = (lessonsByCourseId[c.id] || []).filter((l: any) => 
          userHasAccess || l.is_free_preview
        );

        let lessonsText = "";
        if (accessibleLessons.length > 0) {
          lessonsText = "\n  Materi Tersedia:\n" + accessibleLessons
            .map((l: any) => `    - ${l.title}${l.is_free_preview ? " (Pratinjau Gratis)" : ""}: ${l.description?.substring(0, 100)}...`)
            .join("\n");
        }

        return `- [**${c.title}**](/courses/${c.slug}) - Rp ${c.price.toLocaleString('id-ID')}\n  Ringkasan: ${c.description.substring(0, 100)}...${lessonsText}`;
      })
      .join('\n\n');

    const systemPrompt = `
Anda adalah asisten layanan pelanggan (CS) cerdas dan mentor belajar untuk MyLearning, platform pembelajaran online premium di Indonesia. 

${userContext?.isLoggedIn ? `PENGGUNA SAAT INI: ${userContext.fullName}. Sapa mereka dengan nama agar terasa lebih personal.` : "PENGGUNA SAAT INI: Tamu (Belum Login)."}

TUGAS ANDA:
1. Jawab pertanyaan pengguna tentang kursus, pendaftaran, dan fitur platform.
2. REKOMENDASIKAN kursus yang relevan dari katalog di bawah ini.
3. Sebagai mentor, bantu jelaskan materi pelajaran jika pengguna bertanya tentang isi kursus.
4. ATURAN AKSES KONTEN (PENTING): 
   - Anda hanya memiliki akses detail ke materi yang berlabel "Pratinjau Gratis" atau materi dari kursus yang SUDAH DIMILIKI pengguna (lihat data katalog di bawah).
   - Jika pengguna bertanya tentang materi berbayar yang belum mereka miliki, jelaskan secara garis besar saja dan arahkan mereka untuk membeli kursus tersebut untuk melihat detail lengkapnya.
5. Selalu gunakan format Markdown yang rapi.
6. Gunakan Bahasa Indonesia yang ramah, profesional, dan sedikit santai (Premium feel).

INSTRUKSI LINKING (PENTING):
- Jika menyebutkan nama kursus, Anda WAJIB menggunakan format link: [Nama Kursus](/courses/slug). 
- Contoh: "Berdasarkan minat Anda, saya sangat merekomendasikan [Mastering React & Next.js](/courses/mastering-react-nextjs) untuk karir Anda."

KATALOG KURSUS & MATERI AKSES:
${catalog}
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

/**
 * Generates structured quiz questions for a course
 */
export async function generateAIQuizQuestions(
  courseTitle: string,
  topic: string,
  num: number = 5
): Promise<any[]> {
  try {
    const prompt = `
Generate ${num} pertanyaan kuis pilihan ganda (Multiple Choice) untuk kursus: "${courseTitle}" dengan topik spesifik: "${topic}".

FORMAT RESPONSE HARUS JSON ARRAY:
[
  {
    "question_text": "Teks pertanyaan",
    "options": ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
    "correct_answer_index": 0,
    "explanation": "Penjelasan singkat kenapa ini benar",
    "hint": "Petunjuk kecil",
    "points": 1
  }
]

ATURAN:
1. Pastikan pertanyaan menantang dan relevan dengan topik.
2. Jawaban benar harus bervariasi indeksnya.
3. Langsung kembalikan JSON, jangan ada teks pembuka/penutup.
`;

    const response = await executeWithRetry(() => ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.8,
        responseMimeType: "application/json"
      }
    }));

    const responseText = (response as any).text || (response as any).candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    return JSON.parse(responseText);
  } catch (error) {
    console.error("AI Quiz Gen Error:", error);
    throw error;
  }
}

/**
 * Generates an assignment for a course
 */
export async function generateAIAssessmentContent(
  courseTitle: string,
  assessmentTitle: string,
  type: 'assignment' | 'final_project'
): Promise<{ instructions: string; evaluation_criteria: string; description?: string; title?: string }> {
  try {
    const prompt = `
Generate konten untuk ${type === 'assignment' ? 'Tugas Praktik' : 'Projek Akhir'} pada kursus: "${courseTitle}".
Judul Assessment: "${assessmentTitle}".

Format Output JSON:
{
  "title": "Judul yang lebih menarik (opsional)",
  "description": "Deskripsi singkat project/tugas",
  "instructions": "Instruksi pengerjaan detail (Markdown)",
  "evaluation_criteria": "Kriteria penilaian (Markdown)"
}

INSTRUKSI:
1. Buat instruksi yang menantang dan mendasar pada industri nyata.
2. Gunakan Bahasa Indonesia yang profesional.
3. Langsung kembalikan JSON.
`;

    const response = await executeWithRetry(() => ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.7,
        responseMimeType: "application/json"
      }
    }));

    const responseText = (response as any).text || (response as any).candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    return JSON.parse(responseText);
  } catch (error) {
    console.error("AI Assessment Gen Error:", error);
    throw error;
  }
}
