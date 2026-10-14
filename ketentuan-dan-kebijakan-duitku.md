# Ketentuan dan Kebijakan Duitku untuk Pembuatan Website

- **Tanggal penyusunan:** 14 Oktober 2026
- **Penyedia pembayaran:** Duitku
- **Integrasi acuan:** Duitku POP API
- **Tujuan:** Referensi audit website dan integrasi pembayaran merchant.

> **Penting:** Dokumen ini memisahkan ketentuan yang dinyatakan dalam sumber resmi Duitku, rekomendasi implementasi, dan hal yang masih perlu dikonfirmasi. Ini bukan persetujuan merchant, nasihat hukum, atau pengganti perjanjian merchant. Periksa sumber resmi terbaru sebelum produksi.

## 1. Klasifikasi

| Label | Makna |
|---|---|
| **Persyaratan resmi** | Ketentuan yang dinyatakan oleh sumber resmi Duitku yang dirujuk. |
| **Rekomendasi** | Praktik implementasi website/keamanan yang disarankan, tetapi tidak otomatis merupakan kewajiban Duitku. |
| **Perlu konfirmasi** | Hal yang dapat bergantung pada kontrak merchant, jenis bisnis, kanal pembayaran, atau konfigurasi akun. |

## 2. Sumber resmi

1. Duitku FAQ: https://www.duitku.com/frequently-asked-questions/
2. Duitku POP API: https://docs.duitku.com/pop/id/
3. Duitku Account Documentation: https://docs.duitku.com/account/
4. Duitku Payment Gateway Overview: https://docs.duitku.com/payment-gateway/overview/
5. Duitku Privacy Policy: https://www.duitku.com/kebijakan-privasi/
6. Duitku Knowledge Base: https://knowledge.duitku.com/umum

Sumber teknis digunakan untuk integrasi API; FAQ dan dokumentasi akun digunakan untuk persyaratan merchant. Ketentuan kontrak atau arahan resmi yang berlaku khusus pada merchant dapat menambahkan persyaratan.

---

# BAGIAN A — PERSYARATAN RESMI DUITKU

Bagian ini merangkum hal yang dinyatakan oleh sumber resmi yang dirujuk. Ringkasan bukan pengganti membaca dokumentasi lengkap.

## A1. Website dan informasi bisnis

**Menurut FAQ Duitku:**
- Website yang didaftarkan harus aktif dan dipublikasikan.
- FAQ menyebut website bukan sekadar tautan marketplace, media sosial, atau subdomain platform pembuat website.
- Untuk aplikasi, FAQ menyebut aplikasi harus telah dipublikasikan di App Store atau Play Store.
- Informasi bisnis dan produk/jasa yang dijual harus dijelaskan secara jelas.
- Informasi kontak yang disebutkan meliputi nomor telepon, alamat, dan email.
- Produk atau jasa harus sesuai dengan izin usaha yang berlaku bagi merchant.

Sumber: https://www.duitku.com/frequently-asked-questions/

Pemenuhan poin ini tidak menjamin pengajuan merchant otomatis disetujui.

## A2. Kategori yang tidak diterima

FAQ Duitku menyebut kategori yang tidak dilayani, termasuk:
- Konten pornografi atau “XXX”.
- Perjudian.
- Persenjataan.
- Narkoba dan perlengkapannya.
- Produk atau jasa ilegal maupun terlarang.
- Telemarketing berisiko tinggi terkait horoskop, prediksi, ramalan, atau sejenisnya.
- Produk replika.

Sumber: https://www.duitku.com/frequently-asked-questions/

Daftar ini mengikuti kategori yang disebutkan di FAQ dan tidak boleh dianggap sebagai daftar lengkap seluruh pembatasan kontrak. Jika produk atau model bisnis meragukan, minta konfirmasi tertulis dari Duitku sebelum pengajuan.

## A3. HTTPS

FAQ Duitku menyebut HTTPS tidak diwajibkan dalam persyaratan yang dijelaskan di FAQ tersebut, tetapi direkomendasikan.

- **Status menurut FAQ yang dirujuk:** direkomendasikan, bukan dinyatakan wajib dalam FAQ itu.
- **Catatan:** kewajiban lain dapat timbul dari hukum, kontrak merchant, atau aturan yang berlaku pada layanan tertentu.

Sumber: https://www.duitku.com/frequently-asked-questions/

