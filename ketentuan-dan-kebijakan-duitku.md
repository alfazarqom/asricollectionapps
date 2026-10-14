# Ringkasan Ketentuan dan Dokumentasi Resmi Duitku

- **Tanggal pemeriksaan sumber:** 15 Oktober 2026
- **Cakupan:** persyaratan website/pendaftaran yang tercantum di FAQ Duitku dan teknis integrasi Duitku POP API.
- **Prinsip penyusunan:** hanya memuat informasi yang ditemukan dalam dokumentasi resmi Duitku yang dicantumkan di bagian Sumber. Tidak mencakup rekomendasi umum, asumsi implementasi, atau hasil audit website dari sumber pihak ketiga.

> Dokumen ini adalah ringkasan dokumentasi publik Duitku, bukan persetujuan merchant atau jaminan bahwa suatu website/akun memenuhi hasil verifikasi Duitku. Periksa kembali dokumentasi resmi dan ketentuan akun yang berlaku sebelum implementasi.

## 1. Ketentuan website dan pendaftaran merchant

Menurut [FAQ resmi Duitku](https://www.duitku.com/frequently-asked-questions/):

- Website yang didaftarkan harus sudah aktif dan dipublikasikan.
- Website tidak boleh berupa tautan marketplace.
- Website tidak boleh berupa media sosial.
- Website tidak boleh berupa subdomain dari platform/website builder.
- Aplikasi yang didaftarkan harus sudah dipublikasikan di App Store atau Play Store.
- Website harus diisi pada formulir pendaftaran di dashboard setelah verifikasi nomor telepon dan email.
- Ketentuan website tersebut tidak menentukan hasil akhir verifikasi seluruh data dan dokumen merchant.

### Dokumen legal pendaftaran

FAQ Duitku menyebut kebutuhan dokumen berbeda berdasarkan jenis legalitas usaha:
- **Merchant personal:** KTP, NPWP, dan bukti nomor rekening. FAQ menyatakan KTP, NPWP, dan akun bank harus menggunakan nama yang sama.
- **Merchant perusahaan:** memerlukan dokumen legalitas yang lebih menyeluruh; detailnya merujuk ke [dokumentasi aktivasi akun Duitku](https://docs.duitku.com/account/#aktivasi-akun).

Untuk daftar dokumen yang berlaku, ikuti dokumentasi aktivasi akun dan formulir pada dashboard Duitku.

### Kategori bisnis yang tidak diterima

FAQ Duitku menyebut pengecualian berikut:
- Situs dengan konten “XXX”.
- Situs perjudian.
- Persenjataan.
- Narkoba dan perlengkapannya.
- Produk atau jasa ilegal atau terlarang lainnya.
- Perusahaan telemarketing berisiko tinggi seperti horoskop, prediksi, ramalan, dan sejenisnya.
- Replika.

Daftar di atas adalah kategori yang disebut pada FAQ. Untuk kategori yang tidak jelas, FAQ publik ini tidak menetapkan keputusan khusus bagi setiap produk atau model bisnis.

## 2. HTTPS, mata uang, dan nominal

### HTTPS

FAQ Duitku menyatakan merchant tidak diwajibkan memiliki sertifikat HTTPS pada situsnya berdasarkan ketentuan yang dijelaskan di FAQ, tetapi Duitku menyarankan penggunaannya.

Sumber: [FAQ Duitku — Keamanan](https://www.duitku.com/frequently-asked-questions/).

### Mata uang

FAQ Duitku menyatakan Duitku hanya memproses transaksi dalam Rupiah (IDR). Harga dalam mata uang lain perlu dikonversi ke Rupiah sebelum tagihan akhir dibuat.

FAQ juga **menyarankan**, bukan menyatakan sebagai kewajiban, agar nominal transaksi tidak menggunakan format desimal untuk menghindari transaksi tertunda dari pihak bank.

Sumber: [FAQ Duitku — Mata uang](https://www.duitku.com/frequently-asked-questions/).

## 3. Duitku POP API — Create Invoice

Dokumentasi POP menetapkan informasi berikut untuk endpoint Create Invoice.

### Endpoint dan format request

- Metode: HTTP POST.
- Content-Type: `application/json`.
- Produksi: `https://api-prod.duitku.com/api/merchant/createInvoice`.
- Sandbox: `https://api-sandbox.duitku.com/api/merchant/createInvoice`.

### Header

Dokumentasi mencantumkan header wajib:
- `Content-Type`
- `x-duitku-timestamp`
- `x-duitku-signature`
- `x-duitku-merchantcode`

Timestamp berupa UNIX timestamp dalam milidetik menurut zona waktu Jakarta.

### Signature request

Formula yang dicantumkan dokumentasi POP:

```text
stringToSign = merchantCode + timestamp
signature = HMAC_SHA256(stringToSign, apiKey)
```

Dokumentasi menyatakan metode signature SHA256 sebelumnya sudah usang; implementasi harus mengikuti formula HMAC-SHA256 yang tercantum di dokumentasi POP.

### Parameter Create Invoice

Dokumentasi POP mencantumkan parameter berikut:
- `paymentAmount` — wajib, integer.
- `merchantOrderId` — wajib, string dengan panjang maksimum 50 karakter menurut tabel parameter.
- `productDetails` — wajib.
- `email` — wajib.
- `callbackUrl` — wajib.
- `returnUrl` — wajib.
- `additionalParam`, `merchantUserInfo`, `customerVaName`, `phoneNumber`, `itemDetails`, `customerDetail`, `expiryPeriod`, `paymentMethod`, dan `creditCardDetail` — ditandai opsional dalam tabel parameter POP umum; persyaratan tambahan berlaku untuk fitur/metode tertentu.

Dokumentasi menyatakan:
- Setiap request untuk transaksi baru harus menggunakan `merchantOrderId` baru.
- Jika menggunakan `additionalParam`, nilainya harus berbentuk URL-encoded.
- Untuk transaksi tokenisasi (VC atau MG), `email`, `customerDetail.email`, `customerDetail.merchantCustomerId`, dan `creditCardDetail.saveCardToken` menjadi wajib.
- `expiryPeriod` adalah masa berlaku transaksi dalam menit; tabel parameter memberikan contoh 5, 10, atau 60 menit.
- `itemDetails` menggunakan nama barang, kuantitas integer, dan harga integer tanpa desimal. Dokumentasi menyatakan total semua nilai `price` di `itemDetails` harus sama dengan `paymentAmount`.

Jangan menganggap contoh parameter opsional berlaku untuk semua kanal. Periksa bagian khusus metode pembayaran yang digunakan pada dokumentasi POP.

Sumber: [Duitku POP API — Create Invoice](https://docs.duitku.com/pop/id/).

## 4. Respons Create Invoice

Dokumentasi memberikan contoh respons yang memuat:
- `merchantCode`
- `reference`
- `paymentUrl`
- `statusCode`
- `statusMessage`

Dokumentasi menyatakan `reference` perlu disimpan pada sistem merchant. `paymentUrl` dapat digunakan untuk menampilkan halaman pembayaran Duitku melalui window redirection.

Dokumentasi juga menyatakan bahwa request dengan order ID yang sama dapat memberikan respons yang sama selama 5 menit. Request berulang untuk order ID yang sama saat request sebelumnya masih berjalan atau dengan nominal berbeda dapat menghasilkan error seperti `The transaction is still in progress` atau `Amount is different please try again later`.

Sumber: [Duitku POP API — Respons Create Invoice dan error](https://docs.duitku.com/pop/id/).

## 5. Callback pembayaran HTTP

Dokumentasi POP menjelaskan callback pembayaran dengan:
- Metode HTTP POST.
- Content type `application/x-www-form-urlencoded`.
- Parameter seperti `merchantCode`, `amount`, `merchantOrderId`, `productDetail`, `paymentCode`, `resultCode`, `reference`, dan `signature`; parameter lain dapat muncul sesuai transaksi/metode.

### Signature callback

Formula yang dicantumkan dokumentasi POP:

```text
stringToSign = merchantCode + amount + merchantOrderId
signature = HMAC_SHA256(stringToSign, apiKey)
```

Dokumentasi menyatakan `resultCode = "00"` berarti sukses dan `resultCode = "01"` berarti gagal pada tabel callback tersebut. Signature callback perlu dihitung sesuai formula dokumentasi dengan API key merchant.

Dokumentasi menyebut URL callback publik mungkin diperlukan agar server Duitku dapat mengirimkan notifikasi. Jika server tidak menerima callback dengan respons HTTP 200, Duitku akan mengirim ulang callback. Dokumentasi menyebut hingga maksimum 5 kali percobaan; setelah itu, pemberitahuan callback gagal dikirim melalui email, dan callback dapat dikirim ulang melalui fitur resend pada menu laporan dashboard Duitku.

Sumber: [Duitku POP API — Callback](https://docs.duitku.com/pop/id/).

## 6. JavaScript callback dan window redirection

Dokumentasi POP secara eksplisit menyatakan bahwa hasil JavaScript callback hanya boleh digunakan untuk memberi notifikasi pembayaran kepada pelanggan dan **tidak diperkenankan digunakan untuk mengubah status transaksi pada sistem merchant**. Untuk tujuan tersebut, Duitku menyediakan HTTP Callback.

Dokumentasi juga menjelaskan opsi window redirection menggunakan nilai `paymentUrl` dari respons Create Invoice. Dengan opsi ini, pelanggan diarahkan ke halaman pembayaran Duitku tanpa harus menyertakan `duitku.js` pada halaman situs.

Sumber: [Duitku POP API — JS Callback dan Window Redirection](https://docs.duitku.com/pop/id/).

## 7. Refund

FAQ Duitku menyatakan bahwa Duitku belum menyediakan layanan refund transaksi secara umum dan proses refund ditangani oleh merchant. FAQ juga menjelaskan prosedur tertentu untuk transaksi kartu kredit, termasuk jalur melalui dashboard atau pengajuan ke Duitku, bergantung pada jenis layanan kartu kredit.

Karena prosedur berbeda menurut jenis layanan/metode, ikuti bagian refund pada FAQ dan ketentuan akun yang relevan; jangan mengasumsikan satu prosedur berlaku untuk seluruh kanal pembayaran.

Sumber: [FAQ Duitku — Refund](https://www.duitku.com/frequently-asked-questions/).

## 8. Sumber resmi yang digunakan

1. **FAQ Duitku:** https://www.duitku.com/frequently-asked-questions/
   - Ketentuan website/aplikasi, dokumen legal, kategori bisnis, HTTPS, mata uang, dan refund.
2. **Duitku POP API Reference (Bahasa Indonesia):** https://docs.duitku.com/pop/id/
   - Create Invoice, parameter request, signature, callback, JS callback, window redirection, respons, dan error.
3. **Duitku Account Documentation:** https://docs.duitku.com/account/#aktivasi-akun
   - Rujukan FAQ untuk dokumen dan aktivasi akun merchant.

## 9. Batas cakupan dokumen

Dokumen ini hanya merangkum ketentuan yang ditemukan pada halaman resmi di atas saat diperiksa pada 15 Oktober 2026. Dokumen ini **tidak** menetapkan:
- Apakah website Asri Collection saat ini lulus atau gagal.
- Apakah kode aplikasi atau integrasi sudah benar.
- Apakah akun merchant atau kanal pembayaran sudah disetujui/aktif.
- Kewajiban halaman privasi, pengiriman, pembatalan, atau syarat dan ketentuan yang tidak dinyatakan dalam sumber resmi yang dirujuk di sini.
- Rekomendasi arsitektur database, keamanan umum, atau skema backend yang tidak secara eksplisit ditetapkan oleh dokumentasi Duitku.

Untuk memastikan kesiapan website atau integrasi tertentu, lakukan audit terpisah dengan bukti aktual. Jangan menyebut rekomendasi umum sebagai persyaratan resmi Duitku tanpa sumber resmi yang menyatakannya.
