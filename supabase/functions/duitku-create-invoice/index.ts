import { createClient } from "npm:@supabase/supabase-js@2";

// REVIEW DRAFT ONLY. Sandbox-only; do not deploy without a separate approval.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json" },
});
const env = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};
const sha256Hex = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
};
const hmacHex = async (value: string, secret: string) => {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const origin = req.headers.get("origin");
  if (origin && origin !== "https://asricollection.online" && !/^http:\/\/localhost:\d+$/.test(origin)) {
    return json({ error: "origin_not_allowed" }, 403);
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.order_id !== "string" || typeof body.checkout_token !== "string" || body.checkout_token.length < 32 || body.checkout_token.length > 512) {
      return json({ error: "invalid_request" }, 400);
    }
    const supabaseUrl = env("SUPABASE_URL");
    const serviceRoleKey = env("SUPABASE_SERVICE_ROLE_KEY");
    const merchantCode = env("DUITKU_MERCHANT_CODE");
    const apiKey = env("DUITKU_API_KEY");
    const client = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

    const tokenHash = await sha256Hex(body.checkout_token);
    const { data: order, error: orderError } = await client.from("orders")
      .select("id,order_number,customer_name,customer_email,status,subtotal_amount,discount_amount,shipping_amount,total_amount,checkout_token_hash,checkout_token_expires_at,shipping_approved_at")
      .eq("id", body.order_id).maybeSingle();
    if (orderError) {
      console.error("order_lookup_failed", orderError.code);
      return json({ error: "internal_error" }, 500);
    }
    if (!order) return json({ error: "order_not_found" }, 404);
    if (!order.checkout_token_hash || tokenHash !== order.checkout_token_hash || !order.checkout_token_expires_at || Date.parse(order.checkout_token_expires_at) <= Date.now()) {
      return json({ error: "invalid_or_expired_checkout_token" }, 401);
    }
    if (order.status !== "pending" || !order.shipping_approved_at) return json({ error: "order_not_payable" }, 409);

    const { data: items, error: itemsError } = await client.from("order_items")
      .select("quantity,unit_price,subtotal_amount").eq("order_id", order.id);
    if (itemsError || !items?.length) return json({ error: "order_items_unavailable" }, 409);
    const itemTotal = items.reduce((sum, item) => {
      const qty = Number(item.quantity), price = Number(item.unit_price);
      if (!Number.isSafeInteger(qty) || qty < 1 || !Number.isSafeInteger(price) || price < 0) throw new Error("invalid_item_amount");
      return sum + qty * price;
    }, 0);
    const subtotal = Number(order.subtotal_amount), discount = Number(order.discount_amount), shipping = Number(order.shipping_amount), total = Number(order.total_amount);
    if (![itemTotal, subtotal, discount, shipping, total].every(Number.isSafeInteger) || itemTotal !== subtotal || subtotal - discount + shipping !== total || total <= 0) {
      return json({ error: "order_total_mismatch" }, 409);
    }

    const merchantOrderId = String(order.order_number);
    const { data: existing, error: existingError } = await client.from("payment_transactions")
      .select("id,merchant_order_id,duitku_reference,payment_url,amount,status")
      .eq("order_id", order.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (existingError) return json({ error: "payment_lookup_failed" }, 500);
    if (existing) {
      if (existing.status === "pending" && existing.payment_url && Number(existing.amount) === total) {
        return json({ ok: true, merchant_order_id: existing.merchant_order_id, reference: existing.duitku_reference, payment_url: existing.payment_url, payment_status: existing.status });
      }
      return json({ error: "payment_attempt_already_exists", payment_status: existing.status }, 409);
    }

    const now = new Date();
    const timestamp = String(now.getTime());
    const signature = await hmacHex(merchantCode + timestamp, apiKey);
    const idempotencyKey = `order:${order.id}`;
    const expiryMinutes = 60;
    const { data: payment, error: insertError } = await client.from("payment_transactions").insert({
      order_id: order.id, provider: "duitku", merchant_order_id: merchantOrderId, amount: total,
      currency: "IDR", status: "creating", idempotency_key: idempotencyKey,
      creation_started_at: now.toISOString(), expires_at: new Date(now.getTime() + expiryMinutes * 60_000).toISOString(),
      provider_response: { environment: "sandbox" },
    }).select("id").single();
    if (insertError || !payment) {
      console.error("payment_create_failed", insertError?.code ?? "unknown");
      return json({ error: "payment_attempt_conflict_or_create_failed" }, 409);
    }

    const payload: Record<string, unknown> = {
      paymentAmount: total, merchantOrderId, productDetails: `Asri Collection order ${merchantOrderId}`.slice(0, 255),
      email: order.customer_email, customerVaName: String(order.customer_name).slice(0, 20),
      callbackUrl: `${supabaseUrl}/functions/v1/duitku-callback`,
      returnUrl: env("DUITKU_RETURN_URL"), expiryPeriod: expiryMinutes,
    };
    if (typeof body.payment_method === "string" && body.payment_method.trim()) payload.paymentMethod = body.payment_method.trim();

    let response: Response;
    let result: Record<string, unknown> | null;
    try {
      response = await fetch("https://api-sandbox.duitku.com/api/merchant/createInvoice", {
        method: "POST", headers: { "Content-Type": "application/json", "x-duitku-timestamp": timestamp, "x-duitku-signature": signature, "x-duitku-merchantcode": merchantCode }, body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15_000),
      });
      result = await response.json().catch(() => null) as Record<string, unknown> | null;
    } catch (error) {
      await client.from("payment_transactions").update({ status: "unknown", provider_result_message: "Provider request outcome unknown" }).eq("id", payment.id).eq("status", "creating");
      console.error("duitku_request_outcome_unknown", error instanceof Error ? error.name : "unknown");
      return json({ error: "provider_outcome_unknown_reconciliation_required" }, 502);
    }
    let paymentUrlValid = false;
    if (typeof result?.paymentUrl === "string") {
      try {
        const parsed = new URL(result.paymentUrl);
        paymentUrlValid = parsed.protocol === "https:" && ["app-sandbox.duitku.com", "sandbox.duitku.com"].includes(parsed.hostname);
      } catch { paymentUrlValid = false; }
    }
    if (!response.ok || !result || result.statusCode !== "00" || typeof result.reference !== "string" || !paymentUrlValid) {
      await client.from("payment_transactions").update({ status: "failed", provider_result_code: String(result?.statusCode ?? response.status), provider_result_message: String(result?.statusMessage ?? "Provider rejected invoice").slice(0, 300), creation_completed_at: new Date().toISOString(), provider_response: { http_status: response.status, status_code: result?.statusCode ?? null } }).eq("id", payment.id).eq("status", "creating");
      return json({ error: "duitku_invoice_failed", provider_status_code: result?.statusCode ?? null }, 502);
    }

    const providerFields = {
      duitku_reference: result.reference, payment_url: result.paymentUrl,
      payment_method: typeof body.payment_method === "string" ? body.payment_method.trim() : null,
      provider_result_code: String(result.statusCode), provider_result_message: String(result.statusMessage ?? "SUCCESS").slice(0, 300),
      creation_completed_at: new Date().toISOString(), provider_response: { environment: "sandbox", http_status: response.status, status_code: result.statusCode, status_message: result.statusMessage },
    };
    const { data: transitioned, error: transitionError } = await client.from("payment_transactions").update({ ...providerFields, status: "pending" })
      .eq("id", payment.id).eq("status", "creating").select("status").maybeSingle();
    if (transitionError) {
      console.error("invoice_persist_failed", transitionError.code);
      return json({ error: "invoice_created_but_persistence_failed_reconciliation_required" }, 502);
    }
    if (!transitioned) {
      const { error: lateSaveError } = await client.from("payment_transactions").update(providerFields)
        .eq("id", payment.id).eq("status", "paid");
      if (lateSaveError) {
        console.error("invoice_persist_after_callback_failed", lateSaveError.code);
        return json({ error: "invoice_created_but_persistence_failed_reconciliation_required" }, 502);
      }
    }
    const { data: finalPayment, error: finalReadError } = await client.from("payment_transactions")
      .select("status,duitku_reference,payment_url").eq("id", payment.id).single();
    if (finalReadError || !finalPayment?.payment_url) return json({ error: "invoice_created_but_persistence_failed_reconciliation_required" }, 502);
    return json({ ok: true, merchant_order_id: merchantOrderId, reference: finalPayment.duitku_reference ?? result.reference, payment_url: finalPayment.payment_url, payment_status: finalPayment.status });
  } catch (error) {
    console.error("create_invoice_error", error instanceof Error ? error.message : "unknown");
    return json({ error: "internal_error" }, 500);
  }
});