## A4. Mata uang dan nominal

FAQ Duitku menyatakan transaksi diproses dalam Rupiah (IDR) dan menyarankan agar nominal transaksi tidak menggunakan desimal untuk mengurangi risiko transaksi tertunda dari pihak bank.

Sumber: https://www.duitku.com/frequently-asked-questions/

Format tampilan seperti `Rp150.000` berbeda dari nilai yang dikirim ke API. Format parameter harus mengikuti spesifikasi endpoint.

## A5. Pendaftaran dan dokumen merchant

FAQ Duitku menjelaskan pendaftaran, verifikasi, dan contoh dokumen untuk merchant personal maupun perusahaan. Dokumen yang berlaku dapat berbeda menurut bentuk usaha dan proses verifikasi.

Sumber: https://www.duitku.com/frequently-asked-questions/

Jangan menganggap contoh dokumen sebagai daftar universal. Ikuti instruksi dashboard merchant dan konfirmasi langsung jika ada keraguan.

## A6. Duitku POP — Create Invoice

Dokumentasi POP mendeskripsikan Create Invoice melalui HTTP POST.

- **Sandbox:** `https://api-sandbox.duitku.com/api/merchant/createInvoice`
- **Produksi:** `https://api-prod.duitku.com/api/merchant/createInvoice`

Dokumentasi mencantumkan header seperti:
- `x-duitku-timestamp`
- `x-duitku-signature`
- `x-duitku-merchantcode`

Formula signature request yang didokumentasikan:

```text
stringToSign = merchantCode + timestamp
signature = HMAC_SHA256(stringToSign, apiKey)
```

Ikuti format, tipe data, dan aturan terbaru pada API Reference untuk endpoint serta versi integrasi yang digunakan.

Sumber: https://docs.duitku.com/pop/id/

## A7. Parameter transaksi

Dokumentasi POP mencantumkan parameter seperti `paymentAmount`, `merchantOrderId`, `productDetails`, `callbackUrl`, `returnUrl`, `itemDetails`, `customerDetail`, `paymentMethod`, dan `expiryPeriod`, sesuai fitur yang digunakan.

Dokumentasi menyatakan transaksi baru harus menggunakan `merchantOrderId` yang baru. Jika `itemDetails` dikirim, total `paymentAmount` harus sesuai dengan rincian barang berdasarkan aturan API.

Sumber: https://docs.duitku.com/pop/id/

Parameter wajib dan opsional harus diperiksa kembali pada dokumentasi terbaru.

## A8. Callback pembayaran

Dokumentasi POP menjelaskan callback HTTP POST ke `callbackUrl`. Format callback yang didokumentasikan menggunakan `application/x-www-form-urlencoded`.

Formula signature callback yang didokumentasikan:

```text
stringToSign = merchantCode + amount + merchantOrderId
signature = HMAC_SHA256(stringToSign, apiKey)
```

Dokumentasi POP menggunakan `resultCode = "00"` untuk menunjukkan transaksi berhasil pada callback yang dijelaskan. Nilai tersebut harus dinilai bersama validasi signature dan kecocokan data transaksi.

Dokumentasi juga menjelaskan respons HTTP 200 OK untuk callback yang diproses dengan benar. Implementasikan respons dan penanganan error sesuai petunjuk callback terbaru.

Sumber: https://docs.duitku.com/pop/id/

## A9. Redirect dan JavaScript callback

Dokumentasi Duitku memperingatkan bahwa JavaScript callback tidak boleh dipakai untuk mengubah status pembayaran di sistem merchant dan bahwa parameter URL redirect dapat diubah oleh pelanggan.

Sumber: https://docs.duitku.com/pop/id/

Redirect browser bukan bukti pembayaran yang sah untuk menetapkan pesanan lunas.

## A10. Refund

FAQ Duitku menyatakan bahwa refund transaksi ditangani oleh merchant.

Sumber: https://www.duitku.com/frequently-asked-questions/

Detail prosedur, tenggat, dan metode refund harus mengikuti perjanjian merchant serta ketentuan yang berlaku. Jangan mengasumsikan fitur refund otomatis tersedia untuk semua akun.

---

# BAGIAN B — REKOMENDASI IMPLEMENTASI WEBSITE

