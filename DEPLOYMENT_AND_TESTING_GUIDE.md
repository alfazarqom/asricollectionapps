# PANDUAN PENGUJIAN DAN DEPLOYMENT TOKOKATALOG + DUITKU POP

## 1. HASIL PENGUJIAN OTORITATIF (SESUAI SEKSI 14)

Semua skenario telah diuji secara langsung pada sistem backend dan frontend mobile:

| No | Skenario Uji | Status | Hasil Aktual & Mekanisme Pengamanan |
|---|---|---|---|
| 1 | **Katalog berhasil dimuat** | **LULUS** | Mengambil katalog JSON langsung dari Supabase Edge endpoint `https://mvwflakurihhakdrlteg.supabase.co/functions/v1/get-products`. |
| 2 | **Endpoint produk tidak tersedia** | **LULUS** | Menampilkan error state elegan di UI mobile dengan tombol coba lagi dan penanganan fallback. |
| 3 | **Produk habis (out of stock)** | **LULUS** | Tombol tambah dinonaktifkan di kartu dan detail produk; divalidasi ulang di backend (`POST /api/create-invoice` menolak produk `out of stock`). |
| 4 | **Kuantitas tidak valid (<= 0)** | **LULUS** | Ditolak oleh validasi backend dengan pesan error eksplisit HTTP 400. |
| 5 | **Harga browser dimanipulasi** | **LULUS** | Backend menolak nilai harga client dan selalu menghitung ulang subtotal menggunakan snapshot harga resmi dari server Supabase. |
| 6 | **Ongkir & total dimanipulasi** | **LULUS** | Backend menghitung ulang ongkir berdasarkan kode kurir resmi dan menghitung final total otoritatif. |
| 7 | **Invoice berhasil dibuat** | **LULUS** | Backend menghasilkan nomor pesanan unik `ORD-YYYYMMDD-XXXXX`, token akses guest acak, dan memanggil Duitku `createInvoice`. |
| 8 | **Invoice gagal dibuat** | **LULUS** | Menampilkan pesan error spesifik dan mencegah order berstatus zombie. |
| 9 | **Popup Duitku POP dibuka** | **LULUS** | `window.checkout.process(reference, options)` dipanggil secara resmi dengan event handlers. |
| 10 | **Popup ditutup tanpa bayar** | **LULUS** | Tangani event `closeEvent`; pesanan tetap dalam status `pending` dan tidak pernah dianggap lunas secara sepihak. |
| 11 | **Pembayaran berhasil** | **LULUS** | Webhook callback dengan `resultCode: '00'` diverifikasi dan mengubah status menjadi `paid`, mengunci pesanan, dan mengonfirmasi reservasi stok. |
| 12 | **Pembayaran gagal / expired** | **LULUS** | `resultCode: '01'` mengubah status pembayaran menjadi `failed` dan melepaskan reservasi stok. |
| 13 | **Callback signature salah** | **LULUS** | Verifikasi formula resmi Duitku `MD5(merchantCode + amount + orderId + apiKey)` menolak signature tidak cocok dengan HTTP 401 Unauthorized. |
| 14 | **Nominal callback tidak cocok** | **LULUS** | Callback dengan nominal yang tidak sama persis dengan total tagihan pesanan ditolak dengan HTTP 400 Conflict. |
| 15 | **Callback duplikat (Idempotensi)** | **LULUS** | Callback berulang direspons HTTP 200 `SUCCESS` tanpa mengurangi stok dua kali atau memproses ganda. |
| 16 | **Callback terlambat** | **LULUS** | Status pesanan terminal (seperti `paid` atau `cancelled`) tidak dapat diubah kembali menjadi `pending` oleh callback terlambat. |
| 17 | **Dua checkout bersamaan** | **LULUS** | Stored procedure PostgreSQL `reserve_inventory_atomic` mengunci kuantitas secara atomik. |
| 18 | **Akses pesanan orang lain** | **LULUS** | Endpoint `/api/orders/:orderNumber` mewajibkan token acak 48-karakter atau verifikasi email/telepon. Akses sembarangan ditolak HTTP 403 Forbidden. |
| 19 | **Non-admin ubah pengiriman** | **LULUS** | Endpoint `/api/admin/orders/:orderNumber/shipping` mewajibkan header `x-admin-pin` yang valid. Ditolak HTTP 401 jika PIN tidak ada/salah. |
| 20 | **Responsif Mobile 320–480 px** | **LULUS** | Kontainer mobile strictly 320–480 px di tengah layar dengan tombol thumb-friendly, safe-area insets, dan navigasi bawah tetap. |

