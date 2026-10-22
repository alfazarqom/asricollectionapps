Asri Collection — Backend API

Backend untuk aplikasi e-commerce Asri Collection, dibangun menggunakan Supabase dan Duitku POP sebagai payment gateway. Repository ini menangani autentikasi, pengelolaan data toko, pembuatan transaksi pembayaran, serta verifikasi status pembayaran melalui backend.

Status: Development / Sandbox
Backend: Supabase
Database: PostgreSQL
Serverless Functions: Supabase Edge Functions
Payment Gateway: Duitku POP
Bahasa: TypeScript
Frontend: React + Vite (repository terpisah)

Daftar Isi

Tentang Proyek

Arsitektur

Teknologi

Fitur

Struktur Repository

Persyaratan

Instalasi

Konfigurasi Environment

Konfigurasi Supabase

Integrasi Duitku POP

Alur Pembayaran

Database dan Keamanan

Pengujian

Deployment

Troubleshooting

Dokumentasi Resmi

Checklist Implementasi

Lisensi

Tentang Proyek

Asri Collection Backend adalah layanan backend untuk mendukung operasional toko pakaian online Asri Collection.

Backend bertanggung jawab atas proses yang tidak boleh dipercayakan sepenuhnya kepada frontend, terutama validasi harga, pembuatan pesanan, integrasi Duitku POP, dan verifikasi pembayaran.

Tujuan

Menyediakan backend terpusat untuk aplikasi e-commerce.

Menyimpan data produk, pesanan, dan pembayaran secara terstruktur.

Mengintegrasikan Duitku POP menggunakan environment Sandbox.

Menjaga kredensial pembayaran agar tidak terekspos kepada pengguna.

Memverifikasi pembayaran melalui mekanisme callback dan pemeriksaan status transaksi yang sesuai dengan dokumentasi Duitku.

Menyediakan API yang dapat digunakan oleh frontend React + Vite.

Arsitektur

Frontend dan backend dikelola dalam repository terpisah.

asri-collection/
│
├── asricollectionapps/       # Frontend React + Vite
│
└── asri-collection-backend/  # Backend Supabase
    ├── supabase/
    ├── README.md
    └── ...

Diagram Arsitektur

┌────────────────────────────┐
│ React + Vite Frontend      │
│ TypeScript                 │
└─────────────┬──────────────┘
              │ HTTPS
              ▼
┌────────────────────────────┐
│ Supabase Edge Functions    │
│                            │
│ - Validasi request         │
│ - Validasi harga           │
│ - Pembuatan pesanan        │
│ - Integrasi Duitku         │
│ - Verifikasi pembayaran    │
└─────────────┬──────────────┘
              │
       ┌──────┴─────────┐
       ▼                ▼
┌───────────────┐  ┌────────────────┐
│ Supabase      │  │ Duitku POP     │
│ PostgreSQL    │  │ Sandbox API    │
│               │  │                │
│ Orders        │  │ Payment URL    │
│ Products      │  │ Transactions   │
│ Payments      │  │ Callbacks      │
└───────────────┘  └────────────────┘

Prinsip Arsitektur

Frontend tidak menyimpan merchant key Duitku.

Frontend tidak menentukan harga akhir pesanan secara otoritatif.

Backend menghitung total pesanan berdasarkan data produk yang tersimpan di database.

Permintaan pembuatan pembayaran dilakukan melalui Edge Function.

Status pembayaran ditetapkan berdasarkan hasil verifikasi server-side yang valid.

Data sensitif disimpan menggunakan Supabase Secrets.

Database dilindungi dengan Row Level Security (RLS) sesuai kebutuhan akses.

Teknologi

Teknologi

Fungsi

Supabase

Backend platform

PostgreSQL

Database

Supabase Edge Functions

API serverless

TypeScript

Bahasa pemrograman backend

Deno

Runtime Edge Functions

Duitku POP

Payment gateway

GitHub

Version control

