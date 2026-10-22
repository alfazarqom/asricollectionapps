-- Add explicit physical inventory and make reservation/payment stock transitions atomic.
-- Existing products default to zero because historical physical quantities are not known.
-- Operators must populate stock_quantity from a verified count before accepting new orders.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stock_quantity integer NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_stock_quantity_nonnegative'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_stock_quantity_nonnegative CHECK (stock_quantity >= 0);
  END IF;
END $$;

UPDATE public.products
SET availability = 'out of stock'
WHERE stock_quantity = 0 AND availability <> 'preorder';

CREATE OR REPLACE FUNCTION public.reserve_inventory_atomic(
  p_order_id uuid,
  p_product_id character varying,
  p_quantity integer,
  p_minutes integer DEFAULT 30
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  v_stock integer;
  v_availability varchar;
  v_reserved integer;
BEGIN
  IF p_quantity IS NULL OR p_quantity <= 0 OR p_minutes IS NULL OR p_minutes <= 0 THEN
    RAISE EXCEPTION 'Invalid quantity or reservation duration';
  END IF;

  SELECT stock_quantity, availability
    INTO v_stock, v_availability
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  IF v_availability = 'preorder' THEN
    RAISE EXCEPTION 'Preorder inventory is not supported by this reservation flow';
  END IF;

  SELECT COALESCE(SUM(quantity), 0)::integer
    INTO v_reserved
  FROM public.inventory_reservations
  WHERE product_id = p_product_id
    AND status = 'reserved'
    AND expires_at > now();

  IF v_stock - v_reserved < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock';
  END IF;

  INSERT INTO public.inventory_reservations (
    order_id, product_id, quantity, status, expires_at
  ) VALUES (
    p_order_id, p_product_id, p_quantity, 'reserved',
    now() + make_interval(mins => p_minutes)
  );

  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.process_duitku_callback_atomic(
  p_merchant_order_id character varying,
  p_amount numeric,
  p_result_code character varying,
  p_reference character varying,
  p_payment_method character varying,
  p_raw_payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  v_order public.orders%ROWTYPE;
  v_is_success boolean;
  v_new_status varchar;
  v_inventory_committed boolean := false;
  v_reservation_count integer := 0;
  v_active_count integer := 0;
  v_item record;
  v_stock integer;
BEGIN
  SELECT * INTO v_order
  FROM public.orders
  WHERE order_number = p_merchant_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'status_code', 404, 'message', 'Order not found');
  END IF;

  IF p_amount IS NULL OR ABS(v_order.total_amount - p_amount) > 0.01 THEN
    RETURN jsonb_build_object('success', false, 'status_code', 400, 'message', 'Amount mismatch');
  END IF;

  IF v_order.payment_status = 'paid' THEN
    RETURN jsonb_build_object('success', true, 'status_code', 200, 'message', 'Already paid (idempotent)', 'already_processed', true);
  END IF;

  v_is_success := (p_result_code = '00');
  v_new_status := CASE WHEN v_is_success THEN 'paid' ELSE 'failed' END;

  IF v_is_success THEN
    SELECT COUNT(*)::integer,
           COUNT(*) FILTER (WHERE status = 'reserved' AND expires_at > now())::integer
      INTO v_reservation_count, v_active_count
    FROM public.inventory_reservations
    WHERE order_id = v_order.id;

    -- Commit stock only if every expected reservation is still live.
    -- A late payment is recorded, but inventory is NOT automatically reallocated.
    IF v_reservation_count > 0 AND v_reservation_count = v_active_count THEN
      -- Lock products in stable order and verify every stock decrement before applying any.
      FOR v_item IN
        SELECT product_id, SUM(quantity)::integer AS quantity
        FROM public.inventory_reservations
        WHERE order_id = v_order.id AND status = 'reserved'
        GROUP BY product_id
        ORDER BY product_id
      LOOP
        SELECT stock_quantity INTO v_stock
        FROM public.products
        WHERE id = v_item.product_id
        FOR UPDATE;

        IF NOT FOUND OR v_stock < v_item.quantity THEN
          v_inventory_committed := false;
          EXIT;
        END IF;
      END LOOP;

      IF FOUND OR v_reservation_count > 0 THEN
        -- FOUND is reset by the last SELECT above; recheck the complete set before writes.
        IF NOT EXISTS (
          SELECT 1
          FROM (
            SELECT r.product_id, SUM(r.quantity)::integer AS quantity
            FROM public.inventory_reservations r
            WHERE r.order_id = v_order.id AND r.status = 'reserved'
            GROUP BY r.product_id
          ) required
          LEFT JOIN public.products p ON p.id = required.product_id
          WHERE p.id IS NULL OR p.stock_quantity < required.quantity
        ) THEN
          UPDATE public.products p
          SET stock_quantity = p.stock_quantity - required.quantity,
              availability = CASE
                WHEN p.stock_quantity - required.quantity <= 0 THEN 'out of stock'
                ELSE 'in stock'
              END,
              updated_at = now()
          FROM (
            SELECT product_id, SUM(quantity)::integer AS quantity
            FROM public.inventory_reservations
            WHERE order_id = v_order.id AND status = 'reserved'
            GROUP BY product_id
          ) required
          WHERE p.id = required.product_id;

          UPDATE public.inventory_reservations
          SET status = 'committed'
          WHERE order_id = v_order.id AND status = 'reserved';

          v_inventory_committed := true;
        END IF;
      END IF;
    END IF;
  ELSE
    UPDATE public.inventory_reservations
    SET status = 'released'
    WHERE order_id = v_order.id AND status = 'reserved';
  END IF;

  UPDATE public.orders
  SET payment_status = v_new_status,
      fulfillment_status = CASE
        WHEN v_is_success AND v_inventory_committed AND fulfillment_status = 'unfulfilled' THEN 'processing'
        ELSE fulfillment_status
      END,
      duitku_reference = COALESCE(v_order.duitku_reference, p_reference),
      updated_at = now()
  WHERE id = v_order.id;

  INSERT INTO public.payments (
    order_id, merchant_order_id, reference, duitku_reference, amount,
    payment_amount, payment_method, payment_status, result_code,
    duitku_result_code, status, paid_at, raw_payload, updated_at
  ) VALUES (
    v_order.id, p_merchant_order_id,
    COALESCE(p_reference, v_order.duitku_reference, p_merchant_order_id),
    COALESCE(p_reference, v_order.duitku_reference, p_merchant_order_id),
    p_amount, p_amount, p_payment_method, v_new_status, p_result_code,
    p_result_code, v_new_status,
    CASE WHEN v_is_success THEN now() ELSE NULL END,
    p_raw_payload, now()
  )
  ON CONFLICT (merchant_order_id) DO UPDATE SET
    payment_status = EXCLUDED.payment_status,
    status = EXCLUDED.status,
    result_code = EXCLUDED.result_code,
    duitku_result_code = EXCLUDED.duitku_result_code,
    paid_at = CASE WHEN v_is_success THEN now() ELSE public.payments.paid_at END,
    raw_payload = EXCLUDED.raw_payload,
    updated_at = now();

  INSERT INTO public.audit_logs (order_id, actor, action, details)
  VALUES (
    v_order.id,
    'duitku_callback_sp',
    CASE
      WHEN v_is_success AND v_inventory_committed THEN 'PAYMENT_CONFIRMED_STOCK_COMMITTED'
      WHEN v_is_success THEN 'PAYMENT_RECEIVED_REQUIRES_INVENTORY_RECONCILIATION'
      ELSE 'PAYMENT_FAILED'
    END,
    jsonb_build_object(
      'amount', p_amount,
      'result_code', p_result_code,
      'reference', p_reference,
      'inventory_committed', v_inventory_committed,
      'requires_reconciliation', v_is_success AND NOT v_inventory_committed
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'status_code', 200,
    'message', CASE
      WHEN v_is_success AND NOT v_inventory_committed THEN 'Payment received; inventory reconciliation required'
      ELSE 'Processed successfully'
    END,
    'inventory_committed', v_inventory_committed,
    'requires_reconciliation', v_is_success AND NOT v_inventory_committed
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_update_order_shipping_atomic(
  p_order_number character varying,
  p_courier_name character varying,
  p_tracking_number character varying,
  p_fulfillment_status character varying,
  p_shipping_cost numeric,
  p_shipping_notes text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  v_order public.orders%ROWTYPE;
  v_total numeric;
BEGIN
  IF p_shipping_cost IS NULL OR p_shipping_cost < 0 THEN
    RAISE EXCEPTION 'Shipping cost must be non-negative';
  END IF;
  IF p_fulfillment_status NOT IN ('unfulfilled', 'processing', 'shipped', 'delivered', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid fulfillment status';
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE order_number = p_order_number
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'status_code', 404, 'message', 'Order not found');
  END IF;

  v_total := v_order.subtotal + p_shipping_cost - v_order.discount_amount;

  UPDATE public.orders
  SET courier_name = NULLIF(trim(p_courier_name), ''),
      tracking_number = NULLIF(trim(p_tracking_number), ''),
      fulfillment_status = p_fulfillment_status,
      shipping_cost = p_shipping_cost,
      shipping_notes = NULLIF(trim(p_shipping_notes), ''),
      total_amount = v_total,
      updated_at = now()
  WHERE id = v_order.id;

  INSERT INTO public.audit_logs (order_id, actor, action, details)
  VALUES (
    v_order.id, 'admin_api', 'SHIPPING_UPDATED',
    jsonb_build_object(
      'courier_name', p_courier_name,
      'tracking_number', p_tracking_number,
      'fulfillment_status', p_fulfillment_status,
      'shipping_cost', p_shipping_cost
    )
  );

  RETURN jsonb_build_object('success', true, 'status_code', 200);
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_update_order_shipping_atomic(character varying, character varying, character varying, character varying, numeric, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_order_shipping_atomic(character varying, character varying, character varying, character varying, numeric, text) TO service_role;
