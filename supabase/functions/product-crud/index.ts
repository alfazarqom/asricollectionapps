import { createClient } from "npm:@supabase/supabase-js@2";

const BUCKET = "ws";
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-product-crud-token, apikey, x-client-info",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
};
const fields = ["title", "description", "availability", "condition", "price", "sale_price", "currency", "image_link", "brand", "product_type"] as const;

function response(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers } });
}
function record(v: unknown): v is Record<string, unknown> { return v !== null && typeof v === "object" && !Array.isArray(v); }
function equalSecret(a: string, b: string) {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}
function validate(raw: unknown, partial: boolean, hasImage: boolean) {
  if (!record(raw)) return { error: "Product data must be a JSON object" };
  const allowed = new Set(["id", ...fields]);
  const unknown = Object.keys(raw).filter(k => !allowed.has(k));
  if (unknown.length) return { error: `Unsupported field(s): ${unknown.join(", ")}` };
  const value: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(raw)) {
    if (key === "id") {
      if (typeof v !== "string" || !v.trim() || v.trim().length > 200) return { error: "id must be a non-empty string of at most 200 characters" };
      value.id = v.trim(); continue;
    }
    if (["title", "image_link", "condition", "currency", "availability", "brand", "product_type"].includes(key)) {
      if (v === null && ["brand", "product_type"].includes(key)) { value[key] = null; continue; }
      if (typeof v !== "string") return { error: `${key} must be a string` };
      const max = key === "title" ? 250 : key === "image_link" ? 2048 : 500;
      if (v.length > max) return { error: `${key} exceeds ${max} characters` };
      const s = v.trim();
      if (["title", "condition", "currency", "availability"].includes(key) && !s) return { error: `${key} must not be empty` };
      if (key === "image_link" && s && !/^https:\/\//i.test(s)) return { error: "image_link must be an HTTPS URL" };
      if (key === "availability" && !["in stock", "out of stock", "preorder"].includes(s)) return { error: "Invalid availability value" };
      value[key] = s; continue;
    }
    if (key === "description") {
      if (v !== null && typeof v !== "string") return { error: "description must be a string or null" };
      if (typeof v === "string" && v.length > 10000) return { error: "description exceeds 10000 characters" };
      value[key] = v; continue;
    }
    if (key === "price" || key === "sale_price") {
      if (v === null && key === "sale_price") { value[key] = null; continue; }
      if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > 1_000_000_000_000) return { error: `${key} must be a non-negative finite number` };
      value[key] = v;
    }
  }
  if (!partial) {
    for (const k of ["id", "title", "price"]) if (!(k in value)) return { error: `${k} is required` };
    if (!hasImage && !value.image_link) return { error: "image_link or uploaded image is required" };
  }
  if (partial && Object.keys(value).every(k => k === "id") && !hasImage) return { error: "Provide a product field or image to update" };
  return { value };
}
function imageType(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg";
  if (bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((n,i) => bytes[i] === n)) return "image/png";
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0,4)) === "RIFF" && String.fromCharCode(...bytes.slice(8,12)) === "WEBP") return "image/webp";
  return null;
}
function ext(type: string) { return type === "image/jpeg" ? "jpg" : type === "image/png" ? "png" : "webp"; }
function storagePath(url: unknown, base: string): string | null {
  if (typeof url !== "string" || !url) return null;
  try {
    const u = new URL(url);
    if (u.origin !== new URL(base).origin) return null;
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const i = u.pathname.indexOf(marker);
    if (i < 0) return null;
    const p = decodeURIComponent(u.pathname.slice(i + marker.length));
    return p.startsWith("products/") ? p : null;
  } catch { return null; }
}
async function parseRequest(req: Request) {
  if (!(req.headers.get("content-type") ?? "").toLowerCase().includes("multipart/form-data")) {
    try { return { body: await req.json(), image: null as File | null }; }
    catch { return { error: "Invalid JSON body" }; }
  }
  let form: FormData;
  try { form = await req.formData(); } catch { return { error: "Invalid multipart form data" }; }
  const raw = form.get("product") ?? form.get("data");
  if (typeof raw !== "string") return { error: 'Multipart request requires JSON field "product"' };
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return { error: 'Field "product" must contain valid JSON' }; }
  const file = form.get("image");
  if (file !== null && !(file instanceof File)) return { error: '"image" must be a file' };
  return { body, image: file instanceof File && file.size > 0 ? file : null };
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (!["GET", "POST", "PATCH", "DELETE"].includes(req.method)) return response({ error: "Method not allowed" }, 405, { Allow: "GET, POST, PATCH, DELETE, OPTIONS" });
  const base = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? (() => { try { return JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}").default as string | undefined; } catch { return undefined; } })();
  if (!base || !key) return response({ error: "Product service is not configured" }, 500);

  if (req.method !== "GET") {
    const expected = Deno.env.get("PRODUCT_CRUD_ADMIN_TOKEN");
    if (!expected) return response({ error: "Product write operations are disabled until admin token is configured" }, 503);
    if (!equalSecret(req.headers.get("x-product-crud-token") ?? "", expected)) return response({ error: "Forbidden" }, 403);
  }
  const db = createClient(base, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const url = new URL(req.url);
  try {
    if (req.method === "GET") {
      const id = url.searchParams.get("id")?.trim();
      const search = (url.searchParams.get("search") ?? "").trim().slice(0, 100);
      const category = (url.searchParams.get("category") ?? "").trim().slice(0, 100);
      const availability = url.searchParams.get("availability");
      const rawLimit = url.searchParams.get("limit");
      const limit = rawLimit === null ? 100 : Number(rawLimit);
      if (!Number.isInteger(limit) || limit < 1 || limit > 100) return response({ error: "limit must be an integer between 1 and 100" }, 400);
      let q = db.from("products").select("*");
      if (id) q = q.eq("id", id);
      if (category && category.toLowerCase() !== "all") q = q.ilike("product_type", `%${category.replace(/[%_]/g, "")}%`);
      if (availability) q = q.eq("availability", availability);
      if (search) {
        const s = search.replace(/[^\p{L}\p{N}\s.-]/gu, "");
        if (s) q = q.or(`title.ilike.%${s}%,description.ilike.%${s}%,brand.ilike.%${s}%,id.ilike.%${s}%`);
      }
      const { data, error } = await q.order("created_at", { ascending: false }).limit(limit);
      if (error) { console.error("product-crud GET:", error.message); return response({ error: "Unable to retrieve products" }, 502); }
      return response({ data: data ?? [], count: data?.length ?? 0 });
    }

    if (req.method === "POST" || req.method === "PATCH") {
      const parsed = await parseRequest(req);
      if ("error" in parsed) return response({ error: parsed.error }, 400);
      const validated = validate(parsed.body, req.method === "PATCH", !!parsed.image);
      if ("error" in validated) return response({ error: validated.error }, 400);
      const value = validated.value!;
      const id = req.method === "POST" ? String(value.id ?? "") : (url.searchParams.get("id")?.trim() || String(value.id ?? "").trim());
      if (!id) return response({ error: "Product id is required in ?id= or product.id" }, 400);

      let newPath: string | null = null;
      if (parsed.image) {
        if (parsed.image.size > MAX_BYTES) return response({ error: "Image exceeds the 5 MB limit" }, 413);
        if (!TYPES.has(parsed.image.type)) return response({ error: "Only JPEG, PNG, and WebP images are allowed" }, 415);
        const bytes = new Uint8Array(await parsed.image.arrayBuffer());
        const detected = imageType(bytes);
        if (!detected || detected !== parsed.image.type) return response({ error: "Image content does not match its declared MIME type" }, 415);
        const safeId = id.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 160);
        newPath = `products/${safeId}/${crypto.randomUUID()}.${ext(detected)}`;
        const { error } = await db.storage.from(BUCKET).upload(newPath, bytes, { contentType: detected, cacheControl: "3600", upsert: false });
        if (error) { console.error("product-crud upload:", error.message); return response({ error: "Unable to upload image to bucket ws" }, 502); }
        value.image_link = db.storage.from(BUCKET).getPublicUrl(newPath).data.publicUrl;
      }

      if (req.method === "POST") {
        const { data, error } = await db.from("products").insert(value).select("*").single();
        if (error) {
          if (newPath) await db.storage.from(BUCKET).remove([newPath]);
          console.error("product-crud POST:", error.message);
          return response({ error: error.code === "23505" ? "A product with this id already exists" : "Unable to create product" }, error.code === "23505" ? 409 : 400);
        }
        return response({ data }, 201);
      }

      const { data: before, error: lookupError } = await db.from("products").select("image_link").eq("id", id).maybeSingle();
      if (lookupError || !before) {
        if (newPath) await db.storage.from(BUCKET).remove([newPath]);
        if (lookupError) console.error("product-crud PATCH lookup:", lookupError.message);
        return response({ error: lookupError ? "Unable to update product" : "Product not found" }, lookupError ? 502 : 404);
      }
      const updates = { ...value }; delete updates.id;
      const { data, error } = await db.from("products").update(updates).eq("id", id).select("*").maybeSingle();
      if (error || !data) {
        if (newPath) await db.storage.from(BUCKET).remove([newPath]);
        if (error) console.error("product-crud PATCH:", error.message);
        return response({ error: error ? "Unable to update product" : "Product not found" }, error ? 400 : 404);
      }
      if (newPath) {
        const oldPath = storagePath(before.image_link, base);
        if (oldPath && oldPath !== newPath) {
          const { error: cleanupError } = await db.storage.from(BUCKET).remove([oldPath]);
          if (cleanupError) console.warn("product-crud old image cleanup:", cleanupError.message);
        }
      }
      return response({ data });
    }

    const id = url.searchParams.get("id")?.trim();
    if (!id) return response({ error: "id query parameter is required" }, 400);
    const { data: existing, error: lookupError } = await db.from("products").select("image_link").eq("id", id).maybeSingle();
    if (lookupError) return response({ error: "Unable to delete product" }, 400);
    if (!existing) return response({ error: "Product not found" }, 404);
    const { data, error } = await db.from("products").delete().eq("id", id).select("id").maybeSingle();
    if (error) { console.error("product-crud DELETE:", error.message); return response({ error: "Unable to delete product" }, 400); }
    if (!data) return response({ error: "Product not found" }, 404);
    const oldPath = storagePath(existing.image_link, base);
    if (oldPath) {
      const { error: cleanupError } = await db.storage.from(BUCKET).remove([oldPath]);
      if (cleanupError) console.warn("product-crud deleted product but image cleanup failed:", cleanupError.message);
    }
    return response({ deleted: true, id: data.id });
  } catch (error) {
    console.error("product-crud unexpected error:", error instanceof Error ? error.message : String(error));
    return response({ error: "Unexpected product service error" }, 500);
  }
});
