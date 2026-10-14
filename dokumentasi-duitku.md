# Dokumentasi Duitku — Asri Collection

> **Status:** ringkasan referensi resmi; bukan hasil audit implementasi  
> **Ditinjau:** 15 Oktober 2026  
> **Produk yang dituju:** Duitku POP  
> **Prinsip:** dokumentasi Duitku yang berlaku untuk produk dan environment terpilih menjadi sumber kebenaran kontrak provider.

Dokumen ini disesuaikan berdasarkan halaman resmi yang tercantum di bagian 1. Ringkasan tidak menggantikan schema lengkap, contoh kode, changelog, pengaturan Merchant Portal, atau konfirmasi tertulis Duitku. Tidak ada klaim bahwa integrasi Asri Collection telah diuji, website telah lolos verifikasi, atau akun production telah disetujui.

## 1. Sumber resmi yang ditinjau

| Topik | URL resmi | Kegunaan |
|---|---|---|
| POP — Indonesia | https://docs.duitku.com/pop/id/ | Kontrak teknis utama untuk integrasi POP |
| POP — English | https://docs.duitku.com/pop/en/ | Referensi pembanding dan changelog POP |
| API V2 — Indonesia | https://docs.duitku.com/api/id/ | Kontrak produk API V2 yang terpisah |
| API V2 — English | https://docs.duitku.com/api/en/ | Referensi pembanding untuk API V2 |
| API Browser — Indonesia | https://docs.duitku.com/payment-gateway/api-browser/ | Perbedaan produk POP dan V2 |
| API Browser — English | https://docs.duitku.com/en/payment-gateway/api-browser/ | Referensi pembanding POP dan V2 |
| Dokumentasi utama — Indonesia | https://docs.duitku.com/ | Navigasi dokumentasi resmi |
| Dokumentasi utama — English | https://docs.duitku.com/en/ | Navigasi dokumentasi resmi |
| FAQ — Indonesia | https://www.duitku.com/frequently-asked-questions/ | Ketentuan website/aplikasi untuk pendaftaran merchant |
| FAQ — English | https://www.duitku.com/en/frequently-asked-questions/ | Referensi pembanding FAQ |
| Website resmi | https://www.duitku.com/ | Informasi resmi perusahaan |

**Prioritas penggunaan sumber**
1. Untuk integrasi yang memilih POP, gunakan dokumentasi POP untuk endpoint, header, payload, signature, callback, event, dan alur checkout.
2. API V2 menggunakan kontrak dan endpoint yang berbeda. Jangan menyalin endpoint, payload, atau signature V2 ke POP, atau sebaliknya.
3. API Browser menjelaskan perbedaan produk: V2 ditujukan untuk halaman pembayaran kustom merchant; POP menyediakan pilihan metode pembayaran Duitku yang dapat ditampilkan melalui popup atau redirect.
4. FAQ menjadi rujukan ketentuan website/aplikasi pendaftaran. Syarat akun dan kanal aktif yang spesifik tetap perlu dikonfirmasi di Merchant Portal.

## 2. Pilihan produk dan alur POP

Duitku POP menyediakan halaman/pilihan pembayaran yang dikelola Duitku, dengan opsi popup atau pengalihan ke halaman pembayaran. API Browser membedakan POP dari V2 yang digunakan untuk pengalaman pembayaran kustom merchant.

Alur umum yang perlu diimplementasikan:
1. Pelanggan mengonfirmasi checkout.
2. Backend merchant memvalidasi order, harga, ongkos kirim, diskon, dan total dari sumber data tepercaya.
3. Backend mengirim Create Invoice POP ke Duitku.
4. Backend menyimpan ID order merchant dan referensi provider yang diterima.
5. Frontend menampilkan popup POP sesuai panduan resmi atau mengarahkan pelanggan ke nilai paymentUrl dari respons.
6. Duitku mengirim HTTP callback ke endpoint backend merchant.
7. Backend memvalidasi callback dan transaksi sebelum memperbarui status.
8. Frontend mengambil status dari backend merchant; redirect atau event JavaScript bukan bukti final pembayaran.