Supabase CLI

Pengembangan dan deployment

Fitur

Fitur Utama

Konfigurasi proyek Supabase.

Database produk dan kategori.

Database pesanan dan item pesanan.

Database transaksi pembayaran.

Integrasi autentikasi pengguna.

Validasi harga dan stok di backend.

Pembuatan transaksi Duitku POP Sandbox.

Pengembalian informasi pembayaran kepada frontend.

Endpoint callback atau webhook pembayaran.

Validasi tanda tangan callback sesuai dokumentasi Duitku.

Pembaruan status pembayaran secara aman.

Pencegahan pemrosesan callback berulang.

Logging dan penanganan error.

Pengujian integrasi Sandbox.

Checklist ini merupakan target implementasi. Centang setiap fitur setelah kode, konfigurasi, dan pengujiannya benar-benar tersedia di repository.

Struktur Repository

Struktur berikut merupakan rancangan yang disarankan dan dapat disesuaikan dengan implementasi aktual.

asri-collection-backend/
│
├── README.md
├── .gitignore
├── .env.example
├── deno.json
│
├── docs/
│   ├── architecture.md
│   ├── api-contract.md
│   ├── database-schema.md
│   ├── duitku-integration.md
│   ├── security.md
│   ├── testing.md
│   └── deployment.md
│
├── supabase/
│   ├── config.toml
│   │
│   ├── migrations/
│   │   ├── 0001_create_products.sql
│   │   ├── 0002_create_orders.sql
│   │   ├── 0003_create_order_items.sql
│   │   ├── 0004_create_payments.sql
│   │   └── 0005_configure_rls.sql
│   │
│   ├── functions/
│   │   ├── create-payment/
│   │   │   └── index.ts
│   │   │
│   │   ├── duitku-callback/
│   │   │   └── index.ts
│   │   │
│   │   └── check-payment/
│   │       └── index.ts
│   │
│   └── seed.sql
│
└── tests/
    ├── payment-validation.test.ts
    ├── callback-validation.test.ts
    └── order-validation.test.ts

Catatan: Nama folder dan file di atas adalah rancangan. Sesuaikan dokumentasi ini dengan file yang benar-benar tersedia. Pisahkan fungsi tambahan hanya jika diperlukan oleh alur bisnis dan dokumentasi resmi Duitku.

Persyaratan

Sebelum memulai, siapkan:

Node.js jika diperlukan oleh tooling proyek.

Deno untuk pengembangan atau pengujian lokal Edge Functions sesuai kebutuhan.

Supabase CLI.

Akun Supabase.

Akun merchant Duitku dengan akses Sandbox.

Git.

Repository frontend React + Vite yang akan menggunakan API backend ini.

Instalasi

1. Clone Repository

git clone <BACKEND_REPOSITORY_URL>
cd asri-collection-backend

Ganti <BACKEND_REPOSITORY_URL> dengan URL repository backend yang sebenarnya.

2. Login Supabase

supabase login

3. Hubungkan Proyek

supabase link --project-ref <SUPABASE_PROJECT_REF>

Gunakan project reference dari dashboard Supabase.

4. Jalankan Supabase Secara Lokal

Jika Docker dan kebutuhan lokal lainnya telah tersedia:

supabase start

5. Terapkan Database Migration

supabase db push

Periksa migration sebelum menerapkannya ke proyek yang berisi data penting. Gunakan backup dan prosedur migrasi yang sesuai untuk lingkungan produksi.

6. Jalankan Edge Functions Secara Lokal

Contoh untuk fungsi pembuatan pembayaran:

supabase functions serve create-payment --env-file .env

Ulangi untuk fungsi lain jika diperlukan. Pastikan .env tidak pernah dimasukkan ke Git.

Konfigurasi Environment

Supabase Secrets

Simpan kredensial Duitku sebagai secrets pada proyek Supabase.

Nama variabel yang direkomendasikan:

Variable

Fungsi

