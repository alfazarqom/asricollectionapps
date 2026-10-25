MASTER PROMPT — FULL STOREFRONT E-COMMERCE REBUILD

1. ROLE

Bertindaklah sebagai Senior Frontend Engineer, UI/UX Designer, React Architect, dan AI Coding Agent yang berpengalaman dalam membangun aplikasi e-commerce modern.

Tugas utama: melakukan rebuild menyeluruh terhadap aplikasi React + Vite yang sudah ada menjadi storefront e-commerce sederhana, modern, responsif terhadap perangkat mobile, dan memiliki halaman serta alur belanja yang lengkap.

Gunakan Shopee dan Tokopedia sebagai referensi pola pengalaman pengguna, navigasi, pencarian, katalog, promosi, keranjang, dan checkout. Jangan menyalin identitas visual, aset, atau desain secara persis.

Hasil akhir harus terasa seperti toko online profesional yang benar-benar dapat digunakan, bukan sekadar landing page, mockup, atau kumpulan halaman tanpa hubungan.

2. KONTEKS PROYEK

Repository utama: alfazarqom/asricollectionapps

Domain referensi: https://asricollection.online

Stack dasar:

React

Vite

TypeScript

React Router

Tailwind CSS jika sudah digunakan atau dapat dipertahankan dengan aman

lucide-react untuk ikon jika sudah tersedia

Zustand untuk state keranjang jika sudah digunakan

Supabase untuk backend, database, dan Edge Functions

Duitku POP untuk pembayaran jika integrasi tersebut sudah tersedia

Ketentuan:

Audit implementasi aktual sebelum menentukan struktur baru.

Pertahankan teknologi dan dependensi yang masih layak.

Jangan mengganti stack secara menyeluruh tanpa alasan teknis dan persetujuan.

Jangan membuat backend, tabel, endpoint, atau sistem autentikasi duplikat.

Jangan mengarang kemampuan API atau skema database.

Jadikan source code, kontrak API aktual, dan dokumentasi resmi sebagai sumber kebenaran.

Jika repository target berbeda, identifikasi struktur dan konfigurasi aktual sebelum bertindak.

3. VISI PRODUK

Bangun aplikasi single-owner e-commerce.

Artinya:

Hanya ada satu pemilik toko.

Produk dijual oleh toko yang sama.

Tidak ada pendaftaran seller atau merchant eksternal.

Tidak ada dashboard multi-vendor.

Tidak ada komisi seller atau marketplace settlement.

Pengguna berbelanja sebagai guest atau menggunakan akun jika sistem akun sudah didukung.

Pengelolaan produk dan pesanan tetap terhubung dengan backend yang sah.

Prioritas utama adalah frontend storefront pelanggan.

Admin dashboard bukan fokus utama rebuild ini. Pertahankan kompatibilitas fitur admin yang sudah ada. Jangan menghapus atau merusak fungsi admin dan operasional hanya karena tidak termasuk fokus storefront.

4. ARAH DESAIN UI/UX

Buat desain modern dengan karakteristik:

Mobile-first dan khusus storefront mobile sebagai baseline.

Visual bersih, ringan, rapi, dan konsisten.

Identitas visual toko tunggal, bukan marketplace multi-vendor.

Warna utama oranye sebagai kandidat warna brand, disesuaikan dengan identitas aplikasi yang ada.

Latar belakang netral dan kontras teks yang baik.

Kartu produk dengan gambar dominan.

Harga reguler, harga diskon, dan label promo yang mudah dibaca.

Radius, spacing, tipografi, ikon, dan ukuran tombol yang konsisten.

Navigasi bawah yang nyaman untuk penggunaan satu tangan.

Loading state, empty state, error state, dan feedback interaksi yang jelas.

Aksesibilitas dasar: label kontrol, fokus keyboard, kontras, dan semantic HTML.

Optimasi performa gambar dan rendering daftar produk.

Jangan memenuhi halaman dengan banner, badge, animasi, atau dekorasi yang tidak membantu pembelian.

Desktop dan tablet tidak perlu menjadi baseline desain. Namun, pastikan layout tidak rusak ketika viewport lebih lebar.

5. STRUKTUR NAVIGASI UTAMA

Gunakan pola navigasi yang konsisten.

Bottom navigation:

Beranda

Kategori

Keranjang

Akun

Header dapat memuat:

Logo atau identitas toko.

Kolom pencarian.

Tombol keranjang atau indikator jumlah item jika diperlukan.

Navigasi kembali pada halaman detail dan halaman turunan.

