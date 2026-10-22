import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Enable JSON and URL-encoded body parsing (Duitku callback can be either)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration
const DUITKU_MERCHANT_CODE = process.env.DUITKU_MERCHANT_CODE || '';
const DUITKU_API_KEY = process.env.DUITKU_API_KEY || '';
const DUITKU_ENV = process.env.DUITKU_ENV || 'sandbox';
const ADMIN_SECRET_PIN = process.env.ADMIN_SECRET_PIN || '';
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;
const SUPABASE_URL = process.env.SUPABASE_URL || "https://mvwflakurihhakdrlteg.supabase.co";

// In-Memory Database Store for live execution & persistence in applet
interface OrderItem {
  id: string;
  product_id: string;
  title: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  image_link?: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled';
  fulfillment_status: 'unfulfilled' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  courier_name: string;
  tracking_number: string;
  shipping_notes: string;
  access_token: string;
  duitku_reference: string;
  duitku_payment_url: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
  audit_logs: Array<{ action: string; timestamp: string; details: any }>;
}

const ordersDb = new Map<string, Order>();
const paymentsDb = new Map<string, any>();
const reservationsDb = new Map<string, any>();

// Fetch the authoritative product catalog from Supabase.
// Never substitute local/sample products when the source is empty or unavailable.
async function fetchAuthoritativeProducts(queryString?: string) {
  const baseUrl = 'https://mvwflakurihhakdrlteg.supabase.co/functions/v1/get-products';
  const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;

  const response = await fetch(url, {
    headers: { 'User-Agent': 'AsriCollection-Backend/1.0' },
  });

  if (!response.ok) {
    throw new Error(`Product catalog source returned HTTP ${response.status}`);
  }

  const products: unknown = await response.json();
  if (!Array.isArray(products)) {
    throw new Error('Product catalog source returned an invalid response format');
  }

  return products.map((p: any) => ({
    ...p,
    display_image: p.display_image || p.image_link || '',
  }));
}

// -------------------------------------------------------------
// API ENDPOINTS
// -------------------------------------------------------------

// 1. GET /api/products
app.get('/api/products', async (req: Request, res: Response) => {
  try {
    const queryStr = req.url.includes('?') ? req.url.split('?')[1] : '';
    const products = await fetchAuthoritativeProducts(queryStr);
    res.json({ success: true, data: products });
  } catch (err: any) {
    console.error('Error fetching products:', err.message);
    res.status(500).json({ success: false, error: 'Gagal mengambil katalog produk dari server sumber.' });
  }
});

// 2. GET /api/config-status
app.get('/api/config-status', (_req: Request, res: Response) => {
  res.json({
    duitkuConfigured: Boolean(DUITKU_MERCHANT_CODE && DUITKU_API_KEY),
    adminAuthConfigured: Boolean(ADMIN_SECRET_PIN),
    env: DUITKU_ENV,
    callbackUrl: `${APP_URL}/api/duitku-callback`,
  });
});

// 3. POST /api/create-invoice
// All invoice creation is delegated to the canonical Supabase Edge Function.
// Express must never create a second provider invoice or keep a competing local order record.
app.post('/api/create-invoice', async (req: Request, res: Response) => {
  const body = req.body || {};
  if (!body.recipient || !Array.isArray(body.items) || typeof body.courier?.code !== 'string') {
    return res.status(400).json({ success: false, error: 'Data checkout tidak lengkap atau tidak valid.' });
  }

  const endpoint = SUPABASE_URL.replace(/\/$/, '') + '/functions/v1/duitku-create-invoice';
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: body.recipient,
        items: body.items.map((item: any) => ({ id: item.id, quantity: item.quantity })),
        // Only forward the courier identifier. The canonical backend determines the price/name.
        courier: { code: body.courier.code },
      }),
    });
    const result = await response.json().catch(() => ({} as any));
    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: typeof result?.error === 'string' ? result.error : 'Layanan invoice tidak tersedia.',
      });
    }
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Canonical Supabase invoice function unavailable:', error?.message || 'network error');
    return res.status(503).json({
      success: false,
      error: 'Layanan invoice Supabase tidak tersedia. Tidak ada invoice alternatif yang dibuat.',
    });
  }
});

// Duitku POP payment state is accepted only by the canonical Supabase Edge Function.
// The Express in-memory store is not a persistent or authoritative payment database.
app.post('/api/duitku-callback', (_req: Request, res: Response) => {
  return res.status(503).send('Service Unavailable: use the canonical Supabase Duitku callback endpoint.');
});

