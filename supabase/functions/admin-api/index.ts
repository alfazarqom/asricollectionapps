import { createClient } from "npm:@supabase/supabase-js@2";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, apikey, x-client-info, authorization, x-admin-pin",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers });

function safeEqual(a: string, b: string) {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i++) diff |= left[i] ^ right[i];
  return diff === 0;
}

function normalizeOrder(order: Record<string, any>) {
  const { access_token, order_items, ...safe } = order;
  return { ...safe, items: order_items || [] };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 204, headers });
  const expectedPin = Deno.env.get("ADMIN_SECRET_PIN") || "";
  const url = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!expectedPin || !url || !serviceKey) {
    return json({ success: false, error: "Autentikasi atau layanan admin belum dikonfigurasi." }, 503);
  }

  const route = new URL(req.url);
  const action = route.searchParams.get("action") || "";
  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  try {
    if (action === "auth" && req.method === "POST") {
      const body = await req.json();
      const pin = typeof body?.pin === "string" ? body.pin : "";
      if (!safeEqual(pin, expectedPin)) return json({ success: false, error: "PIN admin tidak valid." }, 401);
      return json({ success: true });
    }

    const suppliedPin = req.headers.get("x-admin-pin") || "";
    if (!safeEqual(suppliedPin, expectedPin)) {
      return json({ success: false, error: "Otorisasi admin ditolak." }, 401);
    }

    if (action === "metrics" && req.method === "GET") {
      const { data, error } = await db.from("orders")
        .select("total_amount,payment_status,fulfillment_status,created_at")
        .order("created_at", { ascending: false }).limit(5000);
      if (error) throw error;
      const rows = data || [];
      return json({ success: true, data: {
        totalRevenue: rows.reduce((sum, row) => sum + (row.payment_status === "paid" ? Number(row.total_amount) : 0), 0),
        totalOrders: rows.length,
        pendingCount: rows.filter((row) => row.payment_status === "pending").length,
        processingCount: rows.filter((row) => row.fulfillment_status === "processing").length,
        shippedCount: rows.filter((row) => row.fulfillment_status === "shipped").length,
        deliveredCount: rows.filter((row) => row.fulfillment_status === "delivered").length,
        failedCount: rows.filter((row) => row.payment_status === "failed").length,
      }});
    }

    if (action === "orders" && req.method === "GET") {
      const status = route.searchParams.get("status") || "all";
      const search = (route.searchParams.get("search") || "").toLowerCase();
      const { data, error } = await db.from("orders")
        .select("*,order_items(*)").order("created_at", { ascending: false }).limit(1000);
      if (error) throw error;
      const filtered = (data || []).filter((row) => {
        if (status === "paid" && row.payment_status !== "paid") return false;
        if (status === "pending" && row.payment_status !== "pending") return false;
        if (["processing", "shipped", "delivered"].includes(status) && row.fulfillment_status !== status) return false;
        if (search) {
          const matches = [row.order_number, row.customer_name, row.customer_phone]
            .some((value) => String(value || "").toLowerCase().includes(search));
          if (!matches) return false;
        }
        return true;
      });
      return json({ success: true, data: filtered.map(normalizeOrder) });
    }

    if (action === "shipping" && req.method === "PATCH") {
      const orderNumber = route.searchParams.get("orderNumber") || "";
      const body = await req.json();
      const courierName = typeof body?.courierName === "string" ? body.courierName : "";
      const trackingNumber = typeof body?.trackingNumber === "string" ? body.trackingNumber : "";
      const shippingNotes = typeof body?.shippingNotes === "string" ? body.shippingNotes : "";
      const fulfillmentStatus = typeof body?.fulfillmentStatus === "string" ? body.fulfillmentStatus : "";
      const shippingCost = Number(body?.shippingCost);
      if (!orderNumber || !Number.isFinite(shippingCost) || shippingCost < 0) {
        return json({ success: false, error: "Data pengiriman tidak valid." }, 400);
      }
      const { data: rpcResult, error: rpcError } = await db.rpc("admin_update_order_shipping_atomic", {
        p_order_number: orderNumber,
        p_courier_name: courierName,
        p_tracking_number: trackingNumber,
        p_fulfillment_status: fulfillmentStatus,
        p_shipping_cost: shippingCost,
        p_shipping_notes: shippingNotes,
      });
      if (rpcError) throw rpcError;
      if (!rpcResult?.success) return json({ success: false, error: rpcResult?.message || "Pesanan tidak ditemukan." }, rpcResult?.status_code || 400);
      const { data: order, error } = await db.from("orders")
        .select("*,order_items(*)").eq("order_number", orderNumber).single();
      if (error) throw error;
      return json({ success: true, order: normalizeOrder(order) });
    }

    return json({ success: false, error: "Endpoint admin tidak ditemukan." }, 404);
  } catch (error) {
    console.error("admin-api failed:", error instanceof Error ? error.message : "unknown error");
    return json({ success: false, error: "Operasi admin gagal diproses." }, 500);
  }
});
