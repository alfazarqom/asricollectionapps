# Asri Collection — Online Store

Frontend aplikasi toko online Asri Collection yang dibangun dengan React, Vite, JavaScript, Tailwind CSS, dan React Router. Repository ini berisi aplikasi frontend; database dan Edge Functions dikelola terpisah di Supabase.

> **Status integrasi penting:** berdasarkan pemeriksaan kode saat README ini diperbarui, `src/services/productApi.js` masih membaca produk langsung dari tabel Supabase `products` dan masih memiliki fallback ke DummyJSON serta data produk lokal. Edge Function Supabase `get-products` tersedia, tetapi frontend belum sepenuhnya menggunakannya sebagai sumber produk utama. Jangan menganggap integrasi frontend–Edge Function sudah selesai sampai perubahan kode dan pengujian dilakukan.

## Fitur frontend

- Halaman beranda dan daftar produk
- Detail produk berdasarkan ID
- Pencarian dan penyaringan produk berdasarkan kategori
- Keranjang belanja dengan Context API
- Drawer keranjang, ubah kuantitas, dan hapus item
- Penyimpanan keranjang melalui browser `localStorage`
- Banner promosi dan halaman Tentang
- Halaman daftar pesanan dan halaman 404
- Komponen UI responsif

Daftar fitur di atas menjelaskan cakupan UI yang ada pada kode; bukan pernyataan bahwa seluruh alur checkout atau pembayaran sudah lolos pengujian produksi.

## Teknologi

| Teknologi | Penggunaan |
| --- | --- |
| React | Komponen dan UI |
| Vite | Development server dan build |
| Tailwind CSS | Styling |
| React Router | Routing sisi klien |
| Supabase JS | Akses data Supabase |
| React Context API | State keranjang |
| Lucide React | Ikon |
| React Slick | Slider |
| `localStorage` | Persistensi keranjang di browser |

## Struktur proyek

```text
src/
├── components/
│   ├── cart/
│   ├── home/
│   ├── layout/
│   ├── product/
│   └── ui/
├── context/
├── hooks/
├── pages/
├── services/
│   └── productApi.js
├── utils/
├── App.jsx
├── index.css
└── main.jsx
```

## Sumber data dan kontrak API

### Kondisi kode saat ini

- Produk: `src/services/productApi.js` melakukan query langsung ke tabel `products`, termasuk filter `is_active`. Jika query gagal atau tidak menghasilkan data, kode dapat beralih ke DummyJSON dan data lokal.
- Detail produk, pencarian, dan kategori: memiliki jalur query langsung dan/atau fallback sendiri.
- Kategori dan banner: diambil dari tabel Supabase `categories` dan `banners`, dengan kategori/banner lokal sebagai fallback.
- Pesanan: frontend memiliki fungsi yang melakukan insert ke `orders` dan kemudian ke `order_items` secara terpisah.

### Target integrasi produk

Edge Function `get-products` direncanakan menjadi sumber data produk utama. Sebelum integrasi dianggap selesai, audit dan implementasi harus memastikan bahwa:

1. Semua jalur produk (daftar, detail, pencarian, kategori, dan produk terkait) menggunakan sumber data dan kontrak yang konsisten.
2. Pemetaan respons ke komponen UI dilakukan secara eksplisit, termasuk `price`, `sale_price`, `currency`, `availability`, `stock_quantity`, `image_url`, `additional_image_urls`, dan `labels`.
3. `availability` diperlakukan sebagai status ketersediaan utama; stok ditampilkan terpisah sesuai aturan bisnis.
4. Data produk lokal atau DummyJSON tidak ditampilkan sebagai produk toko ketika API gagal. Tampilkan keadaan error/kosong yang jelas, kecuali fallback tersebut secara eksplisit dimaksudkan untuk mode demo.
5. Harga dan total pembayaran divalidasi di backend, bukan dipercaya dari nilai yang dikirim browser.

Dokumentasi ini tidak menyatakan bahwa semua poin target di atas sudah diterapkan.

## Routing

| Path | Halaman |
| --- | --- |
| `/` | Beranda |
| `/products` | Daftar produk |
| `/products/:id` | Detail produk |
| `/cart` | Keranjang |
| `/orders` | Daftar pesanan |
| `/orders/:id` | Rute pesanan |
| `/pesanan/:id` | Alias rute pesanan |
| `/about` | Tentang |
| `*` | Halaman tidak ditemukan |

Rute yang terdaftar tidak dengan sendirinya membuktikan bahwa seluruh fungsi pesanan atau pembayaran telah terintegrasi dan teruji.

## Persiapan lokal

Pastikan Node.js dan npm tersedia, lalu jalankan:

```bash
npm install
npm run dev
```

Vite akan menampilkan alamat lokal untuk membuka aplikasi.

### Variabel lingkungan

Periksa file konfigurasi dan penggunaan environment variable di repository sebelum menjalankan aplikasi. Isi nilai yang diperlukan di file lingkungan lokal yang sesuai. Jangan commit secret, service-role key, API key pembayaran, atau kredensial privat ke repository. Variabel yang berawalan `VITE_` dapat terekspos ke browser dan hanya boleh berisi nilai yang memang aman untuk publik.

## Pemeriksaan kualitas

Skrip yang tersedia di `package.json`:

```bash
npm run lint
npm run build
npm run preview
```

Jalankan lint dan build sebelum mengajukan perubahan. README ini sendiri belum menjadi bukti bahwa pemeriksaan tersebut telah dijalankan atau lulus.

## Batas keamanan dan kesiapan produksi

- Kebijakan RLS dan grants Supabase harus diperiksa sesuai akses yang benar-benar dibutuhkan aplikasi.
- Jangan menambahkan policy atau mengubah database tanpa audit dan persetujuan terpisah.
- Pembuatan pesanan yang dilakukan melalui beberapa operasi frontend berisiko menghasilkan pesanan tanpa item lengkap apabila salah satu operasi gagal; pertimbangkan operasi backend yang atomik.
- Edge Function pembayaran harus memvalidasi input, signature callback sesuai kontrak penyedia, idempotensi, status transaksi, dan nilai pembayaran.
- Status aktif suatu Edge Function bukan bukti bahwa alur pembayaran aman atau siap produksi.

## Alur perubahan

Lakukan audit read-only terlebih dahulu, dokumentasikan temuan dan rekomendasi, sepakati ruang lingkup perubahan, implementasikan pada branch kerja, kemudian jalankan verifikasi. Jangan mengubah database aktif, secrets, deployment, atau melakukan merge tanpa persetujuan eksplisit.

## Informasi repository

- Repository: [alfazarqom/asricollectionapps](https://github.com/alfazarqom/asricollectionapps)
- Frontend: React + Vite
- Backend/data: Supabase dan Edge Functions (dikelola terpisah)

