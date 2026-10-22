# Database migrations

## Rules

1. Use a new timestamped filename for each new migration, for example `YYYYMMDDHHMMSS_short_description.sql`.
2. Do not edit a migration that may have been applied to any shared environment. Add a forward migration instead.
3. Do not apply a migration from this branch until its exact SQL and target project are separately approved.
4. Avoid `DROP`, destructive type changes, broad `UPDATE` statements, and table rewrites without a documented data/back-up/rollback plan.
5. Do not seed sample/demo commerce records in a production migration.
6. Use explicit transactions when supported and safe; account for PostgreSQL operations that cannot run inside a transaction.
7. Every privileged function should have an explicit, minimal `GRANT`/ `REVOKE` plan, a fixed safe `search_path`, and tests for unauthorized callers.
8. RLS policies must be paired with table grants; do not assume RLS alone blocks access.
9. Migration checks should cover idempotency, amount mismatch, duplicate callbacks, terminal payment states, reservation expiry, concurrency, and rollback.
10. Add an acceptance checklist to the pull request and attach redacted preflight/post-migration results.

## Existing baseline

`20261009000000_init_ecommerce_duitku.sql` is an existing bootstrap migration. Treat it as historical until the active project's migration history has been inspected. It includes product demo upserts and should not be blindly replayed against a live database.

## Required review checklist

- [ ] Target project/environment identified.
- [ ] Active migration history inspected.
- [ ] Active schema compared with the intended before/after schema.
- [ ] Existing data and backfill impact documented.
- [ ] Foreign keys, unique constraints, indexes, and RLS/grants reviewed.
- [ ] SECURITY DEFINER functions have fixed `search_path` and minimal execute grants.
- [ ] Payment callback is idempotent and validates order ID, amount, and allowed status transition.
- [ ] Stock reservation and decrement are atomic against the actual canonical stock table.
- [ ] Rollback/restore procedure documented.
- [ ] Staging tests passed.
- [ ] Explicit approval recorded before production execution.
