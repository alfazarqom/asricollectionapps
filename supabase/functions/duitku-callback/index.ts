// Supabase Edge Function: duitku-callback
// Duitku POP Official Documentation: https://docs.duitku.com/pop/id/?shell#integrasi-backend-atau-server
// Source of truth: Duitku POP Payment Notification (Callback) Specifications

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// Hardcoded fallback credentials as requested
const HARDCODED_SUPABASE_URL = "https://mvwflakurihhakdrlteg.supabase.co";
const HARDCODED_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12d2ZsYWt1cmloaGFrZHJsdGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMjIwMDksImV4cCI6MjEwNDc5ODAwOX0.E09Vufp77NOkpGjJZMH6sbWYInKu_sMzV7eqHX6xQ0A";

// Pure zero-dependency RFC 1321 MD5 hash implementation
function md5(str: string): string {
  const utf8 = new TextEncoder().encode(str);
  let a = 1732584193;
  let b = -271733879;
  let c = -1732584194;
  let d = 271733878;

  const originalLength = utf8.length;
  const bitLength = originalLength * 8;

  const paddingLength = (originalLength % 64 < 56) ? (56 - (originalLength % 64)) : (120 - (originalLength % 64));
  const totalLength = originalLength + paddingLength + 8;
  const padded = new Uint8Array(totalLength);
  padded.set(utf8);
  padded[originalLength] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(totalLength - 8, bitLength >>> 0, true);
  view.setUint32(totalLength - 4, Math.floor(bitLength / 0x100000000), true);

  const k = [
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee,
    0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
    0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
    0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
    0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa,
    0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed,
    0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
    0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
    0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
    0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05,
    0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039,
    0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
    0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
    0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
  ];

  const s = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];

  for (let offset = 0; offset < totalLength; offset += 64) {
    const chunk = new Uint32Array(16);
    for (let i = 0; i < 16; i++) {
      chunk[i] = view.getUint32(offset + i * 4, true);
    }

    let [aa, bb, cc, dd] = [a, b, c, d];

    for (let i = 0; i < 64; i++) {
      let f: number, g: number;
      if (i < 16) {
        f = (bb & cc) | (~bb & dd);
        g = i;
      } else if (i < 32) {
        f = (dd & bb) | (~dd & cc);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = bb ^ cc ^ dd;
        g = (3 * i + 5) % 16;
      } else {
        f = cc ^ (bb | ~dd);
        g = (7 * i) % 16;
      }

      const temp = dd;
      dd = cc;
      cc = bb;
      const sum = (aa + f + k[i] + chunk[g]) >>> 0;
      bb = (bb + ((sum << s[i]) | (sum >>> (32 - s[i])))) >>> 0;
      aa = temp;
    }

    a = (a + aa) >>> 0;
    b = (b + bb) >>> 0;
    c = (c + cc) >>> 0;
    d = (d + dd) >>> 0;
  }

  const result = new Uint8Array(16);
  const resView = new DataView(result.buffer);
  resView.setUint32(0, a, true);
  resView.setUint32(4, b, true);
  resView.setUint32(8, c, true);
  resView.setUint32(12, d, true);

  return Array.from(result)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Generate HMAC-SHA256 hex string using standard Web Crypto API