Bagian ini berisi praktik yang disarankan untuk website e-commerce. Poin-poin ini **bukan persyaratan eksplisit Duitku**, kecuali dikonfirmasi secara terpisah oleh dokumentasi, kontrak merchant, atau arahan resmi.

## B1. Halaman website yang disarankan

- Beranda dan katalog produk.
- Detail produk, varian, dan harga.
- Keranjang dan checkout.
- Halaman status pesanan/pembayaran.
- Kontak.
- Informasi pengiriman.
- Syarat dan ketentuan.
- Kebijakan privasi.
- Kebijakan pembatalan dan refund.

Daftar ini adalah rekomendasi transparansi e-commerce, bukan daftar halaman wajib Duitku yang telah diverifikasi satu per satu.

## B2. Informasi produk

Sebaiknya tampilkan nama dan deskripsi produk yang akurat, harga IDR, foto relevan, varian/spesifikasi, stok bila relevan, serta informasi pengiriman dan pembelian. Pastikan konten sesuai dengan produk yang benar-benar dijual dan informasi bisnis yang diajukan.

## B3. Kebijakan privasi

Disarankan menjelaskan:
- Data yang dikumpulkan dan tujuan penggunaannya.
- Cara data disimpan dan dilindungi.
- Pihak yang menerima data jika relevan.
- Masa penyimpanan.
- Hak pelanggan sesuai ketentuan yang berlaku.
- Kontak untuk pertanyaan privasi.

Kebijakan privasi Duitku mengatur pemrosesan data dalam layanan Duitku; itu bukan pengganti kebijakan privasi merchant. Isi kebijakan website harus sesuai praktik aktual dan hukum perlindungan data yang berlaku.

## B4. Syarat dan ketentuan

Disarankan menjelaskan identitas penjual, proses pembelian, pembayaran, pemrosesan pesanan, pengiriman, pembatalan, refund, penanganan keluhan, dan kontak dukungan. Pastikan isinya sesuai praktik bisnis dan hukum yang berlaku.

## B5. Pengiriman

Untuk produk fisik, jelaskan wilayah pengiriman, cara menghitung ongkos kirim, estimasi pengiriman, pemrosesan pesanan, pelacakan kiriman, dan cara menangani kiriman bermasalah.

## B6. Keamanan API dan secret

- Simpan API Key dan secret di backend, bukan di HTML atau JavaScript publik.
- Simpan kredensial di secret manager/environment server.
- Pisahkan kredensial sandbox dan produksi.
- Jangan mencetak secret ke log atau menaruhnya di repository publik.
- Batasi akses administratif dan ganti kredensial jika diduga bocor.

Ini adalah rekomendasi keamanan untuk melindungi kredensial dan transaksi merchant.

## B7. Validasi transaksi di backend

Backend sebaiknya menghitung ulang harga, diskon, kuantitas, stok, ongkos kirim, dan total pembayaran dari data tepercaya. Jangan langsung mempercayai nilai total yang dikirim browser.

Sebelum mengubah status pembayaran, periksa signature callback, ID pesanan, nominal, referensi transaksi, dan kecocokan dengan catatan pesanan.

## B8. Idempotensi dan konsistensi

Disarankan agar:
- Setiap pesanan memiliki ID unik.
- Referensi transaksi Duitku disimpan.
- Callback berulang tidak membuat pesanan baru atau mengurangi stok dua kali.
- Pembayaran berhasil tidak diproses ulang.
- Perubahan status dan stok dilakukan secara atomik atau dengan mekanisme konsistensi yang sesuai.
- Transaksi kedaluwarsa atau dibatalkan ditangani sesuai status yang terverifikasi.

Ini adalah rekomendasi desain backend, bukan kewajiban memakai skema tabel tertentu dari Duitku.

## B9. Pengujian sandbox

Sebelum produksi, uji pembuatan invoice, signature tidak valid, pembayaran berhasil/gagal/kedaluwarsa, callback valid/tidak valid/berulang, nominal tidak cocok, pesanan tidak ditemukan, pelanggan menutup halaman pembayaran, dan konsistensi status pesanan serta stok.

Pengujian sandbox tidak membuktikan semua kanal pembayaran produksi telah aktif.

## B10. Arsitektur Supabase (jika digunakan)

