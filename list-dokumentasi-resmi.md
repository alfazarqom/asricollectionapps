# Daftar Dokumentasi Resmi — Source of Truth

Dokumen ini adalah indeks sumber resmi untuk pengembangan, audit, pengujian, dan pemeliharaan backend Asri Collection yang menggunakan Supabase dan Duitku POP.

- **Status:** Referensi dokumentasi
- **Terakhir ditinjau:** 22 Oktober 2026
- **Tujuan:** Menetapkan sumber primer untuk kontrak API, keamanan, konfigurasi, dan pengujian.
- **Catatan:** Tautan dokumentasi dapat berubah. Verifikasi isi halaman resmi sebelum implementasi atau rilis. Daftar ini tidak membuktikan bahwa kode saat ini sudah sesuai.

---

## 1. Aturan Source of Truth

Gunakan sumber dengan urutan prioritas berikut:

1. **Dokumentasi resmi produk dan API yang benar-benar digunakan** untuk kontrak endpoint, parameter, autentikasi, signature, callback, kode status, dan perilaku retry.
2. **Konfigurasi dan ketentuan merchant resmi** yang berlaku untuk akun serta environment (Sandbox atau Production).
3. **Dokumentasi resmi Supabase** untuk perilaku Edge Functions, database, RLS, grants, secrets, autentikasi, dan tooling.
4. Jika terdapat konflik, ketidakjelasan, atau contoh dokumentasi yang tampak berbeda, catat sebagai temuan dan minta klarifikasi dari penyedia. Jangan menebak atau mengganti kontrak secara diam-diam.
5. Blog, forum, contoh pihak ketiga, dan kode lama hanya boleh menjadi bahan tambahan, bukan sumber utama untuk menetapkan kontrak keamanan atau pembayaran.

Sebelum rilis, periksa kembali dokumentasi yang berlaku. Jangan menganggap nilai contoh, endpoint Sandbox, daftar IP, atau perilaku provider akan selalu sama.

---

## 2. Supabase — Dokumentasi Resmi

### 2.1 Edge Functions

| Topik | URL resmi | Kegunaan |
|---|---|---|
| Edge Functions — panduan utama | https://supabase.com/docs/guides/functions | Arsitektur, pengembangan, dan pengoperasian Edge Functions |
| Quickstart Edge Functions | https://supabase.com/docs/guides/functions/quickstart | Memulai fungsi dan alur kerja dasar |
| Environment variables dan secrets | https://supabase.com/docs/guides/functions/secrets | Konfigurasi rahasia untuk lokal dan proyek jarak jauh |
| Securing Edge Functions | https://supabase.com/docs/guides/functions/auth | Autentikasi dan pengamanan fungsi |
| Function configuration | https://supabase.com/docs/guides/functions/function-configuration | Konfigurasi fungsi, termasuk validasi JWT |
| Unit testing Edge Functions | https://supabase.com/docs/guides/functions/unit-test | Strategi dan fasilitas pengujian fungsi |
| Supabase CLI reference | https://supabase.com/docs/reference/cli/introduction | Perintah CLI untuk pengembangan dan administrasi |

### 2.2 Database dan akses

| Topik | URL resmi | Kegunaan |
|---|---|---|
| Row Level Security (RLS) | https://supabase.com/docs/guides/database/postgres/row-level-security | Policies dan kontrol akses baris |
| Database — panduan utama | https://supabase.com/docs/guides/database/overview | Konsep dan operasi database Supabase |
| Database testing | https://supabase.com/docs/guides/database/testing | Pengujian database dan kebijakan akses |

**Penerapan pada proyek:** evaluasi RLS bersama SQL grants; tetapkan akses per tabel dan operasi; uji akses yang diizinkan maupun ditolak. Jika Edge Function memakai secret/service-role key, gunakan hanya di sisi server dan lakukan otorisasi secara eksplisit.

---

## 3. Duitku — Dokumentasi Resmi

### 3.1 POP

