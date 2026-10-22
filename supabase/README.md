# Supabase workspace

This directory contains the Supabase CLI configuration, Edge Functions, and database migration history for Asri Collection.

## Scope and safety

- Target project reference currently documented by the project: `mvwflakurihhakdrlteg`.
- Repository branch: `fix/remove-duitku-simulator-and-harden-callback-2026-10-22`.
- Preparing SQL files is not authorization to apply them to a Supabase project.
- Never run `supabase db push`, `supabase migration up`, or deploy Edge Functions against production until the active schema has been inspected, the exact migration reviewed, a backup/rollback plan recorded, and the user has separately approved execution.
- Do not put project API keys, service-role keys, Duitku merchant credentials, or PINs in this directory or commit them.
- Keep generated/local `.env` files out of Git. Use `.env.example` only for variable names and placeholders.

## Current layout

- `config.toml`: Supabase CLI project configuration.
- `functions/`: Edge Functions for invoice creation, callback verification, payment status, and public reads.
- `migrations/`: ordered SQL history. Existing migration files are historical artifacts and must not be assumed to match the active database.
- `verification/`: read-only SQL preflight and post-migration checks. These scripts do not mutate database state.

## Migration workflow

1. **Preflight read-only:** run `verification/preflight_readonly.sql` in the intended project and save the redacted output.
2. **Compare:** compare active tables, columns, constraints, indexes, RLS, grants, and function definitions with the repository migration history.
3. **Plan:** create a new timestamped migration; do not silently rewrite a migration that may already have been applied.
4. **Review:** inspect the SQL diff and confirm assumptions, lock impact, data transformations, rollback strategy, and acceptance tests.
5. **Backup and approval:** ensure an appropriate backup/restore point exists and obtain explicit approval for the exact project and migration.
6. **Apply in development/staging first:** use Supabase CLI migration tooling and review the output.
7. **Verify:** run `verification/post_migration_readonly.sql`, exercise callback idempotency and amount-mismatch tests in sandbox, and inspect logs.
8. **Production:** separate approval required; never infer production approval from staging approval.

## Known blockers in the current baseline

The existing `20261009000000_init_ecommerce_duitku.sql` is a broad, historical bootstrap migration that includes demo product upserts. It also defines inventory reservation RPCs that change reservation state but do not themselves prove a decrement of product stock. The active database schema and migration history have not been verified here. Therefore this directory is being made migration-ready, not declaring the existing SQL safe to apply.

Before writing a new production migration, resolve at least:
- whether the existing migration has already been applied to the active project;
- whether the active `products` table has a canonical stock/variant model;
- whether `process_duitku_callback_atomic` exists and its exact definition;
- whether callback RPC privileges and `search_path` are hardened;
- how order and payment records from the legacy server are represented;
- how existing pending invoices will continue to receive callbacks.
