-- ==============================================================================
-- Migration: 20261009000000_init_ecommerce_duitku.sql
-- Description: Mobile-Only E-Commerce + Duitku POP Schema, RLS, & Atomic Functions
-- Compatibility: PostgreSQL 13+ / Supabase (Idempotent, Production-Grade)
-- ==============================================================================

-- Enable UUID extension (gen_random_uuid() is native in PG13+, uuid-ossp for fallback)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. Orders Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(64) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(64) NOT NULL,
    shipping_address TEXT NOT NULL,
    shipping_city VARCHAR(100),
    shipping_postal_code VARCHAR(20),
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    shipping_cost NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
    discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    payment_status VARCHAR(32) NOT NULL DEFAULT 'pending' 
        CHECK (payment_status IN ('pending', 'paid', 'failed', 'expired', 'cancelled')),
    fulfillment_status VARCHAR(32) NOT NULL DEFAULT 'unfulfilled'
        CHECK (fulfillment_status IN ('unfulfilled', 'processing', 'shipped', 'delivered', 'cancelled')),
    courier_name VARCHAR(100),
    tracking_number VARCHAR(100),
    shipping_notes TEXT,
    access_token VARCHAR(128), -- Cryptographic random token for secure guest access
    duitku_reference VARCHAR(128),
    duitku_payment_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Pastikan seluruh kolom ada jika tabel orders sebelumnya sudah pernah dibuat di database:
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255) DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255) DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(64) DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address TEXT DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_city VARCHAR(100) DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_postal_code VARCHAR(20) DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(32) DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fulfillment_status VARCHAR(32) DEFAULT 'unfulfilled';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_name VARCHAR(100);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS access_token VARCHAR(128);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS duitku_reference VARCHAR(128);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS duitku_payment_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc', now());
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc', now());

-- Sinkronisasi jika sebelumnya ada kolom 'status' di tabel lama:
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'status'
    ) THEN
        UPDATE public.orders SET payment_status = status WHERE payment_status IS NULL OR payment_status = 'pending';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status ON public.orders(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_orders_access_token ON public.orders(access_token);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);

