# Repository–Database Drift Register

## Scope and evidence

This document records the database objects referenced by the repository migration and payment code. It does not assert that the active Supabase database has this exact schema. The active database was not queried or changed as part of this patch.

Migration inspected: supabase/migrations/20261009000000_init_ecommerce_duitku.sql.

## Objects declared by the migration

The migration defines or references the following main objects:

- Tables: orders, order_items, payments, callback_events, inventory_reservations, admin_users, audit_logs, and products.
- Payment callback RPC: process_duitku_callback_atomic.
- Inventory reservation/commit RPCs: reserve_inventory_atomic and commit_inventory_atomic.
- Supporting indexes, constraints, policies, and grants are also present in the migration and require verification against the active database.

## Drift and ambiguity to resolve read-only

| Area | Repository evidence | Active database status | Required verification |
|---|---|---|---|
| Table and column definitions | SQL migration is committed | Not verified | Compare information_schema, constraints, indexes, and row counts using read-only access |
| RLS and grants | Migration contains policy/grant logic | Not verified | Inspect table privileges and effective RLS policies |
| Callback RPC | Edge Function calls process_duitku_callback_atomic | Existence and definition not verified | Inspect function body, SECURITY DEFINER, search_path, grants, and idempotency |
| Inventory RPCs | Invoice/callback/status code calls reservation and commit functions | Runtime behavior not verified | Confirm stock checks, locking, reservation expiry, and actual stock decrement |
| Payment status updates | Callback and status-check paths exist | Runtime path not verified | Confirm one database-authoritative state transition and no double commit |
| Legacy in-memory cache | server.ts uses Map objects for orders, payments, and reservations | Not a database object | Migrate tracking and admin endpoints before removing the cache |
| Legacy server callback | server.ts retains a callback compatibility endpoint | Existing invoice callback URLs unknown | Verify old pending invoices and merchant callback configuration before disabling the endpoint |

## Patch status

This branch removes the fabricated invoice fallback, removes the interactive fake callback simulator, hardens callback signature validation, and removes the direct order-update fallback when the atomic callback RPC fails. It also removes the default admin PIN and makes server-side PIN configuration mandatory.

The following P1 consolidation is intentionally not marked complete:

1. Replace legacy in-memory order/payment/reservation storage with Supabase-backed reads and writes.
2. Migrate admin metrics, order search, and shipping updates to authorized Supabase operations.
3. Consolidate legacy status polling with the same database transaction used by callbacks.
4. Remove legacy server invoice/callback/status handlers only after all callers and old pending invoices are accounted for.
5. Verify the live schema read-only before preparing any migration.

## Change-control boundary

No active database changes, migrations, secret updates, deployments, or merges to main are authorized by this document.
