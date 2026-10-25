# Panduan Integrasi Supabase Edge Functions — Duitku POP

Dokumentasi ini menjelaskan konfigurasi dan penggunaan dua Supabase Edge Functions untuk **Duitku POP Payment Gateway** pada aplikasi **Asri Collection**:
1. **`duitku-create-invoice`** — Meminta referensi pembayaran (`DUITKU_REFERENCE`) dan `paymentUrl` ke server Duitku POP.
2. **`duitku-callback`** — Menerima notifikasi webhook pembayaran (HTTP POST) otomatis dari Duitku setelah pelanggan membayar.

Sumber Referensi Resmi: [Dokumentasi Duitku POP — Integrasi Backend atau Server](https://docs.duitku.com/pop/id/?shell#integrasi-backend-atau-server)

---

## 1. Konfigurasi Environment (Khusus di Supabase Secrets)

Sesuai standar keamanan, seluruh kredensial rahasia disimpan **hanya di Supabase Secrets** (bukan di frontend).

### Variabel yang Diperlukan:
| Nama Secret | Deskripsi | Contoh Nilai |
|-------------|-----------|--------------|
| `DUITKU_MERCHANT_CODE` | Kode merchant dari Dashboard Duitku | `D12345` |
| `DUITKU_API_KEY` | API Key / Merchant Key dari Dashboard Duitku | `a1b2c3d4e5f6g7h8...` |
| `DUITKU_ENV` | Mode lingkungan (`sandbox` atau `production`) | `sandbox` |
| `DUITKU_CALLBACK_URL` | URL publik Edge Function callback Duitku | `https://<PROJECT-REF>.supabase.co/functions/v1/duitku-callback` |
| `DUITKU_RETURN_URL` | Halaman redirect browser setelah bayar | `https://<DOMAIN-APP>/cart?status=finish` |
| `SUPABASE_URL` | URL project Supabase Anda | `https://<PROJECT-REF>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key Supabase untuk update DB | `eyJhbGciOi...` |

### Cara Mengunggah Secrets ke Supabase:

#### Opsi A — Melalui Supabase CLI (Direkomendasikan):
Jalankan perintah berikut di terminal:
```bash
# Upload semua secrets dari file supabase/.env
supabase secrets set --env-file supabase/.env

# Atau set satu per satu:
supabase secrets set DUITKU_MERCHANT_CODE="D12345"
supabase secrets set DUITKU_API_KEY="your_api_key"
supabase secrets set DUITKU_ENV="sandbox"
supabase secrets set DUITKU_CALLBACK_URL="https://<PROJECT-REF>.supabase.co/functions/v1/duitku-callback"
supabase secrets set DUITKU_RETURN_URL="https://<DOMAIN-APP>/cart"
```

#### Opsi B — Melalui Supabase Dashboard:
1. Buka dashboard proyek Supabase Anda.
2. Navigasi ke **Project Settings** > **Edge Functions** > **Secrets**.
3. Tambahkan key dan value yang tercantum di atas.

---

## 2. Cara Deploy Edge Functions

Gunakan Supabase CLI untuk men-deploy kedua Edge Function:

```bash
# 1. Deploy fungsi pembuat invoice
supabase functions deploy duitku-create-invoice

# 2. Deploy fungsi webhook callback (PENTING: Gunakan --no-verify-jwt)
supabase functions deploy duitku-callback --no-verify-jwt
```

> **CATATAN PENTING**: Flag `--no-verify-jwt` **wajib** digunakan pada `duitku-callback` karena server webhook Duitku mengirim notifikasi server-to-server tanpa header Supabase Bearer JWT token.

---

## 3. Konfigurasi di Dashboard Duitku

1. Masuk ke Dashboard Duitku:
   - **Sandbox**: [https://sandbox.duitku.com/](https://sandbox.duitku.com/)
   - **Production**: [https://passport.duitku.com/](https://passport.duitku.com/)
2. Masuk ke menu **My Projects** > Pilih project Anda.
3. Atur URL Callback:
   - **Callback URL**: `https://<PROJECT-REF>.supabase.co/functions/v1/duitku-callback`
   - **Return URL**: `https://<DOMAIN-APP>/cart`

---

## 4. Cara Pemanggilan dari Frontend

### Request `duitku-create-invoice`:
Frontend memanggil endpoint `duitku-create-invoice` melalui `fetch`:

```javascript
const response = await fetch("https://<PROJECT-REF>.supabase.co/functions/v1/duitku-create-invoice", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "apikey": "<SUPABASE_ANON_KEY>",
  },
  body: JSON.stringify({
    paymentAmount: 250000,
    merchantOrderId: "ASRI-" + Date.now(),
    productDetails: "Gamis Silk Raya & Hijab",
    email: "pembeli@example.com",
    phoneNumber: "08123456789",
    customerVaName: "Siti Rahma",
    itemDetails: [
      {
        name: "Gamis Silk Raya",
        price: 250000,
        quantity: 1
      }
    ],
    customerDetail: {
      firstName: "Siti",
      lastName: "Rahma",
      email: "pembeli@example.com",
      phoneNumber: "08123456789"
    }
  })
});

const data = await response.json();

if (data.statusCode === "00") {
  // 1. Jika menggunakan POP Popup (checkout.duitku.com):
  window.checkout.process(data.reference, {
    successEvent: function(result) { console.log('success', result); },
    pendingEvent: function(result) { console.log('pending', result); },
    errorEvent: function(result) { console.log('error', result); },
    closeEvent: function(result) { console.log('customer closed popup', result); }
  });

  // 2. Atau redirect langsung ke halaman pembayaran Duitku:
  // window.location.href = data.paymentUrl;
} else {
  alert("Gagal membuat transaksi: " + data.statusMessage);
}
```

---

## 5. Alur Validasi Signature di `duitku-callback`

Ketika pembayaran berhasil diselesaikan pelanggan, Duitku mengirimkan notifikasi HTTP POST ke `duitku-callback`.

Fungsi secara otomatis:
1. Membaca parameter `merchantCode`, `amount`, `merchantOrderId`, `signature`, `resultCode`, dan `reference`.
2. Menghitung signature resmi Duitku:
   $$\text{MD5}(\text{merchantCode} + \text{amount} + \text{merchantOrderId} + \text{apiKey})$$
   *(Beserta verifikasi HMAC-SHA256 untuk kompatibilitas versi terbaru).*
3. Bila signature valid dan `resultCode === "00"`, pesanan di database Supabase diperbarui menjadi `SUCCESS`.
4. Mengembalikan respons HTTP 200 dengan isi plaintext `SUCCESS` sesuai spesifikasi Duitku.