-- ------------------------------------------------------------------------------
-- 2. Order Items Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    image_link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_id VARCHAR(64);
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS unit_price NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS subtotal NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS image_link TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc', now());

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- ------------------------------------------------------------------------------
-- 3. Payments Table (Duitku transaction snapshots)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    merchant_order_id VARCHAR(64) UNIQUE NOT NULL,
    reference VARCHAR(128) NOT NULL,
    duitku_reference VARCHAR(128),
    publisher_order_id VARCHAR(128),
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
    payment_amount NUMERIC(15, 2),
    currency VARCHAR(8) NOT NULL DEFAULT 'IDR',
    payment_method VARCHAR(64),
    payment_url TEXT,
    payment_status VARCHAR(32) NOT NULL DEFAULT 'pending',
    result_code VARCHAR(16),
    duitku_result_code VARCHAR(16),
    duitku_status_message TEXT,
    environment VARCHAR(32) NOT NULL DEFAULT 'sandbox',
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    raw_payload JSONB,
    paid_at TIMESTAMPTZ,
    expired_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS merchant_order_id VARCHAR(64);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS reference VARCHAR(128);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS duitku_reference VARCHAR(128);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS publisher_order_id VARCHAR(128);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS amount NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_amount NUMERIC(15, 2);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS currency VARCHAR(8) DEFAULT 'IDR';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_method VARCHAR(64);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_url TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_status VARCHAR(32) DEFAULT 'pending';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS result_code VARCHAR(16);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS duitku_result_code VARCHAR(16);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS duitku_status_message TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS environment VARCHAR(32) DEFAULT 'sandbox';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'pending';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS raw_payload JSONB;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc', now());
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc', now());

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_merchant_order_id ON public.payments(merchant_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON public.payments(reference);
CREATE INDEX IF NOT EXISTS idx_payments_payment_status ON public.payments(payment_status);

-- ------------------------------------------------------------------------------
-- 3b. Callback Events Table (Audit webhook logs, idempotency tracking & signature auditing)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.callback_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_order_id VARCHAR(64),
    reference VARCHAR(128),
    amount NUMERIC(15, 2),
    result_code VARCHAR(16),
    signature VARCHAR(255),
    is_valid_signature BOOLEAN NOT NULL DEFAULT FALSE,
    verification_method VARCHAR(32),
    raw_payload JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.callback_events ADD COLUMN IF NOT EXISTS merchant_order_id VARCHAR(64);
ALTER TABLE public.callback_events ADD COLUMN IF NOT EXISTS reference VARCHAR(128);
ALTER TABLE public.callback_events ADD COLUMN IF NOT EXISTS amount NUMERIC(15, 2);
ALTER TABLE public.callback_events ADD COLUMN IF NOT EXISTS result_code VARCHAR(16);
ALTER TABLE public.callback_events ADD COLUMN IF NOT EXISTS signature VARCHAR(255);
ALTER TABLE public.callback_events ADD COLUMN IF NOT EXISTS is_valid_signature BOOLEAN DEFAULT FALSE;
ALTER TABLE public.callback_events ADD COLUMN IF NOT EXISTS verification_method VARCHAR(32);
ALTER TABLE public.callback_events ADD COLUMN IF NOT EXISTS raw_payload JSONB;
ALTER TABLE public.callback_events ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE public.callback_events ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc', now());

CREATE INDEX IF NOT EXISTS idx_callback_events_order_id ON public.callback_events(merchant_order_id);
CREATE INDEX IF NOT EXISTS idx_callback_events_created ON public.callback_events(created_at);

-- ------------------------------------------------------------------------------
-- 4. Inventory Reservations Table (atomic concurrency safety)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inventory_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id VARCHAR(64) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    status VARCHAR(32) NOT NULL DEFAULT 'reserved' 
        CHECK (status IN ('reserved', 'committed', 'released')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.inventory_reservations ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE public.inventory_reservations ADD COLUMN IF NOT EXISTS product_id VARCHAR(64);
ALTER TABLE public.inventory_reservations ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
ALTER TABLE public.inventory_reservations ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'reserved';
ALTER TABLE public.inventory_reservations ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE public.inventory_reservations ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc', now());

CREATE INDEX IF NOT EXISTS idx_inventory_reservations_product ON public.inventory_reservations(product_id, status);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_expires ON public.inventory_reservations(expires_at) WHERE status = 'reserved';

-- ------------------------------------------------------------------------------
-- 5. Admin Users / Access Control
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin', 'staff')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ------------------------------------------------------------------------------
-- 6. Audit Logs for Admin Actions and Callbacks
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    actor VARCHAR(128) NOT NULL,
    action VARCHAR(64) NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ------------------------------------------------------------------------------
-- 7. Products Table (Katalog Otoritatif Toko)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    availability VARCHAR(32) NOT NULL DEFAULT 'in stock' CHECK (availability IN ('in stock', 'out of stock', 'preorder')),
    condition VARCHAR(32) NOT NULL DEFAULT 'new',
    price NUMERIC(15, 2) NOT NULL CHECK (price >= 0),
    sale_price NUMERIC(15, 2) CHECK (sale_price >= 0),
    currency VARCHAR(8) NOT NULL DEFAULT 'IDR',
    image_link TEXT NOT NULL,
    brand VARCHAR(100),
    product_type VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Seed / Sinkronisasi katalog produk
INSERT INTO public.products (id, title, description, availability, condition, price, sale_price, currency, image_link, brand, product_type, created_at, updated_at)
VALUES
    ('APP-001-BLK-M', 'Kaos Katun Premium Hitam', 'Kaos katun combed 30s premium dengan jahitan rapi dan adem sepanjang hari.', 'in stock', 'new', 125000.00, 99000.00, 'IDR', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80', 'Asri Basic', 'Apparel', '2026-10-09 19:21:07.237165+00', '2026-10-09 19:21:07.237165+00'),
    ('APP-001-WHT-L', 'Kaos Katun Premium Putih', 'Kaos katun combed 30s putih bersih, tidak mudah melar dan nyaman dipakai.', 'in stock', 'new', 125000.00, 99000.00, 'IDR', 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&auto=format&fit=crop&q=80', 'Asri Basic', 'Apparel', '2026-10-09 19:21:07.237165+00', '2026-10-09 19:21:07.237165+00'),
    ('APP-002', 'Kemeja Linen Lengan Pendek', 'Kemeja casual bahan linen breathable dengan kerah resort modern.', 'in stock', 'new', 215000.00, null, 'IDR', 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=600&auto=format&fit=crop&q=80', 'Asri Casual', 'Apparel', '2026-10-09 19:21:07.237165+00', '2026-10-09 19:21:07.237165+00'),
    ('APP-003', 'Hoodie Fleece Unisex', 'Hoodie berbahan fleece lembut dan hangat, cocok untuk cuaca sejuk atau harian santai.', 'in stock', 'new', 275000.00, null, 'IDR', 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80', 'Asri Wear', 'Apparel', '2026-10-09 19:21:07.237165+00', '2026-10-09 19:21:07.237165+00'),
    ('SHO-001', 'Sneakers Klasik Kanvas', 'Sepatu sneakers kanvas dengan sol empuk anti-slip untuk mobilitas tinggi.', 'in stock', 'new', 349000.00, 299000.00, 'IDR', 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&auto=format&fit=crop&q=80', 'Asri Footwear', 'Shoes', '2026-10-09 19:21:07.237165+00', '2026-10-09 19:21:07.237165+00'),
    ('SHO-002', 'Sepatu Lari Ultralight', 'Sepatu running ringan dengan bantalan cushion responsif untuk kenyamanan optimal.', 'in stock', 'new', 489000.00, null, 'IDR', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80', 'Asri Sport', 'Shoes', '2026-10-09 19:21:07.237165+00', '2026-10-09 19:21:07.237165+00'),
    ('BAG-001', 'Ransel Laptop Waterproof', 'Backpack tahan air dengan kompartemen laptop 15.6 inch dan busa punggung empuk.', 'in stock', 'new', 319000.00, null, 'IDR', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80', 'Asri Bags', 'Accessories', '2026-10-09 19:21:07.237165+00', '2026-10-09 19:21:07.237165+00'),
    ('BAG-002', 'Tas Selempang Kanvas Mini', 'Sling bag praktis untuk dompet, ponsel, dan barang bawaan esensial harian.', 'in stock', 'new', 145000.00, null, 'IDR', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80', 'Asri Bags', 'Accessories', '2026-10-09 19:21:07.237165+00', '2026-10-09 19:21:07.237165+00')
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    availability = EXCLUDED.availability,
    condition = EXCLUDED.condition,
    price = EXCLUDED.price,
    sale_price = EXCLUDED.sale_price,
    currency = EXCLUDED.currency,
    image_link = EXCLUDED.image_link,
    brand = EXCLUDED.brand,
    product_type = EXCLUDED.product_type,
    updated_at = EXCLUDED.updated_at;

-- ------------------------------------------------------------------------------
-- 8. Row Level Security (RLS) Setup
-- ------------------------------------------------------------------------------
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.callback_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Idempotent RLS Policies: Service Role (Edge Functions & Backend)
DROP POLICY IF EXISTS "Service role full access on orders" ON public.orders;
CREATE POLICY "Service role full access on orders" 
    ON public.orders FOR ALL 
    USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access on order_items" ON public.order_items;
CREATE POLICY "Service role full access on order_items" 
    ON public.order_items FOR ALL 
    USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access on payments" ON public.payments;
CREATE POLICY "Service role full access on payments" 
    ON public.payments FOR ALL 
    USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access on inventory_reservations" ON public.inventory_reservations;
CREATE POLICY "Service role full access on inventory_reservations" 
    ON public.inventory_reservations FOR ALL 
    USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access on callback_events" ON public.callback_events;
CREATE POLICY "Service role full access on callback_events" 
    ON public.callback_events FOR ALL 
    USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access on audit_logs" ON public.audit_logs;
CREATE POLICY "Service role full access on audit_logs" 
    ON public.audit_logs FOR ALL 
    USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access on admin_users" ON public.admin_users;
CREATE POLICY "Service role full access on admin_users" 
    ON public.admin_users FOR ALL 
    USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access on products" ON public.products;
CREATE POLICY "Service role full access on products" 
    ON public.products FOR ALL 
    USING (auth.role() = 'service_role');

-- Public / Anon Policies
DROP POLICY IF EXISTS "Public read active products" ON public.products;
CREATE POLICY "Public read active products" 
    ON public.products FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Public read order with token" ON public.orders;
CREATE POLICY "Public read order with token" 
    ON public.orders FOR SELECT 
    USING (
        access_token = current_setting('request.jwt.claim.order_token', true)
        OR access_token = current_setting('request.headers', true)::json->>'x-order-token'
    );

DROP POLICY IF EXISTS "Public read order_items with order access" ON public.order_items;
CREATE POLICY "Public read order_items with order access" 
    ON public.order_items FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND (
                orders.access_token = current_setting('request.jwt.claim.order_token', true)
                OR orders.access_token = current_setting('request.headers', true)::json->>'x-order-token'
            )
        )
    );

-- ------------------------------------------------------------------------------
-- 9. Stored Procedure: Atomic Inventory Reservation
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reserve_inventory_atomic(
    p_order_id UUID,
    p_product_id VARCHAR,
    p_quantity INTEGER,
    p_minutes INTEGER DEFAULT 30
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_expires_at TIMESTAMPTZ;
BEGIN
    v_expires_at := timezone('utc', now()) + (p_minutes || ' minutes')::INTERVAL;
    
    INSERT INTO public.inventory_reservations (
        order_id,
        product_id,
        quantity,
        status,
        expires_at
    ) VALUES (
        p_order_id,
        p_product_id,
        p_quantity,
        'reserved',
        v_expires_at
    );

    RETURN TRUE;
END;
$$;

-- ------------------------------------------------------------------------------
-- 10. Stored Procedure: Release Expired Reservations
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.release_expired_reservations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE public.inventory_reservations
    SET status = 'released'
    WHERE status = 'reserved' AND expires_at < timezone('utc', now());
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- ------------------------------------------------------------------------------
-- 11. Stored Procedure: Commit Reservations (Upon Payment Verification)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.commit_inventory_atomic(
    p_order_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.inventory_reservations
    SET status = 'committed'
    WHERE order_id = p_order_id AND status = 'reserved';
END;
$$;

-- ------------------------------------------------------------------------------
-- 12. Stored Procedure: Process Duitku Callback Atomically (Strict Idempotency & Concurrency)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.process_duitku_callback_atomic(
    p_merchant_order_id VARCHAR,
    p_amount NUMERIC,
    p_result_code VARCHAR,
    p_reference VARCHAR,
    p_payment_method VARCHAR,
    p_raw_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order public.orders%ROWTYPE;
    v_is_success BOOLEAN;
    v_new_status VARCHAR;
BEGIN
    -- 1. Kunci baris pesanan (ROW-LEVEL LOCK FOR UPDATE) untuk mencegah race conditions
    SELECT * INTO v_order
    FROM public.orders
    WHERE order_number = p_merchant_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'status_code', 404, 'message', 'Order not found');
    END IF;

    -- 2. Validasi nominal tagihan
    IF ABS(v_order.total_amount - p_amount) > 0.01 THEN
        RETURN jsonb_build_object('success', false, 'status_code', 400, 'message', 'Amount mismatch');
    END IF;

    -- 3. Idempotensi: Jika sudah paid, tidak boleh diproses ulang
    IF v_order.payment_status = 'paid' THEN
        RETURN jsonb_build_object('success', true, 'status_code', 200, 'message', 'Already paid (Idempotent)', 'already_processed', true);
    END IF;

    -- 4. Status terminal proteksi
    IF v_order.payment_status IN ('cancelled', 'expired') THEN
        RETURN jsonb_build_object('success', true, 'status_code', 200, 'message', 'Order is terminal', 'already_processed', true);
    END IF;

    v_is_success := (p_result_code = '00');
    v_new_status := CASE WHEN v_is_success THEN 'paid' ELSE 'failed' END;

    -- 5. Update Status Pesanan & sync referensi Duitku jika belum tercatat
    UPDATE public.orders
    SET 
        payment_status = v_new_status,
        fulfillment_status = CASE WHEN v_is_success AND fulfillment_status = 'unfulfilled' THEN 'processing' ELSE fulfillment_status END,
        duitku_reference = COALESCE(v_order.duitku_reference, p_reference),
        updated_at = timezone('utc', now())
    WHERE id = v_order.id;

    -- 6. Update / Insert Payments Snapshot
    INSERT INTO public.payments (
        order_id,
        merchant_order_id,
        reference,
        duitku_reference,
        amount,
        payment_amount,
        payment_method,
        payment_status,
        result_code,
        duitku_result_code,
        status,
        paid_at,
        raw_payload,
        updated_at
    ) VALUES (
        v_order.id,
        p_merchant_order_id,
        COALESCE(p_reference, v_order.duitku_reference, p_merchant_order_id),
        COALESCE(p_reference, v_order.duitku_reference, p_merchant_order_id),
        p_amount,
        p_amount,
        p_payment_method,
        v_new_status,
        p_result_code,
        p_result_code,
        v_new_status,
        CASE WHEN v_is_success THEN timezone('utc', now()) ELSE NULL END,
        p_raw_payload,
        timezone('utc', now())
    )
    ON CONFLICT (merchant_order_id) DO UPDATE SET
        payment_status = v_new_status,
        status = v_new_status,
        result_code = p_result_code,
        duitku_result_code = p_result_code,
        paid_at = CASE WHEN v_is_success THEN timezone('utc', now()) ELSE public.payments.paid_at END,
        raw_payload = p_raw_payload,
        updated_at = timezone('utc', now());

    -- 7. Manajemen Stok
    IF v_is_success THEN
        UPDATE public.inventory_reservations
        SET status = 'committed'
        WHERE order_id = v_order.id AND status = 'reserved';
    ELSE
        UPDATE public.inventory_reservations
        SET status = 'released'
        WHERE order_id = v_order.id AND status = 'reserved';
    END IF;

    -- 8. Audit Log
    INSERT INTO public.audit_logs (
        order_id,
        actor,
        action,
        details
    ) VALUES (
        v_order.id,
        'duitku_callback_sp',
        CASE WHEN v_is_success THEN 'PAYMENT_CONFIRMED' ELSE 'PAYMENT_FAILED' END,
        jsonb_build_object('amount', p_amount, 'result_code', p_result_code, 'reference', p_reference)
    );

    RETURN jsonb_build_object('success', true, 'status_code', 200, 'message', 'Processed successfully');
END;
$$;

