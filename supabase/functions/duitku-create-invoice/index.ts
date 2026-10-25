// Supabase Edge Function: duitku-create-invoice
// Source of truth: https://docs.duitku.com/pop/id/ (Create Invoice / Backend Integration)
// POP request signature: HMAC_SHA256(merchantCode + timestamp, apiKey).
// The API key is the HMAC key; it is NOT appended to the signed message.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ItemDetail = { name: string; price: number; quantity: number };
type CustomerAddress = {
  firstName?: string;
  lastName?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  countryCode?: string;
};
type CustomerDetail = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  billingAddress?: CustomerAddress;
  shippingAddress?: CustomerAddress;
};
type CreateInvoiceRequest = {
  merchantOrderId: string;
  paymentAmount: number;
  productDetails?: string;
  email?: string;
  phoneNumber?: string;
  customerVaName?: string;
  additionalParam?: string;
  merchantUserInfo?: string;
  paymentMethod?: string;
  expiryPeriod?: number;
  callbackUrl?: string;
  returnUrl?: string;
  itemDetails?: ItemDetail[];
  customerDetail?: CustomerDetail;
};
type OrderRow = {
  id: string;
  total_amount: number | string;
  status: string;
  customer_email: string;
  customer_name: string;
  customer_phone: string;
  product_details: string | null;
  reference: string | null;
  payment_url: string | null;
  payment_method: string | null;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function generateHmacSha256Hex(message: string, secretKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secretKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return jsonResponse({ statusCode: "02", statusMessage: "Method Not Allowed. Only POST is accepted." }, 405);
  }

  try {
    const merchantCode = Deno.env.get("DUITKU_MERCHANT_CODE")?.trim();
    const apiKey = Deno.env.get("DUITKU_API_KEY");
    const environment = (Deno.env.get("DUITKU_ENV") || "sandbox").trim().toLowerCase();
    const callbackUrl = Deno.env.get("DUITKU_CALLBACK_URL")?.trim();
    const returnUrl = (Deno.env.get("DUITKU_RETURN_URL") || "https://asricollection.online/cart").trim();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")?.replace(/\/$/, "");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!merchantCode || !apiKey || !callbackUrl || !supabaseUrl || !serviceKey) {
      console.error("Invoice configuration incomplete; verify required Supabase secrets without logging values.");
      return jsonResponse({
        statusCode: "02",
        statusMessage: "Konfigurasi invoice belum lengkap. Periksa secret Duitku, callback URL, dan konfigurasi Supabase.",
      }, 500);
    }

    if (!["sandbox", "prod", "production"].includes(environment)) {
      return jsonResponse({ statusCode: "02", statusMessage: "DUITKU_ENV harus sandbox atau production." }, 500);
    }

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return jsonResponse({ statusCode: "02", statusMessage: "Body harus berupa JSON valid." }, 400);
    }
    if (!isRecord(rawBody)) {
      return jsonResponse({ statusCode: "02", statusMessage: "Body request tidak valid." }, 400);
    }

    const body = rawBody as unknown as CreateInvoiceRequest;
    const merchantOrderId = typeof body.merchantOrderId === "string" ? body.merchantOrderId.trim() : "";
    const requestedAmount = Number(body.paymentAmount);

    if (!merchantOrderId || merchantOrderId.length > 50) {
      return jsonResponse({ statusCode: "02", statusMessage: "merchantOrderId wajib berupa string 1–50 karakter." }, 400);
    }
    if (!Number.isSafeInteger(requestedAmount) || requestedAmount <= 0) {
      return jsonResponse({ statusCode: "02", statusMessage: "paymentAmount harus berupa integer positif dalam IDR." }, 400);
    }
    if (body.expiryPeriod !== undefined &&
      (!Number.isInteger(Number(body.expiryPeriod)) || Number(body.expiryPeriod) <= 0)) {
      return jsonResponse({ statusCode: "02", statusMessage: "expiryPeriod harus berupa integer positif dalam menit." }, 400);
    }

    // The database order is canonical. Never let client-supplied totals or customer fields
    // override the saved order used to create the payment request.
    const orderQuery = new URLSearchParams({
      select: "id,total_amount,status,customer_email,customer_name,customer_phone,product_details,reference,payment_url,payment_method",
      merchant_order_id: `eq.${merchantOrderId}`,
      limit: "2",
    });
    const orderResponse = await fetch(`${supabaseUrl}/rest/v1/orders?${orderQuery.toString()}`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    if (!orderResponse.ok) {
      console.error("Could not read order before invoice creation; HTTP", orderResponse.status);
      return jsonResponse({ statusCode: "02", statusMessage: "Gagal memverifikasi pesanan. Silakan coba kembali." }, 502);
    }
    const orders = await orderResponse.json() as OrderRow[];
    if (!Array.isArray(orders) || orders.length !== 1) {
      return jsonResponse({ statusCode: "02", statusMessage: "Pesanan tidak ditemukan atau merchantOrderId tidak unik." }, 404);
    }

    const order = orders[0];
    const savedAmount = Number(order.total_amount);
    if (!Number.isSafeInteger(savedAmount) || savedAmount <= 0 || savedAmount !== requestedAmount) {
      return jsonResponse({ statusCode: "02", statusMessage: "paymentAmount tidak sesuai dengan total pesanan tersimpan." }, 409);
    }
    if (order.status !== "PENDING") {
      return jsonResponse({ statusCode: "02", statusMessage: "Pesanan tidak berada dalam status PENDING." }, 409);
    }
    if (order.reference && order.payment_url) {
      return jsonResponse({
        statusCode: "00",
        statusMessage: "Invoice untuk pesanan ini sudah tersedia.",
        merchantCode,
        reference: order.reference,
        paymentUrl: order.payment_url,
        reused: true,
      });
    }
    if (order.reference || order.payment_url) {
      return jsonResponse({ statusCode: "02", statusMessage: "Data invoice pesanan tidak lengkap; perlu rekonsiliasi sebelum membuat ulang." }, 409);
    }

    const email = order.customer_email?.trim();
    const productDetails = (order.product_details || body.productDetails || `Pembayaran pesanan ${merchantOrderId}`).trim();
    if (!email || email.length > 255 || !email.includes("@")) {
      return jsonResponse({ statusCode: "02", statusMessage: "Email pada data pesanan tidak valid." }, 409);
    }
    if (!productDetails || productDetails.length > 255) {
      return jsonResponse({ statusCode: "02", statusMessage: "productDetails harus 1–255 karakter." }, 400);
    }

    let itemDetails: ItemDetail[] | undefined;
    if (body.itemDetails !== undefined) {
      if (!Array.isArray(body.itemDetails) || body.itemDetails.length === 0) {
        return jsonResponse({ statusCode: "02", statusMessage: "itemDetails harus berupa array item yang valid." }, 400);
      }
      const validItems = body.itemDetails.every((item) =>
        isRecord(item) &&
        typeof item.name === "string" && item.name.trim().length > 0 && item.name.length <= 255 &&
        Number.isSafeInteger(Number(item.price)) && Number(item.price) >= 0 &&
        Number.isSafeInteger(Number(item.quantity)) && Number(item.quantity) > 0
      );
      if (!validItems) {
        return jsonResponse({ statusCode: "02", statusMessage: "Satu atau lebih itemDetails tidak valid." }, 400);
      }
      itemDetails = body.itemDetails;
      const itemTotal = itemDetails.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
      if (!Number.isSafeInteger(itemTotal) || itemTotal !== savedAmount) {
        return jsonResponse({ statusCode: "02", statusMessage: "Jumlah itemDetails harus sama dengan paymentAmount sesuai kontrak Duitku." }, 400);
      }
    }

    const timestamp = Date.now().toString(); // UNIX timestamp in milliseconds
    const signature = await generateHmacSha256Hex(`${merchantCode}${timestamp}`, apiKey);
    const endpoint = environment === "sandbox"
      ? "https://api-sandbox.duitku.com/api/merchant/createInvoice"
      : "https://api-prod.duitku.com/api/merchant/createInvoice";

    const payload: Record<string, unknown> = {
      paymentAmount: savedAmount,
      merchantOrderId,
      productDetails,
      email,
      callbackUrl,
      returnUrl,
      customerVaName: (order.customer_name || email.split("@")[0]).slice(0, 20),
      phoneNumber: order.customer_phone || "",
      additionalParam: typeof body.additionalParam === "string" ? body.additionalParam : "",
      merchantUserInfo: typeof body.merchantUserInfo === "string" ? body.merchantUserInfo : "",
      expiryPeriod: body.expiryPeriod === undefined ? 1440 : Number(body.expiryPeriod),
    };
    if (typeof body.paymentMethod === "string" && body.paymentMethod.trim()) {
      payload.paymentMethod = body.paymentMethod.trim();
    }
    if (itemDetails) payload.itemDetails = itemDetails;
    if (isRecord(body.customerDetail)) payload.customerDetail = body.customerDetail;

    let providerResponse: Response;
    try {
      providerResponse = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-duitku-merchantcode": merchantCode,
          "x-duitku-timestamp": timestamp,
          "x-duitku-signature": signature,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(20_000),
      });
    } catch (error) {
      console.error("Duitku Create Invoice network request failed:", error instanceof Error ? error.name : "unknown");
      return jsonResponse({ statusCode: "02", statusMessage: "Tidak dapat menghubungi Duitku. Status invoice belum dapat dipastikan; periksa status sebelum mencoba lagi." }, 502);
    }

    const rawProviderBody = await providerResponse.text();
    let providerData: Record<string, unknown> | null = null;
    try {
      const parsed: unknown = JSON.parse(rawProviderBody);
      if (isRecord(parsed)) providerData = parsed;
    } catch {
      providerData = null;
    }

    if (!providerResponse.ok || !providerData || providerData.statusCode !== "00") {
      // Do not expose raw gateway bodies; they may contain provider diagnostics.
      console.warn("Duitku Create Invoice rejected request; HTTP", providerResponse.status,
        "statusCode", providerData?.statusCode ?? "non-json");
      const status = providerResponse.status === 401 ? 502 : 502;
      return jsonResponse({
        statusCode: typeof providerData?.statusCode === "string" ? providerData.statusCode : "02",
        statusMessage: providerResponse.status === 401
          ? "Duitku menolak otorisasi. Periksa pasangan merchant code/API key dan environment pada Supabase Secrets."
          : "Duitku gagal membuat invoice. Periksa konfigurasi dan respons provider melalui log yang aman.",
      }, status);
    }

    const reference = typeof providerData.reference === "string" ? providerData.reference : "";
    const paymentUrl = typeof providerData.paymentUrl === "string" ? providerData.paymentUrl : "";
    if (!reference || !paymentUrl || !/^https:\/\//i.test(paymentUrl)) {
      console.error("Duitku returned statusCode 00 without a usable reference/paymentUrl.");
      return jsonResponse({ statusCode: "02", statusMessage: "Respons Duitku tidak lengkap; invoice perlu direkonsiliasi." }, 502);
    }

    // Persist the invoice against the existing order using only columns present in the active schema.
    const updateQuery = new URLSearchParams({ id: `eq.${order.id}`, select: "id" });
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/orders?${updateQuery.toString()}`, {
      method: "PATCH",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        reference,
        payment_url: paymentUrl,
        payment_method: typeof body.paymentMethod === "string" ? body.paymentMethod : null,
        result_code: String(providerData.statusCode),
        va_number: typeof providerData.vaNumber === "string" ? providerData.vaNumber : null,
        qr_string: typeof providerData.qrString === "string" ? providerData.qrString : null,
        additional_param: typeof body.additionalParam === "string" ? body.additionalParam : null,
        updated_at: new Date().toISOString(),
      }),
    });

    if (!updateResponse.ok) {
      console.error("Duitku created an invoice but local order persistence failed; HTTP", updateResponse.status,
        "merchantOrderId", merchantOrderId);
      return jsonResponse({
        statusCode: "02",
        statusMessage: "Duitku telah merespons pembuatan invoice, tetapi penyimpanan lokal gagal. Jangan membuat invoice baru; lakukan rekonsiliasi pesanan.",
        reference,
      }, 502);
    }
    const updatedRows = await updateResponse.json() as unknown[];
    if (!Array.isArray(updatedRows) || updatedRows.length !== 1) {
      console.error("Invoice response could not be confirmed persisted for merchantOrderId", merchantOrderId);
      return jsonResponse({
        statusCode: "02",
        statusMessage: "Status penyimpanan invoice belum dapat dikonfirmasi. Perlu rekonsiliasi sebelum retry.",
        reference,
      }, 502);
    }

    return jsonResponse({
      merchantCode: providerData.merchantCode ?? merchantCode,
      reference,
      paymentUrl,
      statusCode: "00",
      statusMessage: typeof providerData.statusMessage === "string" ? providerData.statusMessage : "SUCCESS",
    }, 200);
  } catch (error) {
    console.error("Unexpected error in duitku-create-invoice:", error instanceof Error ? error.name : "unknown");
    return jsonResponse({ statusCode: "02", statusMessage: "Terjadi kesalahan internal saat membuat invoice." }, 500);
  }
});