## 3. Create Invoice POP

### 3.1 Endpoint

| Environment | Method | Endpoint |
|---|---|---|
| Sandbox | POST | https://api-sandbox.duitku.com/api/merchant/createInvoice |
| Production | POST | https://api-prod.duitku.com/api/merchant/createInvoice |

Tipe request: application/json. Gunakan endpoint dan kredensial sandbox untuk pengujian, lalu pindah ke production hanya setelah kesiapan dan aktivasi merchant dikonfirmasi.

### 3.2 Header request

Dokumentasi POP mencantumkan header berikut:

| Header | Keterangan |
|---|---|
| Content-Type | application/json |
| x-duitku-timestamp | Timestamp UNIX dalam milidetik |
| x-duitku-signature | Signature HMAC-SHA256 |
| x-duitku-merchantcode | Merchant code/proyek dari Duitku |

**Penting:** nama header merchant pada dokumentasi POP adalah x-duitku-merchantcode. Jangan menggantinya dengan header bernama merchantCode.

Formula signature request yang ditampilkan dokumentasi POP:

```text
stringToSign = merchantCode + timestamp
signature = HMAC_SHA256(stringToSign, apiKey)
```

Dokumentasi POP menyebut output HMAC berupa hexadecimal lowercase. Gunakan urutan string, timestamp dalam milidetik, encoding, dan secret sesuai kontrak POP. Jangan menggunakan formula lama SHA256 tanpa HMAC. Changelog POP mencatat peningkatan signature HMAC dan penetapan SHA256/MD5 lama sebagai obsolete pada April 2026.

### 3.3 Parameter request

Field yang tercantum pada dokumentasi Create Invoice POP meliputi:

| Field | Ketentuan yang tercantum |
|---|---|
| paymentAmount | Integer nominal transaksi |
| merchantOrderId | ID transaksi dari merchant; string dengan batas yang didokumentasikan, dan harus baru untuk transaksi baru |
| productDetails | Deskripsi produk/jasa |
| email | Email pelanggan; ditandai wajib pada tabel parameter POP |
| additionalParam | Opsional; dokumentasi meminta nilai URL-encoded bila digunakan |
| merchantUserInfo | Opsional |
| customerVaName | Opsional sesuai tabel parameter POP |
| phoneNumber | Opsional sesuai tabel parameter POP |
| paymentMethod | Opsional; kode metode pembayaran bila merchant ingin memilih metode tertentu |
| itemDetails | Rincian barang/jasa; struktur lihat schema resmi |
| customerDetail | Data pelanggan/alamat; struktur lihat schema resmi |
| callbackUrl | URL callback; ditandai wajib |
| returnUrl | URL redirect/kembali; ditandai wajib |
| expiryPeriod | Opsional; periode berlaku dalam menit |
| creditCardDetail | Objek opsional untuk skenario kartu tertentu |
| customerDetail.merchantCustomerId | Field yang ditambahkan pada dokumentasi untuk kebutuhan tertentu |
| creditCardDetail.saveCardToken | Field terkait tokenisasi kartu; persyaratan khusus berlaku |

Tabel ini bukan schema lengkap. Sebelum implementasi, periksa langsung tipe, panjang, struktur nested, kewajiban field, dan aturan khusus pada halaman POP. Dokumentasi POP secara eksplisit menyatakan:
- paymentAmount harus sama dengan total harga pada itemDetails.
- merchantOrderId harus baru untuk setiap transaksi baru.
- Untuk transaksi tokenisasi tertentu (VC atau MG), email, customerDetail.email, customerDetail.merchantCustomerId, dan creditCardDetail.saveCardToken menjadi wajib.

Jangan mengaktifkan tokenisasi atau fitur kartu hanya berdasarkan ringkasan ini; tinjau seluruh persyaratan dan persetujuan akun yang berlaku.

### 3.4 Respons dan pencatatan transaksi

Dokumentasi POP menyebut respons Create Invoice dapat berisi reference, paymentUrl, dan data lain. Gunakan nama serta tipe field dari response schema terbaru.

