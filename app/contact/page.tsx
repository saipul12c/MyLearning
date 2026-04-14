"use client";

import { useActionState } from "react";
import { submitContactForm } from "./actions";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../components/AuthContext";

// Social Icons as simple SVG components for compatibility
const SocialIcons = {
  Twitter: (props: any) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  Facebook: (props: any) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  ),
  Instagram: (props: any) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  ),
  LinkedIn: (props: any) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
};

const initialState = { success: false, message: "", error: undefined };

export default function ContactPage() {
  const { user } = useAuth();
  const [state, formAction, isPending] = useActionState(
    submitContactForm,
    initialState
  );

  return (
    <>
      {/* Hero */}
      <section className="hero-bg grid-pattern py-16 sm:py-20">
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <span className="badge badge-primary mb-4 inline-block">Kontak</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
            Hubungi <span className="gradient-text">Kami</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Punya pertanyaan, masukan, atau butuh bantuan? Tim kami siap membantu
            Anda. Kirimkan pesan dan kami akan merespons secepat mungkin.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-10">
            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="card p-6">
                <h3 className="text-white font-semibold text-lg mb-6">
                  Informasi Kontak
                </h3>

                <div className="space-y-5">
                  {[
                    {
                      icon: Mail,
                      label: "Email",
                      value: "hello@mylearning.id",
                      sub: "Balas dalam 1-2 hari kerja",
                    },
                    {
                      icon: Phone,
                      label: "Telepon",
                      value: "+62 821-1234-5678",
                      sub: "Senin - Jumat, 09:00 - 17:00 WIB",
                    },
                    {
                      icon: MapPin,
                      label: "Alamat",
                      value: "Jakarta Selatan, Indonesia",
                      sub: "Menara Digital Lt. 15",
                    },
                    {
                      icon: Clock,
                      label: "Jam Operasional",
                      value: "Senin - Jumat",
                      sub: "09:00 - 17:00 WIB",
                    },
                  ].map((info) => (
                    <div key={info.label} className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center flex-shrink-0">
                        <info.icon size={18} className="text-purple-400" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">
                          {info.label}
                        </div>
                        <div className="text-white text-sm font-medium">
                          {info.value}
                        </div>
                        <div className="text-slate-500 text-xs">
                          {info.sub}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Social */}
              <div className="card p-6">
                <h3 className="text-white font-semibold mb-4">
                  Ikuti Kami
                </h3>
                <div className="flex gap-3">
                  {[
                    { id: "Twitter", icon: SocialIcons.Twitter },
                    { id: "Facebook", icon: SocialIcons.Facebook },
                    { id: "Instagram", icon: SocialIcons.Instagram },
                    { id: "LinkedIn", icon: SocialIcons.LinkedIn },
                  ].map((social) => (
                    <a
                      key={social.id}
                      href="#"
                      className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                      aria-label={social.id}
                    >
                      <social.icon size={18} />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-3">
              <div className="card p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <MessageCircle size={22} className="text-purple-400" />
                  <h2 className="text-xl font-bold text-white">
                    Kirim Pesan
                  </h2>
                </div>

                {/* Status Message */}
                {state.message && (
                  <div
                    className={`flex items-start gap-3 p-4 rounded-xl mb-6 ${
                      state.success
                        ? "bg-emerald-500/10 border border-emerald-500/20"
                        : "bg-red-500/10 border border-red-500/20"
                    }`}
                  >
                    {state.success ? (
                      <CheckCircle
                        size={18}
                        className="text-emerald-400 mt-0.5 flex-shrink-0"
                      />
                    ) : (
                      <AlertCircle
                        size={18}
                        className="text-red-400 mt-0.5 flex-shrink-0"
                      />
                    )}
                    <span
                      className={`text-sm ${
                        state.success ? "text-emerald-300" : "text-red-300"
                      }`}
                    >
                      {state.message}
                    </span>
                  </div>
                )}

                <form action={formAction} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label
                        htmlFor="contact-name"
                        className="block text-sm text-slate-400 mb-2"
                      >
                        Nama Lengkap *
                      </label>
                      <input
                        id="contact-name"
                        name="name"
                        type="text"
                        placeholder="Masukkan nama Anda"
                        className="input"
                        defaultValue={user?.fullName || ""}
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="contact-email"
                        className="block text-sm text-slate-400 mb-2"
                      >
                        Email *
                      </label>
                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        placeholder="nama@email.com"
                        className="input"
                        defaultValue={user?.email || ""}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="contact-subject"
                      className="block text-sm text-slate-400 mb-2"
                    >
                      Subjek *
                    </label>
                    <select
                      id="contact-subject"
                      name="subject"
                      className="input"
                      required
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Pilih subjek
                      </option>
                      <option value="general">Pertanyaan Umum</option>
                      <option value="technical">Bantuan Teknis</option>
                      <option value="payment">Masalah Pembayaran</option>
                      <option value="course">Tentang Kursus</option>
                      <option value="partnership">Kerja Sama / Partnership</option>
                      <option value="other">Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="contact-message"
                      className="block text-sm text-slate-400 mb-2"
                    >
                      Pesan *
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      placeholder="Tulis pesan Anda di sini..."
                      className="input"
                      rows={5}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-primary w-full !py-3.5"
                    disabled={isPending}
                    id="contact-submit"
                  >
                    {isPending ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Mengirim...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Kirim Pesan
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
