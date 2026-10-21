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
const ADMIN_SECRET_PIN = process.env.ADMIN_SECRET_PIN || '123456';
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;

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

// Seed sample orders for immediate demonstration in admin and tracking
const seedSampleData = () => {
  const sampleOrder: Order = {
    id: crypto.randomUUID(),
    order_number: 'ORD-20261009-88123',
    customer_name: 'Budi Santoso',
    customer_email: 'budi.santoso@example.com',
    customer_phone: '081298765432',
    shipping_address: 'Jl. Sudirman No. 45, RT 02/RW 04',
    shipping_city: 'Jakarta Selatan',
    shipping_postal_code: '12190',
    subtotal: 275000,
    shipping_cost: 16000,
    discount_amount: 0,
    total_amount: 291000,
    payment_status: 'paid',
    fulfillment_status: 'processing',
    courier_name: 'SiCepat REG',
    tracking_number: '003418293812',
    shipping_notes: 'Titipkan ke satpam jika rumah kosong',
    access_token: 'tok-seed-sample-budi88123',
    duitku_reference: 'DS-20261009-1001',
    duitku_payment_url: '',
    items: [
      {
        id: crypto.randomUUID(),
        product_id: 'APP-003',
        title: 'Hoodie Fleece Unisex',
        unit_price: 275000,
        quantity: 1,
        subtotal: 275000,
        image_link: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80',
      },
    ],
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    audit_logs: [
      { action: 'ORDER_CREATED', timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), details: {} },
      { action: 'PAYMENT_CONFIRMED', timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), details: { amount: 291000, resultCode: '00' } },
    ],
  };
  ordersDb.set(sampleOrder.order_number, sampleOrder);
};
seedSampleData();

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
    duitkuConfigured: true,
    supabaseSecrets: true,
    merchantCode: DUITKU_MERCHANT_CODE ? `${DUITKU_MERCHANT_CODE.substring(0, 3)}***` : 'Tersimpan di Supabase Secret',
    env: DUITKU_ENV,
    appUrl: APP_URL,
    callbackUrl: 'https://mvwflakurihhakdrlteg.supabase.co/functions/v1/duitku-callback',
  });
});

// 3. POST /api/create-invoice (Duitku POP Create Invoice & Order Creation)
app.post('/api/create-invoice', async (req: Request, res: Response) => {
  try {
    const { recipient, items, courier } = req.body || {};
    if (!recipient || !Array.isArray(items) || items.length === 0) return res.status(400).json({ success: false, error: 'Data checkout tidak lengkap.' });
    // Supabase Edge Function is the single authoritative order/invoice creator.
    const upstream = await fetch('https://mvwflakurihhakdrlteg.supabase.co/functions/v1/duitku-create-invoice', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient, items: items.map((item: any) => ({ id: item.id, quantity: item.quantity })),
        courier: courier ? { code: courier.code, name: courier.name } : undefined }),
    });
    const result = await upstream.json().catch(() => null);
    if (!upstream.ok || result?.success !== true || typeof result?.orderNumber !== 'string' || !result.orderNumber ||
        typeof result?.reference !== 'string' || !result.reference || typeof result?.accessToken !== 'string' || !result.accessToken) {
      return res.status(upstream.ok ? 502 : upstream.status).json({ success: false,
        error: typeof result?.error === 'string' ? result.error : 'Backend pembayaran belum mengonfirmasi invoice. Periksa status pesanan sebelum mencoba kembali.' });
    }
    return res.status(200).json(result);
  } catch (_error) {
    console.error('Invoice delegation failed.');
    return res.status(502).json({ success: false, error: 'Backend pembayaran tidak dapat dijangkau. Periksa status pesanan sebelum mencoba kembali.' });
  }
});

// Legacy Express callback is disabled; Duitku must call the verified Supabase Edge Function.
app.post('/api/duitku-callback', (_req: Request, res: Response) =>
  res.status(410).send('Callback endpoint retired. Use the configured Supabase Duitku callback endpoint.'));

app.get('/api/orders/:orderNumber', async (req: Request, res: Response) => {
  const orderNumber = String(req.params.orderNumber || '');
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  if (!token) return res.status(403).json({ success: false, error: 'Token akses pesanan diperlukan.' });
  try {
    const upstream = await fetch('https://mvwflakurihhakdrlteg.supabase.co/functions/v1/get-duitku-payment-status', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderNumber, token }),
    });
    const result = await upstream.json().catch(() => null);
    return res.status(upstream.status).json(result || { success: false, error: 'Status pesanan tidak tersedia.' });
  } catch (_error) {
    return res.status(502).json({ success: false, error: 'Backend status pesanan tidak dapat dijangkau.' });
  }
});

app.post('/api/duitku-check-status', async (req: Request, res: Response) => {
  const { orderNumber, token } = req.body || {};
  if (typeof orderNumber !== 'string' || typeof token !== 'string' || !token) return res.status(403).json({
    success: false, error: 'Nomor pesanan dan token akses diperlukan.',
  });
  try {
    const upstream = await fetch('https://mvwflakurihhakdrlteg.supabase.co/functions/v1/get-duitku-payment-status', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderNumber, token }),
    });
    const result = await upstream.json().catch(() => null);
    return res.status(upstream.status).json(result || { success: false, error: 'Status pembayaran tidak tersedia.' });
  } catch (_error) {
    return res.status(502).json({ success: false, error: 'Backend status pembayaran tidak dapat dijangkau.' });
  }
});

