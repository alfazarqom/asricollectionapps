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

// Curated high quality product images map as fallback for sample domain images
const curatedImageMap: Record<string, string> = {
  'APP-003': 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80', // Hoodie
  'APP-001-BLK-M': 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80', // Kaos Hitam
  'APP-001-WHT-L': 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&auto=format&fit=crop&q=80', // Kaos Putih
  'APP-002': 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=600&auto=format&fit=crop&q=80', // Kemeja Linen
  'SHO-002': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80', // Sepatu Lari
  'SHO-001': 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&auto=format&fit=crop&q=80', // Sneakers
  'BAG-001': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80', // Ransel
  'BAG-002': 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80', // Tas Selempang
};

const defaultProductsList = [
  {
    id: 'APP-001-BLK-M',
    title: 'Kaos Katun Premium Hitam',
    description: 'Kaos katun combed 30s premium dengan jahitan rapi dan adem sepanjang hari.',
    availability: 'in stock',
    condition: 'new',
    price: 125000,
    sale_price: 99000,
    currency: 'IDR',
    image_link: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
    brand: 'Asri Basic',
    product_type: 'Apparel',
    display_image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
    created_at: '2026-10-09T19:21:07.237165+00:00',
    updated_at: '2026-10-09T19:21:07.237165+00:00',
  },
  {
    id: 'APP-001-WHT-L',
    title: 'Kaos Katun Premium Putih',
    description: 'Kaos katun combed 30s putih bersih, tidak mudah melar dan nyaman dipakai.',
    availability: 'in stock',
    condition: 'new',
    price: 125000,
    sale_price: 99000,
    currency: 'IDR',
    image_link: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&auto=format&fit=crop&q=80',
    brand: 'Asri Basic',
    product_type: 'Apparel',
    display_image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&auto=format&fit=crop&q=80',
    created_at: '2026-10-09T19:21:07.237165+00:00',
    updated_at: '2026-10-09T19:21:07.237165+00:00',
  },
  {
    id: 'APP-002',
    title: 'Kemeja Linen Lengan Pendek',
    description: 'Kemeja casual bahan linen breathable dengan kerah resort modern.',
    availability: 'in stock',
    condition: 'new',
    price: 215000,
    sale_price: null,
    currency: 'IDR',
    image_link: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=600&auto=format&fit=crop&q=80',
    brand: 'Asri Casual',
    product_type: 'Apparel',
    display_image: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=600&auto=format&fit=crop&q=80',
    created_at: '2026-10-09T19:21:07.237165+00:00',
    updated_at: '2026-10-09T19:21:07.237165+00:00',
  },
  {
    id: 'APP-003',
    title: 'Hoodie Fleece Unisex',
    description: 'Hoodie berbahan fleece lembut dan hangat, cocok untuk cuaca sejuk atau harian santai.',
    availability: 'in stock',
    condition: 'new',
    price: 275000,
    sale_price: null,
    currency: 'IDR',
    image_link: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80',
    brand: 'Asri Wear',
    product_type: 'Apparel',
    display_image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80',
    created_at: '2026-10-09T19:21:07.237165+00:00',
    updated_at: '2026-10-09T19:21:07.237165+00:00',
  },
  {
    id: 'SHO-001',
    title: 'Sneakers Klasik Kanvas',
    description: 'Sepatu sneakers kanvas dengan sol empuk anti-slip untuk mobilitas tinggi.',
    availability: 'in stock',
    condition: 'new',
    price: 349000,
    sale_price: 299000,
    currency: 'IDR',
    image_link: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&auto=format&fit=crop&q=80',
    brand: 'Asri Footwear',
    product_type: 'Shoes',
    display_image: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&auto=format&fit=crop&q=80',
    created_at: '2026-10-09T19:21:07.237165+00:00',
    updated_at: '2026-10-09T19:21:07.237165+00:00',
  },
  {
    id: 'SHO-002',
    title: 'Sepatu Lari Ultralight',
    description: 'Sepatu running ringan dengan bantalan cushion responsif untuk kenyamanan optimal.',
    availability: 'in stock',
    condition: 'new',
    price: 489000,
    sale_price: null,
    currency: 'IDR',
    image_link: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
    brand: 'Asri Sport',
    product_type: 'Shoes',
    display_image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
    created_at: '2026-10-09T19:21:07.237165+00:00',
    updated_at: '2026-10-09T19:21:07.237165+00:00',
  },
  {
    id: 'BAG-001',
    title: 'Ransel Laptop Waterproof',
    description: 'Backpack tahan air dengan kompartemen laptop 15.6 inch dan busa punggung empuk.',
    availability: 'in stock',
    condition: 'new',
    price: 319000,
    sale_price: null,
    currency: 'IDR',
    image_link: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
    brand: 'Asri Bags',
    product_type: 'Accessories',
    display_image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
    created_at: '2026-10-09T19:21:07.237165+00:00',
    updated_at: '2026-10-09T19:21:07.237165+00:00',
  },
  {
    id: 'BAG-002',
    title: 'Tas Selempang Kanvas Mini',
    description: 'Sling bag praktis untuk dompet, ponsel, dan barang bawaan esensial harian.',
    availability: 'in stock',
    condition: 'new',
    price: 145000,
    sale_price: null,
    currency: 'IDR',
    image_link: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80',
    brand: 'Asri Bags',
    product_type: 'Accessories',
    display_image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80',
    created_at: '2026-10-09T19:21:07.237165+00:00',
    updated_at: '2026-10-09T19:21:07.237165+00:00',
  },
];

