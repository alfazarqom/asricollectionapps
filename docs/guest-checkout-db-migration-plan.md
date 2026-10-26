# Rencana Migrasi Database — Guest Checkout Server-Side

**Status:** DRAF UNTUK TINJAUAN — BELUM DISETUJUI, BELUM DIJALANKAN  
**Target:** Supabase project `mvwflakurihhakdrlteg` (schema aktif; perlakukan sebagai production sampai lingkungan berbeda dibuktikan)  
**Repository:** `alfazarqom/asricollectionapps`  
**Branch dokumen:** `feat/guest-checkout-security-gate`  
**Baseline Git:** `795fb50352c4f14bf38dcd2f495c563ed41d4d02`  
**Batas:** Tidak menjalankan SQL/migrasi, tidak mengubah data/RLS/grants/secrets/config, tidak deploy, merge, atau menjalankan transaksi Sandbox.

## 1. Ringkasan keputusan

Rencana ini memisahkan perubahan database dari patch Edge Function. Perubahan baru hanya boleh dilaksanakan setelah rencana dan migration SQL final disetujui secara eksplisit. Audit read-only saat ini mengonfirmasi bahwa kebijakan publik memungkinkan SELECT dan INSERT pada `orders` dan `order_items`; skema `orders` tidak memiliki kolom token guest; dan query katalog fungsi `public` tidak menemukan RPC checkout/order/payment/callback/inventory yang cocok. Riwayat migrasi mencantumkan migrasi terkait guest checkout/RPC lama, tetapi keadaan aktif harus menjadi acuan karena skema dan migrasi bisa drift.

**P0:** Jangan mengaktifkan guest checkout yang mengklaim aman sampai akses tabel langsung ditutup dan alur token diverifikasi end-to-end.

## 2. Baseline aktif yang diamati (read-only)

- Project ref: `mvwflakurihhakdrlteg`.
- `public.orders`: RLS aktif; memiliki `id`, `merchant_order_id` unik, `user_id` nullable, `amount`, `shipping_fee` (default 25000), `discount_amount`, `total_amount`, detail pelanggan/alamat, status dan kolom pembayaran; belum terlihat kolom token guest.
- `public.order_items`: RLS aktif; memiliki FK `order_id` ke orders dan FK `product_id` ke `public.products`; item menyimpan `price`, `quantity`, `subtotal`.
- Kebijakan aktif: `Public can query orders by order number` SELECT `USING (true)`; `Public can create orders` INSERT `WITH CHECK (true)`; `Public can view order items` SELECT `USING (true)`; `Public can create order items` INSERT `WITH CHECK (true)`.
- `public.products`: UUID ID, `price numeric`, `original_price numeric`, `discount_percentage integer`, `stock integer`, `is_active boolean`, ukuran/warna. FK order_items mengarah ke tabel ini.
- `public.products_contoh`: ID varchar, `price numeric`, `sale_price numeric`, `availability`, `stock_quantity integer`. Tidak kompatibel langsung dengan FK `order_items.product_id` yang mengarah ke `products.id`.
- `public.promo_codes` tersedia; aturan penerapan/validasi kupon checkout belum ditetapkan dalam rencana ini.
- Query read-only `pg_proc` untuk fungsi publik bernama mengandung order/guest/checkout/payment/callback/inventory tidak menemukan hasil.
- Query read-only kebijakan dan metadata tabel tidak mengubah schema atau data.

## 3. Tujuan dan kontrak

### 3.1 Checkout tepercaya di server

Klien mengirim hanya daftar `product_id` UUID + quantity serta input kontak/alamat dan kode promo bila digunakan. Klien tidak berwenang menentukan `price`, `subtotal`, `discount_amount`, `shipping_fee`, `total_amount`, status, payment URL, atau payment reference.

