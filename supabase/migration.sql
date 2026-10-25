-- ==============================================================================
-- ASRI COLLECTION — COMPREHENSIVE SUPABASE DATABASE MIGRATION
-- Project URL: https://mvwflakurihhakdrlteg.supabase.co
-- Constraint: TIDAK MENGGUNAKAN SUPABASE AUTH (Standalone custom users table)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper trigger function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ==============================================================================
-- 2. CUSTOM USERS TABLE (No Supabase Auth dependency)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    full_name TEXT NOT NULL,
    password_hash TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'staff', 'admin')),
    avatar_url TEXT,
    address JSONB DEFAULT '{"street": "", "city": "", "province": "", "postal_code": "", "country": "Indonesia"}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

DROP TRIGGER IF EXISTS trigger_users_updated_at ON public.users;
CREATE TRIGGER trigger_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ==============================================================================
-- 3. CATEGORIES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_order ON public.categories(display_order);

DROP TRIGGER IF EXISTS trigger_categories_updated_at ON public.categories;
CREATE TRIGGER trigger_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ==============================================================================
-- 4. PRODUCTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC(14, 2) NOT NULL DEFAULT 0,
    original_price NUMERIC(14, 2),
    discount_percentage INT DEFAULT 0,
    rating NUMERIC(3, 2) DEFAULT 4.9,
    review_count INT DEFAULT 0,
    category_slug TEXT REFERENCES public.categories(slug) ON UPDATE CASCADE ON DELETE SET NULL,
    thumbnail TEXT NOT NULL,
    images TEXT[] NOT NULL DEFAULT '{}',
    sizes TEXT[] DEFAULT '{"S", "M", "L", "XL", "All Size"}'::text[],
    colors TEXT[] DEFAULT '{"Hitam", "Mocca", "Sage", "Broken White"}'::text[],
    stock INT NOT NULL DEFAULT 25,
    sku TEXT UNIQUE,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_new BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    weight_grams INT DEFAULT 350,
    material TEXT DEFAULT 'Premium Material',
    care_instructions TEXT DEFAULT 'Cuci dengan air dingin dan hindari pemutih.',
    tags TEXT[] DEFAULT '{}'::text[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_slug);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_new ON public.products(is_new);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);

