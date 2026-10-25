# Duitku POP — Source of Truth

Last checked: 2026-10-26

## Authority and scope

The integration in this repository uses **Duitku POP Create Invoice**. Use the current official POP documentation as the authority for provider contract details:

- Main POP reference (Indonesian): https://docs.duitku.com/pop/id/
- Create Invoice / Backend Integration: https://docs.duitku.com/pop/id/#integrasi-backend-atau-server
- General Duitku API reference (consult only when the integration explicitly uses that API contract): https://docs.duitku.com/api/id/

Do not substitute examples from Duitku Subscription, Account Linking, legacy SHA-256 signatures, or another product's request contract for POP Create Invoice.

## Create Invoice contract confirmed from the official POP reference

- Method: HTTP POST.
- Content type: `application/json`.
- Sandbox endpoint: `https://api-sandbox.duitku.com/api/merchant/createInvoice`.
- Production endpoint: `https://api-prod.duitku.com/api/merchant/createInvoice`.
- Required request headers:
  - `Content-Type: application/json`
  - `x-duitku-merchantcode`
  - `x-duitku-timestamp` (Unix timestamp in milliseconds)
  - `x-duitku-signature`
- Request signature:
  - `stringToSign = merchantCode + timestamp`
  - `signature = HMAC_SHA256(stringToSign, apiKey)`
  - The API key is the HMAC secret key; it is not appended to the string-to-sign.
- Required body parameters shown in the POP Create Invoice reference include `paymentAmount` (integer), `merchantOrderId` (string up to 50 characters), `productDetails` (string up to 255 characters), `email`, and `callbackUrl`. The reference also documents `returnUrl`, optional customer/contact details, `itemDetails`, `customerDetail`, `paymentMethod`, and `expiryPeriod`.
- If `itemDetails` is sent, its item amounts must match `paymentAmount`.
- A successful response includes `statusCode: "00"`, `reference`, and `paymentUrl`. Check both HTTP status and provider response status; an HTTP response alone is not sufficient.

## Payment-status trust boundary

- Treat the server-to-server HTTP callback as the payment notification channel and validate its documented signature and transaction fields in the callback handler.
- A browser redirect/return URL and client-side JavaScript callback are for user experience only. Never mark an order paid based only on query parameters or a browser callback.
- Keep `DUITKU_API_KEY` server-side in Supabase Secrets. Never expose it in the frontend or logs.

## Repository implementation guardrails

- The backend reads the canonical order and final total from the active Supabase `public.orders` row; client-supplied amount/customer data must not override the stored order.
- Create Invoice is not called if the stored order is missing, the amount differs, the order is not pending, or the order already has an inconsistent invoice state.
- Persist the provider `reference` and `paymentUrl` to the existing order before returning a successful response.
- If Duitku returns a successful invoice but local persistence fails, report a reconciliation-required result; do not fabricate success or silently issue another invoice.
- Do not change the callback signature contract by inference from the Create Invoice request-signature formula. Audit callback validation against the callback section of the official POP docs separately.

This document is a compact implementation checklist, not a replacement for the live official documentation. Re-check the official pages before future contract changes.
