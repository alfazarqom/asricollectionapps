# Local/Sandbox Test Checklist

Status at upload: NOT RUN.

- [ ] Valid Create Invoice signature.
- [ ] Invalid signature rejected.
- [ ] Provider error response handled without creating a false payment record.
- [ ] Client amount ignored; amount recalculated from stored order/items.
- [ ] Shipping fee and approval required before invoice.
- [ ] Callback form-urlencoded parsing.
- [ ] Invalid callback signature rejected.
- [ ] Callback merchant/order/reference mismatch rejected.
- [ ] Callback amount mismatch rejected.
- [ ] Duplicate callback processed idempotently.
- [ ] Database failure does not return false success.
- [ ] Pending expiry cannot overwrite successful payment.
- [ ] Guest order status cannot be read by guessing an order UUID.
- [ ] Reconciliation rejects unauthorized callers and unsupported evidence.
- [ ] No stock decrement/release unless an approved atomic inventory mechanism exists.
- [ ] Lint/typecheck/build results recorded; do not claim tests passed unless actually run.

Use only Duitku Sandbox and synthetic test orders. No real payment.
