// @ts-nocheck
// Supabase Edge Function: get-products
// Official Authoritative Product Catalog Endpoint (Deno / Supabase runtime)
// Compatible with Duitku POP Item Details Specification (RFC & ISO 4217 IDR)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

// Authoritative fallback catalog matching public.products table
const defaultFallbackProducts = [
  {
    id: "APP-001-BLK-M",
    title: "Kaos Katun Premium Hitam",
    description: "Kaos katun combed 30s premium dengan jahitan rapi dan adem sepanjang hari.",
    availability: "in stock",
    condition: "new",
    price: 125000,
    sale_price: 99000,
    currency: "IDR",
    image_link: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80",
    brand: "Asri Basic",
    product_type: "Apparel",
    created_at: "2026-10-09T19:21:07.237165+00:00",
    updated_at: "2026-10-09T19:21:07.237165+00:00",
  },
  {
    id: "APP-001-WHT-L",
    title: "Kaos Katun Premium Putih",
    description: "Kaos katun combed 30s putih bersih, tidak mudah melar dan nyaman dipakai.",
    availability: "in stock",
    condition: "new",
    price: 125000,
    sale_price: 99000,
    currency: "IDR",
    image_link: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&auto=format&fit=crop&q=80",
    brand: "Asri Basic",
    product_type: "Apparel",
    created_at: "2026-10-09T19:21:07.237165+00:00",
    updated_at: "2026-10-09T19:21:07.237165+00:00",
  },
  {
    id: "APP-002",
    title: "Kemeja Linen Lengan Pendek",
    description: "Kemeja casual bahan linen breathable dengan kerah resort modern.",
    availability: "in stock",
    condition: "new",
    price: 215000,
    sale_price: null,
    currency: "IDR",
    image_link: "https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=600&auto=format&fit=crop&q=80",
    brand: "Asri Casual",
    product_type: "Apparel",
    created_at: "2026-10-09T19:21:07.237165+00:00",
    updated_at: "2026-10-09T19:21:07.237165+00:00",
  },
  {
    id: "APP-003",
    title: "Hoodie Fleece Unisex",
    description: "Hoodie berbahan fleece lembut dan hangat, cocok untuk cuaca sejuk atau harian santai.",
    availability: "in stock",
    condition: "new",
    price: 275000,
    sale_price: null,
    currency: "IDR",
    image_link: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80",
    brand: "Asri Wear",
    product_type: "Apparel",
    created_at: "2026-10-09T19:21:07.237165+00:00",
    updated_at: "2026-10-09T19:21:07.237165+00:00",
  },
  {
    id: "SHO-001",
    title: "Sneakers Klasik Kanvas",
    description: "Sepatu sneakers kanvas dengan sol empuk anti-slip untuk mobilitas tinggi.",
    availability: "in stock",
    condition: "new",
    price: 349000,
    sale_price: 299000,
    currency: "IDR",
    image_link: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&auto=format&fit=crop&q=80",
    brand: "Asri Footwear",
    product_type: "Shoes",
    created_at: "2026-10-09T19:21:07.237165+00:00",
    updated_at: "2026-10-09T19:21:07.237165+00:00",
  },
  {
    id: "SHO-002",
    title: "Sepatu Lari Ultralight",
    description: "Sepatu running ringan dengan bantalan cushion responsif untuk kenyamanan optimal.",
    availability: "in stock",
    condition: "new",
    price: 489000,
    sale_price: null,
    currency: "IDR",
    image_link: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
    brand: "Asri Sport",
    product_type: "Shoes",
    created_at: "2026-10-09T19:21:07.237165+00:00",
    updated_at: "2026-10-09T19:21:07.237165+00:00",
  },
  {
    id: "BAG-001",
    title: "Ransel Laptop Waterproof",
    description: "Backpack tahan air dengan kompartemen laptop 15.6 inch dan busa punggung empuk.",
    availability: "in stock",
    condition: "new",
    price: 319000,
    sale_price: null,
    currency: "IDR",
    image_link: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80",
    brand: "Asri Bags",
    product_type: "Accessories",
    created_at: "2026-10-09T19:21:07.237165+00:00",
    updated_at: "2026-10-09T19:21:07.237165+00:00",
  },
  {
    id: "BAG-002",
    title: "Tas Selempang Kanvas Mini",
    description: "Sling bag praktis untuk dompet, ponsel, dan barang bawaan esensial harian.",
    availability: "in stock",
    condition: "new",
    price: 145000,
    sale_price: null,
    currency: "IDR",
    image_link: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80",
    brand: "Asri Bags",
    product_type: "Accessories",
    created_at: "2026-10-09T19:21:07.237165+00:00",
    updated_at: "2026-10-09T19:21:07.237165+00:00",
  },
];