Server/RPC harus:
1. Validasi bentuk payload, batas maksimum jumlah baris, batas kuantitas, field pelanggan, ukuran alamat, dan idempotency key.
2. Muat produk dari `public.products` (bukan `products_contoh`, kecuali keputusan bisnis terpisah menyetujui perpindahan sumber data). Tolak ID tidak dikenal, tidak aktif, duplikat, harga non-integer IDR, kuantitas invalid, atau stok tidak cukup.
3. Tetapkan satu aturan harga kanonis yang disetujui. Jangan mengasumsikan apakah `price`, `original_price`, atau `discount_percentage` adalah harga yang dibayar sebelum keputusan produk/merchandising dikonfirmasi.
4. Hitung setiap subtotal dan total di server dengan integer IDR; jangan memakai pembulatan implisit pada `numeric`. Bila nilai sumber bukan integer, tolak item atau gunakan aturan konversi yang disetujui eksplisit.
5. Terapkan diskon/kupon hanya berdasarkan aturan server yang tervalidasi. Tentukan formula diskon, batas maksimum, masa berlaku, minimum belanja, dan apakah kupon dapat digabung.
6. Hitung ongkir menurut keputusan bisnis. Saat ongkir manual, buat order dengan status menunggu ongkir dan jangan membuat invoice sebelum ongkir final disetujui pelanggan.
7. Buat `orders` dan semua `order_items` dalam satu transaksi database; lakukan pemeriksaan/reservasi stok atomik bila stok dikelola oleh checkout.
8. Simpan idempotency key dengan unique constraint/scope yang sesuai agar retry tidak membuat order ganda.
9. Buat token akses guest berentropi tinggi di Edge Function menggunakan CSPRNG. Simpan hanya hash SHA-256 token (hex/base64url yang konsisten), waktu pembuatan, expiry dan status pencabutan. Token mentah hanya dikembalikan sekali kepada klien dan tidak boleh masuk log.
10. RPC yang memiliki hak istimewa harus memakai nama parameter eksplisit, `search_path` yang aman, validasi penuh, dan EXECUTE dibatasi ke role backend yang memang diperlukan.

### 3.2 Token akses guest

Usulan kolom minimal pada `public.orders` (perlu tinjauan nama/tipe final):
- `guest_access_token_hash text NULL` — hash token; tidak pernah token mentah.
- `guest_access_token_expires_at timestamptz NULL`.
- `guest_access_token_revoked_at timestamptz NULL`.
- `checkout_idempotency_key text NULL` (atau tabel idempotency terpisah bila perlu scope lintas endpoint).

Tambahkan unique partial index pada hash token non-NULL dan unique constraint/index untuk idempotency sesuai scope final. Jangan menyimpan token dalam `notes`, `additional_param`, atau log. Validasi token dengan constant-time comparison bila perbandingan dilakukan di aplikasi; query pencarian sebaiknya menggunakan hash hasil derivasi token. Pertimbangkan rotasi/pencabutan dan rate limit pada endpoint lookup.

Token hanya mengizinkan akses baca yang sangat terbatas ke satu order miliknya (status, ringkasan item, jumlah, instruksi pembayaran/pengiriman yang dibutuhkan). Jangan mengembalikan email/telepon/alamat lengkap jika tidak dibutuhkan untuk tujuan endpoint. Token tidak boleh mengizinkan perubahan alamat, harga, status, atau pembayaran.

### 3.3 RPC yang diusulkan

Nama kandidat (belum final):
- `checkout_create_guest_order_v1(payload jsonb, guest_token_hash text, idempotency_key text)` — transaksi membuat order dan items dari produk server-side, menghitung total, validasi stok, menyimpan hash token, mengembalikan hanya data checkout minimum.
- Opsional `checkout_finalize_shipping_v1(order_id uuid, shipping_fee integer, expected_order_version ...)` — hanya jika alur admin/ongkir perlu operasi atomik yang belum tersedia.
- Hindari RPC publik untuk token lookup. Gunakan Edge Function yang memverifikasi token lalu mengembalikan projection order minimal.
- Jangan menambah RPC baru untuk payment/callback sebelum audit kompatibilitas fungsi dan migrasi yang sudah ada selesai.

Semua nama, signature, grants dan perilaku final harus disepakati setelah kontrak admin/ongkir/stok diperjelas.

## 4. Rencana migrasi bertahap (belum dieksekusi)