async function generateHmacSha256(data: string, secretKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secretKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(data)
  );
  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed. Duitku callback requires HTTP POST.", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    // 1. Retrieve Secret Key from Supabase Secrets
    const apiKey = Deno.env.get("DUITKU_API_KEY");
    const configuredMerchantCode = Deno.env.get("DUITKU_MERCHANT_CODE");

    if (!apiKey) {
      console.error("DUITKU_API_KEY is not defined in Supabase Secrets");
      return new Response("Bad Server Configuration", { status: 500, headers: corsHeaders });
    }

    // 2. Parse Callback Request Payload (supports application/x-www-form-urlencoded and application/json)
    const contentType = req.headers.get("content-type") || "";
    const params: Record<string, string> = {};

    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      for (const [key, value] of formData.entries()) {
        params[key] = String(value);
      }
    } else {
      const jsonBody = await req.json().catch(() => ({}));
      for (const [key, value] of Object.entries(jsonBody)) {
        params[key] = String(value);
      }
    }

    const merchantCode = params.merchantCode || params.merchantcode || "";
    const rawAmount = params.amount || params.paymentAmount || "";
    const merchantOrderId = params.merchantOrderId || params.merchantorderid || "";
    const signature = params.signature || "";
    const resultCode = params.resultCode || params.resultcode || "";
    const reference = params.reference || "";
    const paymentCode = params.paymentCode || params.paymentMethod || "";
    const additionalParam = params.additionalParam || "";

    // 3. Validate presence of mandatory callback parameters
    if (!merchantCode || !rawAmount || !merchantOrderId || !signature) {
      console.warn("Callback missing mandatory parameters:", { merchantCode, rawAmount, merchantOrderId, signature });
      return new Response("Bad Parameter", {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    // Optional safety check for configured merchant code
    if (configuredMerchantCode && merchantCode !== configuredMerchantCode) {
      console.warn("Merchant code mismatch:", { received: merchantCode, configured: configuredMerchantCode });
      return new Response("Bad Merchant Code", {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    // 4. Verify Signature according to Duitku POP Official Documentation
    // Formula 1 (Official Modern POP standard): HMAC_SHA256(merchantCode + merchantOrderId + amount, apiKey)
    // Formula 2 (Alternative POP format): HMAC_SHA256(merchantCode + amount + merchantOrderId, apiKey)
    // Formula 3 (Legacy MD5 format): MD5(merchantCode + amount + merchantOrderId + apiKey)
    // Formula 4 (Alternative MD5 format): MD5(merchantCode + merchantOrderId + amount + apiKey)
    const intAmount = Math.round(Number(rawAmount)).toString();
    const incomingSignature = signature.trim().toLowerCase();

    const expectedSignatures = new Set<string>();

    // Test both rawAmount (e.g. 150000.00) and intAmount (e.g. 150000)
    for (const amt of [rawAmount, intAmount]) {
      expectedSignatures.add((await generateHmacSha256(`${merchantCode}${merchantOrderId}${amt}`, apiKey)).toLowerCase());
      expectedSignatures.add((await generateHmacSha256(`${merchantCode}${amt}${merchantOrderId}`, apiKey)).toLowerCase());
      expectedSignatures.add(md5(`${merchantCode}${amt}${merchantOrderId}${apiKey}`).toLowerCase());
      expectedSignatures.add(md5(`${merchantCode}${merchantOrderId}${amt}${apiKey}`).toLowerCase());
    }

    const isValidSignature = expectedSignatures.has(incomingSignature);

    if (!isValidSignature) {
      console.error("Signature verification failed!", {
        incomingSignature,
        merchantCode,
        merchantOrderId,
        rawAmount,
      });
      return new Response("Bad Signature", {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    // 5. Signature is verified! Determine payment status
    // Duitku Result Codes:
    // "00": Success (Payment completed)
    // "01": Failed / Expired
    const isPaymentSuccess = resultCode === "00";
    const paymentStatus = isPaymentSuccess ? "SUCCESS" : "FAILED";

    console.info(`Duitku Callback Verified: Order ${merchantOrderId} is ${paymentStatus} (ResultCode: ${resultCode})`);

    // 6. Update database record in Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || HARDCODED_SUPABASE_URL;
    const supabaseKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
      Deno.env.get("SUPABASE_ANON_KEY") ||
      HARDCODED_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        const updatePayload: Record<string, unknown> = {
          status: paymentStatus,
          result_code: resultCode,
          reference: reference || null,
          payment_method: paymentCode || null,
          updated_at: new Date().toISOString(),
        };

        if (isPaymentSuccess) {
          updatePayload.paid_at = new Date().toISOString();
        }

        if (additionalParam) {
          updatePayload.additional_param = additionalParam;
        }

        // Update order in 'orders' table by merchant_order_id
        await fetch(`${supabaseUrl}/rest/v1/orders?merchant_order_id=eq.${encodeURIComponent(merchantOrderId)}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            Prefer: "return=representation",
          },
          body: JSON.stringify(updatePayload),
        });
      } catch (dbErr) {
        console.error("Failed to update order status in Supabase database:", dbErr);
      }
    }

    // 7. CRITICAL: Duitku requires HTTP 200 with plaintext "SUCCESS" to acknowledge receipt
    return new Response("SUCCESS", {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Exception during Duitku callback processing:", error);
    return new Response(`Error: ${message}`, {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  }
});