---

## 2. DEPLOYMENT SUPABASE

### A. Deploy Skema Database (PostgreSQL)
Jalankan migration yang telah disediakan:
```bash
# Melalui Supabase CLI:
supabase db push

# Atau copy isi file berikut ke SQL Editor di Supabase Dashboard:
# /supabase/migrations/20261009000000_init_ecommerce_duitku.sql
```

### B. Konfigurasi Secrets Supabase Edge Functions
Set environment variables pada project Supabase Anda:
```bash
supabase secrets set \
  DUITKU_MERCHANT_CODE="DXXXXX" \
  DUITKU_API_KEY="your_api_key_here" \
  DUITKU_ENV="sandbox" \
  APP_URL="https://your-domain.vercel.app"
```

### C. Deploy Supabase Edge Functions
```bash
supabase functions deploy get-products --no-verify-jwt
supabase functions deploy duitku-create-invoice
supabase functions deploy duitku-callback --no-verify-jwt
supabase functions deploy get-duitku-payment-status
```
*(Catatan: Flag `--no-verify-jwt` digunakan untuk `get-products` agar katalog dapat diakses langsung oleh publik, dan untuk `duitku-callback` agar server Duitku dapat mengirimkan webhook secara publik tanpa JWT token).*

---

## 3. DEPLOYMENT VERCEL (FRONTEND & FULL-STACK)

### A. Konfigurasi Vercel
1. Hubungkan repository GitHub ke Vercel.
2. Konfigurasikan Environment Variables pada dashboard Vercel:
   - `DUITKU_MERCHANT_CODE`
   - `DUITKU_API_KEY`
   - `DUITKU_ENV` (`sandbox` atau `production`)
   - `ADMIN_SECRET_PIN` (contoh: `123456`)
   - `APP_URL` (`https://your-app.vercel.app`)
3. Build Command: `npm run build`
4. Output Directory: `dist`

---

## 4. CHECKLIST MIGRASI SANDBOX KE PRODUCTION

Ketika Anda siap menerima pembayaran nyata:

1. **Ubah Kredensial**:
   - Ganti `DUITKU_MERCHANT_CODE` dan `DUITKU_API_KEY` dengan kredensial Production dari Dashboard Duitku.
   - Ubah `DUITKU_ENV=production`.
2. **Ubah Script Duitku POP**:
   - Pada `index.html`, ganti script:
     - Dari: `https://app-sandbox.duitku.com/lib/js/duitku.js`
     - Menjadi: `https://app-prod.duitku.com/lib/js/duitku.js`
3. **Daftarkan Webhook URL di Duitku Merchant**:
   - Buka menu **My Projects > Edit Project** di dashboard Duitku.
   - Isi **Callback URL**: `https://<your-domain>/api/duitku-callback` (atau URL Edge Function Supabase).
   - Isi **Return URL**: `https://<your-domain>/orders`
4. **Verifikasi IP Whitelist**: Jika mengaktifkan IP Whitelist di Duitku, pastikan server IP Anda didaftarkan.

---

## 5. SPESIFIKASI RESMI DUITKU POP (SOURCE OF TRUTH)

Sistem mengadopsi 100% parameter resmi sesuai dokumentasi dan SDK resmi Duitku (`duitkupg`):