| Komponen | Tanggung jawab yang disarankan |
|---|---|
| Frontend | Katalog, keranjang, checkout, dan tampilan status |
| Supabase Database | Produk, pesanan, pembayaran, dan catatan transaksi |
| Supabase Edge Functions | Create Invoice, validasi callback, operasi backend |
| Supabase Secrets | Kredensial server |
| RLS dan hak akses | Membatasi akses data berdasarkan pengguna/peran |
| Transaksi database | Menjaga konsistensi perubahan status dan stok |

Duitku tidak mewajibkan penggunaan Supabase atau skema tabel tertentu dalam dokumentasi POP.

---

# BAGIAN C — PERLU DIKONFIRMASI

Jangan mengklasifikasikan hal-hal berikut sebagai persyaratan resmi tanpa bukti dari Duitku atau kontrak merchant:

| Topik | Yang perlu dikonfirmasi |
|---|---|
| Halaman kebijakan website | Halaman mana yang diwajibkan untuk jenis merchant terkait |
| Legalitas | Dokumen yang tepat untuk bentuk usaha |
| Produk terbatas | Apakah kategori produk tertentu diterima |
| Batas transaksi | Minimum dan maksimum per kanal |
| Biaya transaksi | Tarif yang berlaku untuk merchant |
| Kedaluwarsa invoice | Batas dan dukungan `expiryPeriod` pada integrasi aktif |
| Kanal pembayaran | Metode yang disetujui dan aktif |
| Refund | Prosedur, tenggat, dan metode yang berlaku |
| Produksi | Persyaratan akhir dan status persetujuan merchant |
| Ketentuan tambahan | Persyaratan kontrak atau komunikasi resmi Duitku |

Jika dokumentasi publik tidak cukup jelas, mintalah konfirmasi tertulis dari Duitku.

---

# BAGIAN D — CHECKLIST AUDIT

## D1. Persyaratan resmi untuk diverifikasi

- [ ] Website memenuhi persyaratan pendaftaran Duitku.
- [ ] Informasi bisnis dan kontak tersedia.
- [ ] Produk sesuai izin usaha dan bukan kategori yang ditolak.
- [ ] Dokumen merchant disiapkan sesuai instruksi Duitku.
- [ ] Lingkungan dan kredensial yang digunakan sesuai.
- [ ] Create Invoice mengikuti dokumentasi resmi.
- [ ] Signature request mengikuti formula yang berlaku.
- [ ] Callback divalidasi sesuai dokumentasi.
- [ ] Redirect/JavaScript tidak dijadikan bukti pembayaran.
- [ ] Nominal dan identitas transaksi sesuai ketentuan API.
- [ ] Prosedur refund mengikuti ketentuan merchant.

## D2. Rekomendasi implementasi

- [ ] HTTPS diterapkan.
- [ ] Informasi produk dan harga jelas.
- [ ] Kebijakan privasi sesuai praktik pemrosesan data.
- [ ] Syarat dan ketentuan tersedia.
- [ ] Informasi pengiriman tersedia.
- [ ] Kebijakan pembatalan/refund tersedia.
- [ ] API Key disimpan di backend.
- [ ] Total dihitung ulang di backend.
- [ ] Callback handler idempoten.
- [ ] Status pembayaran dan stok konsisten.
- [ ] Pengujian sandbox selesai.
- [ ] Logging dan rekonsiliasi tersedia.

## D3. Konfirmasi sebelum produksi

- [ ] Hal yang belum jelas telah dikonfirmasi kepada Duitku.
- [ ] Kanal pembayaran yang diperlukan telah aktif.
- [ ] Persyaratan aktivasi produksi telah dipenuhi.
- [ ] Pengujian akhir selesai sebelum transaksi nyata.

---

# Referensi

1. Duitku FAQ — https://www.duitku.com/frequently-asked-questions/
2. Duitku POP API — https://docs.duitku.com/pop/id/
3. Duitku Account Documentation — https://docs.duitku.com/account/
4. Duitku Payment Gateway Overview — https://docs.duitku.com/payment-gateway/overview/
5. Duitku Privacy Policy — https://www.duitku.com/kebijakan-privasi/
6. Duitku Knowledge Base — https://knowledge.duitku.com/umum

**Catatan pemutakhiran:** tanggal penyusunan tidak menjamin semua sumber telah diperbarui pada tanggal tersebut. Periksa dokumentasi terbaru dan konfirmasikan persyaratan merchant sebelum produksi.
