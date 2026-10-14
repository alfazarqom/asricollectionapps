# Requirement Website Merchant dan Integrasi Duitku POP

- **Repositori:** `alfazarqom04122005-commits/asricollectionapps`
- **Domain toko:** `https://asricollection.online`
- **Versi dokumen:** 1.0
- **Status:** Requirement untuk audit; bukan bukti bahwa website atau merchant telah disetujui Duitku.
- **Prinsip sumber:** Ketentuan merchant harus diverifikasi terhadap dokumentasi resmi Duitku. Rekomendasi engineering diberi label terpisah dan tidak boleh dianggap sebagai syarat resmi Duitku tanpa rujukan eksplisit.

## 1. Tujuan dan ruang lingkup

Dokumen ini memisahkan:

1. **Frontend / website merchant** — website publik yang dilihat dan digunakan pelanggan serta diperiksa saat pendaftaran merchant.
2. **Backend / integrasi Duitku POP** — API, database, dan proses server yang mengelola pembuatan transaksi serta verifikasi status pembayaran.
3. **Pendaftaran dan aktivasi merchant** — data dan dokumen yang diminta dalam proses aktivasi akun.

Dokumen ini menetapkan requirement untuk audit dan implementasi. Dokumen ini **tidak** mengizinkan perubahan kode, database, DNS, secret, konfigurasi hosting, atau deployment.

## 2. Label status dan prioritas

### Status audit

- **Lulus** — bukti yang dapat diperiksa menunjukkan kriteria terpenuhi.
- **Gagal** — bukti menunjukkan kriteria tidak terpenuhi.
- **Belum diverifikasi** — bukti belum tersedia atau pemeriksaan belum dilakukan.
- **Tidak berlaku** — requirement tidak relevan terhadap konfigurasi yang dipakai; alasan harus dicatat.

### Klasifikasi requirement

- **Resmi Duitku** — dinyatakan dalam dokumentasi resmi Duitku yang dirujuk.
- **Rekomendasi teknis** — praktik yang disarankan untuk keamanan, keandalan, atau pengalaman pengguna; bukan otomatis persyaratan resmi merchant.
- **P0 / P1** — prioritas pengerjaan internal proyek, bukan klasifikasi resmi Duitku.

## 3. Frontend — website merchant

