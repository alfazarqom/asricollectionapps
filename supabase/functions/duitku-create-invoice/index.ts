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
    const APP_URL = Deno.env.get("APP_URL") || "";
    const DUITKU_CALLBACK_URL = Deno.env.get("DUITKU_CALLBACK_URL") || "";
    const DUITKU_RETURN_URL = Deno.env.get("DUITKU_RETURN_URL") || "";

    if (!DUITKU_MERCHANT_CODE || !DUITKU_API_KEY) {
      return new Response(JSON.stringify({ error: "Konfigurasi Duitku belum lengkap." }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Konfigurasi backend belum lengkap." }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!["sandbox", "production"].includes(DUITKU_ENV)) {
      return new Response(JSON.stringify({ error: "DUITKU_ENV harus bernilai sandbox atau production." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!APP_URL || !DUITKU_CALLBACK_URL) {
      return new Response(JSON.stringify({ error: "APP_URL dan DUITKU_CALLBACK_URL wajib dikonfigurasi." }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
    const { data: authoritativeCatalog, error: dbErr } = await supabase.from("products").select("*");
    if (dbErr || !authoritativeCatalog) {
      console.error("Failed to load authoritative product catalog:", dbErr?.message);
      return new Response(JSON.stringify({ error: "Katalog produk sementara tidak tersedia." }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

      const qty = Number(item.quantity);
      if (!Number.isSafeInteger(qty) || qty <= 0) {
        return new Response(
          JSON.stringify({ error: `Kuantitas produk "${liveProduct.title}" tidak valid.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const verifiedUnitPrice = liveProduct.sale_price !== null && liveProduct.sale_price !== undefined
        ? Number(liveProduct.sale_price)
        : Number(liveProduct.price);
      if (!Number.isFinite(verifiedUnitPrice) || verifiedUnitPrice < 0) {
        return new Response(JSON.stringify({ error: "Harga produk tidak valid di database." }), {
          status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

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
    const { error: itemsError } = await supabase.from("order_items").insert(itemsToInsert);
    if (itemsError) {
      console.error("Failed to save order items:", itemsError.message);
      return new Response(JSON.stringify({ error: "Gagal menyimpan rincian pesanan." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Reservasi inventaris harus berhasil untuk setiap item sebelum invoice dibuat.
    for (const it of validatedItems) {
      const { data: reservationResult, error: reservationError } = await supabase.rpc("reserve_inventory_atomic", {
        p_order_id: orderId,
        p_product_id: it.product_id,
        p_quantity: it.quantity,
        p_minutes: 60,
      });
      if (reservationError || reservationResult?.success === false) {
        console.error("Inventory reservation failed:", reservationError?.message || reservationResult?.message);
        return new Response(JSON.stringify({ error: "Stok tidak dapat dipesan. Silakan coba kembali." }), {
          status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 6. Buat Signature & Request ke Duitku POP
    const createInvoiceUrl = DUITKU_ENV === "production"
      ? "https://api-prod.duitku.com/api/merchant/createInvoice"
      : "https://api-sandbox.duitku.com/api/merchant/createInvoice";

    const timestamp = Date.now().toString();
    // Formula resmi Duitku POP: HMAC_SHA256(merchantCode + timestamp, apiKey)
    const signature = await hmacSha256Hex(DUITKU_API_KEY, DUITKU_MERCHANT_CODE + timestamp);

    const callbackUrl = DUITKU_CALLBACK_URL;
    const returnUrl = DUITKU_RETURN_URL || `${APP_URL.replace(/\/$/, "")}/orders/${orderNumber}?token=${accessToken}`;

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

    // Konfigurasi wajib: tidak pernah membuat invoice simulasi jika kredensial kosong.
    {
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

      if (duitkuResult.statusCode === "00" && duitkuResult.reference && duitkuResult.paymentUrl) {
        reference = duitkuResult.reference;
        paymentUrl = duitkuResult.paymentUrl;
      } else {
        console.error("Duitku invoice rejected:", duitkuResult.statusCode || "unknown");
        return new Response(JSON.stringify({ error: "Duitku gagal membuat invoice pembayaran." }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Update order dengan referensi Duitku
    const { error: updateOrderError } = await supabase
      .from("orders")
      .update({
        duitku_reference: reference,
        duitku_payment_url: paymentUrl,
      })
      .eq("id", orderId);
    if (updateOrderError) {
      console.error("Failed to persist Duitku invoice reference:", updateOrderError.message);
      return new Response(JSON.stringify({ error: "Invoice dibuat, tetapi gagal menyimpan referensi pembayaran. Hubungi dukungan sebelum mencoba ulang." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Catat record awal ke tabel payments
    const { error: paymentInsertError } = await supabase.from("payments").insert({
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
    if (paymentInsertError) {
      console.error("Failed to persist payment record:", paymentInsertError.message);
      return new Response(JSON.stringify({ error: "Invoice dibuat, tetapi pencatatan pembayaran gagal. Hubungi dukungan sebelum mencoba ulang." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
    console.error("Duitku invoice processing error:", err?.message || "unknown error");
    return new Response(
      JSON.stringify({ error: "Terjadi kesalahan internal saat membuat invoice." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
