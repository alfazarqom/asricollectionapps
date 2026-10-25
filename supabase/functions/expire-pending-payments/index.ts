import { createClient } from "npm:@supabase/supabase-js@2";

// REVIEW DRAFT ONLY. Keep gateway JWT verification enabled; call only from a trusted server-side scheduler/operator.
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const env = (name: string) => { const v = Deno.env.get(name); if (!v) throw new Error(`Missing required environment variable: ${name}`); return v; };
Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const limit = body?.limit === undefined ? 100 : Number(body.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 500) return json({ error: "limit_must_be_1_to_500" }, 400);
    const client = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await client.rpc("expire_pending_duitku_payments_v1", { p_limit: limit });
    if (error) {
      console.error("expiry_rpc_failed", error.code);
      return json({ error: "expiry_processing_failed" }, 500);
    }
    return json({ ok: true, result: data });
  } catch (error) {
    console.error("expiry_error", error instanceof Error ? error.message : "unknown");
    return json({ error: "internal_error" }, 500);
  }
});
