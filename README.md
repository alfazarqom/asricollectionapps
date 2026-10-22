# Asri Collection Online Store

Mobile-first React + Vite storefront with an Express compatibility server and Supabase Edge Functions for product and Duitku POP payment operations.

## Local development

1. Install dependencies with the package manager used by your environment.
2. Copy .env.example to .env.
3. Configure SUPABASE_ANON_KEY and set a unique ADMIN_SECRET_PIN. There is intentionally no default admin PIN; admin endpoints remain unavailable until a PIN is configured.
4. Configure Duitku credentials as Supabase Edge Function secrets. Never commit live credentials.
5. Run npm run dev; run npm run lint and npm run build before proposing a merge.

## Duitku payment safety notes

- Invoice creation is delegated to the Supabase function duitku-create-invoice.
- The invoice function fails closed when merchant credentials are missing or Duitku rejects the invoice; it does not fabricate references or payment URLs.
- The callback function verifies the HMAC-SHA256 callback signature and fails closed if configuration is missing.
- Callback processing requires the database RPC process_duitku_callback_atomic; RPC failure is not bypassed with direct order updates.
- The callback endpoint is configured with verify_jwt = false because the provider cannot supply a Supabase user JWT. Provider signature validation is still mandatory.
- Do not treat a browser return, popup event, or client-side status as proof of payment.

## Current limitations

The legacy Express server still has in-memory order/payment/reservation caches and admin/order-status paths. These are transitional compatibility paths and are not durable or fully consolidated with PostgreSQL. Do not remove them until order tracking and admin operations have been migrated to Supabase and regression-tested.

No database migration, secret change, function deployment, or production deployment is performed by repository patches alone.
