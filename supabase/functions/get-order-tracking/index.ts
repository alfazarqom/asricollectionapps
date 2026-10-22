import { createClient } from "npm:@supabase/supabase-js@2";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, apikey, x-client-info, authorization",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 204, headers });
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed" }, 405);
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return json({ success: false, error: "Tracking service is not configured" }, 503);

  try {
    const body = await req.json();
    const orderNumber = typeof body?.orderNumber === "string" ? body.orderNumber.trim().toUpperCase() : "";
    const proof = typeof body?.phoneOrEmail === "string" ? body.phoneOrEmail.trim() : "";
    if (!orderNumber || !proof || proof.length > 254) {
      return json({ success: false, error: "Nomor pesanan dan email/nomor telepon wajib diisi." }, 400);
    }
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: order, error } = await db.from("orders")
      .select("id,order_number,customer_name,customer_email,customer_phone,shipping_city,shipping_postal_code,subtotal,shipping_cost,discount_amount,total_amount,payment_status,fulfillment_status,courier_name,tracking_number,shipping_notes,created_at,updated_at,order_items(*)")
      .eq("order_number", orderNumber).maybeSingle();
    if (error) throw error;
    if (!order) return json({ success: false, error: "Pesanan atau data verifikasi tidak cocok." }, 404);

    const emailMatch = (order.customer_email || "").trim().toLowerCase() === proof.toLowerCase();
    const phone = proof.replace(/\D/g, "");
    const storedPhone = (order.customer_phone || "").replace(/\D/g, "");
    const phoneMatch = phone.length >= 8 && phone === storedPhone;
    if (!emailMatch && !phoneMatch) {
      return json({ success: false, error: "Pesanan atau data verifikasi tidak cocok." }, 404);
    }
    const { data: logs, error: logError } = await db.from("audit_logs")
      .select("action,created_at,details").eq("order_id", order.id)
      .order("created_at", { ascending: true }).limit(50);
    if (logError) throw logError;
    const { order_items, ...safeOrder } = order;
    return json({ success: true, order: {
      ...safeOrder,
      items: (order_items || []).map((item: Record<string, unknown>) => ({
        ...item, title: item.title, subtotal: item.subtotal,
      })),
      audit_logs: (logs || []).map((log: Record<string, unknown>) => ({
        action: log.action, timestamp: log.created_at, details: log.details,
      })),
    }});
  } catch (error) {
    console.error("get-order-tracking failed", error instanceof Error ? error.message : "unknown error");
    return json({ success: false, error: "Gagal mengambil status pesanan." }, 500);
  }
});