Simpan sekurang-kurangnya data internal yang diperlukan untuk rekonsiliasi: ID order internal, merchantOrderId, reference provider, nominal, metode pembayaran bila tersedia, status internal, dan waktu transaksi/kedaluwarsa bila tersedia. Jangan menyimpan secret di record transaksi atau mengirimkannya ke browser.

Jika request timeout atau respons tidak diketahui, jangan langsung membuat invoice baru dengan ID order berbeda tanpa prosedur rekonsiliasi. Dokumentasi POP mencantumkan error untuk request ulang dengan order ID sama ketika transaksi masih diproses atau nominal berbeda; tangani sesuai respons API dan status transaksi yang dapat diverifikasi.

## 4. Tampilan pembayaran dan redirect

### 4.1 POP JavaScript

Ikuti pemasangan library dan cara memanggil checkout.process sesuai halaman POP. Dokumentasi menyediakan opsi event seperti successEvent, pendingEvent, errorEvent, dan closeEvent. Event ini digunakan untuk pengalaman pengguna, bukan untuk menetapkan status pembayaran tepercaya di database.

Dokumentasi POP menyatakan respons JS callback hanya boleh digunakan untuk notifikasi kepada pelanggan. Perubahan status sistem merchant harus menggunakan HTTP callback.

### 4.2 Window redirection

Alternatifnya, gunakan paymentUrl yang dikembalikan Create Invoice untuk mengarahkan pelanggan ke halaman pembayaran Duitku. Dokumentasi POP menjelaskan parameter bahasa seperti lang=id atau lang=en pada URL.

Parameter pada URL return, termasuk resultCode yang dikirim saat redirect, dapat dimodifikasi oleh pelanggan. Jangan mengubah status pembayaran hanya berdasarkan returnUrl, query string, screenshot, atau tampilan sukses di browser. Setelah kembali, frontend harus meminta status terbaru dari backend.

## 5. HTTP callback POP

Dokumentasi POP menetapkan callback sebagai HTTP POST dengan content type application/x-www-form-urlencoded. Callback URL harus dapat diakses secara publik. Dokumentasi meminta respons HTTP 200 OK setelah callback diterima dan ditangani.

### 5.1 Field callback

Field yang didokumentasikan mencakup:

| Field | Keterangan |
|---|---|
| merchantCode | Kode merchant |
| amount | Nominal transaksi |
| merchantOrderId | ID transaksi merchant |
| productDetail | Deskripsi produk |
| additionalParam | Parameter tambahan, jika digunakan |
| paymentCode | Kode metode pembayaran |
| resultCode | Kode hasil; dokumentasi mencontohkan 00 untuk sukses dan 01 untuk gagal |
| merchantUserId | ID pengguna merchant, bila ada |
| reference | Referensi transaksi Duitku; simpan untuk penelusuran |
| signature | Signature callback |
| publisherOrderId | Nomor order/pembayaran tambahan, bila dikirim |
| transactionState, transactionStateStatus | Field status tambahan untuk skenario tertentu |
| merchantCustomerId, tokenId, expiryDate | Field tambahan pada skenario tertentu |
| customerName | Informasi akun issuer yang disebut pada changelog Juni 2026 |
| Field lain | Field dapat bergantung pada kanal/jenis transaksi; periksa schema POP terbaru |

Jangan mengasumsikan semua field tambahan hadir pada setiap metode pembayaran. Nama field harus mengikuti kontrak POP; misalnya dokumentasi callback menggunakan productDetail, bukan productDetails.

### 5.2 Signature callback

Formula callback yang ditampilkan dokumentasi POP:

```text
stringToSign = merchantCode + amount + merchantOrderId
signature = HMAC_SHA256(stringToSign, apiKey)
```

Dokumentasi menyebut API Key sebagai Merchant Key di bagian penjelasan POP, sementara contoh kode menggunakan nama variabel apiKey. Karena penamaan dalam contoh/teks dapat berbeda, gunakan secret API Key/Merchant Key yang diberikan untuk proyek dan environment yang sama; jangan menebak atau memakai secret dari proyek lain.

