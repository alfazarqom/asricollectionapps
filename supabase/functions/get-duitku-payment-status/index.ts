// @ts-nocheck
// Supabase Edge Function: get-duitku-payment-status
// Secure Transaction Status & Reconciliation Endpoint (Deno / Supabase runtime)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Helper: HMAC-SHA256 hex digest, matching the current Duitku transaction-status API.
async function hmacSha256Hex(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
  return Array.from(new Uint8Array(signatureBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
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

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Konfigurasi backend belum lengkap." }), {
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

    // 2. Otorisasi wajib: order number saja bukan bukti kepemilikan.
    if (!accessToken || !order.access_token || order.access_token !== accessToken) {
      return new Response(JSON.stringify({ error: "Akses ditolak. Token akses tidak valid." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Rekonsiliasi Otomatis dengan Duitku TransactionStatus API jika masih pending
    if (order.payment_status === "pending" && DUITKU_MERCHANT_CODE && DUITKU_API_KEY) {
      const checkUrl = DUITKU_ENV === "production"
        ? "https://passport.duitku.com/webapi/api/merchant/transactionStatus"
        : "https://sandbox.duitku.com/webapi/api/merchant/transactionStatus";

      // Current Duitku API docs: HMAC-SHA256(merchantCode + merchantOrderId, apiKey).
      const signature = await hmacSha256Hex(DUITKU_API_KEY, DUITKU_MERCHANT_CODE + cleanOrderNumber);

      try {
        const duitkuRes = await fetch(checkUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            merchantCode: DUITKU_MERCHANT_CODE,
            merchantOrderId: cleanOrderNumber,
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
            const { error: paidUpdateError } = await supabase
              .from("orders")
              .update({
                payment_status: "paid",
                fulfillment_status: order.fulfillment_status,
                updated_at: new Date().toISOString(),
              })
              .eq("id", order.id);
            if (paidUpdateError) throw paidUpdateError;

            const { error: inventoryCommitError } = await supabase.rpc("commit_inventory_atomic", { p_order_id: order.id });
            if (inventoryCommitError) {
              console.error("Inventory commit failed after status reconciliation:", inventoryCommitError.message);
              throw inventoryCommitError;
            }
          } else if (duitkuStatus.statusCode === "02") {
            order.payment_status = "failed";
            const { error: failedUpdateError } = await supabase
              .from("orders")
              .update({ payment_status: "failed", updated_at: new Date().toISOString() })
              .eq("id", order.id);
            if (failedUpdateError) throw failedUpdateError;
          }
        }
      } catch (e) {
        console.error("Duitku status reconciliation failed:", e?.message || "unknown error");
        return new Response(JSON.stringify({ error: "Status pembayaran belum dapat diverifikasi. Silakan coba kembali." }), {
          status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 4. Return Safe Response (Hide Access Token & Secrets)
    const { access_token, order_items, ...safeOrder } = order;
    safeOrder.items = order_items || [];

    return new Response(
      JSON.stringify({
        success: true,
        order: safeOrder,
        paymentStatus: safeOrder.payment_status,
        fulfillmentStatus: safeOrder.fulfillment_status,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Error in get-duitku-payment-status:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Gagal memproses pengecekan status pesanan." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
