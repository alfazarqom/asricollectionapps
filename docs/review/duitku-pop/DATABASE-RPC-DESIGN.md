# Database / RPC Design — Review Only

No SQL in this document has been executed.

## Candidate operations
1. **Apply verified callback:** in one transaction, lock the matching payment row, verify order/reference/amount and current state, insert or deduplicate callback event, and update payment/order state conditionally.
2. **Expire pending payment:** in one transaction, select only expired pending rows, lock them, and transition state only if still pending.
3. **Inventory reservation:** not ready for implementation. The audited database has no `inventory_reservations` table and no confirmed atomic reservation RPC. Stock reconciliation after a late successful payment needs a separate approved design.

## Preconditions before final SQL
- Confirm actual column names and data types for all five allowlisted tables.
- Confirm existing check constraints/enums and all status values.
- Confirm unique keys for merchant order ID/provider reference and callback deduplication.
- Confirm all current checkout/order creation callers.
- Design guest access token issuance/storage/verification; do not use a UUID as authorization.
- Decide grants for `anon`, `authenticated`, and `service_role`; RLS does not protect TRUNCATE.
- Test migration on a disposable local schema and define rollback steps.

## Not authorized
- Creating tables or RPCs now.
- Running SQL against Supabase.
- Changing RLS/grants, secrets, or deployment.
