// Supabase Edge Function: get-banner
// Public, read-only endpoint for promotional products used in storefront banners.
// Only products with a valid sale_price below the regular price are returned.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function jsonResponse(
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": status === 200
        ? "public, max-age=60, s-maxage=300, stale-while-revalidate=600"
        : "no-store",
      ...extraHeaders,
    },
  });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return jsonResponse(
      { error: "Method not allowed" },
      405,
      { Allow: "GET, OPTIONS" },
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const apiKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
    Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !apiKey) {
    console.error("get-banner: Supabase URL or API key is not configured");
    return jsonResponse({ error: "Promotional products are temporarily unavailable" }, 500);
  }

  try {
    const url = new URL(req.url);
    const rawLimit = url.searchParams.get("limit");
    const limit = rawLimit === null ? 8 : Number(rawLimit);

    if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
      return jsonResponse({ error: "limit must be an integer between 1 and 20" }, 400);
    }

    const supabase = createClient(supabaseUrl, apiKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Query a bounded candidate set; validate discount values in application code.
    const { data, error } = await supabase
      .from("products")
      .select(
        "id,title,description,availability,price,sale_price,currency,image_link,additional_image_link,brand,product_type,created_at,updated_at",
      )
      .not("sale_price", "is", null)
      .eq("availability", "in stock")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("get-banner database query failed:", error.message);
      return jsonResponse({ error: "Unable to retrieve promotional products" }, 502);
    }

    const promotionalProducts = (data || [])
      .filter((product: any) => {
        const regularPrice = Number(product.price);
        const salePrice = Number(product.sale_price);
        return Number.isFinite(regularPrice) &&
          Number.isFinite(salePrice) &&
          regularPrice > 0 &&
          salePrice > 0 &&
          salePrice < regularPrice;
      })
      .slice(0, limit)
      .map((product: any) => ({
        id: String(product.id ?? ""),
        title: String(product.title ?? "").slice(0, 120),
        description: String(product.description ?? ""),
        availability: product.availability,
        price: Math.round(Number(product.price)),
        sale_price: Math.round(Number(product.sale_price)),
        currency: product.currency || "IDR",
        image_link: product.image_link || "",
        additional_image_link: Array.isArray(product.additional_image_link)
          ? product.additional_image_link
          : [],
        brand: product.brand || "Asri Collection",
        product_type: product.product_type || "General",
        created_at: product.created_at || null,
        updated_at: product.updated_at || null,
      }));

    return jsonResponse({
      success: true,
      count: promotionalProducts.length,
      data: promotionalProducts,
    });
  } catch (error) {
    console.error(
      "get-banner unexpected error:",
      error instanceof Error ? error.message : String(error),
    );
    return jsonResponse({ error: "Promotional products are temporarily unavailable" }, 500);
  }
});
