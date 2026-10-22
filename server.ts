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
    callbackUrl: `${APP_URL}/api/duitku-callback`,
  });
});

// 3. POST /api/create-invoice (Duitku POP Create Invoice & Order Creation)
app.post('/api/create-invoice', async (req: Request, res: Response) => {
  try {
    const { recipient, items, courier } = req.body;

    // A. Validasi Data Penerima
    if (!recipient?.name || !recipient?.phone || !recipient?.email || !recipient?.address) {
      return res.status(400).json({
        success: false,
        error: 'Data penerima tidak lengkap. Mohon lengkapi nama, nomor telepon, email, dan alamat.',
      });
    }

    // Validasi format email & nomor telepon
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipient.email.trim())) {
      return res.status(400).json({ success: false, error: 'Format email tidak valid.' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Keranjang belanja kosong.' });
    }

    // B. Validasi Otoritatif Produk & Harga dari Server Supabase
    // Jangan pernah percaya harga atau total yang dikirim oleh browser!
    const catalog = await fetchAuthoritativeProducts();
    const catalogMap = new Map(catalog.map((p: any) => [p.id, p]));

    let calculatedSubtotal = 0;
    const validatedItems: OrderItem[] = [];

    for (const item of items) {
      const liveProduct = catalogMap.get(item.id) as any;
      if (!liveProduct) {
        return res.status(400).json({
          success: false,
          error: `Produk dengan ID "${item.id}" tidak ditemukan dalam katalog resmi toko.`,
        });
      }

      if (liveProduct.availability === 'out of stock') {
        return res.status(400).json({
          success: false,
          error: `Maaf, stok produk "${liveProduct.title}" saat ini telah habis.`,
        });
      }

      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({
          success: false,
          error: `Kuantitas produk "${liveProduct.title}" harus lebih besar dari 0.`,
        });
      }

      // Gunakan sale_price jika ada, jika tidak gunakan price
      const authoritativeUnitPrice = liveProduct.sale_price !== null && liveProduct.sale_price !== undefined
        ? Number(liveProduct.sale_price)
        : Number(liveProduct.price);

      const itemSubtotal = authoritativeUnitPrice * qty;
      calculatedSubtotal += itemSubtotal;

      validatedItems.push({
        id: crypto.randomUUID(),
        product_id: liveProduct.id,
        title: liveProduct.title,
        unit_price: authoritativeUnitPrice,
        quantity: qty,
        subtotal: itemSubtotal,
        image_link: liveProduct.display_image || liveProduct.image_link,
      });
    }

    // C. Validasi Ongkos Kirim Otoritatif
    const validCouriers: Record<string, { name: string; cost: number; etd: string }> = {
      'jne_reg': { name: 'JNE Reguler', cost: 18000, etd: '2-3 Hari' },
      'sicepat_reg': { name: 'SiCepat REG', cost: 16000, etd: '1-2 Hari' },
      'jnt_reg': { name: 'J&T Express', cost: 17000, etd: '2-3 Hari' },
      'gosend_sameday': { name: 'GoSend Same Day', cost: 25000, etd: '6-8 Jam' },
      'pickup_store': { name: 'Ambil di Toko', cost: 0, etd: 'Hari ini' },
    };

    const courierCode = courier?.code || 'sicepat_reg';
    const selectedCourier = validCouriers[courierCode] || validCouriers['sicepat_reg'];
    const shippingCost = selectedCourier.cost;
    let finalTotal = calculatedSubtotal + shippingCost;

    // D. Buat Order ID & Access Token Unik
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    let orderNumber = `ORD-${dateStr}-${randomSuffix}`;
    let accessToken = 'tok_' + crypto.randomBytes(24).toString('hex');
    let orderId = crypto.randomUUID();

    // E. Reservasi Stok Atomik
    const reservationExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    reservationsDb.set(orderId, {
      orderId,
      orderNumber,
      items: validatedItems.map((it) => ({ productId: it.product_id, quantity: it.quantity })),
      status: 'reserved',
      expiresAt: reservationExpiry,
    });

    // F. Invoice hanya dibuat oleh Supabase Edge Function; tidak ada direct-provider fallback atau simulasi.
    let reference = '';
    let paymentUrl = '';
    const supabaseFnUrl = 'https://mvwflakurihhakdrlteg.supabase.co/functions/v1/duitku-create-invoice';
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

    if (!supabaseAnonKey) {
      reservationsDb.delete(orderId);
      return res.status(503).json({ success: false, error: 'Konfigurasi backend Supabase belum lengkap. Invoice tidak dibuat.' });
    }

    let edgeData: any;
    try {
      const edgeRes = await fetch(supabaseFnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          recipient,
          items: validatedItems.map((it) => ({ id: it.product_id, quantity: it.quantity })),
          courier: selectedCourier,
        }),
      });
      edgeData = await edgeRes.json().catch(() => ({}));
      if (!edgeRes.ok || !edgeData?.success || !edgeData?.reference || !edgeData?.orderNumber || !edgeData?.orderId || !edgeData?.accessToken) {
        reservationsDb.delete(orderId);
        console.error('Supabase invoice function rejected request', { status: edgeRes.status });
        return res.status(502).json({ success: false, error: 'Gagal membuat invoice melalui backend pembayaran. Silakan coba kembali.' });
      }
    } catch (err: any) {
      reservationsDb.delete(orderId);
      console.error('Supabase invoice function unavailable', err?.message || 'unknown error');
      return res.status(502).json({ success: false, error: 'Backend pembayaran tidak dapat dijangkau. Invoice tidak dibuat.' });
    }

    // Cache lokal sementara memakai identitas order yang dibuat oleh backend otoritatif.
    reservationsDb.delete(orderId);
    orderNumber = edgeData.orderNumber;
    orderId = edgeData.orderId;
    accessToken = edgeData.accessToken;
    finalTotal = Number(edgeData.totalAmount);
    calculatedSubtotal = Number(edgeData.subtotal);
    reference = edgeData.reference;
    paymentUrl = edgeData.paymentUrl || '';
    reservationsDb.set(orderId, {
      orderId,
      orderNumber,
      items: validatedItems.map((it) => ({ productId: it.product_id, quantity: it.quantity })),
      status: 'reserved',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });

    // G. Simpan Order ke Database
    const newOrder: Order = {
      id: orderId,
      order_number: orderNumber,
      customer_name: recipient.name.trim(),
      customer_email: recipient.email.trim(),
      customer_phone: recipient.phone.trim(),
      shipping_address: recipient.address.trim(),
      shipping_city: recipient.city || '',
      shipping_postal_code: recipient.postalCode || '',
      subtotal: calculatedSubtotal,
      shipping_cost: shippingCost,
      discount_amount: 0,
      total_amount: finalTotal,
      payment_status: 'pending',
      fulfillment_status: 'unfulfilled',
      courier_name: selectedCourier.name,
      tracking_number: '',
      shipping_notes: recipient.notes || '',
      access_token: accessToken,
      duitku_reference: reference,
      duitku_payment_url: paymentUrl,
      items: validatedItems,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      audit_logs: [
        {
          action: 'ORDER_CREATED',
          timestamp: new Date().toISOString(),
          details: { subtotal: calculatedSubtotal, shippingCost, finalTotal, courier: selectedCourier.name },
        },
      ],
    };

    ordersDb.set(orderNumber, newOrder);

    paymentsDb.set(orderNumber, {
      orderId,
      merchantOrderId: orderNumber,
      reference,
      amount: finalTotal,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    // Kembalikan HANYA informasi yang aman untuk client
    res.json({
      success: true,
      orderId,
      orderNumber,
      accessToken,
      reference,
      paymentUrl,
      totalAmount: finalTotal,
      subtotal: calculatedSubtotal,
      shippingCost,
      isLiveDuitku: true,
    });
  } catch (err: any) {
    console.error('Create Invoice Error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Terjadi kesalahan internal saat memproses invoice pesanan.',
    });
  }
});