Changelog POP mencatat signature HMAC dan menyatakan metode signature SHA256 lama serta MD5 callback lama sebagai obsolete pada pembaruan April 2026. Jangan gunakan formula legacy tersebut.

### 5.3 Validasi dan pemrosesan callback

Sebelum mengubah status:
1. Validasi signature dengan implementasi HMAC-SHA256 dan secret yang sesuai environment.
2. Cocokkan merchantCode dengan merchant/environment yang dikonfigurasi.
3. Cari order berdasarkan merchantOrderId dan cocokkan reference bila tersedia.
4. Cocokkan amount dengan nominal invoice yang tersimpan di server.
5. Validasi resultCode dan transisi status yang diperbolehkan oleh kontrak provider dan aplikasi.
6. Terapkan perubahan secara atomik dan idempoten; callback duplikat tidak boleh menggandakan efek.
7. Catat hasil pemrosesan tanpa mengekspos secret atau data pribadi.
8. Respons sesuai kontrak callback, termasuk HTTP 200 OK ketika callback berhasil ditangani.

Dokumentasi POP menyatakan server Duitku mengirim ulang callback jika belum menerima HTTP 200, sampai maksimum lima upaya; setelah upaya maksimum, pemberitahuan kegagalan dapat dikirim melalui email. Dokumentasi juga menjelaskan opsi resend melalui menu report pada dashboard Duitku. Oleh karena itu, callback harus aman terhadap pengiriman ulang.

Dokumentasi menyertakan IP outgoing untuk whitelist. Jika whitelist diterapkan, verifikasi daftar IP terkini pada halaman POP saat konfigurasi; IP allowlist hanya pertahanan tambahan dan tidak menggantikan signature serta pemeriksaan transaksi.

## 6. Status pembayaran dan rekonsiliasi

| Sinyal | Perlakuan |
|---|---|
| Event JavaScript POP | Pembaruan UI saja |
| Return URL / redirect | Halaman kembali; jangan dianggap bukti pembayaran |
| HTTP callback tervalidasi | Dapat diproses backend setelah pemeriksaan signature dan aturan bisnis |
| Pemeriksaan status transaksi | Gunakan endpoint resmi yang sesuai produk bila diperlukan untuk rekonsiliasi |

API V2 memiliki endpoint dan kontrak pemeriksaan statusnya sendiri. Jangan memakai endpoint API V2 sebagai bagian dari implementasi POP tanpa memastikan dokumentasi resmi menyatakan endpoint itu berlaku untuk kebutuhan tersebut. Untuk callback tertunda atau hasil yang tidak pasti, rancang prosedur rekonsiliasi yang sesuai dengan kemampuan POP dan konfirmasi Duitku bila diperlukan.

Untuk Asri Collection, pembaruan status order, pembayaran, dan stok adalah tanggung jawab backend. Terapkan perubahan secara aman dan idempoten sesuai kontrak database internal; jangan mengurangi stok berdasarkan event browser atau callback yang belum tervalidasi.

## 7. Kanal pembayaran

Halaman POP mencantumkan kode metode pembayaran, tetapi ketersediaan aktual dapat berbeda menurut proyek/akun dan dapat berubah. Contoh yang tercantum pada halaman POP meliputi kode seperti VC (kartu kredit), beberapa kode Virtual Account, FT/IR (ritel), serta OV/SA/LF/LA (dompet/aplikasi). Daftar ini hanya contoh, bukan daftar lengkap atau jaminan bahwa kanal tersedia pada proyek Asri Collection.

Changelog resmi POP menyebut:
- Februari 2026: penambahan kanal Tokopedia Card Payment, Tokopedia E-Wallet, dan Tokopedia Others.
- September 2026: penghapusan kanal QRIS Gudang Voucher.

Karena kanal dapat ditambah atau dihapus, jangan menjadikan tabel statis dalam dokumen ini sebagai sumber konfigurasi. Periksa halaman POP terbaru dan kanal yang aktif pada Merchant Portal. Jika paymentMethod dikirim, ikuti aturan dokumentasi POP tentang pemilihan metode tertentu.

## 8. Masa berlaku transaksi

