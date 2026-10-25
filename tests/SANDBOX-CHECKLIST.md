# Duitku POP Sandbox Checklist — Review Draft

Status: NOT RUN. This checklist is not evidence that the integration is ready for production.
Do not deploy, apply SQL, or use real payment credentials as part of this review.

## Preflight
- [ ] Re-audit live schema and compare every column used by draft functions/RPCs.
- [ ] Confirm exact Duitku POP create-invoice and callback contracts against current official docs.
- [ ] Confirm payment_callback_events.event_fingerprint has a unique constraint/index before relying on ON CONFLICT.
- [ ] Confirm payment status constraints include every status referenced by the draft.
- [ ] Review order state names; align pending/paid/failed/expired with the actual application.
- [ ] Confirm orders.order_number, orders.total_amount, customer fields, shipping approval, and checkout-token columns exist or revise the draft.
- [ ] Review callback event columns and nullability.
- [ ] Review grants/RLS and ensure only trusted server-side code can execute privileged RPCs.
- [ ] Confirm no service-role key or Duitku API key is exposed to frontend or committed to the repository.

## Sandbox cases
- [ ] Valid create-invoice request with valid guest checkout token.
- [ ] Missing/expired/incorrect checkout token rejected.
- [ ] Tampered order ID and tampered amount rejected.
- [ ] Shipping not yet approved rejected.
- [ ] Duplicate invoice request returns existing pending invoice or a safe conflict.
- [ ] Provider timeout recorded as unknown; no blind duplicate invoice attempt.
- [ ] Invalid callback signature rejected and recorded.
- [ ] Valid callback for matching merchant order ID, amount, and reference accepted.
- [ ] Duplicate callback is idempotent.
- [ ] Amount/reference/merchant mismatch does not mark an order paid.
- [ ] Callback race during invoice persistence does not regress paid to pending.
- [ ] Late success after local expiry routes to reconciliation and does not silently claim inventory.
- [ ] Expiry job cannot overwrite a successful payment.
- [ ] Public status endpoint returns only data authorized by the checkout token.
- [ ] Reconciliation endpoint is operator-only and read-only until an official inquiry contract is verified.

## Exit criteria
- [ ] Static/type checks pass locally.
- [ ] SQL draft reviewed against a fresh schema snapshot; not applied without separate approval.
- [ ] Sandbox tests recorded with sanitized IDs and no secrets.
- [ ] Security review completed for CORS, token entropy/storage, rate limiting, RPC grants, logging, and idempotency.
- [ ] Explicit approval received before any deployment, migration, or secret change.