// 4. POST /api/duitku-callback (Official Webhook Callback Handler)
app.post('/api/duitku-callback', (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const {
      merchantCode,
      amount,
      merchantOrderId,
      signature,
      resultCode,
      reference,
      paymentCode,
      paymentMethod,
    } = payload;

    // A. Validasi Kelengkapan Parameter
    if (!merchantCode || !amount || !merchantOrderId || !signature || !resultCode) {
      console.warn('Callback missing required parameters:', payload);
      return res.status(400).send('Bad Request: Parameter callback tidak lengkap.');
    }

    // B. Validasi Merchant Code
    if (!DUITKU_MERCHANT_CODE || merchantCode !== DUITKU_MERCHANT_CODE) {
      console.warn(`Callback merchantCode mismatch: expected ${DUITKU_MERCHANT_CODE}, got ${merchantCode}`);
      return res.status(401).send('Unauthorized: Merchant Code tidak cocok.');
    }

    // Fail closed: callback hanya menerima HMAC-SHA256 sesuai kontrak Duitku POP.
    if (!DUITKU_MERCHANT_CODE || !DUITKU_API_KEY) {
      return res.status(503).send('Service Unavailable: Konfigurasi callback belum lengkap.');
    }
    const calculatedHmac = crypto
      .createHmac('sha256', DUITKU_API_KEY)
      .update(`${merchantCode}${amount}${merchantOrderId}`)
      .digest('hex');
    const signatureMatches = typeof signature === 'string' &&
      signature.toLowerCase() === calculatedHmac.toLowerCase();

    if (!signatureMatches) {
      console.warn('Callback signature verification failed:', {
        received: signature,
        expectedMd5: calculatedSignature,
      });
      return res.status(401).send('Unauthorized: Signature tidak valid.');
    }

    // D. Cari Pesanan di Database
    const order = ordersDb.get(merchantOrderId);
    if (!order) {
      console.warn(`Callback order not found: ${merchantOrderId}`);
      return res.status(404).send('Not Found: Pesanan tidak ditemukan.');
    }

    // E. Validasi Nominal Pembayaran
    const receivedAmount = parseFloat(amount);
    if (Math.abs(receivedAmount - order.total_amount) > 0.01) {
      order.audit_logs.push({
        action: 'CALLBACK_AMOUNT_MISMATCH',
        timestamp: new Date().toISOString(),
        details: { expected: order.total_amount, received: receivedAmount },
      });
      return res.status(400).send('Conflict: Nominal pembayaran tidak cocok dengan total pesanan.');
    }

    // F. Idempotensi: Jika status sudah 'paid', jangan proses ulang stok
    if (order.payment_status === 'paid') {
      return res.status(200).send('SUCCESS');
    }

    // G. Terminal status protection: Jangan ubah pesanan 'cancelled' atau 'expired' kembali menjadi 'pending'
    if (order.payment_status === 'cancelled' || order.payment_status === 'expired') {
      return res.status(200).send('SUCCESS');
    }

    // H. Pemetaan Status Duitku: '00' = Sukses
    const isSuccess = resultCode === '00';
    order.payment_status = isSuccess ? 'paid' : 'failed';
    order.updated_at = new Date().toISOString();

    if (isSuccess && order.fulfillment_status === 'unfulfilled') {
      order.fulfillment_status = 'processing';
    }

    // I. Catat Pembayaran & Audit
    paymentsDb.set(merchantOrderId, {
      orderId: order.id,
      merchantOrderId,
      reference: reference || order.duitku_reference,
      amount: receivedAmount,
      paymentMethod: paymentMethod || paymentCode || 'Duitku POP',
      resultCode,
      status: order.payment_status,
      updatedAt: new Date().toISOString(),
    });

    order.audit_logs.push({
      action: isSuccess ? 'PAYMENT_CONFIRMED' : 'PAYMENT_FAILED',
      timestamp: new Date().toISOString(),
      details: { amount: receivedAmount, resultCode, reference, paymentMethod },
    });

    // J. Commit / Release Reservasi Stok
    const reservation = reservationsDb.get(order.id);
    if (reservation) {
      reservation.status = isSuccess ? 'committed' : 'released';
    }

    // Respons resmi Duitku harus 'SUCCESS' (HTTP 200)
    return res.status(200).send('SUCCESS');
  } catch (err: any) {
    console.error('Callback error:', err);
    return res.status(500).send(`Internal Server Error: ${err.message}`);
  }
});