DUITKU_MERCHANT_CODE

Identitas merchant Duitku

DUITKU_API_KEY

Merchant API key / kredensial server Duitku sesuai dokumentasi

DUITKU_ENV

Penanda environment, misalnya sandbox

DUITKU_CALLBACK_URL

URL callback publik yang diarahkan ke backend

DUITKU_RETURN_URL

URL halaman frontend setelah pengguna kembali dari pembayaran

Sesuaikan nama variabel dan pemetaan kredensial dengan implementasi kode serta dokumentasi Duitku yang digunakan.

SUPABASE_URL dan SUPABASE_ANON_KEY dapat digunakan pada frontend untuk mengakses layanan Supabase sesuai kebijakan RLS. Jangan menaruh DUITKU_API_KEY atau service_role key di frontend.

Menyimpan Secrets

supabase secrets set DUITKU_MERCHANT_CODE=<MERCHANT_CODE>
supabase secrets set DUITKU_API_KEY=<DUITKU_API_KEY>
supabase secrets set DUITKU_ENV=sandbox
supabase secrets set DUITKU_CALLBACK_URL=<PUBLIC_CALLBACK_URL>
supabase secrets set DUITKU_RETURN_URL=<FRONTEND_RETURN_URL>

Ganti nilai placeholder dengan nilai yang sesuai. Jangan menuliskan kredensial asli ke dokumentasi, commit, log, atau issue publik.

Periksa daftar secrets sesuai kemampuan CLI yang digunakan:

supabase secrets list

Daftar secrets dapat menampilkan nama variabel, bukan berarti nilai rahasianya harus dibagikan.

File .env.example

# Template dokumentasi saja; jangan isi dengan kredensial asli.
DUITKU_MERCHANT_CODE=
DUITKU_API_KEY=
DUITKU_ENV=sandbox
DUITKU_CALLBACK_URL=
DUITKU_RETURN_URL=

Untuk pengembangan lokal, Edge Functions secara default membaca secrets dari supabase/functions/.env. Buat file lokal tersebut dan tambahkan ke .gitignore; jangan mengandalkan .env.example sebagai sumber nilai runtime. Jika menggunakan file lain, berikan path secara eksplisit melalui --env-file. Untuk proyek jarak jauh, gunakan Supabase Secrets atau Dashboard. Jangan pernah commit nilai rahasia. Referensi: https://supabase.com/docs/guides/functions/secrets

Integrasi Duitku POP

Duitku POP menyediakan alur pembayaran melalui halaman pembayaran Duitku. Backend harus mengikuti kontrak POP yang berlaku untuk akun merchant dan environment yang digunakan.

Konfigurasi Environment

Untuk pengujian gunakan Sandbox. Jangan mencampur endpoint, kredensial, atau transaksi Sandbox dengan Production. Endpoint Create Invoice yang tercantum pada dokumentasi POP saat revisi dokumen ini:
- Sandbox: https://api-sandbox.duitku.com/api/merchant/createInvoice
- Production: https://api-prod.duitku.com/api/merchant/createInvoice

Kontrak Create Invoice — acuan dokumentasi POP

- Method: HTTP POST.
- Content-Type: application/json.
- Header wajib yang didokumentasikan: x-duitku-timestamp, x-duitku-signature, dan x-duitku-merchantcode.
- Timestamp: Unix epoch dalam milidetik.
- Formula signature header:
  stringToSign = merchantCode + timestamp
  signature = HMAC_SHA256(stringToSign, apiKey)
- Kirim API key hanya dari backend; jangan pernah mengembalikannya ke frontend.
- Gunakan respons provider yang valid untuk menyimpan reference dan mengembalikan paymentUrl jika tersedia.
- Jangan mengikuti contoh kode lama yang menonaktifkan verifikasi sertifikat TLS. Verifikasi TLS harus tetap aktif.
- Pastikan paymentAmount sesuai total itemDetails menurut kontrak Duitku, merchantOrderId unik untuk setiap transaksi baru, serta format mata uang/nominal sesuai dokumentasi yang berlaku.

