# Supabase + Duitku POP

Backend payment integration for Asri Collection. This folder contains only the Supabase configuration, Edge Functions, migration history, and read-only schema inspection.

## Minimal layout

- `config.toml` — local Supabase project/function settings.
- `functions/` — invoice creation, signed Duitku callback, payment status, and other application endpoints.
- `migrations/` — ordered SQL history. Existing migrations are historical records; do not assume they match the active database.
- `verification/preflight_readonly.sql` — metadata-only schema/security inspection before planning a migration.

## Duitku POP contract

Official reference: [Duitku POP Indonesia](https://docs.duitku.com/pop/id/).

- Create invoices server-side with `POST https://api-prod.duitku.com/api/merchant/createInvoice`; use `https://api-sandbox.duitku.com/api/merchant/createInvoice` for sandbox.
- Sign create-invoice requests with HMAC-SHA256 using the current POP formula documented by Duitku. Do not use legacy SHA256/MD5 signatures.
- Keep merchant credentials in Supabase Edge Function secrets; never expose them to the browser or commit them.
- Persist Duitku `reference` and the returned `paymentUrl`. This application uses payment-page redirection; the browser return URL and JavaScript callback are for user feedback only.
- Receive server-to-server callback as `application/x-www-form-urlencoded`; validate the callback HMAC-SHA256 signature and match merchant order ID and amount before changing transaction state.
- Return HTTP 200 only after a valid callback is safely handled. Make processing idempotent because Duitku can retry callbacks.
- Do not mark an order paid from the browser redirect or JS callback. Use the verified server callback and/or a trusted server-side status reconciliation flow.
- Do not recreate an invoice with the same merchant order ID while a previous request is still in progress or with a changed amount.

## Migration safety

1. Run `verification/preflight_readonly.sql` against the intended environment and save redacted output.
2. Compare the active schema and migration history with the repository before designing SQL.
3. Create a new timestamped migration; do not rewrite a migration that may already have been applied.
4. Review the exact diff, data impact, locking, RLS/grants, function privileges, rollback and acceptance tests.
5. Apply to development/staging first. Production execution requires separate explicit approval.

The existing `20261009000000_init_ecommerce_duitku.sql` is a historical bootstrap migration and includes demo product upserts. **Do not blindly replay it against a live project.** The active schema and migration history have not been verified by this repository patch.

## Payment acceptance checks

- Valid signed sandbox callback updates only the matching order/payment and amount.
- Invalid signature, unknown order, or amount mismatch does not mutate payment/order/stock.
- Duplicate callbacks and status reconciliation are idempotent.
- Expired/cancelled orders do not become paid automatically.
- Callback and reconciliation cannot double-commit inventory.
- Privileged RPCs use a safe `search_path` and minimal execute grants.
- No service-role key or Duitku secret is shipped to the frontend.