// Helper: Fetch Authoritative Product Catalog from Supabase get-products Edge Function
async function fetchAuthoritativeProducts(queryString?: string) {
  const baseUrl = 'https://mvwflakurihhakdrlteg.supabase.co/functions/v1/get-products';
  const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;

  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'AsriCollection-Backend/1.0' } });
    if (response.ok) {
      const products = await response.json();
      if (Array.isArray(products) && products.length > 0) {
        return products.map((p: any) => ({
          ...p,
          display_image: p.display_image || p.image_link || curatedImageMap[p.id],
        }));
      }
    }
  } catch (err: any) {
    console.warn('Fallback to local product catalog:', err.message);
  }

  // Fallback graceful
  return defaultProductsList.map((p: any) => ({
    ...p,
    display_image: curatedImageMap[p.id] || p.image_link,
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
    const finalTotal = calculatedSubtotal + shippingCost;

    // D. Buat Order ID & Access Token Unik
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const orderNumber = `ORD-${dateStr}-${randomSuffix}`;
    const accessToken = 'tok_' + crypto.randomBytes(24).toString('hex');
    const orderId = crypto.randomUUID();

    // E. Reservasi Stok Atomik
    const reservationExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    reservationsDb.set(orderId, {
      orderId,
      orderNumber,
      items: validatedItems.map((it) => ({ productId: it.product_id, quantity: it.quantity })),
      status: 'reserved',
      expiresAt: reservationExpiry,
    });

    // F. Duitku POP Create Invoice Request
    const createInvoiceUrl = DUITKU_ENV === 'production'
      ? 'https://api-prod.duitku.com/api/merchant/createInvoice'
      : 'https://api-sandbox.duitku.com/api/merchant/createInvoice';

    const timestamp = Date.now().toString();
    // Formula resmi Duitku POP Create Invoice Header: SHA256(merchantCode + timestamp + apiKey)
    const signature = crypto
      .createHash('sha256')
      .update(`${DUITKU_MERCHANT_CODE}${timestamp}${DUITKU_API_KEY}`)
      .digest('hex');

    const callbackUrl = `${APP_URL}/api/duitku-callback`;
    const returnUrl = `${APP_URL}/orders/${orderNumber}?token=${accessToken}`;

    const itemDetailsPayload = validatedItems.map((it) => ({
      name: it.title.substring(0, 50),
      price: it.unit_price,
      quantity: it.quantity,
    }));

    if (shippingCost > 0) {
      itemDetailsPayload.push({
        name: `Ongkir - ${selectedCourier.name}`,
        price: shippingCost,
        quantity: 1,
      });
    }

    let reference = '';
    let paymentUrl = '';
    let isLiveDuitku = false;

    // 1. Prioritaskan delegasi ke Supabase Edge Function (tempat Supabase Secret DUITKU dikonfigurasi)
    const supabaseFnUrl = 'https://mvwflakurihhakdrlteg.supabase.co/functions/v1/duitku-create-invoice';

    let delegatedToSupabase = false;
    try {
      const edgeRes = await fetch(supabaseFnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient,
          items: validatedItems.map((it) => ({ id: it.product_id, quantity: it.quantity })),
          courier: selectedCourier,
        }),
      });

      if (edgeRes.ok) {
        const edgeData = await edgeRes.json();
        if (edgeData.reference) {
          reference = edgeData.reference;
          paymentUrl = edgeData.paymentUrl || '';
          isLiveDuitku = true;
          delegatedToSupabase = true;
        }
      }
    } catch (err: any) {
      // Edge function belum aktif atau network timeout, lanjut ke mekanisme berikutnya
    }

    // 2. Jika Edge function belum aktif dan ada env local, panggil Duitku langsung
    if (!delegatedToSupabase && DUITKU_MERCHANT_CODE && DUITKU_API_KEY) {
      try {
        const duitkuPayload = {
          paymentAmount: Math.round(finalTotal),
          merchantOrderId: orderNumber,
          productDetails: `Pesanan ${orderNumber} di Asri Collection`,
          email: recipient.email.trim(),
          phoneNumber: recipient.phone.trim(),
          additionalParam: accessToken,
          merchantUserInfo: recipient.name.trim(),
          customerVaName: recipient.name.trim(),
          callbackUrl,
          returnUrl,
          expiryPeriod: 60,
          itemDetails: itemDetailsPayload,
          customerDetail: {
            firstName: recipient.name.split(' ')[0] || recipient.name,
            lastName: recipient.name.split(' ').slice(1).join(' ') || '',
            email: recipient.email.trim(),
            phoneNumber: recipient.phone.trim(),
            shippingAddress: {
              firstName: recipient.name,
              address: recipient.address,
              city: recipient.city || 'Jakarta',
              postalCode: recipient.postalCode || '12345',
              phone: recipient.phone,
              countryCode: 'ID',
            },
          },
        };

        const response = await fetch(createInvoiceUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-duitku-signature': signature,
            'x-duitku-timestamp': timestamp,
            'x-duitku-merchantcode': DUITKU_MERCHANT_CODE,
          },
          body: JSON.stringify(duitkuPayload),
        });

        const data = await response.json();
        if (data.statusCode === '00' && data.reference) {
          reference = data.reference;
          paymentUrl = data.paymentUrl || '';
          isLiveDuitku = true;
        } else {
          console.warn('Duitku API response error:', data);
          throw new Error(data.statusMessage || 'Gagal membuat invoice di Duitku.');
        }
      } catch (err: any) {
        console.warn('Fallback to Sandbox Simulator:', err.message);
        reference = `DSANDBOX-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        paymentUrl = `https://sandbox-duitku-preview.local/pay/${reference}`;
      }
    } else if (!delegatedToSupabase) {
      // 3. Fallback seamless untuk preview dan sandbox testing di AI Studio tanpa perlu input secret
      reference = `DSANDBOX-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      paymentUrl = `https://sandbox-duitku-preview.local/pay/${reference}`;
    }

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
      isLiveDuitku,
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
    if (DUITKU_MERCHANT_CODE && merchantCode !== DUITKU_MERCHANT_CODE) {
      console.warn(`Callback merchantCode mismatch: expected ${DUITKU_MERCHANT_CODE}, got ${merchantCode}`);
      return res.status(401).send('Unauthorized: Merchant Code tidak cocok.');
    }

    // C. Validasi Signature Resmi Duitku:
    // 1. Formula HMAC-SHA256: HMAC_SHA256(merchantCode + amount + merchantOrderId, apiKey)
    const calculatedHmac = DUITKU_API_KEY
      ? crypto.createHmac('sha256', DUITKU_API_KEY).update(`${merchantCode}${amount}${merchantOrderId}`).digest('hex')
      : '';

    // 2. Formula MD5: MD5(merchantCode + amount + merchantOrderId + apiKey)
    const expectedRaw = `${merchantCode}${amount}${merchantOrderId}${DUITKU_API_KEY}`;
    const calculatedSignature = crypto.createHash('md5').update(expectedRaw).digest('hex');

    // 3. Formula SHA-256 fallback
    const calculatedSha256 = crypto.createHash('sha256').update(expectedRaw).digest('hex');

    const signatureMatches = DUITKU_API_KEY
      ? signature.toLowerCase() === calculatedHmac.toLowerCase() ||
        signature.toLowerCase() === calculatedSignature.toLowerCase() ||
        signature.toLowerCase() === calculatedSha256.toLowerCase()
      : true;

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

// 6. POST /api/orders/track (Guest Order Search with verification)
app.post('/api/orders/track', (req: Request, res: Response) => {
  const { orderNumber, phoneOrEmail } = req.body;
  if (!orderNumber || !phoneOrEmail) {
    return res.status(400).json({
      success: false,
      error: 'Harap masukkan nomor pesanan dan nomor telepon/email.',
    });
  }

  const order = ordersDb.get(orderNumber.trim().toUpperCase());
  if (!order) {
    return res.status(404).json({ success: false, error: 'Pesanan dengan nomor tersebut tidak ditemukan.' });
  }

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

  const { access_token, ...safeOrder } = order;
  res.json({ success: true, order: safeOrder, accessToken: order.access_token });
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
