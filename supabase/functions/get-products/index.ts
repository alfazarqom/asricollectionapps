// Supabase Edge Function: get-products
// Catalog source of truth: public.products
// Keeps the JSON-array contract consumed by server.ts.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function jsonResponse(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
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
    return jsonResponse({ error: "Method not allowed" }, 405, { "Allow": "GET, OPTIONS" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const apiKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !apiKey) {
    console.error("get-products: Supabase URL or API key is not configured");
    return jsonResponse({ error: "Product catalog is temporarily unavailable" }, 500);
  }

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id")?.trim();
    const category = (url.searchParams.get("category") || url.searchParams.get("type") || "").trim();
    const availability = url.searchParams.get("availability")?.trim();
    const rawSearch = (url.searchParams.get("search") || "").trim();
    // Remove PostgREST filter syntax and punctuation from user-supplied search terms.
    const search = rawSearch.replace(/[^\p{L}\p{N}\s]/gu, "").trim().slice(0, 100);
    const sort = url.searchParams.get("sort");
    const rawLimit = url.searchParams.get("limit");
    const parsedLimit = rawLimit === null ? 100 : Number(rawLimit);

    if (rawLimit !== null && (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100)) {
      return jsonResponse({ error: "limit must be an integer between 1 and 100" }, 400);
    }
    if (id !== undefined && id.length > 200) {
      return jsonResponse({ error: "Invalid product id" }, 400);
    }

    const supabase = createClient(supabaseUrl, apiKey);
    let query = supabase.from("products").select("*");

    if (id) query = query.eq("id", id);
    if (category && category.toLowerCase() !== "all") {
      query = query.ilike("product_type", `%${category.replace(/[%_]/g, "")}%`);
    }
    if (availability) query = query.eq("availability", availability);
    if (search) {
      query = query.or(
        `title.ilike.%${search}%,description.ilike.%${search}%,brand.ilike.%${search}%,id.ilike.%${search}%`,
      );
    }

    if (sort === "price_asc") {
      query = query.order("price", { ascending: true });
    } else if (sort === "price_desc") {
      query = query.order("price", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query.limit(parsedLimit);
    if (error) {
      console.error("get-products database query failed:", error.message);
      return jsonResponse({ error: "Unable to retrieve product catalog" }, 502);
    }

    // Return database rows unchanged. select("*") preserves every current and future
    // public.products column, including additional_image_link (JSONB), without defaults,
    // truncation, numeric coercion, or hardcoded field values.
    const products = data ?? [];

    // Empty query results and unknown IDs intentionally return []—never fabricated products.
    return jsonResponse(products);
  } catch (err) {
    console.error("get-products unexpected error:", err instanceof Error ? err.message : String(err));
    return jsonResponse({ error: "Product catalog is temporarily unavailable" }, 500);
  }
});
