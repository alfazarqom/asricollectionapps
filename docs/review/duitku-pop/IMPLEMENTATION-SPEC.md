# Implementation Specification — Review Draft

## Common rules
- No Supabase Auth. Do not trust an order UUID alone as proof of guest ownership.
- Use only existing tables `orders`, `order_items`, `payment_transactions`, and `payment_callback_events` unless a separately approved migration expands the schema.
- Store provider API key and merchant code only as server secrets; never return them to the browser.
- Amounts are integer IDR and must be recomputed/verified server-side.
- Browser redirects and JavaScript callbacks are not payment proof.
- Use conditional status transitions and idempotent processing. Never let an old pending/expiry event overwrite a confirmed payment.

## 1. duitku-create-invoice
- Validate the caller's order-access proof using an explicitly designed guest access mechanism.
- Read order and items from the database; do not trust client amount, item price, shipping fee, or payment status.
- Verify the order is payable and shipping fee/approval are finalized.
- Create the request signature per official POP docs: HMAC-SHA256 of `merchantCode + timestamp`, using the API key.
- Call the documented Sandbox endpoint first: `https://api-sandbox.duitku.com/api/merchant/createInvoice`.
- Validate transport status and provider response fields; persist provider reference and payment URL in `payment_transactions` using actual schema columns.
- Do not write non-existent columns on `orders`.

## 2. duitku-callback
- Parse `application/x-www-form-urlencoded`.
- Validate merchant code, amount, merchant order ID, provider reference, result code, and signature.
- Callback signature input per POP docs: `merchantCode + amount + merchantOrderId`; HMAC-SHA256 with the API key.
- Match an existing transaction and amount before applying any state change.
- Record callback processing in `payment_callback_events`; duplicate deliveries must not repeat business effects.
- Return HTTP 200 only after successful handling; errors must not be disguised as success.

## 3. get-payment-status
- Read-only status endpoint.
- Require a secure guest order access mechanism; UUID knowledge alone must not disclose order data.
- Return minimal order/payment status; never accept a client-supplied status as an update.
- Do not call provider or change stock in this endpoint.

## 4. reconcile-payment
- Draft is operator-only and read-only until provider verification and operator authorization are specified.
- Do not invent a Duitku inquiry endpoint.
- Do not mark payment successful based only on a browser redirect, callback HTTP status, or unsupported evidence.
- Log evidence and outcome in existing structures only if the schema supports it.

## 5. expire-pending-payments
- Process only transactions with a stored, approved expiry timestamp.
- Use a conditional transition that cannot overwrite a successful payment.
- Provider invoice expiry is not automatically equivalent to an internal stock reservation expiry.
- No automatic stock release is safe until the atomic inventory model is approved and available.

## Database/RPC design gates
- Audit exact columns, enum/check values, uniqueness, foreign keys, triggers, grants, and RLS before writing final SQL.
- Proposed RPCs are review-only; do not create or execute them yet.
- Any RPC that updates payment/order state must validate current state, amount, transaction identity, and idempotency inside one database transaction.
- Avoid SECURITY DEFINER unless required; if used, pin search_path, qualify object names, revoke broad EXECUTE, and grant only to the intended server role.
- Hardening grants may break current callers. Inventory caller paths and test before applying.
- The audited baseline lacks `inventory_reservations`; do not imply stock reservation exists.

## Acceptance criteria
- Invalid signature and mismatched amount are rejected.
- Duplicate callback has no duplicate side effects.
- No cross-customer order disclosure.
- Payment success derives from verified server-side evidence.
- No secret is logged or returned.
- Tests are run only in local/Sandbox; unrun tests must be marked NOT RUN.
