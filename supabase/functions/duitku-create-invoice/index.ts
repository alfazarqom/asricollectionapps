// Supabase Edge Function: duitku-create-invoice
// Duitku POP Official Documentation: https://docs.duitku.com/pop/id/?shell#integrasi-backend-atau-server

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-duitku-timestamp, x-duitku-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Generate HMAC-SHA256 hex string using standard Web Crypto API
async function generateHmacSha256(data: string, secretKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secretKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(data)
  );
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface ItemDetail {
  name: string;
  price: number;
  quantity: number;
}

interface CustomerAddress {
  firstName?: string;
  lastName?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  countryCode?: string;
}

interface CustomerDetail {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  billingAddress?: CustomerAddress;
  shippingAddress?: CustomerAddress;
}

interface CreateInvoiceRequest {
  paymentAmount: number;
  merchantOrderId: string;
  productDetails: string;
  email: string;
  phoneNumber?: string;
  customerVaName?: string;
  additionalParam?: string;
  merchantUserInfo?: string;
  paymentMethod?: string; // Optional direct payment channel (e.g. VC, BC, M2, etc.)
  expiryPeriod?: number; // In minutes, default 1440 (24h)
  callbackUrl?: string;
  returnUrl?: string;
  itemDetails?: ItemDetail[];
  customerDetail?: CustomerDetail;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        statusCode: "02",
        statusMessage: "Method Not Allowed. Only POST is accepted.",
      }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // 1. Read secrets strictly from Supabase environment (Supabase Secrets)
    const merchantCode = Deno.env.get("DUITKU_MERCHANT_CODE");
    const apiKey = Deno.env.get("DUITKU_API_KEY");
    const duitkuEnv = (Deno.env.get("DUITKU_ENV") || "sandbox").toLowerCase();
    const envCallbackUrl = Deno.env.get("DUITKU_CALLBACK_URL");
    const envReturnUrl = Deno.env.get("DUITKU_RETURN_URL");

    if (!merchantCode || !apiKey) {
      return new Response(
        JSON.stringify({
          statusCode: "02",
          statusMessage: "Konfigurasi server belum lengkap. Pastikan DUITKU_MERCHANT_CODE dan DUITKU_API_KEY diset di Supabase Secrets.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Parse request body
    const body: CreateInvoiceRequest = await req.json();

    const {
      paymentAmount,
      merchantOrderId,
      productDetails,
      email,
      phoneNumber,
      customerVaName,
      additionalParam = "",
      merchantUserInfo = "",
      paymentMethod,
      expiryPeriod = 1440,
      callbackUrl = envCallbackUrl,
      returnUrl = envReturnUrl,
      itemDetails,
      customerDetail,
    } = body;

    // Validate required parameters according to Duitku POP documentation
    if (!paymentAmount || paymentAmount <= 0) {
      return new Response(
        JSON.stringify({ statusCode: "02", statusMessage: "paymentAmount harus lebih besar dari 0" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!merchantOrderId) {
      return new Response(
        JSON.stringify({ statusCode: "02", statusMessage: "merchantOrderId wajib disertakan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!productDetails) {
      return new Response(
        JSON.stringify({ statusCode: "02", statusMessage: "productDetails wajib disertakan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!email) {
      return new Response(
        JSON.stringify({ statusCode: "02", statusMessage: "email pelanggan wajib disertakan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!callbackUrl) {
      return new Response(
        JSON.stringify({
          statusCode: "02",
          statusMessage: "callbackUrl wajib disertakan di payload atau di set melalui DUITKU_CALLBACK_URL di Supabase Secrets",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Generate Timestamp & Signature for Duitku POP
    // Standard POP formula: HMAC_SHA256(merchantCode + timestamp + apiKey, apiKey)
    const timestamp = Date.now().toString();
    const stringToSign = `${merchantCode}${timestamp}${apiKey}`;
    const signature = await generateHmacSha256(stringToSign, apiKey);

    // 4. Determine Duitku Endpoint
    // Sandbox: https://api-sandbox.duitku.com/api/merchant/createInvoice
    // Production: https://api-prod.duitku.com/api/merchant/createInvoice
    const endpoint =
      duitkuEnv === "production" || duitkuEnv === "prod"
        ? "https://api-prod.duitku.com/api/merchant/createInvoice"
        : "https://api-sandbox.duitku.com/api/merchant/createInvoice";

    // 5. Construct payload to Duitku
    const duitkuPayload: Record<string, unknown> = {
      paymentAmount: Math.round(Number(paymentAmount)),
      merchantOrderId,
      productDetails,
      email,
      phoneNumber: phoneNumber || "",
      additionalParam,
      merchantUserInfo,
      customerVaName: customerVaName || email.split("@")[0],
      callbackUrl,
      returnUrl: returnUrl || "",
      expiryPeriod: Number(expiryPeriod) || 1440,
    };

    if (paymentMethod) {
      duitkuPayload.paymentMethod = paymentMethod;
    }

    if (itemDetails && Array.isArray(itemDetails) && itemDetails.length > 0) {
      duitkuPayload.itemDetails = itemDetails;
    }

    if (customerDetail && typeof customerDetail === "object") {
      duitkuPayload.customerDetail = customerDetail;
    }

    // 6. Request to Duitku POP API
    const duitkuResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-duitku-merchantcode": merchantCode,
        "x-duitku-timestamp": timestamp,
        "x-duitku-signature": signature,
      },
      body: JSON.stringify(duitkuPayload),
    });

    const responseData = await duitkuResponse.json();

    // 7. Optional Database logging if Supabase credentials are provided
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (supabaseUrl && supabaseServiceKey && responseData.statusCode === "00") {
      try {
        await fetch(`${supabaseUrl}/rest/v1/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseServiceKey,
            Authorization: `Bearer ${supabaseServiceKey}`,
            Prefer: "resolution=merge-duplicates",
          },
          body: JSON.stringify({
            merchant_order_id: merchantOrderId,
            reference: responseData.reference || null,
            amount: Math.round(Number(paymentAmount)),
            product_details: productDetails,
            customer_email: email,
            customer_phone: phoneNumber || null,
            status: "PENDING",
            payment_url: responseData.paymentUrl || null,
            va_number: responseData.vaNumber || null,
            qr_string: responseData.qrString || null,
            created_at: new Date().toISOString(),
          }),
        });
      } catch (dbErr) {
        // Non-blocking error for database logging
        console.warn("Database order log skipped or failed:", dbErr);
      }
    }

    // 8. Return response to client
    return new Response(JSON.stringify(responseData), {
      status: duitkuResponse.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    console.error("Error creating Duitku invoice:", err);
    return new Response(
      JSON.stringify({
        statusCode: "02",
        statusMessage: `Gagal membuat invoice Duitku: ${message}`,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
