/*
ASRI COLLECTION — GUEST CHECKOUT DB MIGRATION REVIEW DRAFT
Target: production project mvwflakurihhakdrlteg
Status: REVIEW ONLY — NOT APPROVED — NOT EXECUTABLE
Branch: feat/guest-checkout-security-gate

IMPORTANT SAFETY GUARD:
This file intentionally raises an exception if executed. Do not remove the guard
until pricing, stock semantics, RPC contract, and consumer/grant audit are approved.
Do not copy this file into supabase/migrations yet.

Confirmed design inputs:
- Product source: public.products (order_items.product_id FK points here).
- Guest access token lifetime: 24 hours.
- Environment: production target, but no production mutation is authorized.
- Price rule: UNRESOLVED.
- Stock source/semantics: UNRESOLVED.
- RLS/direct grants: NOT FINAL; consumers must be migrated first.

Read-only findings to account for:
- public.orders and public.order_items currently have broad anon/authenticated table
  privileges and permissive public INSERT/SELECT policies.
- Current browser Cart.jsx creates an order directly, suppresses order-create errors,
  then independently calls duitku-create-invoice with client-supplied amount/itemDetails.
- Existing public RPC audit found no checkout/order/payment/stock RPC in public.
- Active orders data has amount vs total_amount inconsistencies and fractional total_amount
  values; do not silently round or assume either column is canonical.
- Existing migrations include older asri_* schema histories that were later dropped;
  do not reuse their table names/SQL without reconciling against the active public schema.

NEXT STEPS REQUIRED BEFORE THIS CAN BECOME A RUNNABLE MIGRATION:
1. Confirm authoritative price expression: products.price only, or an explicit validated
   sale-price rule (including whether original_price/discount_percentage participates).
2. Confirm stock source and behavior: products.stock, decrement-at-checkout vs reservation,
   and how cancellation/expiry restores stock.
3. Complete repository-wide consumer audit for order reads/writes, admin flows, tracking,
   payment callbacks, and any RPC/function calls; verify each affected caller can be moved.
4. Confirm actual grants and default privileges for anon/authenticated/service_role, including
   column-level grants and function EXECUTE privileges.
5. Design and test a transactional RPC and idempotency behavior before changing RLS/grants.
6. Decide the guest token transport and verification endpoint. Store only a cryptographic hash;
   never log or persist the raw bearer token.
7. Reconcile existing amount/total_amount data and Duitku integer-IDR requirements without
   automatic rounding.
8. Obtain separate explicit approval for the exact finalized SQL before any execution.

-- Intentional hard stop: this is a review artifact, not an executable migration.
DO $guard$
BEGIN
  RAISE EXCEPTION
    'REVIEW-ONLY DRAFT: unresolved price/stock and consumer/grant audit; do not execute.';
END
$guard$;

-- Additional read-only audit findings (2026-10-26):
-- - information_schema.role_table_grants reports broad anon/authenticated privileges
--   (including INSERT/SELECT/UPDATE/DELETE/TRUNCATE) on orders/order_items/products/
--   promo_codes/users. RLS is still a separate control and must be audited with grants.
-- - orders/order_items have public SELECT USING (true) and INSERT WITH CHECK (true).
-- - public.users has public SELECT USING (true) and UPDATE USING (true), a separate
--   high-risk issue outside this checkout migration.
-- - Only handle_updated_at() and set_updated_at() appeared in the queried public/private
--   routine catalog; no checkout/order/payment/inventory RPC was found.
-- - App consumer evidence: Cart.jsx inserts orders and order_items through productApi.js;
--   the writes are separate REST calls. getOrderByMerchantId reads orders/order_items.
--   duitku-create-invoice currently accepts client-supplied paymentAmount/itemDetails.
--   Admin/status/history/callback consumer inventory remains incomplete.
-- - Migration history lists old guest-checkout/idempotency/callback/inventory migrations,
--   but active schema did not expose payments, callback_events, inventory_reservations,
--   nor matching RPCs. Source migration files were not verified at the expected paths.
--   Reconcile source/history/active schema before any production migration.
--
-- Proposed schema shape for review only (not executed while the guard remains):
-- ALTER TABLE public.orders
--   ADD COLUMN guest_access_token_hash text,
--   ADD COLUMN guest_access_token_expires_at timestamptz,
--   ADD COLUMN guest_access_token_revoked_at timestamptz;
--
-- CREATE UNIQUE INDEX orders_guest_access_token_hash_uidx
--   ON public.orders (guest_access_token_hash)
--   WHERE guest_access_token_hash IS NOT NULL;
--
-- Alternative if key-on-order is chosen after review:
-- ALTER TABLE public.orders ADD COLUMN checkout_idempotency_key text;
-- CREATE UNIQUE INDEX orders_checkout_idempotency_key_uidx
--   ON public.orders (checkout_idempotency_key)
--   WHERE checkout_idempotency_key IS NOT NULL;
--
-- Or, if idempotency retention/scope requires a dedicated table:
-- CREATE TABLE public.checkout_idempotency (
--   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   idempotency_key text NOT NULL UNIQUE,
--   request_hash text NOT NULL,
--   order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
--   created_at timestamptz NOT NULL DEFAULT now(),
--   expires_at timestamptz NOT NULL
-- );
--
-- These proposed statements are intentionally commented out. Token TTL is 24 hours, but
-- the database column alone does not enforce expiry. The final RPC and endpoint must.
-- These are alternatives, not instructions to apply both. Column types, index
-- strategy, idempotency retention, RPC signature, schema placement, and grants require
-- review against the final checkout contract. No RLS policy or table grant changes are
-- proposed in this draft because consumer migration has not been completed.
