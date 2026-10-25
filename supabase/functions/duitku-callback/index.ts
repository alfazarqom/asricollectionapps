import { createClient } from "npm:@supabase/supabase-js@2";

// REVIEW DRAFT ONLY. This is the only function intended for unauthenticated provider callbacks.
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });
const env = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};
const hmacHex = async (value: string, secret: string) => {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
};
const sha256Hex = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
};
const constantTimeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  try {
    const type = req.headers.get("content-type")?.toLowerCase() ?? "";
    if (!type.includes("application/x-www-form-urlencoded")) return json({ error: "unsupported_content_type" }, 415);
    const form = new URLSearchParams(await req.text());
    const merchantCode = form.get("merchantCode") ?? "";
    const amountText = form.get("amount") ?? "";
    const merchantOrderId = form.get("merchantOrderId") ?? "";
    const resultCode = form.get("resultCode") ?? "";
    const reference = form.get("reference") ?? "";
    const receivedSignature = (form.get("signature") ?? "").toLowerCase();
    const amount = /^\d+$/.test(amountText) ? Number(amountText) : NaN;
    const requiredPresent = Boolean(merchantCode && amountText && merchantOrderId && resultCode && reference && receivedSignature);
    if (!requiredPresent || !Number.isSafeInteger(amount) || amount <= 0) return json({ error: "invalid_callback_fields" }, 400);

    const expectedMerchant = env("DUITKU_MERCHANT_CODE");
    const apiKey = env("DUITKU_API_KEY");
    const signatureValid = merchantCode === expectedMerchant && constantTimeEqual(await hmacHex(merchantCode + amountText + merchantOrderId, apiKey), receivedSignature);
    const fingerprint = await sha256Hex([merchantCode, amountText, merchantOrderId, resultCode, reference, receivedSignature].join("\n"));
    const client = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await client.rpc("apply_duitku_callback_v1", {
      p_merchant_code: merchantCode,
      p_merchant_order_id: merchantOrderId,
      p_amount: amount,
      p_reference: reference,
      p_result_code: resultCode,
      p_signature_valid: signatureValid,
      p_event_fingerprint: fingerprint,
      p_error_message: signatureValid ? null : "Signature or merchant code invalid",
    });
    if (error) {
      console.error("callback_rpc_failed", error.code);
      return json({ error: "callback_processing_unavailable" }, 500);
    }
    const outcome = data as { accepted?: boolean; duplicate?: boolean; needs_reconciliation?: boolean; reason?: string } | null;
    if (!signatureValid || outcome?.accepted === false) return json({ error: outcome?.reason ?? "callback_rejected" }, 400);
    if (outcome?.needs_reconciliation) return json({ error: "payment_requires_manual_reconciliation" }, 409);
    return json({ ok: true, duplicate: Boolean(outcome?.duplicate) }, 200);
  } catch (error) {
    console.error("callback_error", error instanceof Error ? error.message : "unknown");
    return json({ error: "callback_processing_error" }, 500);
  }
});