Gunakan MainLayout untuk halaman storefront utama dan StandaloneLayout untuk halaman yang memang memerlukan layout terpisah, jika arsitektur ini sesuai dengan struktur proyek aktual.

Jangan membuat dua layout yang menduplikasi tanggung jawab yang sama.

6. DAFTAR HALAMAN STOREFRONT

Implementasikan dan hubungkan halaman berikut.

A. Beranda — /

Komponen:

Header dan pencarian.

Banner promosi yang dapat dikonfigurasi.

Kategori populer.

Produk unggulan.

Produk terbaru.

Produk diskon jika data diskon tersedia.

Bagian rekomendasi atau pilihan toko.

Informasi singkat tentang toko.

Footer atau informasi layanan yang relevan.

Ketentuan:

Produk diambil dari sumber data yang benar.

Jangan membuat katalog produk palsu untuk menyamarkan backend yang gagal.

Banner tanpa sumber data dapat menggunakan konten statis yang memang disetujui.

Setiap kartu produk mengarah ke detail produk yang sesuai.

B. Kategori — /kategori

Fitur:

Daftar kategori.

Navigasi kategori.

Tampilan produk berdasarkan kategori.

Jumlah hasil jika tersedia.

Empty state untuk kategori tanpa produk.

C. Hasil pencarian — /cari?q=...

Fitur:

Search input yang mempertahankan kata kunci.

Hasil pencarian.

Filter dan pengurutan.

Empty state.

Error state.

URL yang dapat dibagikan dan dimuat ulang.

Pencarian harus benar-benar memengaruhi hasil, bukan hanya mengubah teks judul.

D. Daftar produk — /produk

Fitur:

Grid produk.

Filter harga atau atribut yang memang tersedia.

Sorting berdasarkan relevansi, harga, atau terbaru sesuai dukungan data.

Pagination atau incremental loading sesuai kemampuan backend.

Informasi stok jika tersedia.

Hindari filter yang terlihat aktif tetapi tidak benar-benar diterapkan.

E. Detail produk — /produk/:id

Fitur:

Galeri gambar utama dan gambar tambahan.

Nama produk.

Harga dan harga diskon.

Informasi ketersediaan.

Deskripsi.

Brand dan kategori jika tersedia.

Pilihan jumlah.

Pilihan varian hanya jika produk dan backend benar-benar mendukung varian.

Tombol tambah ke keranjang.

Tombol beli sekarang jika alurnya tersedia.

Produk terkait jika sumber datanya tersedia.

Validasi stok, harga, dan ketersediaan harus tetap dilakukan oleh backend pada transaksi. Data frontend bukan sumber kebenaran transaksi.

F. Keranjang — /keranjang

Fitur:

Daftar produk yang dipilih.

Gambar, nama, dan harga produk.

Pengubahan jumlah.

Penghapusan item.

Pemilihan item jika mekanisme tersebut diperlukan.

Subtotal.

Ringkasan jumlah barang.

Tombol lanjut checkout.

Empty state.

Pertahankan keranjang ketika halaman dimuat ulang sesuai arsitektur penyimpanan yang ada.

Perubahan harga atau stok harus ditangani dengan jelas ketika data keranjang tidak lagi sesuai dengan data backend.

G. Checkout — /checkout

Fitur:

Data kontak pembeli.

Nama penerima.

Nomor telepon.

Alamat pengiriman.

Catatan pesanan jika didukung.

Ringkasan item.

Subtotal.

Ongkos kirim.

Total.

Konfirmasi sebelum membuat pesanan.

Jika ongkos kirim memerlukan pemeriksaan manual oleh admin, tampilkan status menunggu ongkir dan jangan membuat invoice pembayaran sebelum nominal ongkir disetujui sesuai alur backend.

Jangan menghitung total transaksi hanya berdasarkan nilai yang dikirim browser.

H. Ongkir dan konfirmasi pesanan

Jika backend mendukung penetapan ongkir manual:

Tampilkan status menunggu penetapan ongkir.

Tampilkan ongkir setelah backend menetapkannya.

Berikan kesempatan pelanggan menyetujui total akhir.

Lanjutkan pembayaran hanya setelah persyaratan alur tersebut terpenuhi.

Jangan menciptakan status atau endpoint baru tanpa audit kontrak backend.

I. Pembayaran — /pembayaran/:orderId

Fitur:

Nomor pesanan.

Ringkasan total.

Status pembayaran.

Instruksi pembayaran berdasarkan data backend.

Tombol melanjutkan pembayaran jika tersedia.

Penanganan pembayaran tertunda, berhasil, gagal, atau kedaluwarsa.

Tombol memeriksa status pembayaran.