POP menyediakan expiryPeriod dalam menit sebagai field opsional. Halaman POP memberi contoh nilai seperti 5, 10, atau 60 menit; contoh ini tidak membuktikan bahwa semua nilai didukung untuk semua akun/metode.

- Tetapkan periode berdasarkan kebutuhan bisnis dan nilai yang diterima provider.
- Simpan waktu kedaluwarsa yang benar pada order/invoice bila tersedia.
- Jangan mengasumsikan semua transaksi berlaku 24 jam.
- Jangan menganggap transaksi kedaluwarsa tetap aktif tanpa memeriksa status yang dapat diverifikasi.
- Tangani callback terlambat atau status yang bertentangan dengan kebijakan backend yang terdokumentasi dan dapat diaudit.

## 9. Ketentuan website/aplikasi merchant menurut FAQ

FAQ resmi Duitku menyebut ketentuan website/aplikasi yang dapat didaftarkan:
- Website harus aktif dan sudah dipublikasikan.
- Website bukan link marketplace.
- Website bukan media sosial.
- Website bukan subdomain dari platform/website builder.
- Aplikasi harus sudah dipublikasikan di App Store/Play Store.

FAQ juga secara eksplisit menyatakan bahwa ketentuan website tersebut tidak menentukan hasil akhir verifikasi keseluruhan data dan dokumen merchant.

FAQ menyatakan akun testing dapat dibuat, tetapi proses verifikasi akun tetap mensyaratkan merchant memiliki website yang dapat diakses. Dokumen ini tidak menyimpulkan bahwa website Asri Collection telah memenuhi persyaratan atau bahwa akun production telah disetujui.

**Batas klaim:** daftar di atas adalah kriteria yang dapat dipastikan dari FAQ yang dirujuk. Konten lain seperti dokumen legal, informasi usaha/kontak, atau syarat akun tertentu harus dikonfirmasi pada pertanyaan FAQ yang relevan, formulir pendaftaran, dan Merchant Portal; jangan menyatakannya sebagai kutipan syarat resmi tanpa sumber yang tepat.

## 10. Secret dan environment — rekomendasi internal

Nama berikut hanyalah konvensi internal yang disarankan, bukan nama environment variable yang diwajibkan Duitku:

| Nama internal | Tujuan |
|---|---|
| DUITKU_ENV | Pemilihan sandbox/production |
| DUITKU_MERCHANT_CODE | Merchant code proyek |
| DUITKU_API_KEY | API Key/Merchant Key rahasia |
| DUITKU_CALLBACK_URL | URL callback backend |
| DUITKU_RETURN_URL | URL return untuk browser |
| DUITKU_EXPIRY_PERIOD | Nilai expiryPeriod yang disepakati |

- Simpan API Key/Merchant Key hanya di backend atau secret manager.
- Pisahkan konfigurasi dan kredensial sandbox dari production.
- Jangan menaruh secret atau membuat signature rahasia di bundle frontend.
- Pastikan callback URL benar dan dapat diakses dari internet.
- Jangan log secret, data pembayaran sensitif, atau data pribadi yang tidak diperlukan.
- Gagal dengan aman jika konfigurasi wajib tidak tersedia.

## 11. Checklist verifikasi integrasi

Checklist ini belum menandakan item lulus.

### P0 — Kontrak dan keamanan pembayaran
- [ ] Endpoint Create Invoice sesuai POP dan environment.
- [ ] Header menggunakan x-duitku-timestamp, x-duitku-signature, dan x-duitku-merchantcode.
- [ ] Signature request memakai HMAC-SHA256 sesuai formula POP terkini.
- [ ] ID order baru digunakan untuk transaksi baru.
- [ ] Nominal dihitung ulang backend dan cocok dengan itemDetails bila dikirim.
- [ ] Callback publik menerima POST application/x-www-form-urlencoded.
- [ ] Signature callback, merchant, order, reference, nominal, dan resultCode divalidasi.
- [ ] Callback idempoten dan perubahan status aman terhadap duplikasi.
- [ ] Event JS dan redirect tidak menjadi sumber status pembayaran final.
- [ ] Secret tidak tersedia di frontend atau log terbuka.

