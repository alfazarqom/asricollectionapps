# Laporan Audit Arsitektur dan Adaptasi Referensi — Asri Collection

- **Repositori Utama:** `asricollectionapps`
- **Domain Merchant:** `https://asricollection.online`
- **Peran:** Senior Full-Stack Engineer & Software Architect
- **Status Audit:** Selesai (Read-Only Audit & Evaluasi Arsitektural)
- **Baseline:** React 19 + Vite + TypeScript + Supabase + Tailwind CSS (Mobile-Only V2)

---

## 1. Ringkasan Eksekutif

Audit menyeluruh ini dilakukan terhadap basis kode **`asricollectionapps`**, skema database dan Edge Functions aktif Supabase (`mvwflakurihhakdrlteg`), serta tiga repositori referensi e-commerce dan dokumentasi resmi Duitku POP.

Tujuan utama audit adalah mengidentifikasi kesenjangan (*gaps*), memverifikasi kepatuhan terhadap kontrak resmi Duitku POP (update April/Juni 2026), serta merumuskan rekomendasi adaptasi fitur tanpa merusak baseline arsitektur mobile-only yang telah berjalan stabil.

---

## 2. Tahap 1 — Audit Repositori `asricollectionapps`

### 2.1 Struktur Direktori & Konfigurasi
* **Arsitektur:** Single Page Application (SPA) berbasis React 19, TypeScript 5.8+, Vite 6, Tailwind CSS v4, dan Node.js Express (`server.ts`) sebagai backend dev server & API proxy.
* **Routing:** `react-router-dom` v7 dengan pemisahan rute publik (`/`, `/categories`, `/product/:id`, `/cart`, `/checkout`, `/orders`, `/account`), rute kebijakan hukum (`/terms`, `/refund`, `/privacy`, `/shipping`, `/contact`, `/store-info`), serta panel administratif terproteksi (`/admin`).
* **Mobile-First Shell:** `MobileContainer.tsx` mengisolasi lebar antarmuka tepat 320px–480px di tengah layar (*strict smartphone layout*), dengan `html, body, #root` 100% height dan `touch-action: pan-x pan-y` untuk memblokir pinch zoom.

### 2.2 Dependensi & Versi Library (`package.json`)
* `react` & `react-dom`: `^19.0.1`
* `react-router-dom`: `^7.18.4`
* `lucide-react`: `^0.546.0` (ikonografi konsisten)
* `express`: `^4.21.2` & `dotenv`: `^17.2.3` (runtime backend lokal)
* `@tailwindcss/vite` & `tailwindcss`: `^4.3.3`
* *Temuan State:* State keranjang saat ini menggunakan React Context (`src/context/CartContext.tsx`) dengan persistensi `localStorage`. Belum memakai Zustand seperti yang ditargetkan pada baseline arsitektur.

### 2.3 Katalog, Varian, & Galeri Produk
* Katalog dimuat secara asinkron dari Supabase Edge Function `get-products` (`https://mvwflakurihhakdrlteg.supabase.co/functions/v1/get-products`) atau fallback `/api/products`.
* Format data katalog memuat id, title, description, availability, condition, price, sale_price, currency (IDR), image_link, brand, product_type, created_at, updated_at.
* Detail produk (`ProductDetailPage.tsx`) mendukung pemilihan kuantitas, status stok (*in stock* vs *out of stock*), dan informasi pengiriman.

### 2.4 Alur Checkout & Manajemen Pesanan
* Guest checkout 3 langkah tanpa kewajiban registrasi akun di awal:
  1. Pengisian data penerima (nama, WhatsApp, email, alamat lengkap, kota, kode pos).
  2. Pemilihan jasa kirim dengan kalkulasi tarif resmi (`sicepat_reg`, `jne_reg`, `jnt_reg`, `gosend_sameday`, `pickup_store`).
  3. Konfirmasi ringkasan dan pembuatan invoice Duitku POP.
* Keamanan transaksi: Backend menghitung ulang seluruh subtotal dan ongkos kirim berdasarkan katalog otoritatif di server. Manipulasi harga atau kuantitas di browser otomatis digagalkan.
* Token akses pesanan: Setiap pesanan menghasilkan `order_number` (`ORD-YYYYMMDD-XXXXX`) dan `access_token` acak 64-karakter untuk melindungi privasi pelanggan saat melacak pesanan.

---

## 3. Tahap 2 — Audit Repositori Referensi

Evaluasi terhadap repositori eksternal dan pola implementasi yang relevan:

