-- READ-ONLY post-migration checks. Run only after an approved migration.
-- These queries inspect metadata; they do not prove application-level behavior.

SELECT version, name
FROM supabase_migrations.schema_migrations
ORDER BY version;

SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'orders', 'order_items', 'payments', 'callback_events',
    'inventory_reservations', 'admin_users', 'audit_logs', 'products'
  )
ORDER BY table_name, ordinal_position;

SELECT n.nspname AS schema_name, p.proname AS function_name,
       pg_get_function_identity_arguments(p.oid) AS arguments,
       p.prosecdef AS security_definer,
       p.proconfig AS function_settings,
       p.proacl AS privileges
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'process_duitku_callback_atomic',
    'reserve_inventory_atomic',
    'commit_inventory_atomic',
    'release_expired_reservations'
  )
ORDER BY p.proname, arguments;

SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'orders', 'order_items', 'payments', 'callback_events',
    'inventory_reservations', 'admin_users', 'audit_logs', 'products'
  )
ORDER BY tablename, policyname;

-- Application-level acceptance tests are still required separately:
-- * valid signed sandbox callback updates a matching pending payment once;
-- * duplicate callback is idempotent;
-- * amount/order mismatch does not alter order/payment/stock;
-- * invalid signature does not alter order/payment/stock;
-- * callback and status reconciliation cannot double-commit stock;
-- * expired/cancelled orders do not become paid automatically;
-- * anonymous clients cannot read payment/customer data without a valid scoped token;
-- * inventory reservations check available stock under concurrency.