Formula di atas adalah acuan dokumentasi POP saat revisi ini ditulis; sebelum rilis atau jika ada ketidaksesuaian, verifikasi kembali halaman resmi dan konfirmasi ke Duitku. Jangan mengasumsikan format dari produk API Duitku lain berlaku untuk POP.

Tanggung Jawab Backend

Menerima permintaan pembuatan pesanan dari frontend.

Memvalidasi pengguna, item produk, kuantitas, harga, dan total pesanan.

Menyimpan pesanan dengan status awal yang sesuai.

Membentuk request pembayaran sesuai dokumentasi Duitku.

Menghitung signature di server jika diwajibkan oleh API.

Mengirim request ke endpoint Sandbox.

Menyimpan referensi transaksi dan data pembayaran yang diperlukan.

Mengembalikan URL pembayaran kepada frontend jika respons Duitku menyediakannya.

Memverifikasi callback atau melakukan pemeriksaan status transaksi sesuai prosedur resmi.

Memperbarui status pesanan secara konsisten.

Batas Keamanan

Jangan membuat request pembayaran langsung dari frontend menggunakan merchant API key.

Jangan mempercayai nilai amount, status, atau payment_method yang dikirim browser sebagai bukti pembayaran.

Jangan menandai pesanan sebagai berhasil hanya karena pengguna kembali ke halaman sukses.

Alur Pembayaran

1. Pengguna memilih produk
          |
          v
2. Frontend mengirim permintaan checkout
          |
          v
3. Edge Function memvalidasi request
          |
          v
4. Backend menghitung total dari database
          |
          v
5. Backend membuat pesanan
          |
          v
6. Backend mengirim request ke Duitku Sandbox
          |
          v
7. Backend menyimpan referensi transaksi
          |
          v
8. Frontend menerima URL pembayaran
          |
          v
9. Pengguna menyelesaikan proses pembayaran
          |
          v
10. Duitku mengirim callback ke backend
          |
          v
11. Backend memvalidasi callback
          |
          v
12. Status pembayaran dan pesanan diperbarui

Status Pesanan

Gunakan status yang eksplisit dan konsisten, misalnya:

pending

paid

failed

expired

cancelled

Sesuaikan status tersebut dengan status resmi Duitku dan kebutuhan bisnis. Jangan menganggap seluruh status provider dapat dipetakan secara langsung tanpa aturan.

Callback harus diproses secara idempoten agar pengiriman notifikasi berulang tidak menyebabkan pembayaran diproses dua kali.

Database dan Keamanan

Tabel yang Disarankan

Tabel

Kegunaan

products

Data produk dan harga

categories

Kategori produk

orders

Informasi pesanan

order_items

Rincian produk dalam pesanan

payments

Referensi transaksi dan status pembayaran

profiles

Data profil pengguna jika diperlukan

Prinsip Database

Gunakan primary key dan foreign key yang sesuai.

Simpan jumlah uang sebagai integer dalam satuan terkecil yang digunakan sistem pembayaran, atau tipe numerik yang tepat; tetapkan satuan secara konsisten.

Validasi jumlah barang dan ketersediaan stok.

Simpan referensi pesanan dan transaksi provider.

Gunakan timestamp untuk pencatatan perubahan.

Terapkan batasan database untuk menjaga integritas data.

Hindari menyimpan data sensitif yang tidak diperlukan.

Row Level Security (RLS), Grants, dan Akses Edge Functions

Aktifkan RLS pada setiap tabel di schema yang terekspos melalui Supabase API. RLS dan SQL grants adalah dua lapisan berbeda: grants menentukan apakah role boleh menjalankan operasi pada tabel, sedangkan policies menentukan baris mana yang dapat diakses. Tinjau keduanya; jangan menganggap RLS otomatis menghapus grants yang terlalu luas.

