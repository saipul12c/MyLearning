"use server";

import { supabase } from "@/lib/supabase";

interface ContactFormState {
  success: boolean;
  message: string;
  error?: string;
}

export async function submitContactForm(
  _prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const subject = formData.get("subject") as string;
  const message = formData.get("message") as string;

  // Validation
  if (!name || !email || !subject || !message) {
    return {
      success: false,
      message: "Semua field harus diisi.",
      error: "validation",
    };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      success: false,
      message: "Format email tidak valid.",
      error: "validation",
    };
  }

  try {
    const { error } = await supabase.from("contact_messages").insert([
      {
        name,
        email,
        subject,
        message,
        status: "unread",
      },
    ]);

    if (error) {
      console.error("Supabase error:", error);
      return {
        success: false,
        message:
          "Terjadi kesalahan saat mengirim pesan. Pastikan Supabase sudah terkonfigurasi dengan benar.",
        error: "database",
      };
    }

    return {
      success: true,
      message:
        "Pesan Anda berhasil dikirim! Tim kami akan membalas dalam 1-2 hari kerja.",
    };
  } catch (err) {
    console.error("Submit error:", err);
    return {
      success: false,
      message:
        "Gagal menghubungi server. Periksa koneksi internet Anda atau konfigurasi Supabase.",
      error: "network",
    };
  }
}