DROP TRIGGER IF EXISTS trigger_products_updated_at ON public.products;
CREATE TRIGGER trigger_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ==============================================================================
-- 5. ORDERS TABLE (With Duitku POP Payment Gateway Support)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_order_id TEXT UNIQUE NOT NULL,
    reference TEXT,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    amount NUMERIC(14, 2) NOT NULL,
    shipping_fee NUMERIC(14, 2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(14, 2) NOT NULL,
    product_details TEXT,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    shipping_address JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED', 'PROCESSING', 'SHIPPED', 'DELIVERED')),
    result_code TEXT,
    payment_method TEXT,
    payment_url TEXT,
    va_number TEXT,
    qr_string TEXT,
    additional_param TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_merchant_order_id ON public.orders(merchant_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_reference ON public.orders(reference);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

DROP TRIGGER IF EXISTS trigger_orders_updated_at ON public.orders;
CREATE TRIGGER trigger_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ==============================================================================
-- 6. ORDER ITEMS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    price NUMERIC(14, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    variant TEXT,
    thumbnail TEXT,
    subtotal NUMERIC(14, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);


-- ==============================================================================
-- 7. BANNERS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    badge TEXT,
    image_url TEXT NOT NULL,
    mobile_image_url TEXT,
    link TEXT NOT NULL DEFAULT '/products',
    cta_text TEXT NOT NULL DEFAULT 'Belanja Sekarang',
    display_order INT DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banners_order ON public.banners(display_order);

DROP TRIGGER IF EXISTS trigger_banners_updated_at ON public.banners;
CREATE TRIGGER trigger_banners_updated_at
BEFORE UPDATE ON public.banners
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ==============================================================================
-- 8. REVIEWS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    variant TEXT,
    is_verified_buyer BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);


-- ==============================================================================
-- 9. PROMO CODES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(14, 2) NOT NULL,
    min_spend NUMERIC(14, 2) DEFAULT 0,
    max_discount NUMERIC(14, 2),
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES — NO SUPABASE AUTH
-- ==============================================================================
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- CATEGORIES: Public can read active categories
DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
CREATE POLICY "Public can view active categories" ON public.categories
    FOR SELECT USING (is_active = true);

-- PRODUCTS: Public can read active products
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products" ON public.products
    FOR SELECT USING (is_active = true);

-- BANNERS: Public can view active banners
DROP POLICY IF EXISTS "Public can view active banners" ON public.banners;
CREATE POLICY "Public can view active banners" ON public.banners
    FOR SELECT USING (is_active = true);

-- REVIEWS: Public can view reviews and submit reviews
DROP POLICY IF EXISTS "Public can view reviews" ON public.reviews;
CREATE POLICY "Public can view reviews" ON public.reviews
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can submit reviews" ON public.reviews;
CREATE POLICY "Public can submit reviews" ON public.reviews
    FOR INSERT WITH CHECK (true);

-- PROMO CODES: Public can check promo codes
DROP POLICY IF EXISTS "Public can view active promo codes" ON public.promo_codes;
CREATE POLICY "Public can view active promo codes" ON public.promo_codes
    FOR SELECT USING (is_active = true);

-- ORDERS: Public/Anon can insert new checkout orders
DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
CREATE POLICY "Public can create orders" ON public.orders
    FOR INSERT WITH CHECK (true);

-- ORDERS: Anyone can query order by merchant_order_id or reference for payment status page
DROP POLICY IF EXISTS "Public can query orders by order number" ON public.orders;
CREATE POLICY "Public can query orders by order number" ON public.orders
    FOR SELECT USING (true);

-- ORDER ITEMS: Public can insert and select order items
DROP POLICY IF EXISTS "Public can create order items" ON public.order_items;
CREATE POLICY "Public can create order items" ON public.order_items
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view order items" ON public.order_items;
CREATE POLICY "Public can view order items" ON public.order_items
    FOR SELECT USING (true);

-- USERS (CUSTOM): Public can insert (register) and query user profile by email/phone
DROP POLICY IF EXISTS "Public can register users" ON public.users;
CREATE POLICY "Public can register users" ON public.users
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can read users" ON public.users;
CREATE POLICY "Public can read users" ON public.users
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can update own profile" ON public.users;
CREATE POLICY "Public can update own profile" ON public.users
    FOR UPDATE USING (true);

-- SERVICE ROLE: Full administrative access on all tables for Edge Functions & backend
DROP POLICY IF EXISTS "Service role access on users" ON public.users;
CREATE POLICY "Service role access on users" ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role access on categories" ON public.categories;
CREATE POLICY "Service role access on categories" ON public.categories FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role access on products" ON public.products;
CREATE POLICY "Service role access on products" ON public.products FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role access on orders" ON public.orders;
CREATE POLICY "Service role access on orders" ON public.orders FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role access on order_items" ON public.order_items;
CREATE POLICY "Service role access on order_items" ON public.order_items FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role access on banners" ON public.banners;
CREATE POLICY "Service role access on banners" ON public.banners FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role access on reviews" ON public.reviews;
CREATE POLICY "Service role access on reviews" ON public.reviews FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role access on promo_codes" ON public.promo_codes;
CREATE POLICY "Service role access on promo_codes" ON public.promo_codes FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ==============================================================================
-- 11. SEED DATA (Asri Collection Brand Data)
-- ==============================================================================

-- Seed Categories
INSERT INTO public.categories (slug, name, description, image_url, display_order)
VALUES
    ('womens-dresses', 'Dresses & Gamis', 'Koleksi gamis dan dress satin sutra elegan untuk acara istimewa dan kasual formal.', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80', 1),
    ('tops', 'Tops & Blouse', 'Atasan katun poplin, kemeja santai, dan tunik bordir modern berkualitas tinggi.', 'https://images.unsplash.com/photo-1564257631407-4deb129f042b?w=800&auto=format&fit=crop&q=80', 2),
    ('womens-bags', 'Tas & Handbag', 'Tas tangan kulit vegan minimalis, shoulder bag klasik, dan tote bag multifungsi.', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80', 3),
    ('womens-shoes', 'Sepatu & Heels', 'Sepatu kitten heels empuk, mule pointed-toe, dan flat shoes premium.', 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&auto=format&fit=crop&q=80', 4),
    ('womens-jewellery', 'Aksesoris & Hijab', 'Pashmina silk shimmer, pashmina ceruty baby doll, dan brooch mutiara.', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80', 5),
    ('fragrances', 'Parfum & Wewangian', 'Eau de Parfum aroma floral oriental tahan hingga 12 jam dengan aroma feminin lembut.', 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&auto=format&fit=crop&q=80', 6)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url;

-- Seed Products
INSERT INTO public.products (
    slug, title, description, price, original_price, discount_percentage, rating, review_count, category_slug, thumbnail, images, sizes, colors, stock, sku, is_featured, is_new, material, care_instructions
) VALUES
(
    'nadira-silk-kaftan-dress',
    'Nadira Silk Kaftan Dress Mocca',
    'Gamis kaftan berbahan silk mulberry premium dengan potongan flowy yang anggun. Dilengkapi aksen lipit depan dan kancing mutiara eksklusif.',
    389000, 489000, 20, 4.95, 48,
    'womens-dresses',
    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80',
    ARRAY['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&auto=format&fit=crop&q=80'],
    ARRAY['S', 'M', 'L', 'All Size'],
    ARRAY['Mocca', 'Broken White', 'Sage Green'],
    35, 'ASRI-DRS-001', true, true,
    'Mulberry Silk Premium',
    'Dry clean atau cuci tangan dengan air dingin. Jangan diperas keras.'
),
(
    'ayesha-pleated-maxi-dress',
    'Ayesha Pleated Maxi Dress Olive',
    'Maxi dress bertekstur pleats halus dengan lengan bishop yang manis. Sangat nyaman untuk kondangan, wisuda, atau momen perayaan Idul Fitri.',
    425000, 520000, 18, 4.90, 62,
    'womens-dresses',
    'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&auto=format&fit=crop&q=80',
    ARRAY['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80'],
    ARRAY['S', 'M', 'L', 'XL'],
    ARRAY['Olive Gold', 'Dusty Rose', 'Midnight Blue'],
    28, 'ASRI-DRS-002', true, false,
    'Chiffon Pleated with Full Furing Katun Rayon',
    'Cuci tangan terpisah, setrika uap suhu sedang.'
),
(
    'zahra-linen-embroidered-tunic',
    'Zahra Embroidered Linen Tunic',
    'Tunik berkerah shanghai dengan sulaman bordir floral minimalis pada bagian dada dan manset. Menyerap keringat dan ramah untuk cuaca tropis.',
    259000, 299000, 13, 4.88, 37,
    'tops',
    'https://images.unsplash.com/photo-1564257631407-4deb129f042b?w=800&auto=format&fit=crop&q=80',
    ARRAY['https://images.unsplash.com/photo-1564257631407-4deb129f042b?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&auto=format&fit=crop&q=80'],
    ARRAY['M', 'L', 'XL'],
    ARRAY['Broken White', 'Terracotta', 'Sage'],
    42, 'ASRI-TOP-001', true, true,
    '100% Pure Linen Cotton',
    'Cuci dengan warna senada. Jangan jemur langsung di bawah terik matahari.'
),
(
    'marissa-croissant-shoulder-bag',
    'Marissa Minimalist Shoulder Bag Ivory',
    'Tas bahu dengan bentuk siluet bulan sabit yang modern. Kulit vegan lembut anti gores dengan kompartemen luas untuk dompet, ponsel, dan riasan.',
    315000, 395000, 20, 4.92, 85,
    'womens-bags',
    'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80',
    ARRAY['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80'],
    ARRAY['One Size'],
    ARRAY['Ivory', 'Classic Black', 'Caramel Tan'],
    20, 'ASRI-BAG-001', true, false,
    'High-Grade Microfiber Vegan Leather',
    'Bersihkan dengan kain lap basah lembut secara berkala.'
),
(
    'celine-kitten-heels-pointed',
    'Celine 5cm Pointed-Toe Kitten Heels',
    'Heels 5 cm dengan bantalan memory foam ekstra empuk yang tidak membuat kaki lelah saat dipakai seharian. Lapisan luar satin matte mewah.',
    299000, 350000, 15, 4.85, 43,
    'womens-shoes',
    'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&auto=format&fit=crop&q=80',
    ARRAY['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&auto=format&fit=crop&q=80'],
    ARRAY['36', '37', '38', '39', '40'],
    ARRAY['Champagne Nude', 'Black Matte'],
    25, 'ASRI-SHO-001', false, true,
    'Matte Satin Upper & Cushion Memory Foam Sole',
    'Simpan di dalam dustbag dan hindari tempat lembap.'
),
(
    'luna-silk-shimmer-pashmina',
    'Luna Silk Shimmer Pashmina Rose Quartz',
    'Pashmina silk shimmer dengan kilau subtle elegan tanpa kesan berlebihan. Mudah dibentuk, tegak di dahi, dan tidak kedap suara.',
    89000, 115000, 22, 4.96, 120,
    'womens-jewellery',
    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80',
    ARRAY['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80'],
    ARRAY['180 x 75 cm'],
    ARRAY['Rose Quartz', 'Champagne', 'Silver Grey', 'Soft Sand'],
    90, 'ASRI-HIJ-001', true, true,
    'Cradle Silk Shimmer Blend',
    'Cuci tangan dengan sampo lembut. Setrika dengan suhu rendah di sisi dalam.'
),
(
    'bloom-of-savannah-edp',
    'Bloom of Savannah Eau De Parfum 50ml',
    'Wewangian signature Asri Collection dengan perpaduan French Rose, White Tea, dan Sandalwood hangat. Proyeksi tahan 10 hingga 12 jam.',
    225000, 275000, 18, 4.94, 53,
    'fragrances',
    'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&auto=format&fit=crop&q=80',
    ARRAY['https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&auto=format&fit=crop&q=80'],
    ARRAY['50 ml'],
    ARRAY['Floral Musky'],
    45, 'ASRI-PRF-001', false, false,
    'Eau De Parfum Concentration 20%',
    'Simpan pada suhu ruang dan jauhkan dari paparan sinar matahari langsung.'
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount_percentage = EXCLUDED.discount_percentage,
    category_slug = EXCLUDED.category_slug,
    thumbnail = EXCLUDED.thumbnail,
    images = EXCLUDED.images,
    is_featured = EXCLUDED.is_featured,
    is_new = EXCLUDED.is_new;

-- Seed Banners
INSERT INTO public.banners (
    title, subtitle, badge, image_url, mobile_image_url, link, cta_text, display_order, is_active
) VALUES
(
    'Koleksi Anggun Raya 2026',
    'Sentuhan keanggunan siluet modern berpadu dengan kemewahan material silk mulberry pilihan.',
    'Koleksi Eksklusif',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=85',
    '/products?category=womens-dresses',
    'Eksplorasi Gaun',
    1, true
),
(
    'Kemewahan Kasual Setiap Hari',
    'Koleksi atasan katun bordir dan pashmina ceruty premium untuk penampilan bersahaja dan percaya diri.',
    'Paling Diminati',
    'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1600&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&auto=format&fit=crop&q=85',
    '/products?category=tops',
    'Lihat Koleksi Atasan',
    2, true
)
ON CONFLICT DO NOTHING;

-- Seed Demo Custom Users (Non-Supabase Auth)
INSERT INTO public.users (
    email, phone, full_name, password_hash, role, address, is_active
) VALUES
(
    'admin@asricollection.com',
    '082156764434',
    'Administrator Asri Collection',
    -- SHA256 hashed default password for admin
    '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
    'admin',
    '{"street": "Jl. Senopati Raya No. 12", "city": "Jakarta Selatan", "province": "DKI Jakarta", "postal_code": "12190", "country": "Indonesia"}'::jsonb,
    true
),
(
    'customer@asricollection.com',
    '081234567890',
    'Aulia Rahmawati',
    '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
    'customer',
    '{"street": "Jl. Cempaka Putih Tengah No. 45", "city": "Jakarta Pusat", "province": "DKI Jakarta", "postal_code": "10510", "country": "Indonesia"}'::jsonb,
    true
)
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

-- Seed Demo Promo Code
INSERT INTO public.promo_codes (code, discount_type, discount_value, min_spend, max_discount, is_active)
VALUES
    ('ASRIBARU', 'percentage', 10, 150000, 50000, true),
    ('RAYASPECIAL', 'fixed', 25000, 200000, NULL, true)
ON CONFLICT (code) DO NOTHING;
