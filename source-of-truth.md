# Duitku Integration — Source of Truth

Dokumen ini menetapkan sumber rujukan untuk analisis, requirement, implementasi, pengujian, dan verifikasi integrasi Duitku pada Asri Collection. Dokumentasi resmi Duitku menjadi acuan utama untuk kontrak teknis. Demo sandbox hanya digunakan untuk eksplorasi dan pengujian, bukan sebagai pengganti kontrak resmi.

## 1. Daftar Referensi

| Referensi | Tujuan | Penggunaan | Prioritas dan batasan |
|---|---|---|---|
| [Duitku POP](https://docs.duitku.com/pop/id/) | Dokumentasi integrasi Duitku POP, termasuk Create Invoice, frontend, backend, callback, redirect, dan metode pembayaran | Acuan utama bila implementasi menggunakan Duitku POP | **Sumber utama untuk POP.** Ikuti endpoint, parameter, signature, alur, dan batasan yang terdokumentasi. |
| [Duitku API](https://docs.duitku.com/api/id/) | Kontrak integrasi API pembayaran Duitku, termasuk permintaan transaksi, daftar metode pembayaran, callback, dan redirect | Acuan khusus bila implementasi menggunakan API Duitku yang dijelaskan di dokumentasi ini | **Sumber resmi khusus API.** Jangan mencampur kontrak API dengan POP tanpa memastikan keduanya memang berlaku untuk alur yang dipilih. |
| [Demo Duitku POP](https://api-sandbox.duitku.com/demoduitku/) | Eksplorasi demo POP pada lingkungan sandbox | Pembelajaran dan uji coba alur POP | Demo untuk pengujian; bukan sumber final untuk kontrak API, persyaratan merchant, atau konfigurasi produksi. |
| [Demo Duitku API](https://sandbox.duitku.com/payment/demopage.aspx) | Halaman demo pembayaran sandbox | Referensi visual dan pengujian alur pembayaran sandbox | Bukan bukti bahwa metode pembayaran aktif untuk merchant tertentu atau bahwa integrasi produksi sudah benar. |
| [Payment Method List — POP](https://docs.duitku.com/pop/id/#payment-method) | Daftar kode metode pembayaran yang dijelaskan pada dokumentasi POP | Memahami kode `paymentMethod` dan memvalidasi pemetaan kode pada implementasi POP | Daftar dokumentasi bukan jaminan seluruh kanal aktif pada akun merchant. Verifikasi kanal yang tersedia untuk merchant dan lingkungan terkait. |

## 2. Aturan Pemilihan Sumber

1. **Tentukan produk integrasi terlebih dahulu.** Jika requirement memilih Duitku POP, gunakan dokumentasi POP sebagai kontrak utama. Jika memilih API Duitku, gunakan dokumentasi API untuk kontrak alur tersebut.
2. **Jangan menyamakan POP dan API secara otomatis.** Parameter request, proses frontend, signature, callback, dan status harus diverifikasi pada dokumentasi produk yang sedang digunakan.
3. Jika informasi demo berbeda dari dokumentasi resmi, utamakan dokumentasi resmi untuk kontrak integrasi. Catat perbedaan tersebut dan verifikasi melalui pengujian sandbox atau konfirmasi resmi Duitku jika dokumentasinya tidak jelas.
4. Untuk perubahan atau ketidakjelasan yang berdampak pada transaksi, keamanan, atau kepatuhan merchant, jangan menebak. Tandai sebagai **belum terverifikasi** sampai ada bukti yang memadai.
5. Dokumentasi payment method digunakan untuk memahami kode. Untuk pilihan kanal yang benar-benar dapat digunakan, utamakan data kanal aktif yang disediakan Duitku untuk merchant dan lingkungan terkait, jika tersedia melalui mekanisme resmi.

## 3. Persyaratan Keamanan yang Harus Diperhatikan

- **Rahasiakan API key.** Simpan kredensial Duitku di sisi server atau secret manager yang sesuai. Jangan menaruh API key di kode frontend, bundle browser, repository publik, atau log yang dapat diakses pengguna.
- **Buat request pembayaran di backend.** Backend harus memvalidasi pesanan dan jumlah pembayaran sebelum mengirim request ke Duitku.
- **Validasi signature callback di backend** sesuai formula dan algoritme yang ditetapkan dokumentasi untuk produk Duitku yang dipakai. Jangan menggunakan formula dari produk atau versi lain tanpa verifikasi.
- **Jangan menjadikan hasil JavaScript callback atau URL redirect sebagai bukti pembayaran.** Keduanya dapat dipakai untuk pengalaman pengguna, tetapi perubahan status pembayaran harus berdasarkan notifikasi server yang tervalidasi dan/atau mekanisme verifikasi status resmi yang sesuai.
- **Proses callback secara idempoten.** Callback dapat dikirim ulang. Pemrosesan berulang tidak boleh menggandakan perubahan status, pengurangan stok, atau efek transaksi lainnya.
- **Cocokkan transaksi sebelum mengubah status.** Validasi sekurang-kurangnya identitas order, nominal, merchant, referensi transaksi, signature, dan result code sesuai kontrak resmi.
- **Tangani respons gagal dan status yang belum final.** Jangan menyamakan respons request invoice yang berhasil dibuat dengan pembayaran yang telah berhasil.
- **Gunakan endpoint dan kredensial sesuai lingkungan.** Sandbox dan production tidak boleh tertukar. Jangan beralih ke production tanpa persetujuan dan verifikasi konfigurasi.

Daftar di atas merupakan aturan rekayasa keamanan untuk penerapan integrasi. Detail teknis yang spesifik—termasuk formula signature, nama header, format payload, result code, serta endpoint—harus selalu diperiksa pada dokumentasi resmi produk yang dipilih.

## 4. Alur Referensi per Area

| Area | Referensi utama | Hal yang perlu diverifikasi |
|---|---|---|
| Pemilihan POP atau API | Dokumentasi POP atau API sesuai keputusan integrasi | Produk, alur checkout, dan kontrak yang benar-benar digunakan |
| Membuat invoice/transaksi | Dokumentasi resmi produk yang dipilih | Endpoint, HTTP method, headers, signature request, parameter wajib, respons, dan penanganan error |
| Frontend pembayaran | Duitku POP bila menggunakan POP; dokumentasi API bila menggunakan alur API | Cara memulai pembayaran, event frontend, redirect, dan batas kepercayaan pada hasil browser |
| Callback server | Dokumentasi resmi produk yang dipilih | HTTP method, content type, field, signature, respons HTTP yang diwajibkan, retry, dan result code |
| Redirect/return URL | Dokumentasi resmi produk yang dipilih | Parameter redirect dan larangan menganggap parameter browser sebagai bukti pembayaran |
| Metode pembayaran | Daftar metode pada dokumentasi produk serta sumber kanal aktif merchant bila tersedia | Kode, kanal yang aktif, biaya, dan kecocokan dengan lingkungan |
| Uji coba | Demo dan endpoint sandbox resmi | Hasil uji, perilaku error, callback, dan pemisahan sandbox/production |
| Persyaratan merchant/website | Ketentuan dan kebijakan resmi Duitku yang relevan | Status website, informasi bisnis, dan persyaratan aktivasi merchant; jangan menyimpulkan kelulusan hanya dari demo teknis |

## 5. Aturan Dokumentasi dan Audit

Untuk setiap requirement atau temuan audit yang terkait Duitku, catat:

- **Klaim atau requirement** yang akan diterapkan.
- **Sumber** berupa URL resmi dan bagian/topik yang relevan.
- **Klasifikasi**: persyaratan resmi, rekomendasi engineering, atau asumsi yang belum diverifikasi.
- **Lingkup**: frontend, backend, database, konfigurasi merchant, atau proses operasional.
- **Bukti**: kode, konfigurasi, hasil pengujian, atau dokumentasi yang mendukung status.
- **Status**: lulus, gagal, atau belum diverifikasi.

Jangan menyatakan website, akun merchant, callback, atau integrasi telah memenuhi persyaratan hanya karena URL dokumentasi tersedia atau demo sandbox dapat dibuka.

## 6. Batasan Dokumen

- Dokumen ini menetapkan hierarki sumber dan aturan penggunaannya; dokumen ini **bukan** bukti bahwa implementasi saat ini sudah sesuai.
- Kode metode pembayaran dan ketersediaan kanal dapat berubah. Periksa dokumentasi resmi terkini dan kanal yang aktif untuk merchant.
- Contoh payload atau kode dari dokumentasi harus disesuaikan secara aman dengan stack aplikasi; jangan menyalin contoh secara membabi buta ke produksi.
- Jika dokumentasi tidak menjelaskan suatu perilaku dengan cukup jelas, tandai sebagai belum terverifikasi dan minta klarifikasi resmi Duitku atau lakukan pengujian sandbox yang terkontrol.

## 7. Tautan Resmi

- POP: https://docs.duitku.com/pop/id/
- API: https://docs.duitku.com/api/id/
- Demo POP: https://api-sandbox.duitku.com/demoduitku/
- Demo API: https://sandbox.duitku.com/payment/demopage.aspx
- Payment Method List (POP): https://docs.duitku.com/pop/id/#payment-method