### Tahap 0 — prasyarat sebelum SQL final
- Audit seluruh grants tabel dan schema, semua policy pada orders/order_items/products/promo_codes, fungsi/triggers/constraints/indexes, dan consumer frontend/admin.
- Cocokkan migrasi repository dengan migration history serta schema aktif; migrasi lama terkait guest checkout harus ditinjau sebelum membuat objek serupa.
- Konfirmasi bahwa produk kanonis adalah `public.products`; konfirmasi harga efektif, integer-IDR, diskon/kupon, ongkir manual, stock field yang authoritative (`products.stock` saat ini vs `products_contoh.stock_quantity`), dan lifecycle status.
- Inventarisasi semua pembaca/penulis orders/order_items termasuk dashboard admin, riwayat customer, callback, invoice dan support.

### Tahap 1 — skema token/idempotensi (proposal DDL)
- Tambah kolom token hash/expiry/revocation dan idempotency yang disetujui; tambah constraint/index unik yang sesuai.
- Tambah metadata versi/status bila diperlukan untuk compare-and-set status pembayaran.
- Tidak mengisi token untuk order lama dan tidak mengubah data historis dalam migrasi ini.
- Pastikan perubahan additive dan kompatibel selama periode rollout.

### Tahap 2 — RPC checkout transaksional (proposal DDL)
- Buat fungsi transaksi yang menerima input non-authoritative dari klien, memvalidasi produk dan menghitung semua angka di server.
- Buat order dan item dengan harga snapshot, cek stok secara atomik dan enforce idempotency.
- Tetapkan `SECURITY DEFINER` hanya bila diperlukan; gunakan `SET search_path = ''`/search path eksplisit aman dan schema-qualify seluruh objek.
- Batasi EXECUTE hanya untuk role backend yang dipilih setelah audit grants. Jangan memberi EXECUTE ke `anon`/public secara otomatis.
- Validasi signature function dan grants secara independen sebelum digunakan.

### Tahap 3 — tutup akses tabel langsung (proposal kebijakan/grants)
- Hapus/ganti policy publik `Public can query orders by order number`, `Public can create orders`, `Public can view order items`, dan `Public can create order items` setelah semua consumer terpetakan.
- Cabut privilege langsung SELECT/INSERT/UPDATE/DELETE untuk role publik/anon pada order tables sesuai kebutuhan final; RLS dan SQL grants harus sama-sama diperiksa.
- Berikan akses administratif dan customer authenticated hanya sesuai kebijakan yang dirancang. Jangan menganggap user table `public.users` sama dengan Supabase Auth identity.
- Jangan menerapkan perubahan ini sebelum endpoint server dan admin/customer replacement flows siap, karena dapat memutus checkout/riwayat/dashboard.

### Tahap 4 — integrasi Edge Function dan frontend (bukan bagian dari SQL)
- Edge Function memanggil RPC dan memberikan token mentah sekali ke klien.
- Invoice endpoint menerima order ID + guest token, memverifikasi token, membaca snapshot order/items, lalu membentuk `paymentAmount` dan `itemDetails` dari DB. Tidak menerima total/item prices otoritatif dari browser.
- Callback tetap diverifikasi terpisah berdasarkan kontrak resmi Duitku dan mengubah status melalui operasi aman/idempoten.
- Frontend tidak membaca atau menulis tabel order langsung; token hanya disimpan sesuai desain threat model dan tidak ditaruh pada URL/log/analytics. Pertimbangkan risiko XSS serta kebijakan sesi/perangkat.

### Tahap 5 — verifikasi setelah persetujuan dan eksekusi
- Jalankan migrasi hanya di lingkungan yang disetujui dengan backup/rollback yang diuji.
- Periksa schema, migration history, grants, RLS, fungsi, index, serta data historis setelah migrasi.
- Jalankan unit/integration tests dengan mock; tidak perlu transaksi Duitku Sandbox untuk memverifikasi logika database.
- Uji akses langsung dari anon ditolak, token valid hanya membuka satu order, token salah/expired/revoked ditolak, dan tidak ada data sensitif di log.
- Uji harga palsu, produk inactive, quantity invalid, stok habis, promo invalid, nominal pecahan, retry idempotency, dan request paralel.
- Baru setelah hasil lulus, siapkan deployment plan Edge Function/frontend terpisah. Merge/deploy tetap membutuhkan persetujuan terpisah.

