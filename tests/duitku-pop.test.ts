import { describe, expect, test } from "bun:test";
import { hmacSha256Hex, isValidDuitkuCallbackAmount } from "../supabase/functions/_shared/duitku-pop.ts";

describe("Duitku POP contract helpers", () => {
  test("accepts integer and two-decimal amounts", () => {
    expect(isValidDuitkuCallbackAmount("0")).toBe(true);
    expect(isValidDuitkuCallbackAmount("150000")).toBe(true);
    expect(isValidDuitkuCallbackAmount("150000.50")).toBe(true);
  });

  test("rejects malformed amounts before signature verification", () => {
    for (const amount of ["", "-1", "+1", "1e3", "1.234", "1.", ".50", " 1"]) {
      expect(isValidDuitkuCallbackAmount(amount)).toBe(false);
    }
  });

  test("computes standard HMAC-SHA256 hex output", async () => {
    expect(await hmacSha256Hex("key", "The quick brown fox jumps over the lazy dog"))
      .toBe("f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8");
  });
});