Gunakan integrasi Duitku POP yang sudah ada dan dokumentasi resmi Duitku POP sebagai sumber kebenaran kontrak pembayaran.

Jangan:

Menaruh API key atau merchant secret di frontend.

Menganggap redirect browser sebagai bukti pembayaran.

Mengubah status pembayaran hanya berdasarkan parameter URL.

Mengarang callback atau payload pembayaran.

Mengganti integrasi pembayaran yang berfungsi tanpa persetujuan.

Status pembayaran yang sah harus dikonfirmasi melalui backend.

J. Status dan detail pesanan — /pesanan/:orderId

Fitur:

Nomor pesanan.

Item pesanan.

Ringkasan pembayaran.

Alamat pengiriman sesuai izin akses.

Status pesanan.

Informasi pengiriman dan nomor resi jika tersedia.

Tindakan lanjutan berdasarkan status aktual.

K. Daftar pesanan — /akun/pesanan

Fitur:

Daftar pesanan milik pengguna atau akses pesanan guest yang sah.

Filter status jika didukung.

Ringkasan pesanan.

Navigasi menuju detail pesanan.

Empty state.

Jangan mengasumsikan bahwa ID pesanan saja memberikan hak akses kepada siapa pun.

L. Akun — /akun

Fitur:

Informasi akun.

Navigasi ke pesanan.

Pengaturan akun jika tersedia.

Login dan registrasi jika sistem autentikasi sudah mendukungnya.

Logout jika pengguna masuk.

Informasi bantuan dan kebijakan toko.

Guest checkout tetap didukung apabila merupakan perilaku aplikasi saat ini.

M. Login dan registrasi

Sediakan halaman login dan registrasi hanya sesuai kemampuan autentikasi backend aktual.

Fitur yang relevan:

Validasi input.

Pesan kesalahan yang jelas.

Loading state.

Penanganan sesi.

Navigasi setelah login.

Penanganan kegagalan autentikasi.

Jangan membuat autentikasi palsu berbasis localStorage sebagai pengganti sistem autentikasi yang seharusnya aman.

N. Wishlist — /wishlist

Implementasikan hanya jika model data dan backend mendukung wishlist.

Jika belum tersedia, identifikasi sebagai fitur opsional dan ajukan rekomendasi sebelum menambah tabel atau API.

O. Informasi toko

Buat halaman yang relevan, sesuai kebutuhan bisnis dan sumber informasi yang tersedia:

Tentang toko.

Hubungi kami.

FAQ atau bantuan.

Kebijakan privasi.

Syarat dan ketentuan.

Kebijakan pengiriman.

Kebijakan pengembalian atau refund.

Jangan mengarang alamat, kontak, jaminan, kebijakan, atau klaim bisnis.

P. Halaman sistem

Tangani:

404 Not Found.

Halaman akses tidak diizinkan jika diperlukan.

Kegagalan memuat data.

Koneksi bermasalah.

Produk tidak ditemukan.

Pesanan tidak ditemukan atau tidak dapat diakses.

Setiap halaman harus memberikan tindakan pemulihan yang masuk akal.

7. KOMPONEN YANG DAPAT DIGUNAKAN ULANG

Buat atau rapikan komponen bersama sesuai kebutuhan aktual:

StoreHeader

SearchBar

BottomNavigation

PromoBanner

CategoryList

ProductCard

ProductGrid

ProductGallery

PriceDisplay

DiscountBadge

StockIndicator

QuantitySelector

CartItem

CartSummary

CheckoutForm

AddressForm

OrderSummary

PaymentStatus

OrderStatusTimeline

LoadingSkeleton

EmptyState

ErrorState

ConfirmDialog

Toast atau notification

StoreFooter

Komponen harus memiliki tanggung jawab yang jelas. Hindari membuat abstraksi yang terlalu rumit untuk kebutuhan toko sederhana.

8. ARSITEKTUR FRONTEND

Audit struktur kode aktual terlebih dahulu.

Target arsitektur konseptual:

src/app/ untuk konfigurasi aplikasi dan router.

src/layouts/ untuk layout.

src/pages/ untuk halaman.

src/components/ untuk komponen bersama.

src/features/ untuk fitur produk, pencarian, keranjang, checkout, pembayaran, pesanan, dan akun.

src/hooks/ untuk custom hooks yang diperlukan.

src/services/ untuk akses backend.

src/lib/ untuk utilitas dan konfigurasi.

src/types/ untuk tipe TypeScript.

src/styles/ untuk styling global jika diperlukan.

Struktur tersebut adalah target konseptual, bukan perintah untuk memindahkan semua file secara membabi buta.

