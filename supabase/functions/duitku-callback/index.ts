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
  // Hanya menerima metode POST
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const DUITKU_MERCHANT_CODE = Deno.env.get("DUITKU_MERCHANT_CODE") || "";
    const DUITKU_API_KEY = Deno.env.get("DUITKU_API_KEY") || "";
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!DUITKU_MERCHANT_CODE || !DUITKU_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Duitku callback unavailable: required server configuration is missing.");
      return new Response("Callback temporarily unavailable", { status: 503 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Duitku dapat mengirimkan payload berupa x-www-form-urlencoded atau json
    let payload: Record<string, any> = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      payload = await req.json();
    } else {
      const text = await req.text();
      const params = new URLSearchParams(text);
      for (const [key, value] of params.entries()) {
        payload[key] = value;
      }
    }

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

    // 1. Validasi Kehadiran Parameter Utama
    if (!merchantCode || !amount || !merchantOrderId || !signature || !resultCode) {
      return new Response("Bad Request: Parameter callback tidak lengkap", { status: 400 });
    }

    // 2. Validasi Merchant Code
    if (merchantCode !== DUITKU_MERCHANT_CODE) {
      return new Response("Unauthorized: Merchant Code tidak cocok", { status: 401 });
    }

    // Official POP callback signature: HMAC_SHA256(merchantCode + amount + merchantOrderId, API key).
    const hmacString = `${merchantCode}${amount}${merchantOrderId}`;
    const expectedHmac = await hmacSha256Hex(DUITKU_API_KEY, hmacString);
    const signatureMatches = signature.toLowerCase() === expectedHmac.toLowerCase();

    // Catat ke tabel callback_events untuk audit trail
    await supabase.from("callback_events").insert({
      merchant_order_id: merchantOrderId,
      reference,
      amount: parseFloat(amount),
      result_code: resultCode,
      is_valid_signature: signatureMatches,
      verification_method: "HMAC-SHA256",
      error_message: signatureMatches ? null : "Invalid callback signature",
    });

    if (!signatureMatches) {
      return new Response("Unauthorized: Signature callback tidak valid", { status: 401 });
    }

    // 4. Eksekusi Stored Procedure Atomik (Row Lock FOR UPDATE & Idempotency)
    const { data: spResult, error: spError } = await supabase.rpc("process_duitku_callback_atomic", {
      p_merchant_order_id: merchantOrderId,
      p_amount: parseFloat(amount),
      p_result_code: resultCode,
      p_reference: reference || null,
      p_payment_method: paymentMethod || paymentCode || "Duitku POP",
      p_raw_payload: {
        merchantCode,
        amount: amountText,
        merchantOrderId,
        resultCode,
        reference: reference || null,
        paymentCode: paymentCode || null,
        paymentMethod: paymentMethod || null,
      },
    });

    if (spError) {
      // Never bypass the atomic payment/inventory transaction. Returning 5xx allows provider retry.
      console.error("Duitku callback atomic processing failed; provider retry is required.");
      return new Response("Callback processing failed; retry required", { status: 500 });
    }

    if (!spResult?.success) {
      return new Response(spResult?.message || "Failed processing callback", { status: spResult?.status_code || 400 });
    }

    // Kembalikan teks respons resmi Duitku: 'SUCCESS' (HTTP 200)
    return new Response("SUCCESS", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (err: any) {
    return new Response(`Internal Server Error: ${err.message}`, { status: 500 });
  }
});
