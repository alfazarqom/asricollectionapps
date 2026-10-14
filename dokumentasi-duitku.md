# Dokumentasi Duitku — Asri Collection

> **Status dokumen:** referensi integrasi dan checklist verifikasi  
> **Terakhir ditinjau:** 15 Oktober 2026  
> **Produk yang dituju:** Duitku POP (Payment Page / Popup)  
> **Bahasa utama:** Indonesia  
>
> Dokumen ini merangkum dokumentasi resmi Duitku yang dirujuk di bagian Sumber Resmi. Dokumentasi Duitku adalah sumber kebenaran untuk kontrak provider. Detail yang dapat berubah (kanal pembayaran, skema request/response, batasan akun, dan konfigurasi merchant) harus diperiksa kembali pada dokumentasi dan Merchant Portal sebelum rilis. Dokumen ini bukan bukti bahwa akun merchant atau integrasi Asri Collection telah disetujui atau berhasil diuji.

## 1. Sumber resmi

| Topik | URL resmi |
|---|---|
| Dokumentasi Duitku POP — Indonesia | https://docs.duitku.com/pop/id/ |
| Dokumentasi Duitku POP — English | https://docs.duitku.com/pop/en/ |
| Dokumentasi Duitku API V2 — Indonesia | https://docs.duitku.com/api/id/ |
| Dokumentasi Duitku API V2 — English | https://docs.duitku.com/api/en/ |
| API Browser dan perbedaan POP vs V2 | https://docs.duitku.com/payment-gateway/api-browser/ |
| Dokumentasi utama semua produk | https://docs.duitku.com/ |
| FAQ Duitku — Indonesia | https://www.duitku.com/frequently-asked-questions/ |
| FAQ Duitku — English | https://www.duitku.com/en/frequently-asked-questions/ |
| Website resmi Duitku | https://www.duitku.com/ |

**Prioritas sumber:** gunakan dokumentasi endpoint/produk yang benar-benar dipilih (POP) untuk kontrak teknis POP. Gunakan FAQ resmi untuk persyaratan pendaftaran dan website merchant. Jangan mencampur endpoint, header, atau format signature POP dengan API V2 hanya karena keduanya merupakan produk Duitku.

## 2. Pemilihan produk dan alur POP

Duitku POP menyediakan alur checkout yang mengembalikan referensi transaksi dari server Duitku, lalu menampilkan halaman pembayaran di pengalaman checkout merchant melalui pustaka JavaScript POP. Dokumentasi juga menyediakan opsi pengalihan browser ke halaman pembayaran Duitku menggunakan `paymentUrl` dari respons Create Invoice.

Alur umum:

1. Pelanggan mengonfirmasi checkout di website merchant.
2. **Backend merchant** memvalidasi order, harga, ongkir, diskon, dan total akhir dari sumber data tepercaya.
3. Backend membuat ID order merchant yang unik dan mengirim request Create Invoice ke endpoint POP.
4. Duitku mengembalikan referensi transaksi serta data pembayaran yang didokumentasikan.
5. Frontend menampilkan POP sesuai panduan resmi, atau mengarahkan pelanggan ke `paymentUrl` jika memakai alur redirect.
6. Duitku mengirim **HTTP callback ke backend merchant** untuk menyampaikan hasil transaksi.
7. Backend memvalidasi signature callback, mencocokkan order dan nominal, kemudian memproses status secara aman dan idempoten.
8. Frontend dapat menampilkan status dari backend merchant. Jangan menganggap halaman redirect atau callback JavaScript di browser sebagai bukti pembayaran.

### POP vs API V2

