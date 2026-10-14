import { createClient } from "npm:@supabase/supabase-js@2";

const BUCKET = "ws";
const MAX_GALLERY = 10;
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
};

type JsonRecord = Record<string, unknown>;
const PRODUCT_FIELDS = new Set([
  "title", "description", "availability", "condition", "price", "sale_price",
  "currency", "image_link", "additional_image_link", "brand", "product_type",
]);

function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}
function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function getStoragePath(value: unknown, supabaseUrl: string): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value);
    if (url.origin !== new URL(supabaseUrl).origin) return null;
    const marker = "/storage/v1/object/public/" + BUCKET + "/";
    const index = url.pathname.indexOf(marker);
    if (index < 0) return null;
    const path = decodeURIComponent(url.pathname.slice(index + marker.length));
    const parts = path.split("/");
    if (!path.startsWith("products/") || parts.some(part => !part || part === "." || part === "..")) return null;
    return path;
  } catch {
    return null;
  }
}
function validateProduct(raw: unknown, partial: boolean, supabaseUrl: string) {
  if (!isRecord(raw)) return { error: "Request body must be a JSON object" };
  const allowed = new Set(["id", ...PRODUCT_FIELDS]);
  const unknown = Object.keys(raw).filter(key => !allowed.has(key));
  if (unknown.length) return { error: "Unsupported field(s): " + unknown.join(", ") };

  const value: JsonRecord = {};
  for (const [key, item] of Object.entries(raw)) {
    if (key === "id") {
      if (typeof item !== "string" || !item.trim() || item.trim().length > 200) {
        return { error: "id must be a non-empty string of at most 200 characters" };
      }
      value.id = item.trim();
      continue;
    }
    if (key === "additional_image_link") {
      if (!Array.isArray(item) || item.length > MAX_GALLERY) {
        return { error: "additional_image_link must be an array containing at most " + MAX_GALLERY + " URLs" };
      }
      for (const imageUrl of item) {
        if (typeof imageUrl !== "string" || !getStoragePath(imageUrl, supabaseUrl)) {
          return { error: "Each additional_image_link item must be a public URL from bucket ws under products/" };
        }
      }
      value[key] = item.map((url: string) => url.trim());
      continue;
    }
    if (["title", "image_link", "availability", "condition", "currency", "brand", "product_type"].includes(key)) {
      if (item === null && ["brand", "product_type"].includes(key)) {
        value[key] = null;
        continue;
      }
      if (typeof item !== "string") return { error: key + " must be a string" };
      const trimmed = item.trim();
      const max = key === "title" ? 250 : key === "image_link" ? 2048 : 500;
      if (trimmed.length > max) return { error: key + " exceeds " + max + " characters" };
      if (["title", "availability", "condition", "currency"].includes(key) && !trimmed) {
        return { error: key + " must not be empty" };
      }
      if (key === "availability" && !["in stock", "out of stock", "preorder"].includes(trimmed)) {
        return { error: "availability must be in stock, out of stock, or preorder" };
      }
      if (key === "image_link" && !getStoragePath(trimmed, supabaseUrl)) {
        return { error: "image_link must be a public URL from bucket ws under products/" };
      }
      value[key] = trimmed;
      continue;
    }
    if (key === "description") {
      if (item !== null && typeof item !== "string") return { error: "description must be a string or null" };
      if (typeof item === "string" && item.length > 10000) return { error: "description exceeds 10000 characters" };
      value[key] = item;
      continue;
    }
    if (key === "price" || key === "sale_price") {
      if (item === null && key === "sale_price") {
        value[key] = null;
        continue;
      }
      if (typeof item !== "number" || !Number.isFinite(item) || item < 0 || item > 1_000_000_000_000) {
        return { error: key + " must be a non-negative finite number" };
      }
      value[key] = item;
    }
  }

  if (!partial) {
    for (const required of ["id", "title", "price", "image_link"]) {
      if (!(required in value)) return { error: required + " is required" };
    }
    if (!("additional_image_link" in value)) value.additional_image_link = [];
  } else if (Object.keys(value).every(key => key === "id")) {
    return { error: "Provide at least one product field to update" };
  }
  return { value };
}
function uniqueStoragePaths(urls: unknown[], supabaseUrl: string): string[] {
  return [...new Set(urls.map(url => getStoragePath(url, supabaseUrl)).filter((path): path is string => !!path))];
}
async function removeUnreferencedImages(
  db: ReturnType<typeof createClient>,
  supabaseUrl: string,
  candidatePaths: string[],
) {
  if (!candidatePaths.length) return;
  const { data, error } = await db.from("products").select("image_link, additional_image_link");
  if (error) {
    console.warn("product-crud image cleanup skipped: unable to check references", error.message);
    return;
  }
  const referenced = new Set<string>();
  for (const product of data ?? []) {
    const main = getStoragePath(product.image_link, supabaseUrl);
    if (main) referenced.add(main);
    const gallery = Array.isArray(product.additional_image_link) ? product.additional_image_link : [];
    for (const imageUrl of gallery) {
      const path = getStoragePath(imageUrl, supabaseUrl);
      if (path) referenced.add(path);
    }
  }
  const removable = [...new Set(candidatePaths)].filter(path => !referenced.has(path));
  if (!removable.length) return;
  const { error: removeError } = await db.storage.from(BUCKET).remove(removable);
  if (removeError) {
    // Intentionally log-only: V2 does not create a retry table or scheduled worker.
    console.warn("product-crud image cleanup failed; manual cleanup may be required", {
      bucket: BUCKET, paths: removable, message: removeError.message,
    });
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (!["GET", "POST", "PATCH", "DELETE"].includes(req.method)) {
    return reply({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
    (() => {
      try { return JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}").default as string | undefined; }
      catch { return undefined; }
    })();
  if (!supabaseUrl || !serviceKey) return reply({ error: "Product service is not configured" }, 500);

  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const url = new URL(req.url);
  const route = url.pathname.replace(/\/+$/, "").split("/").pop() ?? "";

  try {
    if (req.method === "GET") {
      if (route !== "ambil") return reply({ error: "Use GET /ambil" }, 404);
      const id = url.searchParams.get("id");
      if (id !== null && !id.trim()) return reply({ error: "id must not be empty" }, 400);
      if (id !== null) {
        const { data, error } = await db.from("products").select("*").eq("id", id.trim());
        if (error) {
          console.error("product-crud GET /ambil:", error.message);
          return reply({ error: "Unable to retrieve products" }, 502);
        }
        return reply(data ?? []);
      }
      const all: JsonRecord[] = [];
      const pageSize = 1000;
      for (let offset = 0; ; offset += pageSize) {
        const { data, error } = await db.from("products").select("*")
          .order("created_at", { ascending: false }).range(offset, offset + pageSize - 1);
        if (error) {
          console.error("product-crud GET /ambil:", error.message);
          return reply({ error: "Unable to retrieve products" }, 502);
        }
        all.push(...(data ?? []));
        if (!data || data.length < pageSize) break;
      }
      return reply(all);
    }

    if (req.method === "POST") {
      if (route !== "tambah") return reply({ error: "Use POST /tambah" }, 404);
      let raw: unknown;
      try { raw = await req.json(); } catch { return reply({ error: "Invalid JSON body" }, 400); }
      const checked = validateProduct(raw, false, supabaseUrl);
      if ("error" in checked) return reply({ error: checked.error }, 400);
      const { data, error } = await db.from("products").insert(checked.value).select("*").single();
      if (error) {
        console.error("product-crud POST /tambah:", error.message);
        return reply({ error: error.code === "23505" ? "A product with this id already exists" : "Unable to create product" },
          error.code === "23505" ? 409 : 400);
      }
      return reply(data, 201);
    }

    if (req.method === "PATCH") {
      if (route !== "edit") return reply({ error: "Use PATCH /edit?id=..." }, 404);
      const queryId = url.searchParams.get("id")?.trim();
      if (!queryId) return reply({ error: "id query parameter is required" }, 400);
      let raw: unknown;
      try { raw = await req.json(); } catch { return reply({ error: "Invalid JSON body" }, 400); }
      if (isRecord(raw) && typeof raw.id === "string" && raw.id.trim() !== queryId) {
        return reply({ error: "Body id must match the id query parameter" }, 400);
      }
      const checked = validateProduct(raw, true, supabaseUrl);
      if ("error" in checked) return reply({ error: checked.error }, 400);
      const updates = { ...checked.value };
      delete updates.id;

      const { data: before, error: lookupError } = await db.from("products").select("*").eq("id", queryId).maybeSingle();
      if (lookupError) {
        console.error("product-crud PATCH lookup:", lookupError.message);
        return reply({ error: "Unable to find product to update" }, 502);
      }
      if (!before) return reply({ error: "Product not found" }, 404);

      const { data, error } = await db.from("products").update(updates).eq("id", queryId).select("*").maybeSingle();
      if (error) {
        console.error("product-crud PATCH /edit:", error.message);
        return reply({ error: "Unable to update product" }, 400);
      }
      if (!data) return reply({ error: "Product not found" }, 404);

      const oldUrls = [before.image_link, ...(Array.isArray(before.additional_image_link) ? before.additional_image_link : [])];
      const newUrls = new Set([data.image_link, ...(Array.isArray(data.additional_image_link) ? data.additional_image_link : [])]);
      const cleanup = uniqueStoragePaths(oldUrls.filter((imageUrl: unknown) => !newUrls.has(imageUrl)), supabaseUrl);
      await removeUnreferencedImages(db, supabaseUrl, cleanup);
      return reply(data);
    }

    if (req.method === "DELETE") {
      if (route !== "hapus") return reply({ error: "Use DELETE /hapus?id=..." }, 404);
      const id = url.searchParams.get("id")?.trim();
      if (!id) return reply({ error: "id query parameter is required" }, 400);
      const { data: existing, error: lookupError } = await db.from("products").select("*").eq("id", id).maybeSingle();
      if (lookupError) {
        console.error("product-crud DELETE lookup:", lookupError.message);
        return reply({ error: "Unable to find product to delete" }, 502);
      }
      if (!existing) return reply({ error: "Product not found" }, 404);
      const { data, error } = await db.from("products").delete().eq("id", id).select("id").maybeSingle();
      if (error) {
        console.error("product-crud DELETE /hapus:", error.message);
        return reply({ error: "Unable to delete product" }, 400);
      }
      if (!data) return reply({ error: "Product not found" }, 404);

      const imageUrls = [existing.image_link, ...(Array.isArray(existing.additional_image_link) ? existing.additional_image_link : [])];
      await removeUnreferencedImages(db, supabaseUrl, uniqueStoragePaths(imageUrls, supabaseUrl));
      return reply({ deleted: true, id: data.id });
    }

    return reply({ error: "Unknown route. Use /ambil, /tambah, /edit, or /hapus" }, 404);
  } catch (error) {
    console.error("product-crud unexpected error:", error instanceof Error ? error.message : String(error));
    return reply({ error: "Unexpected product service error" }, 500);
  }
});