// Helper: Query Duitku official transactionStatus API as authoritative source of truth
async function queryDuitkuTransactionStatus(orderNumber: string) {
  if (!DUITKU_MERCHANT_CODE || !DUITKU_API_KEY) return null;

  const checkUrl = DUITKU_ENV === 'production'
    ? 'https://api-prod.duitku.com/api/merchant/transactionStatus'
    : 'https://api-sandbox.duitku.com/api/merchant/transactionStatus';

  // Formula resmi Duitku transactionStatus: MD5(merchantCode + merchantOrderId + apiKey)
  const signature = crypto
    .createHash('md5')
    .update(`${DUITKU_MERCHANT_CODE}${orderNumber}${DUITKU_API_KEY}`)
    .digest('hex');

  const payload = {
    merchantCode: DUITKU_MERCHANT_CODE,
    merchantOrderId: orderNumber,
    signature,
  };

  try {
    const res = await fetch(checkUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('Error querying Duitku transactionStatus:', err);
    return null;
  }
}

// 5. GET /api/orders/:orderNumber (Customer Secure Order Lookup with auto Duitku sync)
app.get('/api/orders/:orderNumber', async (req: Request, res: Response) => {
  const { orderNumber } = req.params;
  const token = req.query.token as string;
  const phone = req.query.phone as string;
  const email = req.query.email as string;

  const order = ordersDb.get(orderNumber);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Pesanan tidak ditemukan.' });
  }

  // Pengamanan Otorisasi: Verifikasi token ATAU no telepon / email pelanggan
  const isAuthorized =
    (token && token === order.access_token) ||
    (phone && order.customer_phone.includes(phone.replace(/\D/g, ''))) ||
    (email && order.customer_email.toLowerCase() === email.toLowerCase());

  if (!isAuthorized) {
    return res.status(403).json({
      success: false,
      error: 'Akses ditolak. Token akses tidak valid atau data verifikasi tidak cocok.',
    });
  }

  // Jika pesanan masih berstatus 'pending', tanyakan ke Duitku transactionStatus API (source of truth)
  if (order.payment_status === 'pending' && DUITKU_MERCHANT_CODE && DUITKU_API_KEY) {
    const duitkuStatus = await queryDuitkuTransactionStatus(order.order_number);
    if (duitkuStatus) {
      if (duitkuStatus.statusCode === '00') {
        order.payment_status = 'paid';
        if (order.fulfillment_status === 'unfulfilled') {
          order.fulfillment_status = 'processing';
        }
        order.updated_at = new Date().toISOString();
        order.audit_logs.push({
          action: 'DUITKU_STATUS_SYNC_PAID',
          timestamp: new Date().toISOString(),
          details: duitkuStatus,
        });
        const resv = reservationsDb.get(order.id);
        if (resv) resv.status = 'committed';
      } else if (duitkuStatus.statusCode === '02') {
        order.payment_status = 'failed';
        order.updated_at = new Date().toISOString();
        order.audit_logs.push({
          action: 'DUITKU_STATUS_SYNC_FAILED',
          timestamp: new Date().toISOString(),
          details: duitkuStatus,
        });
        const resv = reservationsDb.get(order.id);
        if (resv) resv.status = 'released';
      }
    }
  }

  // Sembunyikan token dari respons
  const { access_token, ...safeOrder } = order;
  res.json({ success: true, order: safeOrder });
});

