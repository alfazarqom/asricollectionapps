// @ts-nocheck
// Supabase Edge Function: duitku-pop-callback (alias: duitku-callback)
// Public HTTPS webhook endpoint for Duitku payment notifications (Deno / Supabase runtime)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

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
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: { "Allow": "POST" } });
  }

  const DUITKU_MERCHANT_CODE = Deno.env.get("DUITKU_MERCHANT_CODE") || "";
  const DUITKU_API_KEY = Deno.env.get("DUITKU_API_KEY") || "";
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  // Fail closed: no empty-secret bypass and no deprecated MD5 callback signature.
  if (!DUITKU_MERCHANT_CODE || !DUITKU_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Duitku callback configuration is incomplete.");
    return new Response("Service Unavailable", { status: 503 });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const contentType = req.headers.get("content-type") || "";
    let payload: Record<string, any> = {};

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const params = new URLSearchParams(await req.text());
      for (const [key, value] of params.entries()) payload[key] = value;
    } else if (contentType.includes("application/json")) {
      payload = await req.json();
    } else {
      return new Response("Unsupported Media Type", { status: 415 });
    }

    const merchantCode = String(payload.merchantCode || "");
    const amountRaw = String(payload.amount || "");
    const merchantOrderId = String(payload.merchantOrderId || "");
    const signature = String(payload.signature || "");
    const resultCode = String(payload.resultCode || "");
    const reference = payload.reference ? String(payload.reference) : null;
    const paymentMethod = payload.paymentMethod || payload.paymentCode || "Duitku POP";
    const amount = Number(amountRaw);

    if (!merchantCode || !amountRaw || !merchantOrderId || !signature || !resultCode ||
        !Number.isFinite(amount) || amount <= 0 || !/^\d{2}$/.test(resultCode)) {
      return new Response("Bad Request: callback parameters invalid", { status: 400 });
    }

    if (merchantCode !== DUITKU_MERCHANT_CODE) {
      return new Response("Unauthorized: merchant code mismatch", { status: 401 });
    }

    // Duitku POP callback signature: HMAC-SHA256(merchantCode + amount + merchantOrderId, API key).
    const expected = await hmacSha256Hex(DUITKU_API_KEY, `${merchantCode}${amountRaw}${merchantOrderId}`);
    const supplied = signature.toLowerCase();
    const expectedLower = expected.toLowerCase();
    const encoder = new TextEncoder();
    const suppliedBytes = encoder.encode(supplied);
    const expectedBytes = encoder.encode(expectedLower);
    let signatureMatches = suppliedBytes.length === expectedBytes.length;
    if (signatureMatches) {
      let diff = 0;
      for (let i = 0; i < suppliedBytes.length; i++) diff |= suppliedBytes[i] ^ expectedBytes[i];
      signatureMatches = diff === 0;
    }

    const { error: auditError } = await supabase.from("callback_events").insert({
      merchant_order_id: merchantOrderId,
      reference,
      amount,
      result_code: resultCode,
      signature,
      is_valid_signature: signatureMatches,
      verification_method: "HMAC-SHA256",
      raw_payload: payload,
      error_message: signatureMatches ? null : "Invalid callback signature",
    });

    if (auditError) {
      console.error("Failed to record callback audit event:", auditError.message);
      return new Response("Temporary callback processing failure", { status: 500 });
    }
    if (!signatureMatches) {
      return new Response("Unauthorized: invalid callback signature", { status: 401 });
    }

    // The RPC must enforce order existence, amount/reference checks, row locks and idempotency.
    // Do not fall back to non-atomic direct updates if the RPC is missing or fails.
    const { data: spResult, error: spError } = await supabase.rpc("process_duitku_callback_atomic", {
      p_merchant_order_id: merchantOrderId,
      p_amount: amount,
      p_result_code: resultCode,
      p_reference: reference,
      p_payment_method: paymentMethod,
      p_raw_payload: payload,
    });

    if (spError) {
      console.error("Atomic Duitku callback RPC failed:", spError.message);
      return new Response("Temporary callback processing failure", { status: 500 });
    }
    if (!spResult?.success) {
      const statusCode = Number(spResult?.status_code);
      const safeStatus = Number.isInteger(statusCode) && statusCode >= 400 && statusCode <= 499 ? statusCode : 409;
      return new Response("Callback rejected: " + (spResult?.message || "transaction validation failed"), { status: safeStatus });
    }

    return new Response("SUCCESS", { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  } catch (err: any) {
    console.error("Duitku callback processing error:", err?.message || "unknown error");
    return new Response("Temporary callback processing failure", { status: 500 });
  }
});