Sumber utama: [FAQ Duitku](https://www.duitku.com/frequently-asked-questions/) dan [dokumentasi aktivasi akun](https://docs.duitku.com/en/account/).

| ID | Requirement | Kriteria penerimaan | Klasifikasi | Prioritas | Status awal |
|---|---|---|---|---|---|
| FE-001 | Website aktif dan dipublikasikan | Website live dan dapat diakses melalui internet | Resmi Duitku | P0 | Belum diverifikasi |
| FE-002 | URL website bukan tautan marketplace | URL yang diajukan adalah website toko, bukan halaman marketplace | Resmi Duitku | P0 | Belum diverifikasi |
| FE-003 | URL website bukan tautan media sosial | URL yang diajukan bukan akun/halaman media sosial | Resmi Duitku | P0 | Belum diverifikasi |
| FE-004 | Tidak memakai subdomain bawaan platform/website builder yang dilarang | Domain yang diajukan sesuai ketentuan domain dalam FAQ Duitku | Resmi Duitku | P0 | Belum diverifikasi |
| FE-005 | Informasi kontak | Nomor telepon, alamat, dan email tersedia sesuai ketentuan website Duitku | Resmi Duitku | P0 | Belum diverifikasi |
| FE-006 | Informasi produk dan kesesuaian usaha | Produk ditampilkan dan sesuai dengan bidang/kegiatan usaha yang didaftarkan | Resmi Duitku | P0 | Belum diverifikasi |
| FE-007 | Mata uang transaksi | Transaksi menggunakan Rupiah sesuai ketentuan Duitku | Resmi Duitku | P0 | Belum diverifikasi |
| FE-008 | Konten yang patuh hukum dan etika | Konten website tidak melanggar ketentuan hukum dan etika yang berlaku | Resmi Duitku | P0 | Belum diverifikasi |
| FE-009 | Domain toko sendiri | Domain dikelola/dikuasai merchant dan bukan sekadar tautan pihak lain | Kontrol operasional yang disarankan; periksa redaksi FAQ terbaru | P0 | Belum diverifikasi |
| FE-010 | HTTPS berfungsi | Website dapat dibuka melalui HTTPS tanpa peringatan sertifikat | Rekomendasi teknis | P1 | Belum diverifikasi |
| FE-011 | Halaman detail produk | Nama, deskripsi, gambar, dan harga ditampilkan dengan jelas | Rekomendasi kesiapan toko | P1 | Belum diverifikasi |
| FE-012 | Informasi pengiriman | Ketentuan pengiriman dan biaya dijelaskan dengan benar | Rekomendasi kesiapan toko | P1 | Belum diverifikasi |
| FE-013 | Kebijakan toko | Kebijakan privasi, syarat transaksi, pembatalan, pengembalian, dan refund tersedia sesuai model bisnis dan ketentuan yang berlaku | Rekomendasi kesiapan toko; konfirmasi item wajib langsung kepada Duitku | P1 | Belum diverifikasi |
| FE-014 | Navigasi dan tautan | Menu utama serta tautan kontak/kebijakan tidak rusak | Rekomendasi teknis | P1 | Belum diverifikasi |
| FE-015 | Tampilan mobile | Halaman dapat digunakan pada perangkat seluler | Rekomendasi teknis | P1 | Belum diverifikasi |

**Catatan domain:** pemilik menyatakan bahwa `asricollection.online` dibeli melalui Hostinger. Informasi ini dicatat sebagai pernyataan pemilik, bukan verifikasi independen atas registrant atau status DNS. Pembelian domain tidak dengan sendirinya membuktikan website sudah live atau merchant disetujui.

## 4. Backend — integrasi Duitku POP

Sumber utama: [Dokumentasi Duitku POP Indonesia](https://docs.duitku.com/pop/id/). Periksa halaman endpoint dan versi dokumentasi yang berlaku sebelum implementasi. Item di bawah yang diberi label rekomendasi teknis tidak boleh disebut sebagai kewajiban merchant resmi tanpa dukungan dokumentasi eksplisit.

| ID | Requirement | Kriteria penerimaan | Klasifikasi | Prioritas | Status awal |
|---|---|---|---|---|---|
| BE-001 | Pembuatan invoice melalui backend | Backend memanggil API Create Invoice sesuai kontrak Duitku POP | Integrasi API | P0 | Belum diverifikasi |
| BE-002 | Request authentication/signature | Merchant code, API key, parameter, dan signature dibentuk sesuai dokumentasi endpoint yang digunakan | Integrasi API | P0 | Belum diverifikasi |
| BE-003 | Secret tidak terekspos ke frontend | API key dan secret hanya tersedia pada lingkungan server yang terlindungi | Rekomendasi keamanan wajib untuk desain proyek | P0 | Belum diverifikasi |
| BE-004 | Nominal dihitung dan divalidasi server | Server menghitung ulang harga, kuantitas, ongkir, diskon, dan total dari data tepercaya | Rekomendasi keamanan | P0 | Belum diverifikasi |
| BE-005 | Identitas pesanan unik | Setiap transaksi memiliki ID pesanan unik sesuai aturan Duitku | Kontrak API / rekomendasi transaksi | P0 | Belum diverifikasi |
| BE-006 | Callback URL tersedia | URL callback dapat dijangkau Duitku dan sesuai konfigurasi merchant | Integrasi API | P0 | Belum diverifikasi |
| BE-007 | Validasi signature callback | Backend memverifikasi signature berdasarkan formula resmi Duitku sebelum menerima status pembayaran | Integrasi API | P0 | Belum diverifikasi |
| BE-008 | Validasi isi callback | Cocokkan ID pesanan, nominal, referensi, dan status dengan transaksi tersimpan | Rekomendasi keamanan | P0 | Belum diverifikasi |
| BE-009 | Status pembayaran ditetapkan backend | Status tidak ditetapkan hanya dari redirect atau callback JavaScript browser | Integrasi aman; verifikasi pada dokumentasi POP | P0 | Belum diverifikasi |
| BE-010 | Respons callback | Backend merespons sesuai format/status HTTP yang ditentukan dokumentasi Duitku | Integrasi API | P0 | Belum diverifikasi |
| BE-011 | Idempotensi callback | Callback duplikat tidak memproses pembayaran, pesanan, atau stok berulang kali | Rekomendasi keandalan | P0 | Belum diverifikasi |
| BE-012 | Rekonsiliasi status | Jika callback terlambat/tidak diterima, backend dapat memeriksa status melalui mekanisme API yang didukung | Rekomendasi keandalan; verifikasi endpoint yang tersedia | P1 | Belum diverifikasi |
| BE-013 | Pemisahan sandbox dan produksi | Kredensial dan konfigurasi pengujian dipisahkan dari produksi | Rekomendasi operasional | P0 | Belum diverifikasi |
| BE-014 | Pencatatan transaksi | Simpan referensi transaksi, perubahan status, dan log teknis tanpa membocorkan secret | Rekomendasi operasional | P1 | Belum diverifikasi |
| BE-015 | Pembaruan stok konsisten | Stok hanya diperbarui berdasarkan hasil pembayaran terverifikasi dan proses yang aman terhadap transaksi bersamaan | Rekomendasi keamanan data | P0 | Belum diverifikasi |
| BE-016 | Akses administratif dibatasi | Operasi sensitif hanya dapat dilakukan oleh pengguna/server yang berwenang | Rekomendasi keamanan | P0 | Belum diverifikasi |

### Alur backend minimum yang harus diaudit

1. Frontend mengirim pilihan produk dan kuantitas ke backend.
2. Backend membaca harga/stock tepercaya dan menghitung ulang total.
3. Backend membuat pesanan ber-ID unik dengan status awal yang sesuai.
4. Backend membuat invoice Duitku dengan parameter dan signature yang benar.
5. Frontend mengarahkan pelanggan ke alur pembayaran yang dikonfigurasi.
6. Duitku mengirim callback ke backend.
7. Backend memverifikasi signature serta mencocokkan transaksi sebelum mengubah status.
8. Proses status dan stok dibuat idempoten agar callback ulang tidak menyebabkan efek ganda.
9. Frontend membaca status dari backend; redirect pelanggan bukan bukti pembayaran berhasil.

Sesuaikan detail status, format respons, formula signature, masa berlaku, dan endpoint dengan dokumentasi POP yang berlaku serta kontrak merchant yang aktif. Jangan mengarang parameter atau formula jika belum diverifikasi.

## 5. Pendaftaran dan aktivasi merchant

Sumber: [Duitku — dokumentasi akun/aktivasi](https://docs.duitku.com/en/account/) dan [FAQ Duitku](https://www.duitku.com/frequently-asked-questions/).

| ID | Requirement | Kriteria penerimaan | Klasifikasi | Status awal |
|---|---|---|---|---|
| MER-001 | Akun dan kontak pendaftaran | Email/nomor telepon dan formulir pendaftaran dilengkapi sesuai alur Duitku | Proses resmi Duitku | Belum diverifikasi |
| MER-002 | Dokumen identitas dan legalitas | Dokumen sesuai kategori merchant dan daftar terbaru dari Duitku | Proses resmi Duitku | Belum diverifikasi |
| MER-003 | Informasi rekening | Data rekening disediakan sesuai ketentuan pendaftaran | Proses resmi Duitku | Belum diverifikasi |
| MER-004 | Logo dan materi usaha | Materi yang diminta dalam proses aktivasi disiapkan | Proses resmi Duitku jika diminta pada kategori terkait | Belum diverifikasi |
| MER-005 | Website untuk pemeriksaan | URL live dapat dibuka dan kontennya sesuai kegiatan usaha | Resmi Duitku | Belum diverifikasi |
| MER-006 | Dokumen tambahan | Dokumen tambahan diberikan jika diminta tim verifikasi | Proses resmi Duitku | Belum diverifikasi |
| MER-007 | Aktivasi produksi | Transaksi produksi hanya digunakan setelah persetujuan/aktivasi Duitku | Proses operasional | Belum diverifikasi |

Daftar dokumen bisa berbeda berdasarkan kategori dan proses merchant. Gunakan permintaan aktual di dashboard atau dari tim Duitku sebagai acuan final.

## 6. Rencana pengujian penerimaan

### Frontend

- [ ] Domain membuka website toko yang benar.
- [ ] Tidak ada halaman parked domain, halaman kosong, atau error.
- [ ] Website dapat diakses dalam mode privat/incognito tanpa login.
- [ ] Informasi usaha dan kontak terlihat.
- [ ] Katalog dan harga produk terlihat dan sesuai kegiatan usaha.
- [ ] Tautan kebijakan dan kontak berfungsi.
- [ ] HTTPS tidak menampilkan peringatan sertifikat.

### Backend Duitku POP

- [ ] Create Invoice berhasil di sandbox.
- [ ] Signature request cocok dengan dokumentasi.
- [ ] Nominal dan ID pesanan sesuai database.
- [ ] Callback dengan signature valid diproses.
- [ ] Callback dengan signature tidak valid ditolak.
- [ ] Callback duplikat tidak menimbulkan efek ganda.
- [ ] Status dari redirect browser tidak dianggap bukti pembayaran.
- [ ] Kegagalan, pembayaran tertunda, dan callback terlambat ditangani.
- [ ] Stok dan status pesanan konsisten setelah hasil pembayaran terverifikasi.
- [ ] Secret tidak muncul pada bundle frontend, respons publik, atau log.

Pengujian harus dilakukan di lingkungan sandbox sebelum penggunaan produksi. Checklist ini tidak membuktikan bahwa pengujian sudah dijalankan.

## 7. Aturan perubahan dan batasan

- Dokumen ini hanya mendefinisikan requirement.
- Tidak ada kode aplikasi, database, Edge Function, DNS, konfigurasi hosting, atau deployment yang diubah sebagai bagian dari pemenuhan dokumen ini.
- Requirement yang belum didukung kutipan dokumentasi resmi harus tetap diberi label rekomendasi atau menunggu konfirmasi Duitku.
- Perubahan requirement atau implementasi berikutnya dilakukan setelah audit dan persetujuan eksplisit.
- Simpan bukti untuk setiap status audit: URL yang diuji, waktu pengujian, hasil, screenshot/log yang aman, serta referensi dokumentasi.

## 8. Referensi resmi

1. [FAQ Duitku](https://www.duitku.com/frequently-asked-questions/)
2. [Dokumentasi aktivasi akun Duitku](https://docs.duitku.com/en/account/)
3. [Dokumentasi Duitku POP Indonesia](https://docs.duitku.com/pop/id/)

**Disclaimer:** Ini adalah dokumen requirement proyek yang disusun dari rujukan resmi di atas, bukan dokumen yang diterbitkan atau disahkan Duitku. Verifikasi kembali redaksi dan persyaratan terbaru di sumber resmi sebelum menggunakannya sebagai dasar pengajuan merchant.
