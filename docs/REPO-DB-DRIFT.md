# Catatan Drift Repository dan Supabase Aktif

Tanggal audit: 2026-10-22  
Repository: `alfazarqom/asricollectionapps`, branch audit `fix/repo-audit-hardening`  
Proyek Supabase yang diperiksa secara read-only: `mvwflakurihhakdrlteg`

> Dokumen ini merekam perbedaan yang teramati pada saat audit. Ini bukan dump schema lengkap dan bukan instruksi untuk langsung menjalankan migration. Tidak ada database, secret, atau deployment yang diubah dalam pekerjaan ini.

## Ringkasan

| Area | Repository | Supabase aktif saat audit | Implikasi |
|---|---|---|---|
| Migration | Satu file SQL pada `supabase/migrations/` yang diperiksa | Riwayat migration aktif menunjukkan 11 entri | Riwayat repository tidak lengkap; urutan schema tidak dapat direkonstruksi dari file yang ada saja |
| Produk | File migration awal tidak mencakup seluruh atribut produk yang terlihat pada schema aktif | Kolom `additional_image_link` ditemukan pada katalog aktif | Jangan mengasumsikan migration tunggal sama dengan schema aktif |
| Edge Functions | Repository memuat antara lain `get-products`, `duitku-create-invoice`, `duitku-callback`, `get-duitku-payment-status` | Fungsi tambahan aktif termasuk `create-order`, `get-order-tracking`, `product-crud`, dan `ws-crud` | Repository bukan salinan lengkap seluruh backend yang aktif |
| RLS dan grants | Migration SQL bukan representasi lengkap kebijakan saat ini | Tabel utama yang diperiksa memiliki RLS aktif; grants untuk `anon` dan `authenticated` juga ada | Keamanan efektif harus dinilai dari gabungan grants, policies, fungsi SQL, dan konfigurasi Edge Function |
| SQL functions | Repository memiliki definisi fungsi pada migration awal | Advisor menandai fungsi dengan `search_path` yang dapat berubah, termasuk `reserve_inventory_atomic`, `release_expired_reservations`, dan `commit_inventory_atomic` | Perlu hardening SQL terpisah setelah definisi aktif dan dependensi diverifikasi |

## Temuan rinci

### 1. Migration drift

- Riwayat migration Supabase aktif berisi 11 entri pada saat audit.
- Direktori migration repository yang diperiksa hanya berisi `20261009000000_init_ecommerce_duitku.sql`.
- File migration awal tidak boleh diedit untuk meniru schema aktif. Perubahan historis yang tidak ada harus direkonstruksi dari sumber tepercaya atau dump schema yang disetujui.
- Jangan menjalankan `supabase db push`, reset, migration manual, atau perubahan schema untuk menyelesaikan drift ini tanpa rekonsiliasi dan persetujuan terpisah.

### 2. Fungsi pembayaran

Repository memuat fungsi invoice, callback, dan status pembayaran, tetapi nama fungsi aktif yang ditemukan tidak seluruhnya tercermin pada repository. Sebelum deployment berikutnya, bandingkan source aktif dengan source branch dan catat hash/versi setiap fungsi.

Perbaikan di branch audit ini tidak dideploy ke Supabase. Artinya, perubahan callback HMAC dan fail-closed pada repository **belum** berlaku pada fungsi yang sedang aktif sampai proses deployment mendapat persetujuan terpisah.

Dokumentasi POP membedakan key untuk Create Invoice dan menyebut `merchantKey` untuk signature callback. Kode branch ini memakai secret `DUITKU_MERCHANT_KEY` khusus untuk callback. Apakah merchant key identik dengan API key pada akun merchant ini harus dikonfirmasi secara resmi; tidak ada secret aktif yang dibaca atau diubah.

### 3. Konsistensi pembayaran dan inventori

Fungsi invoice di repository melakukan operasi terpisah untuk:
1. membuat pesanan;
2. menyimpan item;
3. meminta reservasi melalui RPC;
4. meminta invoice Duitku;
5. menyimpan referensi pembayaran.

Operasi tersebut belum dibuktikan sebagai satu transaksi atomik. Kegagalan di tengah alur dapat meninggalkan pesanan/reservasi tertunda. Callback yang telah diverifikasi harus memanggil satu prosedur database atomik; jangan membuat jalur pembaruan status alternatif ketika RPC gagal.

Model stok juga perlu diperiksa secara khusus. Kolom stok langsung pada tabel `products` tidak terkonfirmasi dari audit ini. Jangan menyimpulkan stok benar-benar dikurangi hanya karena sebuah fungsi reservasi berhasil dipanggil.

### 4. Security dan performance advisors

