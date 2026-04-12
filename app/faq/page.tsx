"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, MessageCircle } from "lucide-react";
import Link from "next/link";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  name: string;
  icon: string;
  items: FAQItem[];
}

const faqData: FAQCategory[] = [
  {
    name: "Umum",
    icon: "📌",
    items: [
      {
        question: "Apa itu MyLearning?",
        answer:
          "MyLearning adalah platform belajar online yang menyediakan kursus berkualitas dalam berbagai bidang seperti pemrograman, data science, desain, bisnis, dan banyak lagi. Semua kursus dibuat oleh instruktur berpengalaman dan praktisi industri.",
      },
      {
        question: "Apakah MyLearning cocok untuk pemula?",
        answer:
          "Tentu! Kami menyediakan kursus untuk semua level, dari pemula hingga lanjutan. Setiap kursus memiliki label level (Pemula, Menengah, Lanjutan) sehingga Anda bisa memilih yang sesuai dengan kemampuan Anda.",
      },
      {
        question: "Bagaimana cara memulai belajar di MyLearning?",
        answer:
          "Cukup buat akun gratis, pilih kursus yang diminati, lakukan pembayaran, dan Anda langsung bisa mulai belajar. Kursus bisa diakses kapan saja dan dari mana saja.",
      },
      {
        question: "Apakah ada kursus gratis?",
        answer:
          "Ya! Beberapa kursus memiliki pelajaran preview gratis yang bisa Anda akses tanpa perlu membeli. Kami juga sering mengadakan promo dan diskon spesial.",
      },
    ],
  },
  {
    name: "Pembayaran",
    icon: "💳",
    items: [
      {
        question: "Metode pembayaran apa saja yang tersedia?",
        answer:
          "Kami menerima pembayaran melalui transfer bank (BCA, BNI, BRI, Mandiri), e-wallet (GoPay, OVO, Dana), kartu kredit/debit (Visa, Mastercard), dan virtual account.",
      },
      {
        question: "Apakah pembayaran aman?",
        answer:
          "Sangat aman. Semua transaksi diproses melalui payment gateway yang terenkripsi dan bersertifikasi PCI-DSS. Data pembayaran Anda tidak pernah disimpan di server kami.",
      },
      {
        question: "Apakah ada garansi uang kembali?",
        answer:
          "Ya! Kami memberikan garansi uang kembali 30 hari. Jika Anda tidak puas dengan kursus yang dibeli, hubungi tim support kami untuk proses refund penuh.",
      },
      {
        question: "Apakah bisa bayar cicilan?",
        answer:
          "Untuk kursus tertentu, kami menyediakan opsi cicilan 0% melalui kartu kredit. Informasi cicilan tersedia di halaman detail kursus.",
      },
    ],
  },
  {
    name: "Teknis",
    icon: "⚙️",
    items: [
      {
        question: "Apakah bisa belajar di HP/tablet?",
        answer:
          "Ya, platform MyLearning fully responsive dan bisa diakses melalui browser di smartphone dan tablet. Kami juga sedang mengembangkan aplikasi mobile untuk pengalaman belajar yang lebih baik.",
      },
      {
        question: "Apakah perlu koneksi internet untuk belajar?",
        answer:
          "Ya, Anda memerlukan koneksi internet untuk streaming video kursus. Kami merekomendasikan koneksi minimal 5 Mbps untuk pengalaman streaming yang lancar.",
      },
      {
        question: "Berapa lama akses ke kursus yang sudah dibeli?",
        answer:
          "Akses kursus yang sudah dibeli berlaku seumur hidup! Anda bisa menonton ulang materi kapan saja, termasuk semua update konten yang akan datang.",
      },
      {
        question: "Apakah ada subtitle atau transkrip?",
        answer:
          "Sebagian besar kursus dilengkapi dengan subtitle bahasa Indonesia. Kami terus menambahkan subtitle dan transkrip ke kursus-kursus yang belum memilikinya.",
      },
    ],
  },
  {
    name: "Sertifikat",
    icon: "🏆",
    items: [
      {
        question: "Apakah saya mendapat sertifikat?",
        answer:
          "Ya! Setiap kursus yang berhasil diselesaikan akan mendapatkan sertifikat digital yang bisa diunduh dan dibagikan di LinkedIn atau CV Anda.",
      },
      {
        question: "Apakah sertifikat diakui industri?",
        answer:
          "Sertifikat MyLearning menunjukkan bahwa Anda telah menyelesaikan pelatihan profesional. Banyak perusahaan mitra kami yang mengakui sertifikat ini sebagai bukti kompetensi.",
      },
    ],
  },
];

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState(0);
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (key: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <>
      {/* Hero */}
      <section className="hero-bg grid-pattern py-16 sm:py-20">
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <span className="badge badge-primary mb-4 inline-block">FAQ</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
            Pertanyaan yang{" "}
            <span className="gradient-text">Sering Ditanyakan</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Temukan jawaban untuk pertanyaan umum tentang MyLearning. Tidak
            menemukan jawaban? Hubungi tim support kami.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-2 mb-10 justify-center">
            {faqData.map((cat, idx) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(idx)}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeCategory === idx
                    ? "bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-lg shadow-purple-500/20"
                    : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5"
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>

          {/* FAQ Items */}
          <div className="space-y-3">
            {faqData[activeCategory].items.map((item, idx) => {
              const key = `${activeCategory}-${idx}`;
              const isOpen = openItems.has(key);
              return (
                <div
                  key={key}
                  className="card overflow-hidden"
                >
                  <button
                    onClick={() => toggleItem(key)}
                    className="w-full flex items-center justify-between p-5 text-left"
                    id={`faq-item-${activeCategory}-${idx}`}
                  >
                    <span className="text-white font-medium text-sm sm:text-base pr-4">
                      {item.question}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`text-slate-400 flex-shrink-0 transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`transition-all duration-300 ease-in-out ${
                      isOpen
                        ? "max-h-96 opacity-100"
                        : "max-h-0 opacity-0"
                    } overflow-hidden`}
                  >
                    <div className="px-5 pb-5 text-slate-400 text-sm leading-relaxed border-t border-white/5 pt-4">
                      {item.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Still have questions? */}
          <div className="mt-16 text-center">
            <div className="card p-8 sm:p-10 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/15 via-transparent to-cyan-900/15" />
              <div className="relative z-10">
                <HelpCircle
                  size={40}
                  className="text-purple-400 mx-auto mb-4"
                />
                <h3 className="text-xl font-bold text-white mb-2">
                  Masih Punya Pertanyaan?
                </h3>
                <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
                  Tim support kami siap membantu Anda. Jangan ragu untuk
                  menghubungi kami melalui halaman kontak.
                </p>
                <Link href="/contact" className="btn-primary">
                  <MessageCircle size={16} />
                  Hubungi Kami
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
