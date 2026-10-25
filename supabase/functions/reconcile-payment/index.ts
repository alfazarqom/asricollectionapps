import { createClient } from "npm:@supabase/supabase-js@2";

// REVIEW DRAFT ONLY. Keep gateway JWT verification enabled; invoke only from trusted server-side tooling.
// This endpoint is deliberately read-only until an official POP inquiry contract is confirmed.
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const env = (name: string) => { const v = Deno.env.get(name); if (!v) throw new Error(`Missing required environment variable: ${name}`); return v; };
Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.order_id !== "string") return json({ error: "invalid_request" }, 400);
    const client = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: order, error: oe } = await client.from("orders").select("id,order_number,status,total_amount,currency,paid_at").eq("id", body.order_id).maybeSingle();
    if (oe) return json({ error: "database_error" }, 500);
    if (!order) return json({ error: "order_not_found" }, 404);
    const { data: payment, error: pe } = await client.from("payment_transactions").select("id,merchant_order_id,duitku_reference,amount,currency,status,provider_result_code,created_at,updated_at").eq("order_id", order.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (pe) return json({ error: "database_error" }, 500);
    const findings: string[] = [];
    if (!payment) findings.push("No local payment transaction exists.");
    else {
      if (Number(payment.amount) !== Number(order.total_amount)) findings.push("Order and payment amounts differ.");
      if (payment.status === "paid" && order.status !== "paid") findings.push("Payment is marked paid but order is not paid.");
      if (payment.status !== "paid" && order.status === "paid") findings.push("Order is paid but payment transaction is not marked paid.");
      if (["expired", "cancelled", "failed", "refunded"].includes(payment.status)) findings.push("Terminal/non-success payment state requires evidence before any override.");
    }
    return json({ ok: true, read_only: true, requires_operator_review: findings.length > 0, findings, order: { id: order.id, order_number: order.order_number, status: order.status, total_amount: order.total_amount, currency: order.currency, paid_at: order.paid_at }, payment: payment ? { id: payment.id, merchant_order_id: payment.merchant_order_id, reference: payment.duitku_reference, amount: payment.amount, currency: payment.currency, status: payment.status, provider_result_code: payment.provider_result_code, created_at: payment.created_at, updated_at: payment.updated_at } : null, note: "No provider inquiry is performed and no state is changed. Confirm official POP status-check capability before adding automated reconciliation." });
  } catch (error) {
    console.error("reconcile_diagnostic_error", error instanceof Error ? error.message : "unknown");
    return json({ error: "internal_error" }, 500);
  }
});