| Aspek | POP | API V2 |
|---|---|---|
| Dokumentasi rujukan | [POP Indonesia](https://docs.duitku.com/pop/id/) | [API Indonesia](https://docs.duitku.com/api/id/) |
| Tujuan | Alur pembayaran POP/checkout yang dijelaskan pada dokumentasi POP | Kontrak produk API V2 yang didokumentasikan terpisah |
| Ketentuan integrasi | Ikuti endpoint, header, payload, signature, callback, dan alur POP | Ikuti dokumentasi API V2 secara khusus |
| Aturan | Jangan mengambil detail implementasi dari V2 lalu menganggapnya berlaku pada POP tanpa konfirmasi dokumentasi | Jangan menganggap seluruh detail POP otomatis berlaku pada V2 |

Untuk implementasi Asri Collection yang dinyatakan memakai POP, rujukan teknis utama adalah dokumentasi POP. Konfirmasikan pilihan final antara popup JavaScript dan redirect sebelum implementasi; keduanya adalah pilihan tampilan checkout, bukan pengganti verifikasi callback server.

## 3. Endpoint Create Invoice POP

Dokumentasi POP mencantumkan:

| Environment | HTTP method | Endpoint |
|---|---|---|
| Sandbox | POST | `https://api-sandbox.duitku.com/api/merchant/createInvoice` |
| Production | POST | `https://api-prod.duitku.com/api/merchant/createInvoice` |

Request menggunakan `Content-Type: application/json`. Gunakan endpoint sandbox dan kredensial sandbox untuk pengembangan serta pengujian. Jangan mengirim transaksi uji ke endpoint production.

### 3.1 Header autentikasi

Dokumentasi POP menjelaskan header berikut:

| Header | Wajib | Keterangan |
|---|---:|---|
| `Content-Type` | Ya | `application/json` |
| `x-duitku-timestamp` | Ya | Timestamp UNIX dalam milidetik |
| `x-duitku-signature` | Ya | HMAC-SHA256 sesuai formula POP |
| `merchantCode` | Ya | Merchant code yang diberikan Duitku |

Formula signature request Create Invoice POP:

```text
stringToSign = merchantCode + timestamp
signature = HMAC_SHA256(stringToSign, apiKey)
```

Ikuti persis urutan string, satuan timestamp, encoding, dan format output signature yang dijelaskan dokumentasi resmi. Dokumentasi menampilkan output HMAC dalam format hexadecimal lowercase. Jangan memakai formula signature callback untuk header request, atau sebaliknya.

**Keamanan kredensial:**
- `apiKey`/merchant key harus disimpan hanya di backend/secret manager.
- Jangan menaruh API key atau membuat signature rahasia di JavaScript frontend.
- Jangan menulis kredensial, signature sensitif, atau payload berisi data pribadi ke log yang tidak terlindungi.
- Pisahkan kredensial dan endpoint sandbox dari production.

### 3.2 Parameter request Create Invoice

Payload POP menggunakan JSON. Field yang umum ditunjukkan oleh dokumentasi meliputi:

| Field | Peran / ketentuan |
|---|---|
| `paymentAmount` | Jumlah pembayaran dalam rupiah. Harus konsisten dengan total rincian item sesuai dokumentasi. |
| `merchantOrderId` | ID order dari merchant; wajib unik untuk setiap transaksi baru. |
| `productDetails` | Deskripsi produk/layanan yang dibayar. |
| `additionalParam` | Parameter tambahan opsional; bila digunakan, dokumentasi meminta nilainya URL-encoded. |
| `merchantUserInfo` | Informasi pengguna merchant sesuai kebutuhan integrasi. |
| `paymentMethod` | Kode metode pembayaran bila merchant ingin menentukan metode tertentu; bila kosong/diabaikan sesuai skema, ikuti perilaku yang didokumentasikan. |
| `customerVaName` | Nama yang ditampilkan untuk pembayaran tertentu. |
| `email`, `phoneNumber` | Kontak pelanggan sesuai field dan aturan yang berlaku. |
| `itemDetails` | Rincian item, dengan nama, harga, dan kuantitas. |
| `customerDetail` | Data pelanggan, termasuk detail billing/shipping sesuai skema POP. |
| `callbackUrl` | URL publik backend merchant untuk menerima HTTP callback. |
| `returnUrl` | URL tujuan setelah alur pembayaran selesai/dibatalkan. Bukan bukti pembayaran. |
| `expiryPeriod` | Masa berlaku transaksi dalam menit; opsional sesuai dokumentasi dan batas yang diterima Duitku. |
| `creditCardDetail` | Detail opsional untuk alur kartu kredit tertentu; persyaratan khusus berlaku pada transaksi tokenisasi. |

Daftar di atas adalah ringkasan, bukan pengganti schema lengkap. Sebelum implementasi, cocokkan tipe data, panjang maksimum, field wajib/opsional, struktur nested, aturan validasi, dan contoh response langsung dengan bagian Create Invoice POP terbaru.

Dokumentasi POP mengingatkan bahwa `paymentAmount` harus sama dengan total nominal `itemDetails`, dan setiap request transaksi baru harus memakai `merchantOrderId` yang baru. Untuk transaksi tokenisasi kartu tertentu (misalnya kode yang disebutkan dokumentasi), field tambahan dapat menjadi wajib; jangan mengaktifkan fitur tersebut tanpa meninjau persyaratan khususnya.

### 3.3 Respons Create Invoice

Simpan respons provider yang diperlukan untuk rekonsiliasi, terutama reference transaksi Duitku dan URL pembayaran bila dikembalikan. Dokumentasi POP menyebut `paymentUrl` sebagai opsi untuk window redirection. Perlakukan nama dan bentuk field berdasarkan response schema aktual untuk endpoint yang dipakai.

Simpan relasi yang dapat ditelusuri antara:
- ID order internal;
- `merchantOrderId`;
- reference transaksi Duitku;
- nominal dan mata uang;
- metode pembayaran yang dipilih;
- status pembayaran internal dan status provider;
- waktu dibuat dan waktu kedaluwarsa, jika tersedia.

Jangan mempercayai nilai total dari browser; backend harus mengambil atau menghitung ulang total order sebelum membuat invoice.

## 4. Menampilkan pembayaran: POP JavaScript atau redirect

### 4.1 POP JavaScript

Ikuti petunjuk pemasangan dan pemanggilan pustaka `duitku.js` pada dokumentasi POP, termasuk penggunaan reference transaksi dari Create Invoice dan fungsi checkout yang ditentukan provider. Gunakan callback JavaScript hanya untuk pembaruan UI, misalnya menampilkan pesan sukses, pending, error, atau ketika pengguna menutup popup.

Dokumentasi POP menjelaskan event browser seperti:
- `successEvent` — notifikasi event pembayaran sukses pada UI;
- `pendingEvent` — notifikasi event pending;
- `errorEvent` — notifikasi kesalahan;
- `closeEvent` — popup ditutup sebelum alur selesai.

Nama dan kode status harus dicocokkan dengan dokumentasi POP versi yang digunakan. Event browser tidak boleh mengubah status pembayaran tepercaya pada database.

### 4.2 Window redirection

Dokumentasi POP juga memperbolehkan merchant menggunakan `paymentUrl` dari Create Invoice untuk mengarahkan pelanggan langsung ke halaman pembayaran Duitku, tanpa menyertakan `duitku.js`. Parameter bahasa seperti `lang=id` atau `lang=en` dijelaskan sebagai opsi URL.

Redirect hanya pengalaman pengguna. Kembalinya pelanggan ke `returnUrl` tidak membuktikan bahwa pembayaran berhasil. Status final harus berasal dari callback server yang tervalidasi atau mekanisme pengecekan transaksi resmi yang sesuai.

## 5. HTTP callback dan validasi signature

Duitku mengirim HTTP POST ke `callbackUrl` merchant setelah pembayaran diproses. Dokumentasi POP menjelaskan callback dengan content type `application/x-www-form-urlencoded`. Endpoint callback harus dapat diakses dari internet dan merespons HTTP 200 OK setelah request diterima dan diproses sesuai kontrak.

### 5.1 Field callback

Field callback yang dijelaskan dokumentasi antara lain:

| Field | Makna |
|---|---|
| `merchantCode` | Merchant code |
| `amount` | Nominal pembayaran |
| `merchantOrderId` | ID transaksi milik merchant |
| `productDetail` | Detail produk |
| `additionalParam` | Parameter tambahan, jika ada |
| `paymentCode` | Kode metode pembayaran |
| `resultCode` | Kode hasil transaksi; dokumentasi mencontohkan `00` sukses dan `01` gagal |
| `merchantUserId` | ID pengguna pada merchant, bila ada |
| `reference` | Reference Duitku yang perlu disimpan untuk pelacakan |
| `signature` | Signature callback |
| `publisherOrderId` | Nomor unik pembayaran Duitku, jika dikirim |
| Field tambahan | Field tambahan bergantung pada metode pembayaran, misalnya informasi settlement, issuer/QRIS, atau kartu |

Jangan mengasumsikan semua field opsional selalu dikirim untuk semua metode. Tangani field tambahan secara kompatibel dan gunakan kontrak resmi untuk field wajib.

### 5.2 Formula signature callback

Dokumentasi POP mencantumkan formula:

```text
stringToSign = merchantCode + amount + merchantOrderId
signature = HMAC_SHA256(stringToSign, merchantKey)
```

Gunakan key rahasia backend yang sesuai untuk environment. Verifikasi signature dengan implementasi kriptografi yang tepat dan perbandingan yang aman. Pastikan urutan penggabungan dan representasi amount sama persis dengan dokumentasi.

Dokumentasi menyatakan metode signature lama berbasis SHA256 tanpa HMAC telah usang; untuk callback, metode lama MD5 juga dinyatakan usang. Jangan menggunakan formula lama. Bila ada perbedaan penamaan key antara contoh atau bagian dokumentasi, verifikasi dengan referensi POP dan konfigurasi merchant yang berlaku, bukan menebak.

### 5.3 Pemeriksaan callback yang disarankan

Sebelum mengubah status order:
1. Validasi signature callback menggunakan secret yang benar.
2. Pastikan `merchantCode` cocok dengan environment/merchant.
3. Cari transaksi menggunakan `merchantOrderId` dan cocokkan dengan reference Duitku yang tersimpan bila tersedia.
4. Cocokkan nominal callback dengan nominal invoice yang disimpan di server; jangan menerima nominal yang hanya berasal dari browser.
5. Validasi `resultCode` sesuai kontrak resmi dan status transaksi yang diizinkan.
6. Terapkan perubahan secara atomik/idempoten agar callback berulang tidak menggandakan efek.
7. Catat hasil pemrosesan tanpa mengekspos secret atau data pribadi.
8. Kembalikan respons yang sesuai kontrak callback, termasuk HTTP 200 setelah request berhasil ditangani. Jangan memberi respons sukses palsu bila transaksi gagal diproses secara aman.

Duitku menjelaskan bahwa callback dapat dikirim ulang jika server tidak merespons HTTP 200, dengan upaya maksimum yang disebutkan dokumentasi sebanyak lima kali. Dokumentasi juga menyebut merchant dapat mengirim ulang callback melalui menu report pada dashboard. Karena callback bisa berulang, handler harus idempoten.

**Catatan keamanan:** callback tervalidasi merupakan bagian penting dari konfirmasi server, tetapi validasi signature saja tidak cukup. Order, nominal, merchant, referensi, status sebelumnya, dan aturan transisi status tetap harus diperiksa.

## 6. Status pembayaran dan batas kepercayaan

| Sumber sinyal | Kegunaan yang aman |
|---|---|
| Event JavaScript POP | Memperbarui tampilan/UX; tidak boleh menjadi sumber status pembayaran final |
| `returnUrl` / redirect browser | Menampilkan halaman kembali dan mengambil status terbaru dari backend |
| HTTP callback yang tervalidasi | Memproses status transaksi pada backend setelah seluruh pemeriksaan bisnis dan keamanan |
| Pemeriksaan status transaksi resmi | Gunakan bila dibutuhkan untuk rekonsiliasi atau callback yang tertunda, dengan kontrak endpoint resmi yang sesuai |

Jangan menandai order lunas hanya karena pengguna mencapai halaman sukses, frontend mengirim status sukses, atau callback JavaScript memberi `resultCode = 00`. Dokumentasi POP secara eksplisit menyatakan respons JS callback hanya untuk notifikasi kepada pelanggan; perubahan status sistem merchant harus menggunakan HTTP callback.

Untuk Asri Collection, pemrosesan status pembayaran sebaiknya dilakukan di backend dengan transaksi database yang aman dan idempoten. Bila pembayaran terkonfirmasi, perubahan status pembayaran, order, dan stok harus mengikuti kontrak database internal yang telah diaudit; jangan menurunkan stok berdasarkan sinyal frontend atau callback yang belum tervalidasi.

## 7. Metode pembayaran

Duitku mendokumentasikan kode metode pembayaran pada halaman POP. Ketersediaan aktual dapat bergantung pada konfigurasi project/merchant dan perubahan provider. Contoh kode yang tercantum dalam dokumentasi POP meliputi:

| Kategori | Contoh kode yang didokumentasikan |
|---|---|
| Kartu kredit | `VC` |
| Virtual Account | `BC`, `M2`, `VA`, `I1`, `B1`, `BT`, `A1`, `AG`, `NC`, `BR`, `S1`, `DM`, `BV` |
| Gerai retail | `FT`, `IR` |
| E-wallet/aplikasi | `OV`, `SA`, `LF`, `LA` |

Ini hanya contoh kode dari dokumentasi yang dirujuk, bukan jaminan bahwa semua metode tersedia untuk akun Asri Collection saat ini. Periksa daftar metode yang aktif pada project merchant dan dokumentasi terbaru sebelum menampilkan pilihan pembayaran. Jika `paymentMethod` diisi, dokumentasi menyebut pelanggan dapat langsung diarahkan ke metode tersebut tanpa memilih metode lain.

## 8. Masa berlaku transaksi

POP menyediakan `expiryPeriod` opsional yang dinyatakan dalam menit. Contoh dokumentasi mencantumkan nilai seperti 5, 10, atau 60 menit, tetapi jangan menganggap contoh itu sebagai daftar nilai yang selalu berlaku untuk semua akun atau metode.

Ketentuan implementasi:
- Pilih expiry berdasarkan kebutuhan bisnis dan nilai yang diterima endpoint Duitku.
- Simpan waktu kedaluwarsa yang berlaku pada order/invoice.
- Jangan mengasumsikan masa berlaku tetap 24 jam.
- Cegah transaksi yang telah kedaluwarsa diperlakukan sebagai pembayaran aktif tanpa pemeriksaan status resmi.
- Tangani callback yang terlambat atau callback yang bertentangan dengan status internal secara aman dan dapat diaudit.

## 9. Website dan pendaftaran merchant — FAQ resmi

FAQ Duitku menyatakan website/aplikasi untuk pendaftaran harus memenuhi ketentuan berikut:
- Website sudah aktif dan dipublikasikan.
- Website bukan link marketplace.
- Website bukan media sosial.
- Website bukan subdomain dari platform/website builder.
- Aplikasi harus sudah dipublikasikan di App Store/Play Store.
- Ketentuan website tersebut tidak menentukan hasil akhir verifikasi seluruh data dan dokumen merchant.

FAQ resmi juga menyebut standar minimum konten website meliputi:
- Informasi resmi mengenai usaha/perusahaan dan produk yang jelas serta sesuai dengan izin usaha.
- Informasi kontak yang aktif dan dapat dihubungi, seperti telepon, alamat, dan email.
- Penerimaan pembayaran dalam rupiah atau dapat dikonversi ke kurs rupiah.

FAQ menyatakan akun testing/sandbox dapat digunakan untuk mencoba integrasi tanpa uang riil. Aktivasi production memerlukan proses verifikasi identitas dan website oleh tim Duitku. Dokumen legal yang diminta bergantung pada jenis legalitas merchant; periksa FAQ dan arahan Merchant Portal untuk persyaratan terbaru.

**Penting:** daftar di atas adalah ringkasan FAQ, bukan jaminan penerimaan merchant. Status website, kelengkapan dokumen, dan keputusan akhir harus dikonfirmasi oleh Duitku. Jangan menyatakan Asri Collection telah memenuhi syarat tanpa audit website dan konfirmasi resmi.

## 10. Konfigurasi environment dan secret

Simpan konfigurasi di secret/environment backend, bukan di frontend. Nama variabel di bawah merupakan rekomendasi penamaan internal, bukan nama wajib yang ditetapkan Duitku:

| Nama internal yang disarankan | Isi |
|---|---|
| `DUITKU_ENV` | `sandbox` atau `production` |
| `DUITKU_MERCHANT_CODE` | Merchant code untuk environment yang dipilih |
| `DUITKU_API_KEY` | API key/merchant key rahasia |
| `DUITKU_CALLBACK_URL` | URL HTTPS publik endpoint callback backend |
| `DUITKU_RETURN_URL` | URL untuk alur kembali pengguna |
| `DUITKU_EXPIRY_PERIOD` | Masa berlaku dalam menit sesuai konfigurasi yang disepakati |

Aturan:
- Jangan menggunakan secret sandbox pada production atau sebaliknya.
- Validasi konfigurasi saat fungsi backend dijalankan dan gagal dengan aman bila secret wajib tidak tersedia.
- Jangan mengirim API key ke browser atau menyimpannya dalam bundle frontend.
- Pastikan callback URL publik, HTTPS, dan mengarah ke endpoint yang benar.
- Jangan menganggap nama variabel internal di atas sebagai nama konfigurasi resmi dari Duitku.

## 11. Checklist integrasi Asri Collection

Checklist berikut adalah item verifikasi; belum menandakan item telah lulus.

### P0 — Keamanan dan kebenaran pembayaran
- [ ] Secret hanya berada di backend/secret manager.
- [ ] Endpoint Create Invoice sesuai environment POP.
- [ ] Header timestamp dan signature dibuat sesuai formula POP.
- [ ] ID order unik untuk setiap transaksi baru.
- [ ] Nominal dihitung ulang di backend dan konsisten dengan rincian item.
- [ ] Callback memakai URL publik dan menerima POST dengan format yang benar.
- [ ] Signature callback diverifikasi menggunakan HMAC-SHA256.
- [ ] Callback mencocokkan merchant, order, nominal, reference, dan status.
- [ ] Callback diproses idempoten; callback berulang tidak menggandakan efek.
- [ ] Status tidak ditentukan dari JS callback atau redirect.
- [ ] Perubahan order/pembayaran/stok menggunakan transaksi database yang aman.
- [ ] Log tidak membocorkan secret atau data pribadi.

### P1 — Perilaku transaksi
- [ ] Perilaku sukses, pending, gagal, batal, dan kedaluwarsa diuji di sandbox.
- [ ] Callback berulang dan callback yang terlambat diuji.
- [ ] Timeout/kegagalan jaringan saat Create Invoice ditangani tanpa membuat invoice duplikat.
- [ ] Ada cara rekonsiliasi status ketika callback tertunda atau tidak diterima, sesuai API resmi.
- [ ] Reference Duitku dan ID order merchant tersimpan untuk penelusuran.
- [ ] Metode pembayaran yang ditampilkan sesuai metode aktif di Merchant Portal.
- [ ] Periode kedaluwarsa sesuai kebutuhan dan nilai yang didukung provider.

### P2 — Website dan kesiapan merchant
- [ ] Website aktif dan dipublikasikan pada domain yang memenuhi ketentuan FAQ.
- [ ] Website bukan marketplace, media sosial, atau subdomain platform/website builder.
- [ ] Informasi usaha dan produk jelas.
- [ ] Kontak aktif (telepon, alamat, email) tersedia.
- [ ] Harga dan proses pembayaran jelas; transaksi menggunakan IDR sesuai alur bisnis.
- [ ] Dokumen legal dan data merchant dikirim serta diverifikasi oleh Duitku.
- [ ] Persetujuan/aktivasi production dikonfirmasi secara resmi.

### P3 — Rilis dan operasional
- [ ] Pengujian sandbox didokumentasikan.
- [ ] URL callback dan return diverifikasi untuk environment yang benar.
- [ ] Prosedur monitoring callback dan rekonsiliasi tersedia.
- [ ] Prosedur penanganan transaksi gagal, refund, dan sengketa mengikuti ketentuan merchant/provider.
- [ ] Beralih ke production dilakukan hanya setelah persetujuan dan pengujian terkontrol.

## 12. Batasan dan catatan versi

- URL, daftar metode pembayaran, field payload, batasan panjang, aturan tokenisasi, response code, dan kebijakan merchant dapat berubah.
- Contoh request pada dokumentasi adalah contoh format, bukan kredensial atau konfigurasi untuk Asri Collection.
- IP callback yang tercantum dalam dokumentasi POP dapat digunakan sebagai informasi tambahan untuk whitelist bila sesuai infrastruktur, tetapi jangan menjadikan IP whitelist sebagai pengganti validasi signature dan validasi transaksi.
- Jangan menganggap API V2 identik dengan POP.
- Jangan menganggap halaman return, event JS, screenshot, atau tampilan sukses sebagai bukti pembayaran.
- Dokumen ini merangkum referensi resmi yang tercantum; setiap implementasi harus diverifikasi terhadap halaman teknis terbaru dan akun merchant yang sebenarnya.

## 13. Referensi teknis langsung

- [POP API Reference — Indonesia](https://docs.duitku.com/pop/id/)
- [POP API Reference — English](https://docs.duitku.com/pop/en/)
- [API V2 — Indonesia](https://docs.duitku.com/api/id/)
- [API Browser / POP vs V2](https://docs.duitku.com/payment-gateway/api-browser/)
- [FAQ Duitku — Indonesia](https://www.duitku.com/frequently-asked-questions/)
- [FAQ Duitku — English](https://www.duitku.com/en/frequently-asked-questions/)
- [Duitku official website](https://www.duitku.com/)