Kebijakan minimum yang harus dirancang dan diuji:
- Pengguna hanya dapat membaca pesanan dan item pesanan miliknya.
- Pengguna tidak dapat mengubah status pembayaran atau harga resmi secara langsung.
- Data produk publik hanya dapat dibaca sejauh memang ditujukan untuk publik.
- Operasi administratif dibatasi pada identitas/role tepercaya yang diverifikasi server-side.
- Callback pembayaran mengakses operasi backend yang diperlukan dan tidak memberi akses publik langsung ke tabel sensitif.
- Untuk UPDATE, policy harus membatasi baris yang boleh diubah dan memeriksa nilai baru; jangan hanya mengandalkan role authenticated.
- Periksa view, RPC, trigger, dan fungsi SQL yang mungkin memiliki privilege lebih tinggi atau melewati RLS.

Untuk setiap tabel exposed, dokumentasikan grants dan policies per operasi (SELECT, INSERT, UPDATE, DELETE), lalu uji akses yang seharusnya diizinkan dan ditolak bagi anon dan authenticated. Gunakan supabase test db bila sesuai dan simpan tes di repository.

Jika Edge Function memakai service_role/secret key, batasi di server dan lakukan otorisasi secara eksplisit. Kunci tersebut dapat melewati RLS. Jangan pernah memasukkannya ke frontend atau log.

Tentukan kebijakan autentikasi per fungsi:
- Fungsi yang dipanggil pengguna harus memvalidasi JWT dan otorisasi yang relevan sesuai kebutuhan aplikasi.
- Callback provider yang harus menerima request server-to-server mungkin perlu dikonfigurasi tanpa verifikasi JWT gateway, tetapi wajib memverifikasi signature callback dan transaksi di dalam handler.
- Jangan menonaktifkan verify_jwt secara global atau untuk semua fungsi tanpa alasan. Konfigurasi publik tidak menggantikan verifikasi signature, validasi input, rate limiting yang sesuai, dan logging aman.

Referensi: https://supabase.com/docs/guides/database/postgres/row-level-security dan https://supabase.com/docs/guides/functions/function-configuration.

Verifikasi Callback

Callback Duitku POP adalah notifikasi server-to-server. Implementasi harus mengikuti format payload yang ditentukan dokumentasi POP; dokumentasi POP mendeskripsikan callback HTTP POST dengan data application/x-www-form-urlencoded. Jangan mengasumsikan payload callback berupa JSON.

Callback harus:
1. Memvalidasi content type, field wajib, tipe, panjang, dan format nilai.
2. Memverifikasi signature dengan metode resmi POP. Dokumentasi POP saat revisi ini mencantumkan:
   stringToSign = merchantCode + amount + merchantOrderId
   signature = HMAC_SHA256(stringToSign, apiKey)
   Gunakan nama field, encoding, key, dan perbandingan signature tepat seperti dokumentasi merchant yang berlaku. Jangan gunakan signature MD5 lama.
3. Mencocokkan merchantCode, merchantOrderId, amount, dan reference/provider transaction reference dengan catatan transaksi yang tersimpan.
4. Mengevaluasi resultCode dan aturan pemetaan status provider; jangan menyimpulkan sukses dari keberadaan callback saja.
5. Menolak callback dengan signature tidak valid, nominal berbeda, merchant/referensi tidak cocok, atau transisi status yang tidak diizinkan.
6. Memproses pembaruan status dalam transaksi database yang aman dan idempoten.
7. Mengembalikan respons sesuai protokol callback. Duitku menyatakan callback perlu mendapat HTTP 200 OK dan dapat dicoba ulang jika respons 200 tidak diterima; dokumentasi menyebut maksimum lima upaya sebelum pemberitahuan callback gagal. Perilaku untuk callback invalid atau kegagalan database harus ditentukan agar tidak mengakui sukses sebelum perubahan penting tersimpan.
8. Menulis log operasional secukupnya tanpa API key, signature rahasia, token, atau data pribadi yang tidak diperlukan.