## 5. Risiko, dampak, dan rollback

**Risiko utama:** menutup policy/grants terlalu dini dapat memutus checkout, halaman status, riwayat, dashboard admin atau integrasi callback; fungsi SECURITY DEFINER yang terlalu luas dapat menjadi jalur eskalasi; perubahan perhitungan harga dapat mengubah total checkout; stok dan idempotency yang tidak atomik dapat menyebabkan overselling/duplikasi.

**Blast radius:** `orders`, `order_items`, `products`, kemungkinan `promo_codes`, grants/RLS, fungsi RPC baru, serta frontend/Edge Function yang mengonsumsi tabel tersebut.

**Backup/rollback sebelum eksekusi:** simpan migration history dan schema/grants/policies/function definitions sebelum perubahan; pastikan backup database yang dapat dipulihkan tersedia; siapkan rollback migration yang membuang hanya objek baru. Untuk policy/grants, rollback harus mengembalikan definisi persis yang direkam. Perubahan data historis tidak termasuk scope. Jangan rollback dengan membuka kembali SELECT publik tanpa mitigasi karena itu mengembalikan paparan data.

**Zero-downtime:** gunakan rollout bertahap: tambah skema additive → implementasi backend dan pengujian → alihkan frontend/admin → verifikasi consumer → baru tutup akses langsung. Jika tidak dapat memastikan seluruh consumer telah pindah, jadwalkan maintenance window dan persetujuan downtime terpisah.

## 6. Kriteria penerimaan

- Tidak ada direct public SELECT/INSERT/UPDATE/DELETE yang tidak dibutuhkan pada order data.
- Order dan item dibuat utuh atau tidak dibuat sama sekali.
- Harga/discount/shipping/total dihitung dari sumber server-side yang telah disetujui.
- `paymentAmount` adalah integer IDR positif dan sama persis dengan jumlah `itemDetails`; tidak ada silent rounding.
- Token hash tidak dapat dipakai sebagai token mentah; token salah, kedaluwarsa, dicabut, atau untuk order lain ditolak.
- RPC tidak dapat dipanggil oleh role yang tidak diizinkan dan tidak membuka objek lain melalui search_path.
- Retry dan concurrency tidak membuat duplikasi order/invoice atau overselling.
- Alur admin, ongkir manual, customer lookup, callback, dan pembayaran yang sudah ada lulus regression tests.
- Schema/RLS/grants/functions diverifikasi setelah migrasi; tidak ada deploy atau Sandbox payment dalam tahap database ini.

## 7. Keputusan yang perlu disetujui secara eksplisit

1. Apakah lingkungan target adalah production project `mvwflakurihhakdrlteg` atau staging/branch terpisah? Sampai dikonfirmasi, perlakukan sebagai production.
2. Apakah `public.products` menjadi sumber produk/harga kanonis untuk checkout, atau ada rencana migrasi dari `products_contoh`?
3. Apa aturan harga efektif: `price`, `original_price`, atau formula diskon? Semua harga harus integer IDR, atau aturan pembulatan eksplisit apa yang berlaku?
4. Bagaimana diskon/promo dan ongkir manual dihitung/dikonfirmasi?
5. Kolom mana yang menjadi sumber stok otoritatif? Saat ini `products.stock` dan `products_contoh.stock_quantity` terpisah.
6. Consumer mana yang harus tetap dapat membaca/menulis order: admin, customer login, callback, support?
7. Berapa TTL token guest, apakah perlu rotasi, dan apakah status/order detail tertentu perlu re-auth tambahan?
8. Apakah disetujui untuk menyusun SQL migration final setelah keputusan di atas dan review seluruh grants/consumer selesai? Persetujuan ini bukan izin menjalankan migrasi.

## 8. Sumber

- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Database Functions: https://supabase.com/docs/guides/database/functions
- Supabase Functions Auth: https://supabase.com/docs/guides/functions/auth
- Duitku POP: https://docs.duitku.com/pop/id/

**Status akhir:** rencana untuk ditinjau. Tidak ada SQL/migrasi, perubahan data, secrets/config, deployment, merge, atau transaksi Sandbox yang dilakukan.
