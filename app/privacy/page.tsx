import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Kebijakan privasi platform MyLearning.",
};

export default function PrivacyPage() {
  return (
    <>
      <section className="hero-bg grid-pattern py-16 sm:py-20">
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
            Kebijakan <span className="gradient-text">Privasi</span>
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
                "Informasi yang Kami Kumpulkan",
                "Cara Kami Menggunakan Informasi",
                "Pembagian Informasi",
                "Keamanan Data",
                "Cookie dan Teknologi Pelacakan",
                "Hak Pengguna",
                "Penyimpanan Data",
                "Layanan Pihak Ketiga",
                "Perubahan Kebijakan",
                "Kontak",
              ].map((item, idx) => (
                <li key={idx}>
                  <a
                    href={`#privacy-${idx + 1}`}
                    className="text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    {idx + 1}. {item}
                  </a>
                </li>
              ))}
            </ol>
          </div>

          {/* Content */}
          <div className="space-y-10">
            <p className="text-slate-400 text-sm leading-relaxed">
              MyLearning (&ldquo;kami&rdquo;, &ldquo;kita&rdquo;, atau
              &ldquo;milik kami&rdquo;) berkomitmen untuk melindungi privasi
              Anda. Kebijakan Privasi ini menjelaskan bagaimana kami
              mengumpulkan, menggunakan, dan melindungi informasi pribadi
              Anda ketika Anda menggunakan platform kami.
            </p>

            <div id="privacy-1">
              <h2 className="text-xl font-bold text-white mb-3">
                1. Informasi yang Kami Kumpulkan
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-3">
                Kami mengumpulkan beberapa jenis informasi:
              </p>
              <ul className="space-y-3 text-sm text-slate-400">
                <li>
                  <strong className="text-slate-300">
                    Informasi Akun:
                  </strong>{" "}
                  Nama, alamat email, nomor telepon, dan informasi profil yang
                  Anda berikan saat mendaftar.
                </li>
                <li>
                  <strong className="text-slate-300">
                    Informasi Pembayaran:
                  </strong>{" "}
                  Detail pembayaran diproses oleh payment gateway pihak ketiga
                  dan tidak disimpan di server kami.
                </li>
                <li>
                  <strong className="text-slate-300">
                    Data Pembelajaran:
                  </strong>{" "}
                  Progress kursus, quiz results, dan aktivitas belajar Anda
                  di platform.
                </li>
                <li>
                  <strong className="text-slate-300">
                    Data Teknis:
                  </strong>{" "}
                  Alamat IP, jenis browser, perangkat, sistem operasi, dan
                  data log lainnya.
                </li>
                <li>
                  <strong className="text-slate-300">
                    Cookie:
                  </strong>{" "}
                  Kami menggunakan cookie untuk meningkatkan pengalaman
                  pengguna. Lihat bagian Cookie di bawah.
                </li>
              </ul>
            </div>

            <div id="privacy-2">
              <h2 className="text-xl font-bold text-white mb-3">
                2. Cara Kami Menggunakan Informasi
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-3">
                Informasi yang kami kumpulkan digunakan untuk:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-slate-400 text-sm">
                <li>Menyediakan dan mengoperasikan layanan platform</li>
                <li>Memproses transaksi dan pembayaran</li>
                <li>
                  Mengirim notifikasi terkait kursus dan pembaruan platform
                </li>
                <li>Meningkatkan pengalaman belajar Anda</li>
                <li>Memberikan dukungan pelanggan</li>
                <li>Menganalisis penggunaan platform untuk peningkatan</li>
                <li>
                  Mengirim informasi pemasaran (dengan persetujuan Anda)
                </li>
              </ul>
            </div>

            <div id="privacy-3">
              <h2 className="text-xl font-bold text-white mb-3">
                3. Pembagian Informasi
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-3">
                Kami tidak menjual informasi pribadi Anda. Kami mungkin
                membagikan informasi Anda dengan:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-slate-400 text-sm">
                <li>
                  Instruktur kursus (terbatas pada informasi yang diperlukan)
                </li>
                <li>
                  Penyedia layanan pihak ketiga yang membantu operasional kami
                </li>
                <li>
                  Pihak berwenang jika diwajibkan oleh hukum yang berlaku
                </li>
              </ul>
            </div>

            <div id="privacy-4">
              <h2 className="text-xl font-bold text-white mb-3">
                4. Keamanan Data
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Kami mengimplementasikan langkah-langkah keamanan teknis dan
                organisasional untuk melindungi data pribadi Anda. Ini
                termasuk enkripsi SSL/TLS untuk transmisi data, penyimpanan
                aman dengan akses terbatas, dan audit keamanan berkala.
                Meskipun demikian, tidak ada metode transmisi data melalui
                internet atau penyimpanan elektronik yang 100% aman.
              </p>
            </div>

            <div id="privacy-5">
              <h2 className="text-xl font-bold text-white mb-3">
                5. Cookie dan Teknologi Pelacakan
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-3">
                Kami menggunakan cookie dan teknologi serupa untuk:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-slate-400 text-sm">
                <li>Menjaga sesi login Anda</li>
                <li>Menyimpan preferensi pengguna</li>
                <li>Menganalisis lalu lintas dan penggunaan platform</li>
                <li>Menampilkan konten yang dipersonalisasi</li>
              </ul>
              <p className="text-slate-400 text-sm leading-relaxed mt-3">
                Anda dapat mengatur preferensi cookie melalui pengaturan browser
                Anda. Namun, menonaktifkan cookie tertentu mungkin mempengaruhi
                fungsionalitas platform.
              </p>
            </div>

            <div id="privacy-6">
              <h2 className="text-xl font-bold text-white mb-3">
                6. Hak Pengguna
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-3">
                Anda memiliki hak-hak berikut terkait data pribadi Anda:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-slate-400 text-sm">
                <li>Mengakses data pribadi yang kami simpan tentang Anda</li>
                <li>Memperbaiki atau memperbarui data pribadi Anda</li>
                <li>Meminta penghapusan data pribadi Anda</li>
                <li>Menarik persetujuan untuk pemrosesan data tertentu</li>
                <li>Meminta portabilitas data Anda</li>
              </ul>
              <p className="text-slate-400 text-sm leading-relaxed mt-3">
                Untuk menggunakan hak-hak ini, silakan hubungi kami melalui
                email di{" "}
                <span className="text-purple-400">privacy@mylearning.id</span>.
              </p>
            </div>

            <div id="privacy-7">
              <h2 className="text-xl font-bold text-white mb-3">
                7. Penyimpanan Data
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Kami menyimpan data pribadi Anda selama akun Anda aktif atau
                selama diperlukan untuk menyediakan layanan kami. Setelah akun
                dihapus, kami akan menghapus atau menganonimkan data Anda
                dalam waktu 90 hari, kecuali jika penyimpanan lebih lama
                diperlukan untuk keperluan hukum atau bisnis yang sah.
              </p>
            </div>

            <div id="privacy-8">
              <h2 className="text-xl font-bold text-white mb-3">
                8. Layanan Pihak Ketiga
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Platform kami mungkin berisi tautan ke layanan pihak ketiga.
                Kami tidak bertanggung jawab atas praktik privasi layanan
                tersebut. Kami mendorong Anda untuk membaca kebijakan privasi
                setiap layanan pihak ketiga yang Anda gunakan.
              </p>
            </div>

            <div id="privacy-9">
              <h2 className="text-xl font-bold text-white mb-3">
                9. Perubahan Kebijakan
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Kami dapat memperbarui kebijakan privasi ini dari waktu ke
                waktu. Kami akan memberitahu Anda tentang perubahan
                signifikan melalui email atau notifikasi di platform.
                Kebijakan yang diperbarui akan berlaku sejak tanggal
                publikasi di halaman ini.
              </p>
            </div>

            <div id="privacy-10">
              <h2 className="text-xl font-bold text-white mb-3">
                10. Kontak
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini,
                silakan hubungi kami melalui{" "}
                <Link
                  href="/contact"
                  className="text-purple-400 hover:text-purple-300 underline"
                >
                  halaman kontak
                </Link>{" "}
                atau email ke{" "}
                <span className="text-purple-400">privacy@mylearning.id</span>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
