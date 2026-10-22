# Asri Collection Online Store

Repository aplikasi toko online Asri Collection. Frontend menggunakan React, TypeScript, Vite, dan Tailwind CSS; fungsi backend pembayaran dan katalog diarahkan ke Supabase Edge Functions serta Duitku POP.

> **Status keamanan:** repository ini sedang dalam tahap hardening. Jangan menganggap alur pembayaran, admin, reservasi stok, atau deployment siap produksi sebelum seluruh pemeriksaan pada bagian [Status dan batasan](#status-dan-batasan) selesai. File yang ada di repository tidak membuktikan bahwa versi yang sama sudah terpasang di layanan aktif.

## Teknologi

- React 19, TypeScript, Vite 8
- React Router 7
- Tailwind CSS 4 dan `lucide-react`
- Express untuk server pengembangan lokal (`server.ts`)
- Supabase PostgreSQL dan Edge Functions
- Duitku POP untuk pembuatan invoice dan notifikasi pembayaran
- Bun lockfile: `bun.lock`

Versi dependensi yang tepat mengacu pada `package.json` dan `bun.lock`.

## Struktur penting

```text
.
├── src/
│   ├── components/             # Komponen UI
│   ├── pages/                  # Halaman aplikasi
│   ├── context/                # State aplikasi
│   ├── assets/                 # Aset statis
│   ├── types.ts                # Tipe TypeScript
│   └── main.tsx                # Entry point frontend
├── server.ts                   # Express + Vite dev server; bukan database persisten
├── supabase/
│   ├── config.toml             # Konfigurasi Supabase lokal
│   ├── functions/
│   │   ├── get-products/
│   │   ├── duitku-create-invoice/
│   │   ├── duitku-callback/
│   │   └── get-duitku-payment-status/
│   └── migrations/             # Migration yang tersimpan di repository
├── docs/
│   └── REPO-DB-DRIFT.md        # Catatan perbedaan repository dan Supabase aktif
├── .env.example                # Template environment lokal, tanpa kredensial aktif
├── bun.lock
├── package.json
├── masterprompt.md
└── list-dokumentasi-resmi.md
```

Struktur di atas menyoroti file yang relevan dengan aplikasi dan integrasi pembayaran; bukan inventaris setiap file repository.

## Menjalankan secara lokal

Persyaratan awal: Bun dan versi runtime yang sesuai dengan dependensi proyek.

1. Clone repository dan masuk ke direktori proyek.
2. Pasang dependensi sesuai lockfile:

   ```bash
   bun install --frozen-lockfile
   ```

3. Salin `.env.example` menjadi `.env` lalu isi hanya konfigurasi lokal yang diperlukan. Jangan commit `.env`.
4. Jalankan server pengembangan:

   ```bash
   bun run dev
   ```

5. Jalankan pemeriksaan statis dan build:

   ```bash
   bun run lint
   bun run build
   ```

Script yang tersedia di `package.json` adalah `dev`, `build`, `start`, `preview`, `clean`, dan `lint`. Script `start` saat ini memanggil `node server.ts`; kompatibilitasnya dengan versi Node yang digunakan harus diverifikasi terpisah. Repository belum mendefinisikan script `test` pada `package.json`.

> Perintah di atas adalah instruksi yang tersedia dari konfigurasi repository. Status keberhasilan build/lint harus mengacu pada hasil run nyata, bukan pada keberadaan script saja.

## Konfigurasi environment

### Express lokal

Lihat `.env.example`. Variabel yang relevan:

| Variabel | Tujuan |
|---|---|
| `APP_URL` | Origin publik HTTPS yang digunakan untuk callback/return URL saat memakai invoice sungguhan |
| `DUITKU_ENV` | `sandbox` atau `production` |
| `DUITKU_MERCHANT_CODE` | Merchant code Duitku |
| `DUITKU_API_KEY` | API key Duitku; rahasia |
| `ADMIN_SECRET_PIN` | Secret server-side untuk endpoint admin Express; tidak ada PIN default |
| `GEMINI_API_KEY` | Opsional, untuk integrasi Gemini jika digunakan |

Kredensial jangan ditaruh di kode frontend, repository, log, URL, atau variabel dengan awalan `VITE_`. Jangan gunakan API key produksi untuk pengujian.

### Supabase Edge Functions

Konfigurasi runtime Edge Functions dilakukan melalui Supabase Secrets dan/atau konfigurasi lokal Supabase CLI. Nama variabel yang dipakai kode antara lain:

- `DUITKU_MERCHANT_CODE`
- `DUITKU_API_KEY`
- `DUITKU_ENV`
- `APP_URL`
- `DUITKU_CALLBACK_URL` (opsional)
- `DUITKU_RETURN_URL` (opsional)
- `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` pada runtime server-side Supabase

`SUPABASE_SERVICE_ROLE_KEY` adalah kredensial berhak tinggi. Jangan masukkan ke bundle frontend atau commit ke repository. Konfigurasi secret aktif tidak diubah sebagai bagian dari patch repository ini.

## Alur pembayaran yang dimaksud

1. Frontend mengirim data penerima, pilihan kurir, dan item keranjang.
2. Fungsi `duitku-create-invoice` mengambil harga dari tabel `products`, menghitung total di server, menyimpan data pesanan, lalu meminta invoice Duitku POP.
3. Pelanggan diarahkan ke `paymentUrl` dari respons Duitku.
4. Duitku mengirim HTTP callback ke endpoint publik. Signature callback diverifikasi menggunakan HMAC-SHA256 sesuai dokumentasi POP.
5. Perubahan status pembayaran harus dilakukan melalui RPC database atomik yang terverifikasi. Redirect browser bukan bukti pembayaran.

Signature Create Invoice POP menggunakan HMAC-SHA256 atas `merchantCode + timestamp` dengan API key. Signature callback POP menggunakan HMAC-SHA256 atas `merchantCode + amount + merchantOrderId` dengan key yang sesuai kontrak merchant. Lihat [dokumentasi resmi Duitku](./list-dokumentasi-resmi.md) dan konfirmasi kontrak merchant bila konfigurasi akun berbeda.

## API dan fungsi

### Rewrite Vercel yang tersimpan

`vercel.json` mengarahkan path katalog, invoice, callback, dan status pesanan ke Supabase Edge Functions. Daftar rewrite yang sebenarnya dapat dilihat di [vercel.json](./vercel.json).

### Supabase Edge Functions di repository

| Fungsi | Tanggung jawab |
|---|---|
| `get-products` | Mengambil katalog dari tabel `products` |
| `duitku-create-invoice` | Validasi data pesanan dan meminta invoice POP |
| `duitku-callback` | Memverifikasi notifikasi Duitku dan memanggil RPC atomik |
| `get-duitku-payment-status` | Membaca status pesanan; inquiry provider otomatis dinonaktifkan sampai kontrak rekonsiliasi POP dipastikan |

### Endpoint admin Express

`server.ts` memiliki endpoint admin untuk metrik, daftar pesanan, dan pembaruan pengiriman. Endpoint ini memakai penyimpanan `Map` dalam memori dan tidak terhubung sebagai backend persisten untuk deployment Vercel. Karena itu endpoint tersebut **tidak boleh digunakan sebagai sumber resmi pesanan produksi**. Konfigurasi deployment saat ini belum menyediakan rewrite/serverless route untuk endpoint admin tersebut.

## Database, migration, dan drift

Folder `supabase/migrations/` pada repository saat ini tidak mewakili seluruh riwayat migration yang tercatat pada proyek Supabase aktif saat audit dilakukan. Lihat [docs/REPO-DB-DRIFT.md](./docs/REPO-DB-DRIFT.md).

Jangan menjalankan `supabase db push`, migration manual, atau SQL perubahan schema pada database aktif sebelum perbedaan migration dan schema direkonsiliasi serta mendapat persetujuan terpisah.

## Status dan batasan

Status berikut mengacu pada audit repository dan patch hardening, bukan sertifikasi produksi:

- **Implemented in repository:** validasi konfigurasi invoice, signature POP HMAC untuk create invoice/callback, penolakan invoice simulasi, dan pemeriksaan hasil operasi database yang ditambahkan.
- **Implemented in repository:** callback Express yang menggunakan store in-memory tidak lagi mengonfirmasi pembayaran; endpoint tersebut merespons HTTP 503. Callback kanonis berada pada Edge Function.
- **Implemented in repository:** PIN admin default dan simulator callback aplikasi dihapus; autentikasi admin Express memerlukan secret yang dikonfigurasi server-side.
- **Read-only by design:** endpoint status pesanan tidak mengubah status pembayaran dari hasil inquiry provider. Kontrak endpoint status POP perlu dikonfirmasi sebelum rekonsiliasi otomatis diaktifkan.
- **Not production-ready until resolved:** `server.ts` masih menyimpan pesanan lokal dalam memori; skema stok dan fungsi reservasi perlu direkonsiliasi; penulisan pesanan, item, reservasi, dan invoice belum menjadi satu transaksi database atomik.
- **Not yet verified:** build, lint, pengujian callback, pengujian idempotensi, tes E2E, dan transaksi Duitku Sandbox. Jalankan dan catat hasil aktual sebelum menyatakan PASS.
- **Not changed:** database aktif, migration, Supabase Secrets, Edge Function deployment, konfigurasi deployment aktif, dan branch `main`.

## Dokumentasi source of truth

- [Indeks dokumentasi resmi Supabase dan Duitku](./list-dokumentasi-resmi.md)
- [Master prompt backend](./masterprompt.md)
- [Catatan drift repository/database](./docs/REPO-DB-DRIFT.md)
- [Duitku POP Indonesia](https://docs.duitku.com/pop/id/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

## Kontribusi dan perubahan sensitif

Untuk perubahan pembayaran, lakukan audit kode dan schema aktual terlebih dahulu, siapkan patch yang dapat ditinjau, jalankan tes yang relevan, dan pisahkan perubahan repository dari perubahan database, secrets, serta deployment. Jangan menandai transaksi berhasil berdasarkan redirect atau callback JavaScript browser.