// 5. GET /api/orders/:orderNumber
// Read status from the canonical Supabase function; do not consult local in-memory order state.
app.get('/api/orders/:orderNumber', async (req: Request, res: Response) => {
  const orderNumber = String(req.params.orderNumber || '').trim();
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  if (!orderNumber || !token) {
    return res.status(400).json({ success: false, error: 'Nomor pesanan dan token akses wajib diisi.' });
  }

  const endpoint = new URL(SUPABASE_URL.replace(/\/$/, '') + '/functions/v1/get-duitku-payment-status');
  endpoint.searchParams.set('orderNumber', orderNumber);
  endpoint.searchParams.set('token', token);
  try {
    const response = await fetch(endpoint);
    const result = await response.json().catch(() => ({} as any));
    return res.status(response.status).json(result);
  } catch (error: any) {
    console.error('Canonical Supabase order status function unavailable:', error?.message || 'network error');
    return res.status(503).json({ success: false, error: 'Status pesanan tidak dapat diambil saat ini.' });
  }
});

// 5b. POST /api/duitku-check-status
// Read-only proxy to the canonical status endpoint. This route never calls Duitku or mutates payment state.
app.post('/api/duitku-check-status', async (req: Request, res: Response) => {
  const orderNumber = typeof req.body?.orderNumber === 'string' ? req.body.orderNumber : '';
  const token = typeof req.body?.token === 'string' ? req.body.token : '';
  if (!orderNumber.trim() || !token) {
    return res.status(400).json({ success: false, error: 'Nomor pesanan dan token akses wajib diisi.' });
  }

  const endpoint = new URL(SUPABASE_URL.replace(/\/$/, '') + '/functions/v1/get-duitku-payment-status');
  endpoint.searchParams.set('orderNumber', orderNumber.trim());
  endpoint.searchParams.set('token', token);
  try {
    const response = await fetch(endpoint);
    const result = await response.json().catch(() => ({} as any));
    return res.status(response.status).json(result);
  } catch (error: any) {
    console.error('Canonical Supabase payment status function unavailable:', error?.message || 'network error');
    return res.status(503).json({ success: false, error: 'Status pembayaran tidak dapat diambil saat ini.' });
  }
});

// 6. POST /api/orders/track (Guest Order Search with optional verification)
app.post('/api/orders/track', (req: Request, res: Response) => {
  const { orderNumber, phoneOrEmail } = req.body;
  if (!orderNumber) {
    return res.status(400).json({
      success: false,
      error: 'Harap masukkan nomor pesanan Anda.',
    });
  }

  const order = ordersDb.get(orderNumber.trim().toUpperCase());
  if (!order) {
    return res.status(404).json({ success: false, error: 'Pesanan dengan nomor tersebut tidak ditemukan.' });
  }

  // Jika pelanggan menyertakan phoneOrEmail, validasi kecocokannya
  if (phoneOrEmail && phoneOrEmail.trim()) {
    const cleanInput = phoneOrEmail.trim().toLowerCase();
    const phoneClean = cleanInput.replace(/\D/g, '');
    const orderPhoneClean = order.customer_phone.replace(/\D/g, '');

    const matches =
      order.customer_email.toLowerCase() === cleanInput ||
      (phoneClean.length >= 8 && orderPhoneClean.includes(phoneClean));

    if (!matches) {
      return res.status(403).json({
        success: false,
        error: 'Nomor pesanan cocok, tetapi nomor telepon/email yang dimasukkan tidak sesuai.',
      });
    }
  }

  const { access_token, ...safeOrder } = order;
  res.json({ success: true, order: safeOrder, accessToken: order.access_token });
});

// Admin authentication is disabled until an explicit server-side secret is configured.
app.post('/api/admin/auth', (req: Request, res: Response) => {
  if (!ADMIN_SECRET_PIN) {
    return res.status(503).json({ success: false, error: 'Autentikasi admin belum dikonfigurasi di server.' });
  }
  const pin = typeof req.body?.pin === 'string' ? req.body.pin : '';
  const expected = Buffer.from(ADMIN_SECRET_PIN);
  const received = Buffer.from(pin);
  const valid = expected.length === received.length && crypto.timingSafeEqual(expected, received);
  if (!valid) return res.status(401).json({ success: false, error: 'PIN admin tidak valid.' });
  return res.json({ success: true });
});

