// @ts-nocheck
// Supabase Edge Function: check-secrets
// Endpoint untuk menampilkan status konfigurasi Supabase Secrets secara aman
// (Deno / Supabase runtime)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

// Helper: Mask sensitive string securely
function maskSecret(val: string | undefined, showFirst = 3, showLast = 3): string {
  if (!val || val.trim() === "") return "(BELUM DISET / KOSONG)";
  if (val.length <= showFirst + showLast) return "***";
  return `${val.substring(0, showFirst)}...${val.substring(val.length - showLast)}`;
}

serve(async (req: Request) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const merchantCode = Deno.env.get("DUITKU_MERCHANT_CODE") || "";
    const apiKey = Deno.env.get("DUITKU_API_KEY") || "";
    const duitkuEnv = Deno.env.get("DUITKU_ENV") || "sandbox";
    const callbackUrl = Deno.env.get("DUITKU_CALLBACK_URL") || "";
    const returnUrl = Deno.env.get("DUITKU_RETURN_URL") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const appUrl = Deno.env.get("APP_URL") || "";

    const secretReport = {
      DUITKU_MERCHANT_CODE: {
        is_set: Boolean(merchantCode),
        value_preview: maskSecret(merchantCode, 2, 2),
        description: "Kode merchant Duitku (misal D12345)",
      },
      DUITKU_API_KEY: {
        is_set: Boolean(apiKey),
        length: apiKey.length,
        value_preview: maskSecret(apiKey, 3, 3),
        description: "API Key rahasia dari Dashboard Duitku",
      },
      DUITKU_ENV: {
        is_set: Boolean(duitkuEnv),
        value: duitkuEnv,
        description: "Lingkungan transaksi ('sandbox' atau 'production')",
      },
      DUITKU_CALLBACK_URL: {
        is_set: Boolean(callbackUrl),
        value: callbackUrl || "(menggunakan default: /functions/v1/duitku-callback)",
        description: "Target URL Webhook resmi Duitku",
      },
      DUITKU_RETURN_URL: {
        is_set: Boolean(returnUrl),
        value: returnUrl || "(otomatis berdasarkan order)",
        description: "Target redirect halaman setelah bayar",
      },
      SUPABASE_URL: {
        is_set: Boolean(supabaseUrl),
        value: supabaseUrl || "(default Supabase internal)",
        description: "URL instance Supabase",
      },
      SUPABASE_SERVICE_ROLE_KEY: {
        is_set: Boolean(serviceRoleKey),
        length: serviceRoleKey.length,
        value_preview: maskSecret(serviceRoleKey, 6, 4),
        description: "Kunci Service Role untuk bypass RLS pada Edge Functions",
      },
      APP_URL: {
        is_set: Boolean(appUrl),
        value: appUrl || "(otomatis)",
        description: "Domain hosting frontend aplikasi",
      },
    };

    const isDuitkuReady = Boolean(merchantCode && apiKey);
    const isSupabaseReady = Boolean(supabaseUrl && serviceRoleKey);

    const responseData = {
      status: isDuitkuReady ? "ready" : "needs_configuration",
      message: isDuitkuReady
        ? "Semua secret utama Duitku POP telah terkonfigurasi di Supabase."
        : "Secret DUITKU_MERCHANT_CODE atau DUITKU_API_KEY belum terisi di Supabase.",
      checked_at: new Date().toISOString(),
      summary: {
        duitku_configured: isDuitkuReady,
        supabase_db_configured: isSupabaseReady,
        environment: duitkuEnv,
      },
      secrets: secretReport,
      cli_commands_guide: {
        set_secrets: "supabase secrets set --env-file supabase/.env",
        list_secrets: "supabase secrets list",
      },
    };

    return new Response(JSON.stringify(responseData, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Gagal memeriksa secret" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
