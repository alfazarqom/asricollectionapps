// @ts-nocheck
// Supabase Edge Function: get-duitku-payment-status
// Secure Transaction Status & Reconciliation Endpoint (Deno / Supabase runtime)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Payment status service is not configured." }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let orderNumber = "";
    let accessToken = "";

    if (req.method === "GET") {
      const url = new URL(req.url);
      orderNumber = url.searchParams.get("orderNumber") || url.searchParams.get("order_number") || "";
      accessToken = url.searchParams.get("token") || "";
    } else {
      try {
        const body = await req.json();
        orderNumber = body.orderNumber || body.order_number || "";
        accessToken = body.token || body.accessToken || "";
      } catch (_e) {
        // Body might be empty or url-encoded
      }
    }

    if (!["GET", "POST"].includes(req.method)) {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }

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

    // Order details are private: a valid access token is mandatory, not optional.
    if (!accessToken || typeof order.access_token !== "string" || order.access_token !== accessToken) {
      return new Response(JSON.stringify({ error: "Akses ditolak. Token akses tidak valid." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Provider-side reconciliation is deliberately not called from this public read endpoint.
    // The POP docs must be confirmed for the exact transaction-status endpoint/contract before
    // enabling provider inquiries. This endpoint must never mutate payment state; the verified
    // callback's atomic RPC is the payment-state source of truth.
    const providerStatus = null;

    // 4. Return Safe Response (Hide Access Token & Secrets)
    const { access_token, order_items, ...safeOrder } = order;
    safeOrder.items = order_items || [];

    return new Response(
      JSON.stringify({
        success: true,
        order: safeOrder,
        paymentStatus: safeOrder.payment_status,
        fulfillmentStatus: safeOrder.fulfillment_status,
        providerStatus,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Error in get-duitku-payment-status:", err?.message || "unknown error");
    return new Response(
      JSON.stringify({ error: "Gagal memproses pengecekan status pesanan." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