app.post('/api/orders/track', async (req: Request, res: Response) => {
  const orderNumber = typeof req.body?.orderNumber === 'string' ? req.body.orderNumber.trim() : '';
  const phoneOrEmail = typeof req.body?.phoneOrEmail === 'string' ? req.body.phoneOrEmail.trim() : '';
  if (!orderNumber || !phoneOrEmail) return res.status(400).json({
    success: false, error: 'Nomor pesanan serta email atau nomor telepon diperlukan.',
  });
  const verification = phoneOrEmail.includes('@') ? { email: phoneOrEmail.toLowerCase() } : { phone: phoneOrEmail };
  try {
    const upstream = await fetch('https://mvwflakurihhakdrlteg.supabase.co/functions/v1/get-duitku-payment-status', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderNumber, ...verification }),
    });
    const result = await upstream.json().catch(() => null);
    return res.status(upstream.status).json(result || { success: false, error: 'Status pesanan tidak tersedia.' });
  } catch (_error) {
    return res.status(502).json({ success: false, error: 'Backend status pesanan tidak dapat dijangkau.' });
  }
});

// 7. ADMIN AUTH MIDDLEWARE
const adminAuth = (req: Request, res: Response, next: () => void) => {
  const pin = req.headers['x-admin-pin'] as string;
  if (!pin || pin !== ADMIN_SECRET_PIN) {
    return res.status(401).json({ success: false, error: 'Otorisasi Admin ditolak. PIN salah.' });
  }
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

// 11. POST /api/test/simulate-callback (Interactive Sandbox Test Tool)
app.post('/api/test/simulate-callback', (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_PAYMENT_SIMULATOR !== 'true') {
    return res.status(404).json({ success: false, error: 'Not Found' });
  }
  return res.status(410).json({ success: false, error: 'Simulasi callback lama dinonaktifkan.' });

  const { orderNumber, scenario, customAmount, tamperedSignature } = req.body;
  const order = ordersDb.get(orderNumber);

  if (!order) {
    return res.status(404).json({ success: false, error: 'Pesanan tidak ditemukan.' });
  }

  const merchantCode = DUITKU_MERCHANT_CODE || 'D12345';
  const apiKey = DUITKU_API_KEY || 'sandbox_test_key_abc123';
  const amount = customAmount !== undefined ? customAmount : order.total_amount;
  const resultCode = scenario === 'failed' ? '01' : '00';

  // Calculate signature
  let signature = crypto
    .createHash('md5')
    .update(`${merchantCode}${amount}${orderNumber}${apiKey}`)
    .digest('hex');

  if (tamperedSignature) {
    signature = 'invalid_tampered_signature_99999';
  }

  const simulatedPayload = {
    merchantCode,
    amount: amount.toString(),
    merchantOrderId: orderNumber,
    signature,
    resultCode,
    reference: order.duitku_reference || `DS-${Date.now()}`,
    paymentMethod: 'VA_BCA',
    paymentCode: '014',
  };

  // Perform internal call to callback logic
  // Signature check
  const expectedRaw = `${merchantCode}${amount}${orderNumber}${apiKey}`;
  const validMD5 = crypto.createHash('md5').update(expectedRaw).digest('hex');

  if (signature.toLowerCase() !== validMD5.toLowerCase()) {
    return res.json({
      success: false,
      scenario,
      error: 'TEST RESULT: Callback Ditolak (HTTP 401 Unauthorized - Signature Tidak Valid). Keamanan Signature Lulus!',
      payloadSent: simulatedPayload,
    });
  }

  if (Math.abs(Number(amount) - order.total_amount) > 0.01) {
    return res.json({
      success: false,
      scenario,
      error: 'TEST RESULT: Callback Ditolak (HTTP 400 Conflict - Nominal Mismatch). Integritas Nominal Lulus!',
      payloadSent: simulatedPayload,
    });
  }

  if (order.payment_status === 'paid' && scenario === 'duplicate') {
    return res.json({
      success: true,
      scenario,
      message: 'TEST RESULT: Idempotensi Lulus. Callback duplikat direspons SUCCESS tanpa mengubah stok ulang.',
      payloadSent: simulatedPayload,
    });
  }

  const isSuccess = resultCode === '00';
  order.payment_status = isSuccess ? 'paid' : 'failed';
  if (isSuccess && order.fulfillment_status === 'unfulfilled') {
    order.fulfillment_status = 'processing';
  }
  order.updated_at = new Date().toISOString();
  order.audit_logs.push({
    action: `SIMULATED_CALLBACK_${isSuccess ? 'SUCCESS' : 'FAILED'}`,
    timestamp: new Date().toISOString(),
    details: simulatedPayload,
  });

  return res.json({
    success: true,
    scenario,
    message: isSuccess
      ? 'TEST RESULT: Pembayaran Terverifikasi Lunas! Pesanan kini status PAID.'
      : 'TEST RESULT: Status Pembayaran Gagal Tercatat (resultCode 01).',
    currentPaymentStatus: order.payment_status,
    payloadSent: simulatedPayload,
  });
});

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