| Topik | URL resmi | Kegunaan |
|---|---|---|
| Duitku POP — dokumentasi Bahasa Indonesia | https://docs.duitku.com/pop/id/ | Referensi utama integrasi POP, Create Invoice, request, callback, dan redirect |
| Duitku POP — dokumentasi Bahasa Inggris | https://docs.duitku.com/pop/en/ | Referensi POP berbahasa Inggris; gunakan untuk pembanding bila diperlukan |
| Metode pembayaran POP | https://docs.duitku.com/pop/id/#payment-method | Kode dan pilihan metode pembayaran yang didokumentasikan |
| FAQ resmi Duitku | https://www.duitku.com/frequently-asked-questions/ | Informasi resmi tambahan terkait layanan Duitku |
| Demo POP Sandbox | https://api-sandbox.duitku.com/demoduitku/ | Demo untuk eksplorasi alur Sandbox; bukan pengganti API Reference |

Gunakan halaman POP sebagai sumber utama untuk:
- Endpoint Sandbox dan Production.
- Header request, timestamp, dan formula signature Create Invoice.
- Parameter wajib/opsional dan format nominal.
- Respons Create Invoice dan payment URL.
- Format callback, field yang diterima, formula signature, kode hasil, dan respons HTTP.
- Return URL/redirect dan batas penggunaannya.
- Perilaku callback retry serta prosedur pengecekan transaksi yang didukung.

Jangan menggunakan signature lama atau contoh dari produk Duitku lain tanpa konfirmasi bahwa kontrak tersebut memang berlaku untuk POP yang digunakan.

### 3.2 Duitku API

| Topik | URL resmi | Kegunaan |
|---|---|---|
| Duitku API Reference | https://docs.duitku.com/api/id/ | Dokumentasi produk API Duitku |

**Peringatan:** Duitku POP dan Duitku API dapat memiliki alur, endpoint, parameter, dan mekanisme autentikasi yang berbeda. Jangan menganggap kontrak pada API Reference berlaku pada POP atau sebaliknya. Gunakan dokumen yang sesuai dengan produk yang diaktifkan untuk akun merchant.

---

## 4. Cara menggunakan daftar ini saat audit atau implementasi

Untuk setiap requirement teknis:

1. Catat requirement dan komponen yang terdampak.
2. Cantumkan URL resmi spesifik yang mendukung requirement.
3. Catat bagian/heading dokumentasi yang relevan serta tanggal pemeriksaan.
4. Bedakan **ketentuan resmi**, **keputusan desain proyek**, dan **rekomendasi internal**.
5. Buat acceptance criteria yang bisa diuji, termasuk kasus gagal dan input tidak valid.
6. Jika kontrak tidak jelas, buat pertanyaan untuk penyedia dan tahan perubahan yang bergantung pada jawaban tersebut.
7. Setelah implementasi, simpan bukti pengujian tanpa membocorkan secrets, signature rahasia, token, atau data pribadi.

### Template pencatatan bukti

| Field | Isi |
|---|---|
| Requirement | Requirement yang diperiksa |
| Sumber resmi | URL langsung |
| Bagian dokumentasi | Heading/parameter/ketentuan |
| Tanggal diperiksa | YYYY-MM-DD |
| Status | Belum diperiksa / Sesuai / Perlu klarifikasi / Tidak sesuai |
| Bukti | Test, log aman, atau hasil audit |
| Tindak lanjut | Perubahan atau pertanyaan yang dibutuhkan |

---

## 5. Batasan dan keamanan

- Dokumen ini adalah indeks sumber, bukan sertifikasi kepatuhan.
- Jangan menyalin kredensial merchant, API key, secret key, token, atau nilai rahasia ke repository.
- Jangan melakukan transaksi Production untuk pengujian.
- Jangan mengubah database, secrets, atau deployment hanya karena suatu halaman dokumentasi berubah; lakukan audit dampak dan ikuti prosedur persetujuan proyek.
- Jika dokumentasi resmi tidak menjawab kasus penting, mintalah konfirmasi tertulis kepada Supabase atau Duitku sesuai konteksnya.