serve(async (req: Request) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

    const apiKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

    let products = [];

    // Jika Supabase credentials terkonfigurasi, kueri langsung tabel 'products'
    if (SUPABASE_URL && apiKey) {
      const supabase = createClient(SUPABASE_URL, apiKey);
      const url = new URL(req.url);

      const id = url.searchParams.get("id");
      const category = url.searchParams.get("category") || url.searchParams.get("type");
      const availability = url.searchParams.get("availability");
      const search = url.searchParams.get("search");
      const sort = url.searchParams.get("sort");
      const limit = parseInt(url.searchParams.get("limit") || "100", 10);

      let query = supabase.from("products").select("*");

      if (id) {
        query = query.eq("id", id);
      }

      if (category && category !== "all") {
        query = query.ilike("product_type", `%${category}%`);
      }

      if (availability) {
        query = query.eq("availability", availability);
      }

      if (search && search.trim()) {
        const term = search.trim();
        query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%,brand.ilike.%${term}%,id.ilike.%${term}%`);
      }

      if (sort === "price_asc") {
        query = query.order("price", { ascending: true });
      } else if (sort === "price_desc") {
        query = query.order("price", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      query = query.limit(limit);

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        products = data;
      } else {
        // Fallback jika query kosong atau tabel belum ada data
        if (id) {
          const matched = defaultFallbackProducts.filter((p) => p.id === id);
          products = matched.length > 0 ? matched : defaultFallbackProducts;
        } else {
          products = defaultFallbackProducts;
        }
      }
    } else {
      // Fallback lokal mode
      const url = new URL(req.url);
      const id = url.searchParams.get("id");
      if (id) {
        const matched = defaultFallbackProducts.filter((p) => p.id === id);
        products = matched.length > 0 ? matched : defaultFallbackProducts;
      } else {
        products = defaultFallbackProducts;
      }
    }

    // Standardisasi & sanitasi data produk sesuai format Duitku POP itemDetails
    const sanitizedProducts = products.map((p: any) => {
      const priceNum = Math.round(Number(p.price) || 0);
      const salePriceNum = p.sale_price !== null && p.sale_price !== undefined 
        ? Math.round(Number(p.sale_price)) 
        : null;

      return {
        id: String(p.id),
        title: String(p.title || "").substring(0, 50), // Duitku itemDetails name max 50 chars
        description: String(p.description || ""),
        availability: p.availability || "in stock",
        condition: p.condition || "new",
        price: priceNum,
        sale_price: salePriceNum,
        currency: "IDR",
        image_link: p.image_link || "",
        brand: p.brand || "Asri Collection",
        product_type: p.product_type || "General",
        display_image: p.image_link,
        created_at: p.created_at || new Date().toISOString(),
        updated_at: p.updated_at || new Date().toISOString(),
      };
    });

    return new Response(JSON.stringify(sanitizedProducts), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        // Edge CDN Caching: cache selama 60 detik di browser dan 300 detik di Supabase Edge CDN
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err: any) {
    console.error("Error in get-products function:", err.message);
    // Return fallback graceful daripada 500 error
    return new Response(JSON.stringify(defaultFallbackProducts), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});
