import { createClient } from "npm:@supabase/supabase-js@2";

// REVIEW DRAFT ONLY. Read-only guest status endpoint; gateway JWT verification should be false only after token checks are reviewed.
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" } });
const env = (name: string) => { const v = Deno.env.get(name); if (!v) throw new Error(`Missing required environment variable: ${name}`); return v; };
const sha256Hex = async (value: string) => { const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)); return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join(""); };
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" } });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.order_id !== "string" || typeof body.checkout_token !== "string" || body.checkout_token.length < 32 || body.checkout_token.length > 512) return json({ error: "invalid_request" }, 400);
    const client = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: order, error } = await client.from("orders").select("id,status,checkout_token_hash,checkout_token_expires_at,created_at").eq("id", body.order_id).maybeSingle();
    if (error) return json({ error: "internal_error" }, 500);
    if (!order) return json({ error: "order_not_found" }, 404);
    if (!order.checkout_token_hash || await sha256Hex(body.checkout_token) !== order.checkout_token_hash || !order.checkout_token_expires_at || Date.parse(order.checkout_token_expires_at) <= Date.now()) return json({ error: "invalid_or_expired_checkout_token" }, 401);
    const { data: payment, error: paymentError } = await client.from("payment_transactions").select("status,merchant_order_id,duitku_reference,amount,currency,expires_at,paid_at").eq("order_id", order.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (paymentError) return json({ error: "internal_error" }, 500);
    return json({ ok: true, order_status: order.status, payment: payment ? { status: payment.status, merchant_order_id: payment.merchant_order_id, reference: payment.duitku_reference, amount: payment.amount, currency: payment.currency, expires_at: payment.expires_at, paid_at: payment.paid_at } : null });
  } catch (error) {
    console.error("payment_status_error", error instanceof Error ? error.message : "unknown");
    return json({ error: "internal_error" }, 500);
  }
});