Jangan melakukan side effect berulang pada callback duplikat. Gunakan constraint unik dan/atau mekanisme idempotensi di database, kunci transaksi yang konsisten, serta aturan transisi status yang eksplisit. Jika proses gagal sebelum perubahan status tersimpan, jangan mengembalikan respons sukses seolah transaksi sudah diproses.

Jika dibutuhkan untuk menyelesaikan keadaan yang ambigu, gunakan mekanisme pemeriksaan status server-to-server resmi Duitku. Return URL, query parameter browser, dan JavaScript callback bukan sumber kebenaran status pembayaran.

Catatan: Formula dan perilaku callback di atas harus diverifikasi ulang terhadap halaman POP dan konfigurasi merchant yang aktif sebelum rilis. Jika dokumentasi resmi tidak konsisten atau tidak menjelaskan kasus tertentu, minta konfirmasi tertulis Duitku alih-alih menebak.

API Contract

Endpoint berikut merupakan rancangan kontrak API. Sesuaikan nama fungsi, method, payload, dan respons dengan implementasi aktual.

Endpoint

Method

Tujuan

/functions/v1/create-payment

POST

Membuat pesanan atau transaksi pembayaran

/functions/v1/duitku-callback

POST

Menerima notifikasi pembayaran

/functions/v1/check-payment

POST

Memeriksa status transaksi

Contoh Request create-payment

{
  "items": [
    {
      "product_id": "PRODUCT_UUID",
      "quantity": 2
    }
  ],
  "customer": {
    "name": "Nama Pelanggan",
    "email": "pelanggan@example.com",
    "phone": "08xxxxxxxxxx"
  }
}

Payload ini adalah ilustrasi. Backend harus mengambil harga dan informasi produk yang valid dari database, bukan mempercayai harga yang dikirim klien.

Contoh Respons

{
  "success": true,
  "order_id": "ORDER_UUID",
  "payment_url": "PAYMENT_URL_FROM_PROVIDER"
}

Respons tersebut hanya contoh format kontrak. Nama field, nilai, dan penanganan error harus disesuaikan dengan hasil implementasi.

Jangan mengembalikan merchant API key, signature rahasia, atau kredensial internal kepada frontend.

Pengujian

Pengujian Lokal

Jalankan pemeriksaan dan pengujian sesuai toolchain yang digunakan.

Contoh:

supabase start
supabase functions serve create-payment --env-file .env

Checklist Pengujian dan Acceptance Criteria

Jalankan pengujian lokal dan Sandbox dengan data non-produksi. Setiap butir dinyatakan lulus hanya jika ada bukti test/log yang aman atau hasil verifikasi yang dapat diulang.

Checkout dan Create Invoice:
- Checkout valid menghasilkan pesanan/transaksi yang konsisten.
- Produk tidak ditemukan, tidak tersedia, atau kuantitas nol/negatif ditolak.
- Harga/total yang dimanipulasi di frontend diabaikan; total dihitung dari database.
- merchantOrderId unik untuk transaksi baru dan request ulang tidak membuat pesanan ganda tanpa sengaja.
- paymentAmount sama dengan total itemDetails menurut kontrak POP.
- Timestamp, header, endpoint, dan signature request sesuai dokumentasi POP.
- Respons provider gagal, timeout, atau tidak valid tidak membuat status paid.

Callback:
- Callback dengan content type/payload valid diparse sesuai format provider.
- Signature valid diterima; signature salah/kosong ditolak.
- Merchant code, merchantOrderId, amount, reference, dan resultCode diverifikasi.
- Nominal berbeda, transaksi tidak dikenal, dan transisi status tidak sah tidak mengubah pesanan menjadi paid.
- Callback duplikat tidak menggandakan efek samping atau mengurangi stok lebih dari sekali.
- Kegagalan database tidak dikembalikan sebagai sukses yang menyesatkan.
- Respons HTTP callback mengikuti kontrak POP; jalur sukses yang telah diproses mengembalikan HTTP 200 OK.
- Redirect/return URL dan JavaScript frontend tidak dapat mengubah status pembayaran.