const adminAuth = (req: Request, res: Response, next: () => void) => {
  if (!ADMIN_SECRET_PIN) {
    return res.status(503).json({ success: false, error: 'Autentikasi admin belum dikonfigurasi di server.' });
  }
  const pin = req.headers['x-admin-pin'] as string;
  if (!pin) return res.status(401).json({ success: false, error: 'Autentikasi admin diperlukan.' });
  const expected = Buffer.from(ADMIN_SECRET_PIN);
  const received = Buffer.from(pin);
  const valid = expected.length === received.length && crypto.timingSafeEqual(expected, received);
  if (!valid) return res.status(401).json({ success: false, error: 'Otorisasi admin ditolak.' });
  next();
};

// 8. GET /api/admin/metrics
app.get('/api/admin/metrics', adminAuth, (_req: Request, res: Response) => {
  let totalRevenue = 0;
  let totalOrders = 0;
  let pendingCount = 0;
  let processingCount = 0;
  let shippedCount = 0;
  let deliveredCount = 0;
  let failedCount = 0;

  for (const order of ordersDb.values()) {
    totalOrders += 1;
    if (order.payment_status === 'paid') {
      totalRevenue += order.total_amount;
    }
    if (order.payment_status === 'pending') {
      pendingCount += 1;
    }
    if (order.payment_status === 'failed') {
      failedCount += 1;
    }
    if (order.fulfillment_status === 'processing') {
      processingCount += 1;
    }
    if (order.fulfillment_status === 'shipped') {
      shippedCount += 1;
    }
    if (order.fulfillment_status === 'delivered') {
      deliveredCount += 1;
    }
  }

  res.json({
    success: true,
    data: {
      totalRevenue,
      totalOrders,
      pendingCount,
      processingCount,
      shippedCount,
      deliveredCount,
      failedCount,
    },
  });
});

// 9. GET /api/admin/orders
app.get('/api/admin/orders', adminAuth, (req: Request, res: Response) => {
  const statusFilter = (req.query.status as string) || 'all';
  const search = ((req.query.search as string) || '').toLowerCase();

  const allOrders = Array.from(ordersDb.values());

  const filtered = allOrders.filter((ord) => {
    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'paid' && ord.payment_status !== 'paid') return false;
      if (statusFilter === 'pending' && ord.payment_status !== 'pending') return false;
      if (statusFilter === 'processing' && ord.fulfillment_status !== 'processing') return false;
      if (statusFilter === 'shipped' && ord.fulfillment_status !== 'shipped') return false;
      if (statusFilter === 'delivered' && ord.fulfillment_status !== 'delivered') return false;
    }

    // Search filter
    if (search) {
      const matchNo = ord.order_number.toLowerCase().includes(search);
      const matchName = ord.customer_name.toLowerCase().includes(search);
      const matchPhone = ord.customer_phone.includes(search);
      if (!matchNo && !matchName && !matchPhone) return false;
    }

    return true;
  });

  // Sort by newest
  filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  res.json({ success: true, data: filtered });
});

// 10. PATCH /api/admin/orders/:orderNumber/shipping (Manual Shipping Management)
app.patch('/api/admin/orders/:orderNumber/shipping', adminAuth, (req: Request, res: Response) => {
  const { orderNumber } = req.params;
  const { courierName, trackingNumber, fulfillmentStatus, shippingCost, shippingNotes } = req.body;

  const order = ordersDb.get(orderNumber);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Pesanan tidak ditemukan.' });
  }

  // Update fields
  if (courierName !== undefined) order.courier_name = courierName.trim();
  if (trackingNumber !== undefined) order.tracking_number = trackingNumber.trim();
  if (fulfillmentStatus !== undefined) {
    const validStatuses = ['unfulfilled', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (validStatuses.includes(fulfillmentStatus)) {
      order.fulfillment_status = fulfillmentStatus;
    }
  }
  if (shippingNotes !== undefined) order.shipping_notes = shippingNotes.trim();

  // If shipping cost changed by admin, recalculate total
  if (shippingCost !== undefined && Number(shippingCost) >= 0) {
    order.shipping_cost = Number(shippingCost);
    order.total_amount = order.subtotal + order.shipping_cost - order.discount_amount;
  }

  order.updated_at = new Date().toISOString();
  order.audit_logs.push({
    action: 'SHIPPING_UPDATED',
    timestamp: new Date().toISOString(),
    details: { courierName, trackingNumber, fulfillmentStatus, shippingCost },
  });

  res.json({ success: true, order });
});

// Callback simulation is intentionally not exposed by the application server.
// -------------------------------------------------------------
// VITE DEV SERVER / PRODUCTION STATIC SERVING
// -------------------------------------------------------------
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Asri Collection Server running on port ${PORT}`);
    console.log(`📱 Mobile e-commerce ready with Duitku POP endpoints.`);
  });
}

startServer();
