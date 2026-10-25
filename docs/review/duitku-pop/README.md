# Asri Collection — Duitku POP Implementation Review Pack

**Status:** review only; not approved for execution.  
**Target:** Supabase project `mvwflakurihhakdrlteg`; repository `alfazarqom/asricollectionapps`.  
**Branch:** `review/duitku-pop-implementation-pack`.

## Scope
- Drafts for `duitku-create-invoice`, `duitku-callback`, `get-payment-status`, `reconcile-payment`, and `expire-pending-payments`.
- Database/RPC design is review-only; no SQL was run.
- Sandbox/local testing only.
- No secrets, database changes, deployment, or merge to `main`.

## Baseline constraints from the read-only audit
- Actual payment tables: `public.payment_transactions` and `public.payment_callback_events`.
- `public.inventory_reservations` and an atomic checkout/reservation RPC were not found.
- Existing invoice function's schema assumptions and Supabase Auth usage conflict with project requirements.
- Do not apply grants hardening until all existing callers and checkout write paths have been inventoried.
- No new tables/functions should be deployed without separate explicit approval.

## Review order
1. Validate active schema/constraints and status values.
2. Review guest-order authorization and operator authorization.
3. Review request/callback signatures and idempotency.
4. Review the SQL/RPC design without executing it.
5. Run lint/build/unit tests locally and Duitku Sandbox tests; report unrun tests as NOT RUN.
6. Obtain separate approval for each concrete repository, database, secrets, or deployment operation.

## Official reference
Duitku POP documentation: https://docs.duitku.com/pop/id/

This folder is documentation for review and does not constitute permission to deploy or execute migrations.