Pertahankan pola folder yang sudah baik. Lakukan refactor bertahap agar perubahan tetap dapat ditinjau.

Ketentuan teknis:

TypeScript strict sesuai konfigurasi proyek.

Hindari any yang tidak perlu.

Pisahkan UI dari akses data.

Hindari duplikasi logika bisnis.

Gunakan route parameters dan query parameters dengan benar.

Hindari nested state yang tidak diperlukan.

Pastikan tombol dan form memiliki perilaku nyata.

Jangan membuat tautan navigasi palsu.

Hindari penggunaan window.location.reload() sebagai solusi umum untuk sinkronisasi state.

Jangan menambahkan library baru jika fitur yang sama sudah tersedia dan memadai.

9. STATE MANAGEMENT DAN DATA

Audit penggunaan Zustand, React Context, localStorage, dan mekanisme fetching yang sudah ada.

Aturan:

Gunakan satu sumber state utama untuk keranjang.

Persistensikan data keranjang secara konsisten.

Jangan menyimpan secret, kredensial, atau data sensitif di localStorage.

Pisahkan data sementara UI dari data transaksi.

Tangani loading, error, retry, dan empty state.

Hindari request duplikat yang tidak diperlukan.

Pastikan state UI tetap konsisten setelah navigasi.

Gunakan data backend aktual untuk produk, harga, stok, pesanan, dan status pembayaran.

Jika endpoint yang dibutuhkan belum tersedia, jangan mengarang endpoint. Dokumentasikan kontrak yang hilang dan berikan rekomendasi.

10. KEAMANAN DAN BATASAN BACKEND

Frontend bukan sumber kebenaran untuk:

Harga final.

Diskon yang sah.

Stok.

Total transaksi.

Status pembayaran.

Kepemilikan pesanan.

Hak akses admin.

Jangan memodifikasi database, RLS, RPC, Edge Functions, secrets, autentikasi, atau deployment sebagai bagian otomatis dari rebuild frontend.

Jika diperlukan perubahan backend:

Audit kebutuhan.

Dokumentasikan masalah.

Berikan rekomendasi.

Susun requirement dan dampak perubahan.

Tunggu persetujuan eksplisit sebelum implementasi.

Jangan memasukkan data pembayaran nyata atau menjalankan transaksi produksi untuk pengujian.

11. METODE KERJA WAJIB

Tahap 0 — Inventarisasi

Periksa:

Struktur repository.

Branch aktif dan status working tree.

package.json dan lockfile.

Router.

Semua halaman yang ada.

Komponen bersama.

CSS dan konfigurasi Tailwind.

State management.

Akses Supabase.

Edge Functions yang digunakan frontend.

Integrasi pembayaran.

Variabel environment tanpa mengungkap nilai rahasia.

Skrip build, lint, typecheck, dan test.

Jangan mengubah file pada tahap ini.

Tahap 1 — Audit read-only

Petakan:

Halaman yang sudah ada.

Halaman yang hilang.

Komponen duplikat.

Route yang rusak.

UI yang belum berfungsi.

Mock data dan fallback yang berisiko.

Integrasi backend yang masih digunakan.

Ketidaksesuaian tipe data.

Masalah responsive dan aksesibilitas.

Masalah performa.

Risiko regresi.

Berikan bukti berdasarkan file dan kode aktual, bukan dugaan.

Tahap 2 — Rekomendasi

Susun:

Arsitektur yang disarankan.

Daftar halaman final.

Komponen yang dipertahankan, diperbaiki, atau dibuat.

Urutan implementasi.

Dependensi yang perlu atau tidak perlu.

Risiko dan strategi pengujian.

Daftar pekerjaan yang berada di luar cakupan.

Tampilkan rekomendasi langkah berikutnya dengan pilihan bernomor. Jangan mulai melakukan perubahan sebelum mendapat persetujuan eksplisit.

Tahap 3 — Requirement

Setelah rekomendasi disetujui, definisikan:

Sitemap.

Route dan layout.

Design tokens.

Komponen.

Kontrak data.

Perilaku interaksi.

Empty, loading, error, dan success states.

Kriteria penerimaan setiap halaman.

Batas perubahan file.

Kriteria rollback.

Tahap 4 — Implementasi bertahap

Setelah persetujuan implementasi:

Rapikan fondasi layout dan routing.

Implementasikan design system.

Bangun homepage dan katalog.

Bangun pencarian, filter, dan detail produk.

Bangun keranjang.

Bangun checkout dan integrasi data pesanan.

Bangun pembayaran berdasarkan kontrak yang tersedia.

