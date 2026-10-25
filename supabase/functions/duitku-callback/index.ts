// Supabase Edge Function: duitku-callback
// Duitku POP Official Documentation: https://docs.duitku.com/pop/id/?shell#integrasi-backend-atau-server

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

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

    if (!apiKey || !configuredMerchantCode) {
      // Do not log secret values or reveal which credential is missing.
      console.error("Duitku callback configuration is incomplete");
      return new Response("Bad Server Configuration", { status: 500, headers: corsHeaders });
    }

    // 2. Parse Callback Request Payload (supports both application/x-www-form-urlencoded and application/json)
    const contentType = req.headers.get("content-type") || "";
    let params: Record<string, string> = {};

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

    const merchantCode = params.merchantCode || params.merchantcode;
    const amount = params.amount || params.paymentAmount;
    const merchantOrderId = params.merchantOrderId || params.merchantorderid;
    const signature = params.signature;
    const resultCode = params.resultCode || params.resultcode;
    const reference = params.reference;
    const productDetail = params.productDetail || params.productDetails || "";
    const paymentCode = params.paymentCode || params.paymentMethod || "";
    const additionalParam = params.additionalParam || "";

    // 3. Validate presence of required callback parameters
    if (!merchantCode || !amount || !merchantOrderId || !signature) {
      console.warn("Duitku callback rejected: required parameters missing");
      return new Response("Bad Parameter", {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    // Optional safety check for configured merchant code
    if (configuredMerchantCode && merchantCode !== configuredMerchantCode) {
      console.warn("Duitku callback rejected: merchant code mismatch");
      return new Response("Bad Merchant Code", {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    // 4. Verify the current Duitku POP callback signature contract.
    // stringToSign = merchantCode + amount + merchantOrderId
    // signature = HMAC_SHA256(stringToSign, apiKey)
    const stringToSign = `${merchantCode}${amount}${merchantOrderId}`;
    const expectedSignature = await generateHmacSha256(stringToSign, apiKey);
    const incomingSignature = signature.trim().toLowerCase();

    // Constant-time comparison for equal-length hexadecimal signatures.
    const expectedBytes = new TextEncoder().encode(expectedSignature);
    const incomingBytes = new TextEncoder().encode(incomingSignature);
    let signatureDifference = expectedBytes.length ^ incomingBytes.length;
    const compareLength = Math.max(expectedBytes.length, incomingBytes.length);
    for (let i = 0; i < compareLength; i++) {
      signatureDifference |= (expectedBytes[i] ?? 0) ^ (incomingBytes[i] ?? 0);
    }
    if (signatureDifference !== 0) {
      // Never log the API key, signed string, or signature values.
      console.warn("Duitku callback rejected: signature verification failed");
      return new Response("Bad Signature", {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    // 5. Signature is VALID! Determine payment status
    // resultCode == "00" indicates Payment SUCCESS
    // resultCode == "01" indicates Payment FAILED / PENDING
    const isPaymentSuccess = resultCode === "00";
    const paymentStatus = isPaymentSuccess ? "SUCCESS" : "FAILED";

    console.info(`Duitku Callback Authenticated: Order ${merchantOrderId} is ${paymentStatus} (ResultCode: ${resultCode})`);

    // 6. Update database record in Supabase (if Supabase credentials are configured)
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (supabaseUrl && supabaseServiceKey) {
      try {
        const updatePayload: Record<string, unknown> = {
          status: paymentStatus,
          result_code: resultCode,
          reference: reference || null,
          payment_method: paymentCode || null,
          updated_at: new Date().toISOString(),
        };

        if (additionalParam) {
          updatePayload.additional_param = additionalParam;
        }

        // Upsert / update order in 'orders' table by merchant_order_id
        const dbRes = await fetch(`${supabaseUrl}/rest/v1/orders?merchant_order_id=eq.${encodeURIComponent(merchantOrderId)}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseServiceKey,
            Authorization: `Bearer ${supabaseServiceKey}`,
            Prefer: "return=representation",
          },
          body: JSON.stringify(updatePayload),
        });

        if (!dbRes.ok) {
          console.warn("Database order status update response status:", dbRes.status);
        }
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
