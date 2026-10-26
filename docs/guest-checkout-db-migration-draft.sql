-- REVIEW DRAFT ONLY — NOT EXECUTED
-- Target reviewed: Supabase production project mvwflakurihhakdrlteg
-- Purpose: additive guest-token lifecycle and checkout idempotency metadata only.
-- This is NOT the final checkout migration. Do not apply until separately approved.
--
-- Explicitly excluded:
--   * no RLS policy or table-grant changes
--   * no checkout/payment/inventory RPC
--   * no price/discount/shipping calculation
--   * no stock reservation logic
--   * no data backfill or changes to existing orders
--
-- Blocking decisions: canonical effective price and authoritative stock source
-- remain unconfirmed. App consumer inventory and migration-source drift review
-- must be completed before finalizing RLS/grants or the full transaction RPC.

begin;

alter table public.orders
  add column if not exists guest_access_token_hash text,
  add column if not exists guest_access_token_expires_at timestamptz,
  add column if not exists guest_access_token_revoked_at timestamptz,
  add column if not exists checkout_idempotency_key text;

do $migration$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.orders'::regclass
      and conname = 'orders_guest_access_token_hash_format_chk'
  ) then
    alter table public.orders
      add constraint orders_guest_access_token_hash_format_chk
      check (
        guest_access_token_hash is null
        or guest_access_token_hash ~ '^[0-9a-f]{64}$'
      );
  end if;
end
$migration$;

create unique index if not exists orders_guest_access_token_hash_uidx
  on public.orders (guest_access_token_hash)
  where guest_access_token_hash is not null;

create unique index if not exists orders_checkout_idempotency_key_uidx
  on public.orders (checkout_idempotency_key)
  where checkout_idempotency_key is not null;

comment on column public.orders.guest_access_token_hash is
  'SHA-256 hex digest of a high-entropy guest access token; never store the raw token.';
comment on column public.orders.guest_access_token_expires_at is
  'Guest access token expiry. Proposed checkout TTL is 24 hours; enforcement belongs in the server-side endpoint.';
comment on column public.orders.guest_access_token_revoked_at is
  'Timestamp at which guest access was revoked; enforcement belongs in the server-side endpoint.';
comment on column public.orders.checkout_idempotency_key is
  'Unique server-validated checkout idempotency key; never trust it as authorization.';

commit;

-- Review notes:
-- 1. Null values preserve compatibility with existing orders; no backfill is performed.
-- 2. Token generation, SHA-256 hashing, expiry enforcement, rate limiting and safe response projection
--    must be implemented and tested in a server-side Edge Function.
-- 3. The unique idempotency index assumes one key per order globally. Confirm the intended key scope
--    (e.g. client session/device) before treating this as final.
-- 4. Existing migration history already lists guest checkout/idempotency migrations. Reconcile their
--    source and active schema before applying any migration to production.
-- 5. No RLS/grants changes are included because application consumer inventory is not yet complete.