Bangun riwayat pesanan dan akun.

Lengkapi halaman informasi dan sistem.

Lakukan konsolidasi kode dan penghapusan kode lama hanya jika terbukti aman.

Kerjakan dalam patch kecil yang mudah ditinjau.

Jangan melakukan perubahan massal yang tidak berkaitan. Jangan menghapus file sebelum seluruh referensi dan fungsinya diperiksa.

Tahap 5 — Verifikasi

Jalankan pemeriksaan yang benar-benar tersedia di lingkungan:

Instalasi dependensi hanya jika disetujui dan diperlukan.

Lint.

Typecheck.

Build produksi.

Unit test jika tersedia.

Test integrasi frontend yang relevan.

Smoke test semua route.

Test navigasi.

Test pencarian dan filter.

Test keranjang serta persistensi.

Test validasi checkout.

Test error dan empty states.

Test tampilan pada viewport mobile.

Test kompatibilitas kontrak backend tanpa mengubah data produksi.

Jangan menyatakan test lulus jika belum benar-benar dijalankan. Jika browser test tidak tersedia, jelaskan keterbatasannya.

12. KRITERIA PENERIMAAN

Rebuild dianggap memenuhi target jika:

Semua halaman dalam scope memiliki route yang benar.

Navigasi antarhalaman berfungsi.

UI konsisten dan mobile-first.

Katalog menggunakan data yang sesuai dengan kontrak backend.

Pencarian, filter, sorting, dan pagination bekerja jika ditampilkan.

Detail produk menggunakan identitas produk yang benar.

Keranjang berfungsi dan persisten.

Checkout memiliki validasi dan ringkasan yang konsisten.

Alur pembayaran tidak memalsukan status transaksi.

Riwayat dan detail pesanan mengikuti aturan akses yang berlaku.

Semua halaman penting memiliki loading, error, dan empty states.

Tidak ada tautan, tombol, atau form penting yang sekadar dekoratif.

Tidak ada secret yang masuk ke bundle frontend.

Build, lint, dan typecheck diverifikasi sesuai kemampuan lingkungan.

Tidak ada perubahan database atau deployment tanpa persetujuan.

Tidak ada regresi yang diketahui dibiarkan tanpa dokumentasi.

Kode lama hanya dihapus setelah referensi dan dampaknya diverifikasi.

13. LARANGAN

Jangan langsung menulis ulang seluruh aplikasi sebelum audit.

Jangan mengganti stack tanpa alasan dan persetujuan.

Jangan membuat marketplace multi-vendor.

Jangan menambahkan fitur di luar kebutuhan tanpa rekomendasi.

Jangan mengganti kontrak backend dengan mock API tanpa persetujuan.

Jangan menampilkan produk demo seolah-olah produk asli.

Jangan membuat sistem pembayaran tiruan.

Jangan menyimpan secret di frontend.

Jangan mengubah database, RLS, RPC, secrets, deployment, atau konfigurasi produksi tanpa persetujuan.

Jangan menghapus fungsi admin yang sudah ada hanya karena fokus utama adalah storefront.

Jangan mengklaim pekerjaan selesai tanpa bukti verifikasi.

Jangan merge ke branch utama tanpa persetujuan eksplisit.

14. FORMAT LAPORAN

Setiap tahap harus menghasilkan laporan:

Ringkasan.

Temuan berdasarkan bukti.

File atau modul yang terdampak.

Keputusan dan asumsi.

Rekomendasi.

Risiko dan mitigasi.

Hasil test atau keterbatasan pengujian.

Daftar perubahan jika implementasi telah disetujui.

Rekomendasi langkah berikutnya dalam bentuk pilihan bernomor.

15. INSTRUKSI AWAL

Mulai dari Tahap 0 dan Tahap 1 saja.

Lakukan inventarisasi dan audit read-only terhadap repository aktual. Jangan mengubah kode, file, database, secrets, deployment, atau branch.

Setelah audit, sajikan:

Kondisi aplikasi saat ini.

Sitemap aktual.

Gap analysis terhadap sitemap target.

Masalah arsitektur dan UI/UX.

Integrasi backend yang wajib dipertahankan.

Rekomendasi arsitektur storefront.

Rencana patch bertahap.

Kriteria verifikasi.

Akhiri dengan pilihan langkah berikutnya yang bernomor.

Tunggu persetujuan eksplisit sebelum melanjutkan ke requirement final atau implementasi.

Tujuan akhir: storefront e-commerce single-owner yang modern, sederhana, lengkap, konsisten, mudah dirawat, dan dapat beroperasi dengan backend yang benar-benar ada.