Supabase dan keamanan:
- Grants dan RLS diuji bersama untuk operasi yang diizinkan dan ditolak.
- Pengguna A tidak dapat membaca/mengubah pesanan pengguna B.
- Pengguna tidak dapat mengubah harga atau status pembayaran melalui API publik.
- Autentikasi dan otorisasi diperiksa per Edge Function.
- Secrets, signature rahasia, token, dan data pelanggan tidak muncul di log atau respons error.
- Kegagalan provider/database dan request invalid menghasilkan error yang aman serta tidak meninggalkan status transaksi yang tidak konsisten.

End-to-end:
- Alur Sandbox dari checkout, Create Invoice, redirect paymentUrl, callback, hingga pembacaan status backend diuji.
- Bukti pengujian tidak memuat kredensial atau data pribadi yang tidak perlu.
- Jangan menggunakan kredensial atau transaksi Production untuk pengujian.

Pengujian unit dan integrasi Edge Functions dapat menggunakan panduan resmi: https://supabase.com/docs/guides/functions/unit-test.

Deployment

1. Siapkan Proyek Supabase

Buat proyek melalui Supabase Dashboard.

2. Konfigurasikan Secrets

Masukkan seluruh kredensial dan URL yang diperlukan melalui Supabase Secrets.

3. Terapkan Migration

supabase link --project-ref <SUPABASE_PROJECT_REF>
supabase db push

4. Deploy Edge Functions

supabase functions deploy create-payment
supabase functions deploy duitku-callback
supabase functions deploy check-payment

Pastikan nama fungsi sesuai dengan direktori yang tersedia.

Periksa konfigurasi autentikasi setiap fungsi. Fungsi callback publik mungkin perlu menerima request dari Duitku tanpa JWT pengguna, tetapi wajib melakukan validasi signature dan pemeriksaan transaksi secara server-side. Jangan menonaktifkan autentikasi untuk seluruh fungsi tanpa alasan yang jelas.

5. Konfigurasikan URL Callback

Gunakan URL publik Edge Function yang sesuai dengan nama fungsi yang telah di-deploy.

Contoh pola URL:

https://<SUPABASE_PROJECT_REF>.supabase.co/functions/v1/duitku-callback

Daftarkan URL tersebut sesuai mekanisme konfigurasi callback pada akun merchant Duitku. Pastikan endpoint dapat diakses oleh sistem Duitku dan menerapkan verifikasi yang benar.

6. Integrasikan Frontend

Frontend React + Vite memanggil Edge Function menggunakan URL proyek Supabase.

Contoh variabel frontend:

VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

Variabel berawalan VITE_ dapat terekspos dalam bundle frontend. Jangan pernah memasukkan merchant API key Duitku atau Supabase service_role key ke variabel tersebut.

7. Verifikasi Deployment

Periksa log Edge Functions.

Jalankan checkout Sandbox.

Pastikan URL pembayaran dapat dibuka.

Periksa callback yang masuk.

Cocokkan status transaksi dengan dashboard atau mekanisme verifikasi resmi Duitku.

Uji penanganan error dan callback duplikat.

Troubleshooting

Masalah

Pemeriksaan

Secret tidak terbaca

Periksa nama variabel, konfigurasi environment, dan deployment

Pembuatan pembayaran gagal

Periksa payload, kredensial Sandbox, endpoint, dan respons Duitku

Signature tidak valid

Periksa rumus, urutan parameter, encoding, dan tipe data sesuai dokumentasi

Callback tidak diterima

Periksa URL publik, konfigurasi merchant, dan log fungsi

Status pembayaran tidak berubah