### P1 — Perilaku transaksi
- [ ] Skenario sukses, pending, gagal, close, timeout, dan kedaluwarsa diuji di sandbox.
- [ ] Callback duplikat, callback terlambat, dan callback yang gagal diterima diuji.
- [ ] Timeout Create Invoice direkonsiliasi sebelum membuat transaksi baru.
- [ ] Referensi provider dan ID order merchant tersimpan.
- [ ] Kanal pembayaran cocok dengan konfigurasi proyek yang aktif.
- [ ] Prosedur pengecekan status/rekonsiliasi mengikuti kontrak resmi yang tepat.

### P2 — Website dan merchant
- [ ] Website aktif dan dipublikasikan.
- [ ] Website bukan link marketplace, media sosial, atau subdomain platform/website builder.
- [ ] Jika mendaftar aplikasi, aplikasi telah dipublikasikan di App Store/Play Store.
- [ ] Data dan dokumen merchant telah diproses melalui alur resmi.
- [ ] Hasil verifikasi dan aktivasi production dikonfirmasi oleh Duitku.

### P3 — Operasional
- [ ] Hasil pengujian sandbox terdokumentasi.
- [ ] Callback dan return URL diuji pada environment yang benar.
- [ ] Monitoring callback, rekonsiliasi, dan penanganan transaksi tidak pasti tersedia.
- [ ] Prosedur refund/sengketa mengikuti ketentuan merchant dan provider yang berlaku.
- [ ] Peralihan ke production dilakukan setelah persetujuan dan pengujian terkontrol.

## 12. Perubahan dokumentasi POP yang relevan

Menurut changelog pada halaman POP yang ditinjau:
- April 2026: signature ditingkatkan menggunakan HMAC; metode SHA256 lama dan MD5 lama dinyatakan obsolete.
- Juni 2026: penambahan customerName sebagai informasi akun issuer pada callback.
- Februari 2026: penambahan kanal Tokopedia Card Payment, Tokopedia E-Wallet, dan Tokopedia Others; penambahan bagian testing E-Commerce.
- September 2026: kanal QRIS Gudang Voucher dihapus.

Changelog ini menjadi alasan untuk tidak mengandalkan implementasi signature atau daftar kanal dari contoh lama. Periksa changelog terbaru sebelum rilis karena halaman dapat berubah lagi.

## 13. Batasan dan catatan

- Dokumen ini ringkasan, bukan salinan lengkap dokumentasi provider.
- Field, batas panjang, response, error code, metode pembayaran, dan persyaratan akun dapat berubah.
- Contoh pada dokumentasi bukan kredensial atau konfigurasi Asri Collection.
- API V2 dan POP adalah produk berbeda; jangan mencampur kontraknya.
- FAQ website tidak menjamin kelulusan verifikasi seluruh merchant.
- Dokumen ini tidak membuktikan bahwa aplikasi, database, callback, website, atau akun merchant telah diaudit atau lulus uji.
- Sebelum implementasi atau rilis, verifikasi kembali halaman POP, changelog, Merchant Portal, dan pengaturan proyek yang sebenarnya.

## 14. Referensi teknis langsung

- [POP API Reference — Indonesia](https://docs.duitku.com/pop/id/)
- [POP API Reference — English](https://docs.duitku.com/pop/en/)
- [API V2 — Indonesia](https://docs.duitku.com/api/id/)
- [API V2 — English](https://docs.duitku.com/api/en/)
- [API Browser — Indonesia](https://docs.duitku.com/payment-gateway/api-browser/)
- [API Browser — English](https://docs.duitku.com/en/payment-gateway/api-browser/)
- [Dokumentasi utama — Indonesia](https://docs.duitku.com/)
- [Dokumentasi utama — English](https://docs.duitku.com/en/)
- [FAQ Duitku — Indonesia](https://www.duitku.com/frequently-asked-questions/)
- [FAQ Duitku — English](https://www.duitku.com/en/frequently-asked-questions/)
- [Website resmi Duitku](https://www.duitku.com/)
