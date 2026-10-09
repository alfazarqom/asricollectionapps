// @ts-nocheck
// Supabase Edge Function: create-duitku-invoice (alias: duitku-create-invoice)
// Official Duitku POP Create Invoice Handler (Deno / Supabase runtime)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper: HMAC-SHA256 hex digest
async function hmacSha256Hex(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyBuffer = encoder.encode(key);
  const dataBuffer = encoder.encode(data);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, dataBuffer);
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Helper: SHA256 hex digest (standard fallback)
async function sha256Hex(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req: Request) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const DUITKU_MERCHANT_CODE = Deno.env.get("DUITKU_MERCHANT_CODE") || "";
    const DUITKU_API_KEY = Deno.env.get("DUITKU_API_KEY") || "";
    const DUITKU_ENV = Deno.env.get("DUITKU_ENV") || "sandbox";
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const APP_URL = Deno.env.get("APP_URL") || "https://example.com";

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    const {
      recipient,
      items,
      courier,
    } = body;

    // 1. Validasi Input Penerima
    if (!recipient?.name || !recipient?.phone || !recipient?.email || !recipient?.address) {
      return new Response(
        JSON.stringify({ error: "Data penerima tidak lengkap (nama, nomor telepon, email, alamat diperlukan)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Keranjang belanja kosong." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Validasi Otoritatif Produk & Harga dari Database Supabase (atau get-products Edge Function)
    // JANGAN percaya harga dari client/browser!
    let authoritativeCatalog: any[] = [];
    const { data: dbProducts, error: dbErr } = await supabase.from("products").select("*");
    if (!dbErr && dbProducts && dbProducts.length > 0) {
      authoritativeCatalog = dbProducts;
    } else {
      const catalogResponse = await fetch("https://mvwflakurihhakdrlteg.supabase.co/functions/v1/get-products");
      if (catalogResponse.ok) {
        authoritativeCatalog = await catalogResponse.json();
      }
    }
    const catalogMap = new Map(authoritativeCatalog.map((p: any) => [p.id, p]));

    let calculatedSubtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const liveProduct = catalogMap.get(item.id);
      if (!liveProduct) {
        return new Response(
          JSON.stringify({ error: `Produk dengan ID "${item.id}" tidak ditemukan dalam katalog resmi.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (liveProduct.availability === "out of stock") {
        return new Response(
          JSON.stringify({ error: `Produk "${liveProduct.title}" sedang habis stok.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        return new Response(
          JSON.stringify({ error: `Kuantitas produk "${liveProduct.title}" tidak valid.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const verifiedUnitPrice = liveProduct.sale_price !== null && liveProduct.sale_price !== undefined 
        ? Number(liveProduct.sale_price) 
        : Number(liveProduct.price);

      const itemSubtotal = verifiedUnitPrice * qty;
      calculatedSubtotal += itemSubtotal;

      validatedItems.push({
        product_id: liveProduct.id,
        title: liveProduct.title,
        unit_price: verifiedUnitPrice,
        quantity: qty,
        subtotal: itemSubtotal,
        image_link: liveProduct.image_link || liveProduct.additional_image_link,
      });
    }

    // 3. Validasi Ongkos Kirim di Backend
    const validCouriers: Record<string, number> = {
      "jne_reg": 18000,
      "sicepat_reg": 16000,
      "jnt_reg": 17000,
      "gosend_sameday": 25000,
      "pickup_store": 0,
    };

    const courierCode = courier?.code || "sicepat_reg";
    const verifiedShippingCost = validCouriers[courierCode] ?? 18000;
    const verifiedCourierName = courier?.name || "SiCepat REG";

    const verifiedTotal = calculatedSubtotal + verifiedShippingCost;

    // 4. Generate Unique Order Number & Secure Access Token
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const orderNumber = `ORD-${dateStr}-${randomSuffix}`;
    const accessToken = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");

    // 5. Simpan Pesanan Awal ke Database
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_name: recipient.name.trim(),
        customer_email: recipient.email.trim(),
        customer_phone: recipient.phone.trim(),
        shipping_address: recipient.address.trim(),
        shipping_city: recipient.city || "",
        shipping_postal_code: recipient.postalCode || "",
        subtotal: calculatedSubtotal,
        shipping_cost: verifiedShippingCost,
        total_amount: verifiedTotal,
        payment_status: "pending",
        fulfillment_status: "unfulfilled",
        courier_name: verifiedCourierName,
        access_token: accessToken,
      })
      .select()
      .single();

    if (orderError) {
      throw new Error(`Gagal membuat data pesanan: ${orderError.message}`);
    }

    const orderId = orderData.id;

    // Simpan order items
    const itemsToInsert = validatedItems.map((it) => ({
      ...it,
      order_id: orderId,
    }));
    await supabase.from("order_items").insert(itemsToInsert);

    // Buat inventory reservation atomik
    for (const it of validatedItems) {
      await supabase.rpc("reserve_inventory_atomic", {
        p_order_id: orderId,
        p_product_id: it.product_id,
        p_quantity: it.quantity,
        p_minutes: 60,
      });
    }

    // 6. Buat Signature & Request ke Duitku POP
    const createInvoiceUrl = DUITKU_ENV === "production"
      ? "https://api-prod.duitku.com/api/merchant/createInvoice"
      : "https://api-sandbox.duitku.com/api/merchant/createInvoice";

    const timestamp = Date.now().toString();
    // Formula resmi Duitku POP: HMAC_SHA256(merchantCode + timestamp, apiKey)
    const signature = await hmacSha256Hex(DUITKU_API_KEY, DUITKU_MERCHANT_CODE + timestamp);

    const callbackUrl = Deno.env.get("DUITKU_CALLBACK_URL") || `${APP_URL}/api/duitku-callback`;
    const returnUrl = Deno.env.get("DUITKU_RETURN_URL") || `${APP_URL}/orders/${orderNumber}?token=${accessToken}`;

    const itemDetailsPayload = validatedItems.map((it) => ({
      name: it.title.substring(0, 50),
      price: it.unit_price,
      quantity: it.quantity,
    }));

    if (verifiedShippingCost > 0) {
      itemDetailsPayload.push({
        name: `Ongkir (${verifiedCourierName})`,
        price: verifiedShippingCost,
        quantity: 1,
      });
    }

    const duitkuPayload = {
      paymentAmount: Math.round(verifiedTotal),
      merchantOrderId: orderNumber,
      productDetails: `Pesanan #${orderNumber} di Asri Collection`,
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
        firstName: recipient.name.split(" ")[0] || recipient.name,
        lastName: recipient.name.split(" ").slice(1).join(" ") || "",
        email: recipient.email.trim(),
        phoneNumber: recipient.phone.trim(),
        shippingAddress: {
          firstName: recipient.name,
          address: recipient.address,
          city: recipient.city || "Jakarta",
          postalCode: recipient.postalCode || "12345",
          phone: recipient.phone,
          countryCode: "ID",
        },
      },
    };

    let reference = "";
    let paymentUrl = "";

    // Panggil Duitku jika credentials ada, atau gunakan sandbox simulation jika kosong
    if (DUITKU_MERCHANT_CODE && DUITKU_API_KEY) {
      const duitkuResponse = await fetch(createInvoiceUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-duitku-signature": signature,
          "x-duitku-timestamp": timestamp,
          "x-duitku-merchantcode": DUITKU_MERCHANT_CODE,
        },
        body: JSON.stringify(duitkuPayload),
      });

      const duitkuResult = await duitkuResponse.json();

      if (duitkuResult.statusCode === "00" && duitkuResult.reference) {
        reference = duitkuResult.reference;
        paymentUrl = duitkuResult.paymentUrl || "";
      } else {
        throw new Error(duitkuResult.statusMessage || "Duitku menolak pembuatan invoice.");
      }
    } else {
      // Sandbox fallback token untuk mode testing lokal/staging
      reference = `DSANDBOX-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      paymentUrl = `https://sandbox-duitku-preview.local/pay/${reference}`;
    }

    // Update order dengan referensi Duitku
    await supabase
      .from("orders")
      .update({
        duitku_reference: reference,
        duitku_payment_url: paymentUrl,
      })
      .eq("id", orderId);

    // Catat record awal ke tabel payments
    await supabase.from("payments").insert({
      order_id: orderId,
      merchant_order_id: orderNumber,
      reference,
      duitku_reference: reference,
      amount: verifiedTotal,
      payment_amount: verifiedTotal,
      currency: "IDR",
      payment_url: paymentUrl,
      payment_status: "pending",
      environment: DUITKU_ENV,
      status: "pending",
    });

    // Kembalikan HANYA data yang diperlukan frontend (tanpa secrets!)
    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        orderNumber,
        accessToken,
        reference,
        paymentUrl,
        totalAmount: verifiedTotal,
        subtotal: calculatedSubtotal,
        shippingCost: verifiedShippingCost,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Terjadi kesalahan internal pada server." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
