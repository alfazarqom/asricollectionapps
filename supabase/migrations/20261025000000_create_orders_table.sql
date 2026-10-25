-- Migration: 20261025000000_create_orders_table.sql
-- Table untuk menyimpan transaksi pemesanan dan riwayat pembayaran Duitku POP

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_order_id TEXT UNIQUE NOT NULL,
    reference TEXT,
    amount NUMERIC NOT NULL,
    product_details TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    result_code TEXT,
    payment_method TEXT,
    payment_url TEXT,
    va_number TEXT,
    qr_string TEXT,
    additional_param TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index untuk pencarian cepat berdasarkan nomor order merchant dan nomor referensi Duitku
CREATE INDEX IF NOT EXISTS idx_orders_merchant_order_id ON public.orders(merchant_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_reference ON public.orders(reference);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policy: Publik atau user terotentikasi dapat membaca data pesanan berdasarkan merchant_order_id
CREATE POLICY "Allow select orders" 
ON public.orders 
FOR SELECT 
USING (true);

-- Policy: Service role memiliki akses penuh untuk insert & update (digunakan oleh Supabase Edge Functions)
CREATE POLICY "Service role full access on orders" 
ON public.orders 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);