Periksa validasi callback, pemetaan status, dan operasi database

Frontend mendapatkan 401

Periksa JWT, konfigurasi autentikasi fungsi, dan header request

Frontend mendapatkan 403

Periksa otorisasi pengguna dan kebijakan RLS

Pesanan ganda

Periksa idempotensi checkout dan penanganan request berulang

Jangan menampilkan API key, token, signature rahasia, atau data pribadi pelanggan ketika membagikan log error untuk keperluan debugging.

Dokumentasi Resmi dan Source of Truth

Supabase:
- Edge Functions: https://supabase.com/docs/guides/functions
- Quickstart Edge Functions: https://supabase.com/docs/guides/functions/quickstart
- Environment variables dan secrets: https://supabase.com/docs/guides/functions/secrets
- Securing Edge Functions / autentikasi: https://supabase.com/docs/guides/functions/auth
- Function configuration (termasuk verify_jwt): https://supabase.com/docs/guides/functions/function-configuration
- Row Level Security, grants, dan policies: https://supabase.com/docs/guides/database/postgres/row-level-security
- Unit testing Edge Functions: https://supabase.com/docs/guides/functions/unit-test
- Supabase CLI: https://supabase.com/docs/reference/cli/introduction

Duitku:
- POP API Reference (Indonesia): https://docs.duitku.com/pop/id/
- API Reference: https://docs.duitku.com/api/id/
- FAQ resmi: https://www.duitku.com/frequently-asked-questions/
- Demo POP Sandbox: https://api-sandbox.duitku.com/demoduitku/

Source of truth untuk integrasi Duitku adalah dokumentasi POP yang berlaku untuk akun merchant dan environment yang dipakai. Jangan menggunakan contoh dari produk Duitku lain, dokumentasi lama, blog pihak ketiga, atau signature MD5 yang sudah obsolete sebagai pengganti kontrak POP saat ini.

Sebelum mengubah kode, periksa ulang halaman resmi karena endpoint, parameter, metode autentikasi, dan perilaku provider dapat berubah. Jika dokumentasi resmi dan implementasi yang ada tampak berbeda, catat perbedaannya dan konfirmasi ke Duitku sebelum menebak atau mengubah kontrak.

Checklist Implementasi

Backend

Proyek Supabase tersedia.

Migration database tersedia dan dapat dijalankan.

RLS aktif dan telah diuji.

Edge Functions selesai diimplementasikan.

Validasi checkout dilakukan di server.

Secrets telah dikonfigurasi.

Integrasi Duitku POP Sandbox berhasil.

Callback diverifikasi.

Pembaruan status transaksi aman dan idempoten.

Pengujian otomatis dan manual telah dilakukan.

Integrasi Frontend

Frontend menggunakan URL dan kunci publik Supabase yang benar.

Frontend mengirim request sesuai kontrak API.

URL pembayaran ditangani dengan benar.

Halaman kembali dari pembayaran tidak menjadi sumber kebenaran status.

Status pesanan diperoleh dari backend.

Tidak ada kredensial server dalam bundle frontend.

Kesiapan Produksi

Kredensial Production terpisah dari Sandbox.

URL callback Production telah dikonfigurasi.

Verifikasi pembayaran diuji kembali di environment Production yang sesuai.

Logging tidak membocorkan data sensitif.

Backup, monitoring, dan penanganan kegagalan telah disiapkan.

Kebijakan keamanan dan akses database telah ditinjau.

Lisensi

Tentukan lisensi proyek sebelum mendistribusikan atau menggunakan ulang kode secara publik.

Jika repository menggunakan kode atau dependensi pihak ketiga, patuhi lisensi masing-masing.

Asri Collection Backend
Supabase + Duitku POP Sandbox

Dokumentasi ini merupakan panduan implementasi. Sesuaikan nama endpoint, variabel environment, struktur database, dan perilaku callback dengan kode aktual serta dokumentasi resmi Duitku yang berlaku.
