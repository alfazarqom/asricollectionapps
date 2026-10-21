// Supabase Edge Function: duitku-callback
// Verifies Duitku POP callbacks and delegates state changes to the atomic database RPC.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const headers = { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" };
const reply = (body: string, status: number) => new Response(body, { status, headers });

async function hmacSha256Hex(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw", encoder.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i++) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0;
}

async function readPayload(req: Request): Promise<Record<string, unknown>> {
  const type = req.headers.get("content-type")?.toLowerCase() ?? "";
  if (type.includes("application/json")) {
    const value = await req.json();
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid payload");
    return value as Record<string, unknown>;
  }
  return Object.fromEntries(new URLSearchParams(await req.text()).entries());
}

serve(async (req: Request) => {
  if (req.method !== "POST") return reply("Method Not Allowed", 405);

  const expectedMerchant = Deno.env.get("DUITKU_MERCHANT_CODE");
  const apiKey = Deno.env.get("DUITKU_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!expectedMerchant || !apiKey || !supabaseUrl || !serviceRoleKey) {
    console.error("duitku-callback: required server configuration is missing");
    return reply("Service Unavailable", 503);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await readPayload(req);
  } catch {
    return reply("Bad Request", 400);
  }

  const merchantCode = String(payload.merchantCode ?? "");
  const amountText = String(payload.amount ?? "");
  const merchantOrderId = String(payload.merchantOrderId ?? "");
  const signature = String(payload.signature ?? "").toLowerCase();
  const resultCode = String(payload.resultCode ?? "");
  const reference = String(payload.reference ?? "");
  const paymentMethod = String(payload.paymentMethod ?? payload.paymentCode ?? "Duitku POP");
  const amount = Number(amountText);

  if (!merchantCode || !merchantOrderId || !signature ||
      !/^[0-9]+(?:\.[0-9]+)?$/.test(amountText) ||
      !Number.isFinite(amount) || amount <= 0 ||
      !["00", "01"].includes(resultCode)) {
    return reply("Bad Request", 400);
  }
  if (merchantCode !== expectedMerchant || !/^[a-f0-9]{64}$/.test(signature)) {
    return reply("Unauthorized", 401);
  }

  // Current Duitku POP documentation specifies HMAC-SHA256 for callback signatures.
  const expectedSignature = await hmacSha256Hex(apiKey, `${merchantCode}${amountText}${merchantOrderId}`);
  const isValidSignature = constantTimeEqual(signature, expectedSignature);
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Best-effort audit trail. An invalid signature is never allowed to mutate payment state.
  const { error: auditError } = await supabase.from("callback_events").insert({
    merchant_order_id: merchantOrderId,
    reference: reference || null,
    amount,
    result_code: resultCode,
    signature,
    is_valid_signature: isValidSignature,
    verification_method: "HMAC-SHA256",
    raw_payload: payload,
    error_message: isValidSignature ? null : "Invalid callback signature",
  });
  if (auditError) console.error("duitku-callback: callback audit insert failed");

  if (!isValidSignature) return reply("Unauthorized", 401);

  // Fail closed if the atomic/idempotent RPC fails; never perform direct fallback updates.
  const { data: result, error } = await supabase.rpc("process_duitku_callback_atomic", {
    p_merchant_order_id: merchantOrderId,
    p_amount: amount,
    p_result_code: resultCode,
    p_reference: reference || null,
    p_payment_method: paymentMethod,
    p_raw_payload: payload,
  });
  if (error) {
    console.error("duitku-callback: atomic callback RPC failed");
    return reply("Temporary processing failure", 503);
  }
  if (!result?.success) {
    const status = Number(result?.status_code);
    if (status === 404) return reply("Order not found", 404);
    if (status === 400 || status === 409) return reply("Callback rejected", status);
    return reply("Callback processing failed", 503);
  }
  return reply("SUCCESS", 200);
});
