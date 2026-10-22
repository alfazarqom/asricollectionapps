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

// Duitku transactionStatus signature: HMAC_SHA256(merchantCode + merchantOrderId, apiKey).
async function hmacSha256Hex(key: string, data: string): Promise<string> {
  const keyBytes = new TextEncoder().encode(key);
  const dataBytes = new TextEncoder().encode(data);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, dataBytes);
  return Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
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

    if (!DUITKU_MERCHANT_CODE || !DUITKU_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Payment status service is not configured." }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!["sandbox", "production"].includes(DUITKU_ENV)) {
      return new Response(JSON.stringify({ error: "Invalid payment environment configuration." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
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

    // 3. Read-only provider inquiry. Callback/RPC remains the only payment-state writer.
    // Duitku API documentation: HMAC_SHA256(merchantCode + merchantOrderId, apiKey).
    let providerStatus: { statusCode: string; statusMessage?: string; amount?: string; reference?: string } | null = null;
    if (order.payment_status === "pending") {
      const checkUrl = DUITKU_ENV === "production"
        ? "https://api-prod.duitku.com/api/merchant/transactionStatus"
        : "https://api-sandbox.duitku.com/api/merchant/transactionStatus";
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
          const result = await duitkuRes.json();
          if (
            result?.merchantOrderId === cleanOrderNumber &&
            result?.amount !== undefined &&
            Math.abs(Number(result.amount) - Number(order.total_amount)) < 0.01 &&
            ["00", "01", "02"].includes(String(result.statusCode))
          ) {
            providerStatus = {
              statusCode: String(result.statusCode),
              statusMessage: typeof result.statusMessage === "string" ? result.statusMessage : undefined,
              amount: String(result.amount),
              reference: typeof result.reference === "string" ? result.reference : undefined,
            };
          } else {
            console.error("Duitku status response did not match order identity or amount.");
          }
        } else {
          console.warn("Duitku transaction status request returned HTTP", duitkuRes.status);
        }
      } catch (e) {
        console.warn("Duitku status inquiry failed:", e);
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
