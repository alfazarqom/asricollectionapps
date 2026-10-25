// Supabase Edge Function: duitku-callback
// Duitku POP Official Documentation: https://docs.duitku.com/pop/id/?shell#integrasi-backend-atau-server

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

function textResponse(body: string, status: number): Response {
  return new Response(body, {
    status,
    headers: { ...corsHeaders, "Content-Type": "text/plain" },
  });
}

// Generate HMAC-SHA256 hex string using standard Web Crypto API.
async function generateHmacSha256(data: string, secretKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secretKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return textResponse("Method Not Allowed. Duitku callback requires HTTP POST.", 405);
  }

  try {
    const apiKey = Deno.env.get("DUITKU_API_KEY");
    const configuredMerchantCode = Deno.env.get("DUITKU_MERCHANT_CODE");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!apiKey || !configuredMerchantCode || !supabaseUrl || !supabaseServiceKey) {
      console.error("Duitku callback configuration is incomplete");
      return textResponse("Bad Server Configuration", 500);
    }

    const contentType = req.headers.get("content-type") || "";
    let params: Record<string, string> = {};

    if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const formData = await req.formData();
      for (const [key, value] of formData.entries()) params[key] = String(value);
    } else if (contentType.includes("application/json")) {
      const jsonBody: unknown = await req.json();
      if (!jsonBody || typeof jsonBody !== "object" || Array.isArray(jsonBody)) {
        return textResponse("Bad Parameter", 400);
      }
      for (const [key, value] of Object.entries(jsonBody)) params[key] = String(value);
    } else {
      return textResponse("Unsupported Content Type", 415);
    }

    const merchantCode = params.merchantCode || params.merchantcode;
    const amount = params.amount || params.paymentAmount;
    const merchantOrderId = params.merchantOrderId || params.merchantorderid;
    const signature = params.signature;
    const resultCode = params.resultCode || params.resultcode;
    const reference = params.reference;
    const paymentCode = params.paymentCode || params.paymentMethod || "";
    const additionalParam = params.additionalParam || "";

    if (!merchantCode || !amount || !merchantOrderId || !signature || !resultCode) {
      console.warn("Duitku callback rejected: required parameters missing");
      return textResponse("Bad Parameter", 400);
    }

    if (merchantCode !== configuredMerchantCode) {
      console.warn("Duitku callback rejected: merchant code mismatch");
      return textResponse("Bad Merchant Code", 400);
    }

    // POP callback result codes: 00 = success, 01 = failed.
    if (resultCode !== "00" && resultCode !== "01") {
      console.warn("Duitku callback rejected: unsupported result code");
      return textResponse("Bad Result Code", 400);
    }

    if (!/^\d+$/.test(amount) || !Number.isSafeInteger(Number(amount)) || Number(amount) <= 0) {
      console.warn("Duitku callback rejected: invalid amount format");
      return textResponse("Bad Amount", 400);
    }

    // Official POP callback formula: HMAC_SHA256(merchantCode + amount + merchantOrderId, apiKey).
    const expectedSignature = await generateHmacSha256(
      `${merchantCode}${amount}${merchantOrderId}`,
      apiKey,
    );
    const incomingSignature = signature.trim().toLowerCase();

    // Constant-time comparison for equal-length hexadecimal signatures.
    const expectedBytes = new TextEncoder().encode(expectedSignature);
    const incomingBytes = new TextEncoder().encode(incomingSignature);
    let signatureDifference = expectedBytes.length ^ incomingBytes.length;
    const compareLength = Math.max(expectedBytes.length, incomingBytes.length);
    for (let i = 0; i < compareLength; i++) {
      signatureDifference |= (expectedBytes[i] ?? 0) ^ (incomingBytes[i] ?? 0);
    }
    if (!/^[0-9a-f]{64}$/.test(incomingSignature) || signatureDifference !== 0) {
      console.warn("Duitku callback rejected: signature verification failed");
      return textResponse("Bad Signature", 400);
    }

    const paymentStatus = resultCode === "00" ? "SUCCESS" : "FAILED";
    const baseUrl = supabaseUrl.replace(/\/$/, "");
    const authHeaders = {
      apikey: supabaseServiceKey,
      Authorization: `Bearer ${supabaseServiceKey}`,
    };

    // Read and validate the persisted invoice before changing any payment state.
    const orderUrl = `${baseUrl}/rest/v1/orders?select=merchant_order_id,amount,status,reference&merchant_order_id=eq.${encodeURIComponent(merchantOrderId)}`;
    const orderRes = await fetch(orderUrl, { headers: authHeaders });
    if (!orderRes.ok) {
      console.error("Duitku callback could not read local order; HTTP status:", orderRes.status);
      return textResponse("Order Lookup Failed", 500);
    }

    const orders: unknown = await orderRes.json();
    if (!Array.isArray(orders) || orders.length !== 1) {
      console.warn("Duitku callback rejected: order missing or ambiguous");
      return textResponse("Order Not Found", 409);
    }

    const order = orders[0] as {
      merchant_order_id?: unknown;
      amount?: unknown;
      status?: unknown;
      reference?: unknown;
    };
    const storedAmount = Number(order.amount);
    if (
      order.merchant_order_id !== merchantOrderId ||
      !Number.isSafeInteger(storedAmount) ||
      storedAmount !== Number(amount)
    ) {
      console.warn("Duitku callback rejected: local order or amount mismatch");
      return textResponse("Order Amount Mismatch", 409);
    }

    if (reference && order.reference && reference !== order.reference) {
      console.warn("Duitku callback rejected: provider reference mismatch");
      return textResponse("Reference Mismatch", 409);
    }

    const currentStatus = typeof order.status === "string" ? order.status.toUpperCase() : "";
    if (currentStatus === paymentStatus) {
      // A verified duplicate callback is safe to acknowledge.
      return textResponse("SUCCESS", 200);
    }
    if (currentStatus !== "PENDING") {
      console.warn("Duitku callback rejected: invalid payment status transition");
      return textResponse("Invalid Status Transition", 409);
    }

    const updatePayload: Record<string, unknown> = {
      status: paymentStatus,
      result_code: resultCode,
      reference: reference || order.reference || null,
      payment_method: paymentCode || null,
      updated_at: new Date().toISOString(),
    };
    if (additionalParam) updatePayload.additional_param = additionalParam;

    // Conditional update avoids overwriting a status changed by another callback.
    const updateUrl = `${baseUrl}/rest/v1/orders?merchant_order_id=eq.${encodeURIComponent(merchantOrderId)}&status=eq.${encodeURIComponent(String(order.status))}`;
    const updateRes = await fetch(updateUrl, {
      method: "PATCH",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(updatePayload),
    });

    if (!updateRes.ok) {
      console.error("Duitku callback database update failed; HTTP status:", updateRes.status);
      return textResponse("Order Update Failed", 500);
    }

    const updatedRows: unknown = await updateRes.json();
    if (!Array.isArray(updatedRows)) {
      console.error("Duitku callback database update returned an unexpected response");
      return textResponse("Order Update Failed", 500);
    }
    if (updatedRows.length === 0) {
      // A concurrent callback may have won the conditional update. Re-read to
      // acknowledge only if it persisted the same verified result.
      const verifyRes = await fetch(orderUrl, { headers: authHeaders });
      if (!verifyRes.ok) {
        console.error("Duitku callback could not verify concurrent update; HTTP status:", verifyRes.status);
        return textResponse("Order Verification Failed", 500);
      }
      const latestRows: unknown = await verifyRes.json();
      const latest = Array.isArray(latestRows) && latestRows.length === 1
        ? latestRows[0] as { status?: unknown }
        : null;
      if (latest?.status === paymentStatus) return textResponse("SUCCESS", 200);
      console.warn("Duitku callback rejected: concurrent status transition conflict");
      return textResponse("Status Transition Conflict", 409);
    }

    console.info(`Duitku callback processed: order ${merchantOrderId}, result ${resultCode}`);
    return textResponse("SUCCESS", 200);
  } catch (error: unknown) {
    // Avoid logging request bodies, signatures, or credentials.
    console.error("Exception during Duitku callback processing:", error instanceof Error ? error.name : "UnknownError");
    return textResponse("Callback Processing Failed", 500);
  }
});
