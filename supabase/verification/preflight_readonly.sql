-- READ-ONLY preflight for the intended Supabase project.
-- Metadata only: no customer/order rows are selected and no changes are made.
-- Redact identifiers before sharing output.

-- 1. Confirm whether migration history is available.
SELECT to_regclass('supabase_migrations.schema_migrations') AS migration_history_table;
-- If the result is non-NULL, inspect migration history separately in the Supabase
-- dashboard or with the Supabase CLI for the same target environment.

-- 2. Relevant public tables and columns.
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'orders', 'order_items', 'payments', 'callback_events',
    'inventory_reservations', 'admin_users', 'audit_logs', 'products'
  )
ORDER BY table_name, ordinal_position;

-- 3. RLS state and policies.
SELECT n.nspname AS schema_name, c.relname AS table_name,
       c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind IN ('r', 'p')
  AND c.relname IN (
    'orders', 'order_items', 'payments', 'callback_events',
    'inventory_reservations', 'admin_users', 'audit_logs', 'products'
  )
ORDER BY c.relname;

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'orders', 'order_items', 'payments', 'callback_events',
    'inventory_reservations', 'admin_users', 'audit_logs', 'products'
  )
ORDER BY tablename, policyname;

-- 4. Constraints and indexes.
SELECT conrelid::regclass AS table_name, conname, contype,
       pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
  AND conrelid::regclass::text IN (
    'orders', 'order_items', 'payments', 'callback_events',
    'inventory_reservations', 'admin_users', 'audit_logs', 'products'
  )
ORDER BY table_name, conname;

SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'orders', 'order_items', 'payments', 'callback_events',
    'inventory_reservations', 'admin_users', 'audit_logs', 'products'
  )
ORDER BY tablename, indexname;

-- 5. Duitku/payment and inventory RPC definitions, security settings and grants.
SELECT n.nspname AS schema_name, p.proname AS function_name,
       pg_get_function_identity_arguments(p.oid) AS arguments,
       p.prosecdef AS security_definer, p.proconfig AS function_settings,
       pg_get_userbyid(p.proowner) AS owner, p.proacl AS privileges,
       pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'process_duitku_callback_atomic', 'reserve_inventory_atomic',
    'commit_inventory_atomic', 'release_expired_reservations'
  )
ORDER BY p.proname, arguments;

-- 6. Triggers and possible canonical stock/variant columns.
SELECT event_object_table AS table_name, trigger_name, action_timing,
       event_manipulation, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN (
    'orders', 'order_items', 'payments', 'callback_events',
    'inventory_reservations', 'products'
  )
ORDER BY event_object_table, trigger_name;

SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    column_name ILIKE '%stock%' OR column_name ILIKE '%quantity%'
    OR column_name ILIKE '%inventory%' OR column_name ILIKE '%variant%'
  )
ORDER BY table_name, ordinal_position;
