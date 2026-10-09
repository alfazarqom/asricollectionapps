// @ts-nocheck
// Supabase Edge Function: get-duitku-payment-status
// Secure Transaction Status & Reconciliation Endpoint (Deno / Supabase runtime)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper: MD5 hex digest
async function md5Hex(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("MD5", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const DUITKU_MERCHANT_CODE = Deno.env.get("DUITKU_MERCHANT_CODE") || "";
    const DUITKU_API_KEY = Deno.env.get("DUITKU_API_KEY") || "";
    const DUITKU_ENV = Deno.env.get("DUITKU_ENV") || "sandbox";
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let orderNumber = "";
    let accessToken = "";

    if (req.method === "GET") {
      const url = new URL(req.url);
      orderNumber = url.searchParams.get("orderNumber") || "";
      accessToken = url.searchParams.get("token") || "";
    } else {
      const body = await req.json();
      orderNumber = body.orderNumber || "";
      accessToken = body.token || "";
    }

    if (!orderNumber) {
      return new Response(JSON.stringify({ error: "orderNumber is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Ambil data pesanan dari database
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("order_number", orderNumber)
      .single();

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: "Pesanan tidak ditemukan" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Otorisasi Kepemilikan: Mencegah IDOR (Insecure Direct Object Reference)
    if (order.access_token && order.access_token !== accessToken) {
      return new Response(JSON.stringify({ error: "Akses ditolak. Token akses tidak valid." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Rekonsiliasi Otomatis dengan Duitku TransactionStatus API jika masih pending
    if (order.payment_status === "pending" && DUITKU_MERCHANT_CODE && DUITKU_API_KEY) {
      const checkUrl = DUITKU_ENV === "production"
        ? "https://api-prod.duitku.com/api/merchant/transactionStatus"
        : "https://api-sandbox.duitku.com/api/merchant/transactionStatus";

      // Formula: MD5(merchantCode + merchantOrderId + apiKey)
      const signature = await md5Hex(DUITKU_MERCHANT_CODE + orderNumber + DUITKU_API_KEY);

      try {
        const duitkuRes = await fetch(checkUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            merchantCode: DUITKU_MERCHANT_CODE,
            merchantOrderId: orderNumber,
            signature,
          }),
        });

        if (duitkuRes.ok) {
          const duitkuStatus = await duitkuRes.json();
          if (duitkuStatus.statusCode === "00") {
            // Perbarui status menjadi paid
            order.payment_status = "paid";
            if (order.fulfillment_status === "unfulfilled") {
              order.fulfillment_status = "processing";
            }
            await supabase
              .from("orders")
              .update({
                payment_status: "paid",
                fulfillment_status: order.fulfillment_status,
                updated_at: new Date().toISOString(),
              })
              .eq("id", order.id);

            await supabase.rpc("commit_inventory_atomic", { p_order_id: order.id });
          } else if (duitkuStatus.statusCode === "02") {
            order.payment_status = "failed";
            await supabase
              .from("orders")
              .update({ payment_status: "failed", updated_at: new Date().toISOString() })
              .eq("id", order.id);
          }
        }
      } catch (e) {
        console.warn("Duitku status check error:", e);
      }
    }

    // 4. Return Safe Response (Hide Access Token & Secrets)
    const { access_token, ...safeOrder } = order;

    return new Response(
      JSON.stringify({
        success: true,
        order: safeOrder,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