Advisor Supabase pada saat audit menampilkan beberapa hal untuk ditinjau:
- fungsi SQL yang `search_path`-nya dapat berubah;
- indeks foreign key yang belum tersedia;
- evaluasi fungsi pada policy RLS;
- policy permisif yang berpotensi tumpang tindih.

Ini adalah temuan untuk dianalisis, bukan persetujuan otomatis untuk mengubah database. Setiap perubahan harus memiliki diff SQL, penjelasan dampak, tes policy/grants, dan persetujuan eksekusi tersendiri.

### 5. Express dan deployment

`server.ts` masih memiliki `Map` untuk endpoint admin/tracking lama, tetapi pembuatan invoice dan pembacaan status kini didelegasikan ke Edge Functions kanonis. Karena checkout baru tidak menulis ke Map tersebut, endpoint admin/tracking lokal yang masih membaca Map tidak akan menampilkan order baru. Penyimpanan itu tidak persisten dan tidak dapat menjadi sumber status pesanan produksi. `vercel.json` mengarahkan beberapa route ke Edge Functions tetapi tidak menyediakan route backend untuk endpoint admin Express.

Branch audit ini menghapus data contoh pesanan yang otomatis ditanam, menghapus fallback pembuatan invoice langsung dari Express ke Duitku, mencegah URL invoice palsu, mengarahkan invoice/status ke fungsi Supabase kanonis, menonaktifkan simulasi callback aplikasi, dan membuat endpoint callback Express tidak dapat mengubah status pembayaran. Perubahan tersebut hanya ada di branch ini sampai ditinjau dan di-merge/deploy secara terpisah.

## Rencana rekonsiliasi yang disarankan

1. Ambil daftar lengkap migration aktif dan file schema dari proyek yang benar.
2. Cocokkan tiap migration aktif dengan file repository berdasarkan timestamp, isi, dan hash; jangan membuat file kosong untuk mengisi celah.
3. Ambil definisi aktif untuk tabel, policy, grants, trigger, function/RPC, dan indeks yang relevan.
4. Bandingkan source aktif Edge Functions dengan branch repository dan catat versi/hash.
5. Siapkan migration baru hanya untuk perubahan yang memang dibutuhkan, bukan untuk merekayasa ulang sejarah.
6. Uji callback, nominal mismatch, callback duplikat, status terminal, kegagalan RPC, dan pemulihan reservasi di staging/Sandbox.
7. Minta persetujuan terpisah sebelum menerapkan migration, secrets, atau deployment.

## Batasan bukti

Audit ini menggunakan metadata proyek, daftar migration/fungsi, tabel/policy/grants, advisor, dan file repository yang dapat dibaca. Belum dilakukan dump lengkap seluruh schema atau pengujian langsung pada database. Tidak ada kesimpulan bahwa seluruh RLS, fungsi aktif, atau alur pembayaran telah lolos uji.


## Patch lanjutan: stok atomik dan kontrak tracking/admin (belum diterapkan ke Supabase)

Migration kandidat `supabase/migrations/20261022100000_atomic_stock_tracking_admin.sql` menambahkan `products.stock_quantity` sebagai integer non-negatif dengan default 0. Nilai default nol dipilih secara fail-closed karena jumlah stok historis belum terverifikasi; setelah migration disetujui dan diterapkan, jumlah fisik harus diisi berdasarkan inventaris nyata sebelum checkout menerima pesanan. Migration juga mengganti `reserve_inventory_atomic` dan `process_duitku_callback_atomic` agar reservasi mengurangi ketersediaan yang dapat dipesan, dan callback sukses mengurangi stok fisik hanya ketika seluruh reservasi masih aktif. Pembayaran sukses yang terlambat atau tanpa reservasi valid tetap tercatat sebagai pembayaran yang perlu rekonsiliasi; stok tidak dialokasikan otomatis.

Kontrak tracking sekarang dikandidatkan melalui `get-order-tracking`, yang meminta nomor pesanan beserta email/telepon yang cocok tepat dengan data checkout. `/api/orders/track` tidak lagi membaca `Map` lokal. Endpoint admin diarahkan ke `admin-api`, membaca tabel `orders`/item secara persisten, dan memakai RPC `admin_update_order_shipping_atomic` untuk memperbarui ongkir/status serta audit log dalam satu transaksi.

**Batasan penting:** file migration belum dijalankan pada proyek Supabase aktif; fungsi Edge baru belum dideploy; secret `ADMIN_SECRET_PIN` harus dikonfigurasi terpisah di Supabase Secrets sebelum endpoint admin dapat digunakan. Verifikasi CI dan pengujian integrasi masih wajib sebelum keputusan merge.
