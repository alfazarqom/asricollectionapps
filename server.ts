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

// Guest tracking is backed by the canonical Supabase Edge Function, never an in-memory Map.
app.post('/api/orders/track', async (req: Request, res: Response) => {
  const endpoint = SUPABASE_URL.replace(/\/$/, '') + '/functions/v1/get-order-tracking';
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderNumber: req.body?.orderNumber,
        phoneOrEmail: req.body?.phoneOrEmail,
      }),
    });
    const result = await response.json().catch(() => ({ success: false, error: 'Respons tracking tidak valid.' }));
    return res.status(response.status).json(result);
  } catch (error: any) {
    console.error('Canonical order tracking unavailable:', error?.message || 'network error');
    return res.status(503).json({ success: false, error: 'Layanan tracking tidak tersedia saat ini.' });
  }
});

// Admin APIs proxy to the same persistent Supabase-backed implementation used by Vercel rewrites.
const ADMIN_API_URL = SUPABASE_URL.replace(/\/$/, '') + '/functions/v1/admin-api';
async function forwardAdminApi(
  action: string,
  req: Request,
  res: Response,
  options: { orderNumber?: string; method?: string; body?: unknown } = {},
) {
  const endpoint = new URL(ADMIN_API_URL);
  endpoint.searchParams.set('action', action);
  if (options.orderNumber) endpoint.searchParams.set('orderNumber', options.orderNumber);
  if (action === 'orders') {
    if (typeof req.query.status === 'string') endpoint.searchParams.set('status', req.query.status);
    if (typeof req.query.search === 'string') endpoint.searchParams.set('search', req.query.search);
  }
  try {
    const method = options.method || req.method;
    const headers: Record<string, string> = {};
    const pin = req.headers['x-admin-pin'];
    if (typeof pin === 'string' && pin) headers['x-admin-pin'] = pin;
    if (method !== 'GET') headers['Content-Type'] = 'application/json';
    const response = await fetch(endpoint, {
      method,
      headers,
      ...(method !== 'GET' ? { body: JSON.stringify(options.body ?? req.body ?? {}) } : {}),
    });
    const result = await response.json().catch(() => ({ success: false, error: 'Respons admin tidak valid.' }));
    return res.status(response.status).json(result);
  } catch (error: any) {
    console.error('Canonical admin API unavailable:', error?.message || 'network error');
    return res.status(503).json({ success: false, error: 'Layanan admin Supabase tidak tersedia saat ini.' });
  }
}

app.post('/api/admin/auth', async (req: Request, res: Response) => {
  return forwardAdminApi('auth', req, res, { method: 'POST', body: req.body });
});

app.get('/api/admin/metrics', async (req: Request, res: Response) => {
  return forwardAdminApi('metrics', req, res);
});

app.get('/api/admin/orders', async (req: Request, res: Response) => {
  return forwardAdminApi('orders', req, res);
});

app.patch('/api/admin/orders/:orderNumber/shipping', async (req: Request, res: Response) => {
  return forwardAdminApi('shipping', req, res, {
    orderNumber: String(req.params.orderNumber || '').trim().toUpperCase(),
    method: 'PATCH',
    body: req.body,
  });
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