### A. Endpoint Pembuatan Invoice (`createInvoice`)
- **Sandbox**: `https://api-sandbox.duitku.com/api/merchant/createInvoice`
- **Production**: `https://api-prod.duitku.com/api/merchant/createInvoice`
- **HTTP Headers Wajib**:
  - `Content-Type: application/json`
  - `x-duitku-signature`: `SHA256(merchantCode + timestamp + apiKey)`
  - `x-duitku-timestamp`: Milliseconds timestamp (`Date.now().toString()`)
  - `x-duitku-merchantcode`: Merchant code dari Duitku
- **Payload Request**:
  - `paymentAmount` (Integer): Total tagihan yang harus dibayar.
  - `merchantOrderId` (String): ID unik pesanan merchant.
  - `productDetails` (String): Deskripsi transaksi.
  - `email` (String) & `phoneNumber` (String): Kontak pelanggan.
  - `additionalParam` (String): Token pengaman akses pesanan.
  - `customerVaName` (String): Nama rekening tujuan transfer bank/VA.
  - `callbackUrl` (String): Endpoint HTTPS server merchant untuk webhook.
  - `returnUrl` (String): URL redirect setelah pembayaran selesai.
  - `expiryPeriod` (Integer): Batas waktu invoice dalam menit (misal: 60).
  - `itemDetails` (Array): Daftar rincian barang `[{ name, price, quantity }]`.
  - `customerDetail` (Object): `{ firstName, lastName, email, phoneNumber, shippingAddress }`.
- **Response**:
  - `statusCode`: `"00"` (Sukses)
  - `statusMessage`: `"SUCCESS"`
  - `reference`: Token referensi Duitku (digunakan oleh `checkout.process`).
  - `paymentUrl`: URL pembayaran fallback untuk browser mobile.

### B. Frontend POP Library (`duitku.js`)
- **Library Sandbox**: `https://app-sandbox.duitku.com/lib/js/duitku.js`
- **Library Production**: `https://app-prod.duitku.com/lib/js/duitku.js`
- **Metode Pemanggilan**:
  ```javascript
  window.checkout.process(reference, {
    successEvent: function(result) { /* Update UI, backend tetap verifikasi via webhook */ },
    pendingEvent: function(result) { /* Status pending */ },
    errorEvent: function(result) { /* Pembayaran gagal / ditolak */ },
    closeEvent: function() { /* Pengguna menutup popup tanpa menyelesaikan */ }
  });
  ```

### C. Webhook Callback Duitku
- **Metode**: POST (`application/x-www-form-urlencoded` atau `application/json`)
- **Parameter Utama**:
  - `merchantCode`: Kode merchant.
  - `amount`: Nominal yang dibayar.
  - `merchantOrderId`: Nomor pesanan merchant.
  - `resultCode`: `"00"` (Berhasil) \| `"01"` (Gagal).
  - `reference`: Referensi transaksi Duitku.
  - `signature`: `MD5(merchantCode + amount + merchantOrderId + apiKey)`.
- **Verifikasi Wajib di Server**:
  1. Validasi `merchantCode`.
  2. Hitung ulang MD5 signature dan cocokkan dengan `signature` callback.
  3. Cocokkan `merchantOrderId` dan `amount` persis sama dengan database.
  4. Periksa idempotensi: jika status sudah `"paid"`, jangan proses ulang stok.
  5. Kirim respon HTTP 200 dengan body teks: `"SUCCESS"`.

### D. Check Transaction Status API (`transactionStatus`)
- **Sandbox**: `https://api-sandbox.duitku.com/api/merchant/transactionStatus`
- **Production**: `https://api-prod.duitku.com/api/merchant/transactionStatus`
- **Signature**: `MD5(merchantCode + merchantOrderId + apiKey)`
- **Response**:
  - `statusCode`: `"00"` (Success) \| `"01"` (Pending) \| `"02"` (Failed/Canceled).
  - Digunakan sebagai sinkronisasi aktif (*active reconciliation*) saat status pesanan disegarkan.

