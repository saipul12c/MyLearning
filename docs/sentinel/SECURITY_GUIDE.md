# 🛡️ Panduan Keamanan Sentinel Gatekeeper (v1.1.0)

Dokumen ini menjelaskan cara kerja, alur akses, dan pengelolaan sistem keamanan Sentinel pada platform MyLearning.

---

## 1. Sistem Proteksi DDoS (Anti-Flood)
Sentinel menggunakan sistem filtrasi trafik tiga level untuk menjaga stabilitas server:

*   **Low (Soft)**: Mode standar. Hanya melakukan pemantauan trafik tanpa pembatasan agresif.
*   **Medium (Throttle)**: Mengaktifkan *Token Bucket Rate Limiting*. Jika trafik dari satu IP melebihi ambang batas (default 100 req/min), akses akan diperlambat otomatis.
*   **High (Under Attack)**: Mode Siaga Tinggi. 
    *   Pengguna yang belum terverifikasi akan dibatasi sangat ketat (maks. 10 req/min).
    *   Pengguna wajib melakukan verifikasi di `/security-check` untuk mendapatkan akses penuh.

---

## 2. Kontrol Akses Global (Mode Darurat)
Admin dapat mengaktifkan mode darurat melalui Dashboard untuk melindungi integritas data:

*   **Maintenance Mode**: Menampilkan halaman pemeliharaan ke seluruh user publik.
*   **Security Lockdown**: Membatasi akses ke Dashboard hanya untuk Admin atau sesi yang telah terverifikasi.
*   **Auth Kill-Switch**: Mematikan fungsi Login, Registrasi, dan API Auth secara total jika terdeteksi serangan pada modul akun.

---

## 3. Jalur Verifikasi & Bypass (Security Check)
Rute `/security-check` adalah pintu darurat untuk menembus pembatasan Sentinel.

### Aturan Akses Halaman Verifikasi:
Demi keamanan, halaman ini **tidak dapat diakses** dalam kondisi normal. Ia hanya akan terbuka jika:
1.  Website sedang dalam **Maintenance Mode**.
2.  Website sedang dalam **Security Lockdown**.
3.  Proteksi DDoS sedang diatur ke level **High**.
4.  IP Anda sedang **diblokir** oleh sistem (untuk unblock mandiri).
5.  Anda adalah seorang **Admin** yang sudah login.

---

## 4. Alur Keamanan Berlapis (2-Layer Security)
Untuk keamanan maksimal, Sentinel menerapkan alur verifikasi ganda bagi Admin selama kondisi darurat (Maintenance/Lockdown/High DDoS):

1.  **Lapis 1 (Identitas Akun)**: Login menggunakan Email & Password Admin yang valid.
2.  **Lapis 2 (Otoritas Sentinel)**: Verifikasi identitas tambahan menggunakan **Sentinel Access Key** di halaman `/security-check`.

---

## 5. Auto-Lockdown (Threat Intelligence)
Sentinel memantau aktivitas mencurigakan secara otomatis:

*   **Mekanisme**: Jika satu IP gagal login sebanyak **5 kali**, IP tersebut akan diblokir otomatis selama **24 jam**.
*   **Efek**: IP tersebut akan menerima Error 403 Forbidden di seluruh halaman.
*   **Solusi Mandiri**: Admin yang terblokir cukup pergi ke `/security-check`, masukkan kunci Sentinel, dan blokir IP akan dilepas secara instan oleh sistem.

---

## 6. Perilaku Berdasarkan Status Login
Sentinel memperlakukan pengguna secara berbeda tergantung pada peran (role) dan status verifikasi mereka saat kondisi darurat:

### A. Kondisi: Belum Login (Guest)
*   **Maintenance/Lockdown**: Otomatis diarahkan ke halaman `/maintenance`.
*   **DDoS High**: Dibatasi sangat ketat (10 req/min). Harus ke `/security-check` untuk normalisasi trafik.

### B. Kondisi: Sudah Login (User Biasa)
*   **Maintenance**: Tetap diarahkan ke halaman `/maintenance` demi keamanan data.
*   **Lockdown**: Tidak bisa mengakses Dashboard, otomatis dikembalikan ke halaman Beranda.

### C. Kondisi: Sudah Login (Admin)
*   **Verifikasi Wajib**: Jika kondisi darurat aktif, Admin yang baru login akan **otomatis diarahkan** ke `/security-check`.
*   **Akses Penuh**: Setelah melewati verifikasi kunci Sentinel, Admin mendapatkan bypass total terhadap filter Maintenance, Lockdown, dan Rate Limit.

---

## 7. Alur Akses Darurat Khusus Admin (Step-by-Step)
Jika Anda adalah Admin dan perlu masuk ke sistem saat kondisi darurat:

### Skenario A: Masuk dari Kondisi Belum Login
1.  Buka halaman **`/login`**.
2.  Masukkan Email & Password Admin Anda.
3.  Sistem akan mendeteksi status darurat dan mengarahkan Anda ke **`/security-check`**.
4.  Masukkan **Sentinel Access Key** Anda.
5.  Selesai. Anda sekarang dapat mengakses Dashboard dengan aman.

### Skenario B: Sudah Login tapi Sesi Verifikasi Berakhir
1.  Jika Anda sudah berada di Dashboard dan tiba-tiba diarahkan ke `/security-check`.
2.  Masukkan kembali **Sentinel Access Key**.
3.  Sesi verifikasi berlaku selama **30 menit**.

---

## 8. Tips Keamanan untuk Admin
1.  **Rotasi Kunci**: Ganti `SENTINEL_ACCESS_KEY` secara berkala di server.
2.  **IP Whitelist**: Tambahkan IP kantor/rumah ke tabel `sentinel_configs` -> `ip_whitelist` agar tidak pernah terkena blokir otomatis.
3.  **Pantau Log**: Cek tabel `sentinel_logs` untuk melihat pola serangan yang berhasil diredam.

---
*Dokumentasi ini diperbarui secara otomatis untuk mencerminkan logika perlindungan Sentinel terbaru.*
