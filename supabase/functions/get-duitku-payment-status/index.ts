// @ts-nocheck
// Supabase Edge Function: get-duitku-payment-status
// Secure Transaction Status & Reconciliation Endpoint (Deno / Supabase runtime)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
    status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return new Response(JSON.stringify({ error: "Layanan status pesanan belum dikonfigurasi." }), {
      status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json().catch(() => ({}));
    const orderNumber = typeof body.orderNumber === "string" ? body.orderNumber.trim() : "";
    const accessToken = typeof body.token === "string" ? body.token : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body.phone === "string" ? body.phone.replace(/\D/g, "") : "";

    if (!orderNumber || !orderNumber.trim()) {
      return new Response(JSON.stringify({ error: "Nomor pesanan harus diisi" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanOrderNumber = orderNumber.trim().toUpperCase();

    // 1. Ambil data pesanan dari database
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("order_number", cleanOrderNumber)
      .single();

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: "Pesanan dengan nomor tersebut tidak ditemukan" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Every request must prove order ownership. A missing token never bypasses authorization.
    const tokenMatches = Boolean(accessToken && order.access_token && order.access_token === accessToken);
    const emailMatches = Boolean(email && typeof order.customer_email === "string" && email === order.customer_email.trim().toLowerCase());
    const phoneMatches = Boolean(phone && typeof order.customer_phone === "string" && phone === order.customer_phone.replace(/\\D/g, ""));
    if (!tokenMatches && !emailMatches && !phoneMatches) return new Response(JSON.stringify({ error: "Akses ditolak. Verifikasi pemilik pesanan tidak cocok." }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    // Read-only endpoint: verified callbacks are the only payment mutation path.
    const { access_token, order_items, ...safeOrder } = order;
    safeOrder.items = order_items || [];
    return new Response(JSON.stringify({
      success: true, order: safeOrder, paymentStatus: safeOrder.payment_status, fulfillmentStatus: safeOrder.fulfillment_status,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" } });
  } catch (_err: any) {
    console.error("Order status request failed.");
    return new Response(JSON.stringify({ error: "Gagal memproses pengecekan status pesanan." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
