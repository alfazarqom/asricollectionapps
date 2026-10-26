# Guest Checkout Server-Side — Security Gate

**Status:** BLOCKED pending a separate database change approval  
**Repository:** `alfazarqom/asricollectionapps`  
**Design branch:** `feat/guest-checkout-security-gate`  
**Baseline:** `main` at `795fb50352c4f14bf38dcd2f495c563ed41d4d02`  
**Scope guard:** No database changes, secret/config changes, merge, deployment, or Sandbox payment transactions.

## Decision

Do not implement or enable the guest order-access token flow against the current schema. The current schema cannot provide a complete secure guest checkout using application code alone. The branch is intentionally limited to this design/blocker record until a separate database change is approved. This is not a completed checkout implementation.

## Evidence collected

- `src/pages/Cart.jsx` currently creates an order from the browser using `createOrderInSupabase`, catches and suppresses a pre-record failure, then independently calls `duitku-create-invoice`. The browser submits totals, item names/prices/quantities and customer details.
- `supabase/functions/duitku-create-invoice/index.ts` accepts `paymentAmount`, `merchantOrderId`, `itemDetails`, and customer data from the caller. It does not create the order from authoritative product rows before requesting the invoice.
- The active `public.orders` schema includes `id`, `merchant_order_id`, `amount`, `total_amount`, customer/contact/address fields and payment fields, but no guest token hash, token expiry, or revocation field/table.
- The active `public.order_items` schema includes order/product IDs, title, price, quantity and subtotal.
- Read-only `pg_policies` inspection found permissive public policies:
  - `orders`: public INSERT with `WITH CHECK (true)` and public SELECT with `USING (true)`.
  - `order_items`: public INSERT with `WITH CHECK (true)` and public SELECT with `USING (true)`.
  These policies allow direct API access outside any proposed token-gated Edge Function. A token check in an Edge Function alone would not protect order data while these policies remain.
- Active product schema has more than one possible product source/table. `public.products` has `price` and `original_price`; `public.products_contoh` has `price` and `sale_price`. The canonical checkout price source/rule must be confirmed rather than guessed.
- Duitku POP documentation specifies `paymentAmount` as an integer and, when `itemDetails` is sent, its item total must equal `paymentAmount`. Fractional existing `orders.total_amount` values were identified in the preceding audit; they must not be silently rounded.

## Why implementation is paused

1. **Guest authorization:** No independent, approved token-signing secret or persisted token-verification/revocation structure is available. Reusing the Duitku API key or Supabase service-role key as an order-token secret is not an acceptable substitute.
2. **Direct table bypass:** Public SELECT policies expose orders and order items independently of the Edge Function. Public INSERT policies also let clients bypass server-side checkout.
3. **Atomic checkout:** Creating an order and its items through separate REST writes is not a database transaction. Compensating deletes do not guarantee atomicity under concurrency or partial failures.
4. **Canonical pricing:** The browser cart is untrusted and the active schema has competing product representations and price fields. Checkout must load the canonical product rows and calculate prices/totals server-side.
5. **Duitku amount contract:** The final payable amount must be a safe integer IDR amount and match the item-detail total exactly. Existing fractional/mismatched order totals need a separately defined reconciliation policy before affected orders can be paid.

## Required database approval — proposed scope only

No SQL has been run for these changes. Approve a separate, exact migration plan before implementation:

- Add a transactional database operation (preferably a narrowly scoped RPC) that creates an order and its order items atomically from validated product IDs and quantities, calculates all line totals and totals from canonical product prices, and enforces stock/availability rules.
- Add secure guest-order credential persistence, preferably storing only a cryptographic hash of a high-entropy random token plus expiry/revocation metadata. Return the raw token only once to the checkout client.
- Replace unrestricted public `SELECT` and `INSERT` policies on `orders` and `order_items` with least-privilege access. Ensure guests cannot read those tables directly; expose only a token-verified server-side lookup endpoint.
- Confirm the canonical product table and effective price field/rule (including whether sale price applies), integer-IDR rounding/rejection policy, discount eligibility, shipping-fee calculation, and stock-reservation behavior.
- Review grants, RLS, indexes, function execution privileges and `search_path`; ensure privileged RPCs cannot be invoked to bypass validation.

## Target design after approval

1. Client sends only product identifiers, quantities, approved variant data if applicable, and customer/shipping input. It never supplies authoritative prices or payable totals.
2. Server validates shape and limits, loads active products, computes canonical prices and discounts, checks integer IDR rules, and creates the order plus items atomically.
3. Server creates a high-entropy guest token; only its hash and lifecycle metadata are persisted. Raw token is returned once and used as a bearer credential only for narrowly scoped order access.
4. Invoice creation accepts the order identifier and guest token, validates access server-side, reloads the persisted order and items, and builds Duitku `paymentAmount`/`itemDetails` itself. It must not trust client-supplied item or customer pricing fields.
5. Order status, payment callback, and guest lookup use separate authorization paths. Duitku callback authenticity is validated using the current official POP contract; frontend return URLs remain display-only.
6. Direct table access is denied to public callers. Logs never contain raw guest tokens, signatures, API keys or unnecessary personal data.

## Acceptance tests required before release

- Forged or stale prices do not change persisted order totals.
- Unknown, inactive, unavailable, duplicated, or excessive-quantity product requests are rejected.
- `itemDetails` sum exactly equals integer `paymentAmount`; fractional payable totals are rejected or handled by an explicitly approved policy, never silently rounded.
- Concurrent checkout requests cannot create partial order/order-item sets or oversell stock.
- A wrong, missing, expired, revoked or order-mismatched guest token cannot retrieve another order.
- Public direct SELECT/INSERT on `orders` and `order_items` is denied; the approved server endpoints continue to work.
- Duplicate invoice attempts and duplicate/out-of-order callbacks remain safe and idempotent.
- Unit/static tests and local mocked integration tests pass. No live Sandbox or production transaction is required for these tests.

## Change-control state

- Branch created; this document only is intended on the branch at this stage.
- No database, secrets, configuration, deployed function, or production data changed.
- No payment transaction, merge, or deployment performed.
- Guest-token and server-side checkout implementation remain **NOT IMPLEMENTED** until the separate database plan is explicitly approved.