// 5b. POST /api/duitku-check-status (Explicit status synchronization with Duitku)
app.post('/api/duitku-check-status', async (req: Request, res: Response) => {
  const { orderNumber, token } = req.body;
  const order = ordersDb.get(orderNumber);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Pesanan tidak ditemukan.' });
  }

  if (token && token !== order.access_token) {
    return res.status(403).json({ success: false, error: 'Akses ditolak.' });
  }

  if (DUITKU_MERCHANT_CODE && DUITKU_API_KEY) {
    const duitkuStatus = await queryDuitkuTransactionStatus(orderNumber);
    if (duitkuStatus) {
      if (duitkuStatus.statusCode === '00' && order.payment_status !== 'paid') {
        order.payment_status = 'paid';
        if (order.fulfillment_status === 'unfulfilled') {
          order.fulfillment_status = 'processing';
        }
        order.updated_at = new Date().toISOString();
        order.audit_logs.push({
          action: 'DUITKU_MANUAL_SYNC_PAID',
          timestamp: new Date().toISOString(),
          details: duitkuStatus,
        });
        const resv = reservationsDb.get(order.id);
        if (resv) resv.status = 'committed';
      }
      return res.json({ success: true, paymentStatus: order.payment_status, duitkuResponse: duitkuStatus });
    }
  }

  return res.json({ success: true, paymentStatus: order.payment_status });
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

// 7. ADMIN AUTH
app.post('/api/admin/login', (req: Request, res: Response) => {
  const pin = typeof req.body?.pin === 'string' ? req.body.pin : '';
  if (!ADMIN_SECRET_PIN) return res.status(503).json({ success: false, error: 'ADMIN_SECRET_PIN belum dikonfigurasi di server.' });
  if (!pin || pin !== ADMIN_SECRET_PIN) return res.status(401).json({ success: false, error: 'PIN Admin tidak valid.' });
  return res.status(200).json({ success: true });
});

const adminAuth = (req: Request, res: Response, next: () => void) => {
  const pin = req.headers['x-admin-pin'] as string;
  if (!ADMIN_SECRET_PIN) return res.status(503).json({ success: false, error: 'ADMIN_SECRET_PIN belum dikonfigurasi di server.' });
  if (!pin || pin !== ADMIN_SECRET_PIN) return res.status(401).json({ success: false, error: 'Otorisasi Admin ditolak. PIN salah.' });
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
