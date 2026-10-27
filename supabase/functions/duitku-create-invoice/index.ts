// Supabase Edge Function: duitku-create-invoice
// Duitku POP Official Documentation: https://docs.duitku.com/pop/id/?shell#integrasi-backend-atau-server
// Source of truth: Duitku POP API Specifications (createInvoice & HMAC-SHA256 signature authorization)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-duitku-timestamp, x-duitku-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Hardcoded fallback credentials as requested
const HARDCODED_SUPABASE_URL = "https://mvwflakurihhakdrlteg.supabase.co";
const HARDCODED_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12d2ZsYWt1cmloaGFrZHJsdGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMjIwMDksImV4cCI6MjEwNDc5ODAwOX0.E09Vufp77NOkpGjJZMH6sbWYInKu_sMzV7eqHX6xQ0A";

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
  paymentMethod?: string;
  expiryPeriod?: number; // In minutes, default 1440 (24h)
  callbackUrl?: string;
  returnUrl?: string;
  itemDetails?: ItemDetail[];
  customerDetail?: CustomerDetail;
  // Optional overrides from client if secrets are not set yet
  merchantCode?: string;
  apiKey?: string;
  environment?: string; // 'sandbox' or 'production'
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
        statusMessage: "Method Not Allowed. Hanya menerima permintaan HTTP POST.",
      }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // 1. Parse request body
    const body: CreateInvoiceRequest = await req.json();

    const {
      paymentAmount,
      merchantOrderId,
      productDetails,
      email,
      phoneNumber = "",
      customerVaName,
      additionalParam = "",
      merchantUserInfo = "",
      paymentMethod,
      expiryPeriod = 1440,
      itemDetails,
      customerDetail,
    } = body;

    // 2. Read credentials: prioritize environment variables (Supabase Secrets), fallback to payload
    const merchantCode = (Deno.env.get("DUITKU_MERCHANT_CODE") || body.merchantCode || "").trim();
    const apiKey = (Deno.env.get("DUITKU_API_KEY") || body.apiKey || "").trim();
    const duitkuEnv = (Deno.env.get("DUITKU_ENV") || body.environment || "sandbox").toLowerCase();

    // Check if credentials are missing or still using placeholder values
    const isPlaceholder =
      !merchantCode ||
      !apiKey ||
      merchantCode === "D12345" ||
      apiKey === "your_duitku_merchant_api_key_here";

    if (isPlaceholder) {
      return new Response(
        JSON.stringify({
          statusCode: "01",
          statusMessage:
            "Kredensial Duitku belum dikonfigurasi. DUITKU_MERCHANT_CODE dan DUITKU_API_KEY dari dashboard Duitku Sandbox belum diatur di Supabase Secrets.",
          instruction:
            "Jalankan: npx supabase secrets set DUITKU_MERCHANT_CODE='KODE_MERCHANT_ANDA' DUITKU_API_KEY='API_KEY_ANDA' DUITKU_ENV='sandbox'",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. URLs Configuration
    const envCallbackUrl =
      Deno.env.get("DUITKU_CALLBACK_URL") ||
      `${HARDCODED_SUPABASE_URL}/functions/v1/duitku-callback`;
    const callbackUrl = body.callbackUrl || envCallbackUrl;

    const envReturnUrl =
      Deno.env.get("DUITKU_RETURN_URL") ||
      "https://asricollection.online/#/orders";
    const returnUrl = body.returnUrl || envReturnUrl;

    // 4. Validate required parameters according to Duitku POP documentation
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

    const resolvedVaName =
      customerVaName ||
      (customerDetail?.firstName
        ? `${customerDetail.firstName} ${customerDetail.lastName || ""}`.trim()
        : email.split("@")[0]);

    // 5. Generate Timestamp & Signature for Duitku POP
    // Standard POP formula: HMAC_SHA256(merchantCode + timestamp + apiKey, apiKey)
    const timestamp = Date.now().toString();
    const stringToSign = `${merchantCode}${timestamp}${apiKey}`;
    const signature = await generateHmacSha256(stringToSign, apiKey);

    // 6. Determine Duitku Endpoint
    const endpoint =
      duitkuEnv === "production" || duitkuEnv === "prod"
        ? "https://api-prod.duitku.com/api/merchant/createInvoice"
        : "https://api-sandbox.duitku.com/api/merchant/createInvoice";

    // 7. Construct payload to Duitku
    const duitkuPayload: Record<string, unknown> = {
      paymentAmount: Math.round(Number(paymentAmount)),
      merchantOrderId,
      productDetails,
      email,
      phoneNumber: phoneNumber || "082156764434",
      additionalParam,
      merchantUserInfo,
      customerVaName: resolvedVaName.slice(0, 20),
      callbackUrl,
      returnUrl,
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

    // 8. Request to Duitku POP API
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

    // 9. Safely read and parse response (protects against raw plaintext "Unauthorized" on 401)
    const rawResponseText = await duitkuResponse.text();
    let responseData: any = null;

    try {
      responseData = JSON.parse(rawResponseText);
    } catch {
      // Duitku returned non-JSON (e.g., HTTP 401 "Unauthorized" or 500 HTML)
      console.error("Duitku returned non-JSON response:", {
        status: duitkuResponse.status,
        body: rawResponseText,
        merchantCode,
      });

      if (duitkuResponse.status === 401 || rawResponseText.includes("Unauthorized")) {
        return new Response(
          JSON.stringify({
            statusCode: "01",
            statusMessage:
              "Kredensial Duitku Ditolak oleh Server Duitku (401 Unauthorized). Pastikan Merchant Code dan API Key dari dashboard Duitku Sandbox sudah benar dan sesuai.",
            details:
              "Periksa kembali bahwa Merchant Code & API Key yang digunakan berasal dari https://sandbox.duitku.com dan environment disetel ke 'sandbox'.",
          }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          statusCode: "02",
          statusMessage: `Duitku Server Response (${duitkuResponse.status}): ${rawResponseText}`,
        }),
        { status: duitkuResponse.status || 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 10. Persist Order in Supabase Database (if success)
    if (responseData.statusCode === "00") {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") || HARDCODED_SUPABASE_URL;
      const supabaseKey =
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
        Deno.env.get("SUPABASE_ANON_KEY") ||
        HARDCODED_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
        try {
          const orderRecord = {
            merchant_order_id: merchantOrderId,
            reference: responseData.reference || null,
            amount: Math.round(Number(paymentAmount)),
            shipping_fee: 0,
            discount_amount: 0,
            total_amount: Math.round(Number(paymentAmount)),
            product_details: productDetails,
            customer_name: resolvedVaName,
            customer_email: email,
            customer_phone: phoneNumber || "082156764434",
            status: "PENDING",
            payment_url: responseData.paymentUrl || null,
            va_number: responseData.vaNumber || null,
            qr_string: responseData.qrString || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          await fetch(`${supabaseUrl}/rest/v1/orders`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              Prefer: "resolution=merge-duplicates",
            },
            body: JSON.stringify(orderRecord),
          });
        } catch (dbErr) {
          console.warn("Database order record log error:", dbErr);
        }
      }
    }

    // 11. Return response to client
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