### 3.1 `TalhaSaleem01/Ecommerce-shoppingStore-FullStack`
* **Pola yang dievaluasi:** Storefront katalog React + Supabase.
* **Temuan:** Menggunakan pemanggilan Supabase Client langsung dari frontend untuk seluruh query produk dan auth.
* **Keputusan: `REJECT` untuk alur transaksi / `ADAPT` untuk struktur filter UI.**
  * *Alasan:* Memanggil Supabase langsung dari browser untuk checkout berisiko memicu manipulasi harga di sisi klien. Pada Asri Collection, pembuatan invoice dan reservasi stok **wajib** melalui backend/Edge Functions otoritatif demi keamanan Duitku.

### 3.2 `PramodBasavarajMenasi/ecommerce-app`
* **Pola yang dievaluasi:** Pemisahan direktori `services/`, `hooks/`, dan `store/`.
* **Temuan:** Struktur pemisahan layer API service dan custom hooks sangat rapi dan memudahkan pengujian modular.
* **Keputusan: `ADOPT`.**
  * *Rekomendasi:* Adaptasi struktur isolasi API client ke dalam `src/services/` (misal: `productService.ts`, `orderService.ts`) agar pemanggilan API di `App.tsx` dan `CheckoutPage.tsx` lebih modular.

### 3.3 `danipaBernales/modern-ecommerce`
* **Pola yang dievaluasi:** Zustand store dengan middleware `persist` ke `localStorage`.
* **Temuan:** Zustand memberikan performa re-render jauh lebih optimal dibanding React Context standar untuk keranjang belanja mobile.
* **Keputusan: `ADOPT`.**
  * *Rekomendasi:* Migrasikan `CartContext.tsx` ke Zustand slice store (`useCartStore`) dengan API yang identik agar tidak merusak komponen konsumen (`ProductCard`, `CartPage`, `CheckoutPage`).

### 3.4 Referensi Resmi Duitku (`duitkupg/duitku-php` & `duitkupg/duitku-pop-woocommerce`)
* **Pola yang dievaluasi:** Alur pembuatan invoice, verifikasi HMAC, dan penanganan webhook callback.
* **Temuan:**
  * Endpoint Create Invoice wajib menyertakan header `x-duitku-signature` (HMAC-SHA256 dari `merchantCode + timestamp`).
  * Total `itemDetails.price * quantity` harus sama persis dengan `paymentAmount`.
  * Callback server mengirim `POST application/x-www-form-urlencoded` dan wajib dibalas dengan plain text `SUCCESS` (HTTP 200).
* **Keputusan: `ADOPT` (Sesuai dengan Source of Truth Asri Collection).**

---

## 4. Tahap 3 — Audit Supabase (`mvwflakurihhakdrlteg`)

### 4.1 Skema Tabel Database (Schema `public`)
1. **`products`**: Tabel katalog utama (`id`, `title`, `description`, `price`, `sale_price`, `availability`, `currency`, `image_link`, `brand`, `product_type`, `created_at`, `updated_at`).
2. **`orders`**: Menyimpan order dengan status pembayaran (`pending`, `paid`, `failed`, `expired`, `cancelled`), status pengiriman (`unfulfilled`, `processing`, `shipped`, `delivered`), serta `access_token` privat.
3. **`order_items`**: Rincian item pesanan terikat ke `orders.id` dengan snapshot harga beli saat transaksi dibuat.
4. **`payments`**: Log referensi transaksi dari Duitku POP (`merchant_order_id`, `reference`, `amount`, `payment_method`, `result_code`).
5. **`inventory_reservations`**: Reservasi stok sementara saat invoice Duitku dibuat untuk mencegah *overselling*.
6. **`callback_events`**: Audit trail webhook callback yang masuk dari Duitku untuk audit dan penelusuran masalah.

