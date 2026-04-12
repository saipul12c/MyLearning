import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Syarat dan ketentuan penggunaan platform MyLearning.",
};

export default function TermsPage() {
  return (
    <>
      <section className="hero-bg grid-pattern py-16 sm:py-20">
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
            Syarat & <span className="gradient-text">Ketentuan</span>
          </h1>
          <p className="text-slate-400 text-lg">
            Terakhir diperbarui: 1 April 2026
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {/* Table of Contents */}
          <div className="card p-6 mb-10">
            <h2 className="text-white font-semibold mb-4">Daftar Isi</h2>
            <ol className="space-y-2 text-sm">
              {[
                "Persetujuan Pengguna",
                "Penggunaan Layanan",
                "Akun Pengguna",
                "Konten dan Kursus",
                "Pembayaran dan Refund",
                "Hak Kekayaan Intelektual",
                "Batasan Tanggung Jawab",
                "Perubahan Ketentuan",
                "Hukum yang Berlaku",
                "Kontak",
              ].map((item, idx) => (
                <li key={idx}>
                  <a
                    href={`#section-${idx + 1}`}
                    className="text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    {idx + 1}. {item}
                  </a>
                </li>
              ))}
            </ol>
          </div>

          {/* Content */}
          <div className="prose-dark space-y-10">
            <div id="section-1">
              <h2 className="text-xl font-bold text-white mb-3">
                1. Persetujuan Pengguna
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Dengan mengakses dan menggunakan platform MyLearning, Anda
                menyetujui untuk terikat dengan syarat dan ketentuan ini.
                Jika Anda tidak setuju dengan ketentuan ini, mohon untuk
                tidak menggunakan layanan kami. Syarat dan ketentuan ini
                berlaku untuk semua pengunjung, pengguna, dan pihak lain yang
                mengakses layanan MyLearning.
              </p>
            </div>

            <div id="section-2">
              <h2 className="text-xl font-bold text-white mb-3">
                2. Penggunaan Layanan
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-3">
                Anda setuju untuk menggunakan layanan kami hanya untuk tujuan
                yang sah dan sesuai dengan ketentuan ini. Anda tidak
                diperbolehkan untuk:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-slate-400 text-sm">
                <li>
                  Menggunakan layanan untuk tujuan ilegal atau tidak sah
                </li>
                <li>
                  Membagikan akun Anda kepada pihak lain tanpa izin
                </li>
                <li>
                  Menyalin, merekam, atau mendistribusikan konten kursus
                  tanpa izin tertulis
                </li>
                <li>
                  Mengganggu atau merusak infrastruktur platform
                </li>
                <li>
                  Melakukan scraping atau harvesting data dari platform
                </li>
              </ul>
            </div>

            <div id="section-3">
              <h2 className="text-xl font-bold text-white mb-3">
                3. Akun Pengguna
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Anda bertanggung jawab untuk menjaga kerahasiaan akun dan
                password Anda. Anda setuju untuk bertanggung jawab atas
                semua aktivitas yang terjadi di bawah akun Anda. Anda harus
                segera memberitahu kami jika mengetahui adanya penggunaan
                tidak sah atas akun Anda. MyLearning tidak bertanggung jawab
                atas kerugian yang diakibatkan oleh penggunaan tidak sah
                atas akun Anda.
              </p>
            </div>

            <div id="section-4">
              <h2 className="text-xl font-bold text-white mb-3">
                4. Konten dan Kursus
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Semua konten kursus yang tersedia di MyLearning adalah milik
                MyLearning atau instruktur yang bersangkutan. Pembelian
                kursus memberikan Anda lisensi terbatas untuk mengakses dan
                menonton konten tersebut untuk penggunaan pribadi dan
                non-komersial. Anda tidak diperbolehkan untuk merekam,
                menyalin, mendistribusikan, atau menjual kembali konten
                kursus tanpa izin tertulis.
              </p>
            </div>

            <div id="section-5">
              <h2 className="text-xl font-bold text-white mb-3">
                5. Pembayaran dan Refund
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-3">
                Harga kursus ditampilkan dalam Rupiah Indonesia (IDR) dan
                sudah termasuk pajak yang berlaku. Pembayaran diproses
                melalui payment gateway pihak ketiga yang aman.
              </p>
              <p className="text-slate-400 text-sm leading-relaxed">
                Kami memberikan garansi uang kembali 30 hari untuk semua
                pembelian kursus. Jika Anda tidak puas dengan kursus yang
                dibeli, Anda dapat mengajukan refund dalam waktu 30 hari
                setelah pembelian dengan menghubungi tim support kami.
                Refund akan diproses dalam 7-14 hari kerja.
              </p>
            </div>

            <div id="section-6">
              <h2 className="text-xl font-bold text-white mb-3">
                6. Hak Kekayaan Intelektual
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Seluruh konten, desain, logo, dan materi lainnya di platform
                MyLearning dilindungi oleh hak cipta dan hukum hak kekayaan
                intelektual yang berlaku. Penggunaan tidak sah atas konten
                kami dapat mengakibatkan tindakan hukum.
              </p>
            </div>

            <div id="section-7">
              <h2 className="text-xl font-bold text-white mb-3">
                7. Batasan Tanggung Jawab
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                MyLearning menyediakan layanan &ldquo;as is&rdquo; dan
                &ldquo;as available&rdquo; tanpa jaminan apapun. Kami tidak
                bertanggung jawab atas kerugian langsung, tidak langsung,
                insidental, atau konsekuensial yang timbul dari penggunaan
                platform kami. Kami tidak menjamin bahwa layanan akan
                tersedia tanpa gangguan atau bebas dari error.
              </p>
            </div>

            <div id="section-8">
              <h2 className="text-xl font-bold text-white mb-3">
                8. Perubahan Ketentuan
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Kami berhak untuk mengubah syarat dan ketentuan ini sewaktu-waktu.
                Perubahan akan berlaku segera setelah dipublikasikan di halaman
                ini. Kami akan memberitahu pengguna tentang perubahan
                signifikan melalui email atau notifikasi di platform.
                Penggunaan layanan setelah perubahan dianggap sebagai
                persetujuan terhadap ketentuan yang baru.
              </p>
            </div>

            <div id="section-9">
              <h2 className="text-xl font-bold text-white mb-3">
                9. Hukum yang Berlaku
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Syarat dan ketentuan ini diatur oleh dan ditafsirkan sesuai
                dengan hukum Republik Indonesia. Segala sengketa yang timbul
                dari penggunaan layanan ini akan diselesaikan melalui
                pengadilan yang berwenang di Jakarta, Indonesia.
              </p>
            </div>

            <div id="section-10">
              <h2 className="text-xl font-bold text-white mb-3">
                10. Kontak
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Jika Anda memiliki pertanyaan tentang syarat dan ketentuan
                ini, silakan hubungi kami melalui{" "}
                <Link
                  href="/contact"
                  className="text-purple-400 hover:text-purple-300 underline"
                >
                  halaman kontak
                </Link>{" "}
                atau email ke{" "}
                <span className="text-purple-400">legal@mylearning.id</span>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
