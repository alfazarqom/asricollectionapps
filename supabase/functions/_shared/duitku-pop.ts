/**
 * Shared, provider-contract-specific helpers for Duitku POP.
 * Keep signature construction and callback amount parsing consistent across handlers.
 */
export async function hmacSha256Hex(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Duitku sends amount as a decimal/integer string; reject signs, exponents and excess decimals. */
export function isValidDuitkuCallbackAmount(amount: string): boolean {
  return /^\d+(?:\.\d{1,2})?$/.test(amount);
}
