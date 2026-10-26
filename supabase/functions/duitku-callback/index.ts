// Supabase Edge Function: duitku-callback
// Duitku POP Official Documentation: https://docs.duitku.com/pop/id/?shell#integrasi-backend-atau-server

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
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
  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed. Duitku callback requires HTTP POST.", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    // 1. Retrieve Secret Key from Supabase Secrets
    const apiKey = Deno.env.get("DUITKU_API_KEY");
    const configuredMerchantCode = Deno.env.get("DUITKU_MERCHANT_CODE");

    if (!apiKey || !configuredMerchantCode) {
      console.error("Duitku callback configuration incomplete; verify required secrets without logging values.");
      return new Response("Bad Server Configuration", { status: 500, headers: corsHeaders });
    }

    // 2. Parse Callback Request Payload (supports both application/x-www-form-urlencoded and application/json)
    const contentType = req.headers.get("content-type") || "";
    let params: Record<string, string> = {};

    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      for (const [key, value] of formData.entries()) {
        params[key] = String(value);
      }
    } else {
      const jsonBody = await req.json().catch(() => ({}));
      for (const [key, value] of Object.entries(jsonBody)) {
        params[key] = String(value);
      }
    }

    const merchantCode = params.merchantCode || params.merchantcode;
    const amount = params.amount || params.paymentAmount;
    const merchantOrderId = params.merchantOrderId || params.merchantorderid;
    const signature = params.signature;
    const resultCode = params.resultCode || params.resultcode;
    const reference = params.reference;
    const productDetail = params.productDetail || params.productDetails || "";
    const paymentCode = params.paymentCode || params.paymentMethod || "";
    const additionalParam = params.additionalParam || "";

    // 3. Validate presence of required callback parameters
    if (!merchantCode || !amount || !merchantOrderId || !signature) {
      console.warn("Duitku callback missing mandatory parameters.");
      return new Response("Bad Parameter", {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    // Require the callback merchant code to match the configured merchant.
    if (merchantCode !== configuredMerchantCode) {
      console.warn("Merchant code mismatch:", { received: merchantCode, configured: configuredMerchantCode });
      return new Response("Bad Merchant Code", {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    // Official Duitku POP callback signature:
    // HMAC-SHA256(merchantCode + amount + merchantOrderId, API key).
    const expectedSignature = (await generateHmacSha256(
      `${merchantCode}${amount}${merchantOrderId}`, apiKey
    )).toLowerCase();
    const incomingSignature = signature.trim().toLowerCase();
    const isHexSignature = /^[a-f0-9]{64}$/.test(incomingSignature);
    if (!isHexSignature || incomingSignature.length !== expectedSignature.length ||
      !crypto.subtle || !constantTimeEqual(incomingSignature, expectedSignature)) {
      console.warn("Duitku callback signature verification failed.");
      return new Response("Bad Signature", {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    // 5. Signature is VALID! Determine payment status
    // resultCode == "00" indicates Payment SUCCESS
    // resultCode == "01" indicates Payment FAILED / PENDING
    if (resultCode !== "00" && resultCode !== "01") {
      console.warn("Duitku callback received an unrecognized result code; no state change applied.");
      return new Response("Unrecognized Result Code", {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }
    const isPaymentSuccess = resultCode === "00";
    const paymentStatus = isPaymentSuccess ? "SUCCESS" : "FAILED";

    console.info(`Duitku Callback Authenticated: Order ${merchantOrderId} is ${paymentStatus} (ResultCode: ${resultCode})`);

    // The callback must match an existing order and its stored amount before mutation.
    const supabaseUrl = Deno.env.get("SUPABASE_URL")?.replace(/\/$/, "");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Duitku callback cannot process because Supabase configuration is incomplete.");
      return new Response("Server Configuration Error", { status: 500, headers: corsHeaders });
    }

    const orderQuery = new URLSearchParams({
      select: "id,merchant_order_id,amount,total_amount,status",
      merchant_order_id: `eq.${merchantOrderId}`,
      limit: "2",
    });
    const lookup = await fetch(`${supabaseUrl}/rest/v1/orders?${orderQuery.toString()}`, {
      headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${supabaseServiceKey}` },
    });
    if (!lookup.ok) {
      console.error("Duitku callback order lookup failed; HTTP", lookup.status);
      return new Response("Temporary Processing Error", { status: 500, headers: corsHeaders });
    }
    const orders = await lookup.json();
    if (!Array.isArray(orders) || orders.length !== 1) {
      console.warn("Duitku callback did not match exactly one order.");
      return new Response("Order Not Found", { status: 404, headers: corsHeaders });
    }
    const order = orders[0] as Record<string, unknown>;
    const storedAmount = Number(order.total_amount ?? order.amount);
    if (!Number.isSafeInteger(Number(amount)) || !Number.isSafeInteger(storedAmount) ||
      Number(amount) !== storedAmount) {
      console.warn("Duitku callback amount mismatch; no state change applied.");
      return new Response("Amount Mismatch", { status: 400, headers: corsHeaders });
    }
    if (order.status === "SUCCESS" && paymentStatus !== "SUCCESS") {
      console.warn("Duitku callback attempted to move a successful order backwards.");
      return new Response("State Conflict", { status: 409, headers: corsHeaders });
    }

    const updatePayload: Record<string, unknown> = {
      status: paymentStatus,
      result_code: resultCode,
      reference: reference || null,
      payment_method: paymentCode || null,
      updated_at: new Date().toISOString(),
    };
    if (additionalParam) updatePayload.additional_param = additionalParam;

    const updateQuery = new URLSearchParams({
      merchant_order_id: `eq.${merchantOrderId}`,
      select: "id",
    });
    const dbRes = await fetch(`${supabaseUrl}/rest/v1/orders?${updateQuery.toString()}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(updatePayload),
    });
    if (!dbRes.ok) {
      console.error("Duitku callback database update failed; HTTP", dbRes.status);
      return new Response("Temporary Processing Error", { status: 500, headers: corsHeaders });
    }
    const updated = await dbRes.json();
    if (!Array.isArray(updated) || updated.length !== 1) {
      console.error("Duitku callback update could not be confirmed.");
      return new Response("Temporary Processing Error", { status: 500, headers: corsHeaders });
    }

    // Acknowledge only after signature, order, amount and database update are verified.
    return new Response("SUCCESS", {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Exception during Duitku callback processing:", error);
    return new Response(`Error: ${message}`, {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  }
});