### 4.2 Row Level Security (RLS) & Akses Data
* Seluruh tabel memiliki RLS aktif (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
* Tabel `products` memiliki policy publik `read-only` untuk katalog.
* Tabel `orders`, `order_items`, dan `payments` dibatasi: hanya dapat diakses melalui Supabase Service Role Key oleh Edge Functions, atau via fungsi verifikasi token akses.

### 4.3 Edge Functions
* **`get-products`** (`--no-verify-jwt`): Endpoint publik untuk mengambil katalog lengkap dengan filter kueri.
* **`duitku-create-invoice`**: Validasi backend, perhitungan ulang harga, reservasi inventaris atomik, dan request resmi ke Duitku POP.
* **`duitku-callback`** (`--no-verify-jwt`): Webhook publik untuk menerima notifikasi pembayaran Duitku, validasi dual signature (HMAC-SHA256 & MD5 fallback), pembaruan status pesanan idempoten, dan konfirmasi reservasi stok.
* **`get-duitku-payment-status`**: Sinkronisasi status aktif ke endpoint `transactionStatus` Duitku jika webhook mengalami keterlambatan.

---

## 5. Tahap 4 — Evaluasi Integrasi Duitku POP

Berdasarkan *Source of Truth* dan dokumentasi Duitku POP resmi:

1. **Pembuatan Invoice:**
   * Endpoint Sandbox: `https://api-sandbox.duitku.com/api/merchant/createInvoice`
   * Endpoint Production: `https://api-prod.duitku.com/api/merchant/createInvoice`
   * Signature Header: `HMAC_SHA256(merchantCode + timestamp, apiKey)` pada header `x-duitku-signature`.
   * Status: **Sesuai & Lulus Audit**.
2. **Frontend POP Script:**
   * Script `https://app-sandbox.duitku.com/lib/js/duitku.js` dimuat secara asinkron di `index.html`.
   * Pemanggilan `window.checkout.process(reference, options)` menangani event `successEvent`, `pendingEvent`, `errorEvent`, dan `closeEvent`.
   * **Pencegahan Fraud:** Sesuai dokumentasi Duitku, event JavaScript di frontend **hanya** digunakan untuk pembaruan UI dan tidak boleh mengubah status pembayaran di database.
3. **Webhook Callback HTTP:**
   * Menerima payload `application/x-www-form-urlencoded` atau `application/json`.
   * Formula signature callback: `HMAC_SHA256(merchantCode + amount + merchantOrderId, apiKey)`.
   * Validasi nominal: Server memeriksa kecocokan eksak antara `amount` yang dibayarkan dan `total_amount` di database.
   * Idempotensi: Jika status pesanan sudah `paid`, callback duplikat direspons HTTP 200 `SUCCESS` tanpa mengurangi stok ulang.

---

## 6. Tahap 5 — Pemetaan Hasil & Matriks Rekomendasi

| Area | Kondisi Asri Saat Ini | Referensi yang Relevan | Gap yang Terbukti | Rekomendasi | Status | Risiko |
|---|---|---|---|---|---|---|
| **State Keranjang** | React Context + `localStorage` (`CartContext.tsx`) | `danipaBernales/modern-ecommerce` (Zustand + persist) | Context menyebabkan seluruh komponen konsumen re-render saat kuantitas berubah | Migrasi ke Zustand store dengan interface dan persistensi yang kompatibel | **ADOPT** | Rendah (pertahankan nama hook dan method agar zero-breaking) |
| **Pemisahan API Service** | Fetch langsung tersebar di `App.tsx` dan `CheckoutPage.tsx` | `PramodBasavarajMenasi/ecommerce-app` (`src/services/`) | Duplikasi logika error handling dan URL parsing | Ekstraksi ke `src/services/api.ts` dan `src/services/duitku.ts` | **ADOPT** | Rendah (mempermudah unit testing) |
| **Katalog Frontend Query** | Memanggil Edge Function `get-products` / backend proxy | `TalhaSaleem01` (Direct Supabase Client query) | Query langsung dari browser membuka celah kebocoran policy jika RLS miskonfigurasi | Pertahankan pemanggilan katalog terpusat via API proxy & Edge Function | **REJECT** | Menghindari manipulasi harga dan RLS bypass |
| **Signature Duitku POP** | Menggunakan HMAC-SHA256 resmi (dan MD5 legacy fallback) | Duitku Docs POP April 2026 update | Dokumentasi lama di guide masih mencantumkan SHA256 biasa | Pastikan seluruh dokumen teknis selaras dengan standar HMAC-SHA256 Duitku POP | **ADAPT** | Nol (keamanan meningkat dan sesuai regulasi Duitku) |
| **Guest Order Privacy** | Verifikasi nomor pesanan + `access_token` 64-karakter | Standar OWASP & E-Commerce Security | Lacak pesanan publik hanya dengan nomor HP rentan scraping data pribadi pelanggan | Pertahankan akses token acak untuk URL tracking dan verifikasi ganda kontak untuk pencarian publik | **ADOPT** | Nol (melindungi data pelanggan sesuai UU PDP) |
| **Layout & Viewport** | Mobile-only shell 320–480px, `height: 100%` | Visual Project Tree — Mobile Only V2 | Tampilan tablet/desktop harus tetap mempertahankan rasio mobile elegan | Pertahankan `MobileContainer` terisolasi di tengah layar dengan background slate | **ADOPT** | Nol (identitas mobile toko tetap konsisten) |

---

## 7. Rencana Aksi Terarah (Action Plan)

1. **Adopsi Zustand:** Pasang library `zustand` dan buat `src/store/useCartStore.ts` sebagai drop-in replacement untuk `CartContext.tsx` dengan persistensi key `tokokatalog_guest_cart_v1`.
2. **Sinkronisasi Dokumentasi Panduan:** Perbarui catatan di `DEPLOYMENT_AND_TESTING_GUIDE.md` agar seluruh deskripsi signature Create Invoice dan Callback secara eksplisit merujuk ke HMAC-SHA256 resmi.
3. **Verifikasi Build & Lint:** Pastikan kompilasi TypeScript dan Vite build selalu lolos tanpa *warning* atau *type error*.
