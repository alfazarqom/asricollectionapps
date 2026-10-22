-- READ-ONLY preflight. Safe for inspection: contains SELECT statements only.
-- Run against the intended project before designing/applying a migration.
-- Review output for sensitive identifiers before attaching it to a PR.

-- 1. Migration history, if Supabase CLI has created the history table.
SELECT
  to_regclass('supabase_migrations.schema_migrations') AS migration_history_table;

SELECT version, name
FROM supabase_migrations.schema_migrations
ORDER BY version;

-- 2. Relevant public tables and columns.
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'orders', 'order_items', 'payments', 'callback_events',
    'inventory_reservations', 'admin_users', 'audit_logs', 'products'
  )
ORDER BY table_name, ordinal_position;

-- 3. RLS state.
SELECT n.nspname AS schema_name, c.relname AS table_name,
       c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind IN ('r', 'p')
  AND c.relname IN (
    'orders', 'order_items', 'payments', 'callback_events',
    'inventory_reservations', 'admin_users', 'audit_logs', 'products'
  )
ORDER BY c.relname;

-- 4. Policies.
SELECT schemaname, tablename, policyname, permissive, roles,
       cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'orders', 'order_items', 'payments', 'callback_events',
    'inventory_reservations', 'admin_users', 'audit_logs', 'products'
  )
ORDER BY tablename, policyname;

-- 5. Constraints and indexes.
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

-- 6. Privileged/public functions of interest, including their security mode.
SELECT n.nspname AS schema_name, p.proname AS function_name,
       pg_get_function_identity_arguments(p.oid) AS arguments,
       p.prosecdef AS security_definer,
       p.proconfig AS function_settings,
       pg_get_userbyid(p.proowner) AS owner,
       p.proacl AS privileges,
       pg_get_functiondef(p.oid) AS definition
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

-- 7. Trigger definitions on the relevant tables.
SELECT event_object_table AS table_name, trigger_name,
       action_timing, event_manipulation, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN (
    'orders', 'order_items', 'payments', 'callback_events',
    'inventory_reservations', 'products'
  )
ORDER BY event_object_table, trigger_name;

-- 8. Product inventory candidates. This returns column metadata only,
--    helping identify the canonical stock model without exposing product data.
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    column_name ILIKE '%stock%'
    OR column_name ILIKE '%quantity%'
    OR column_name ILIKE '%inventory%'
    OR column_name ILIKE '%variant%'
  )
ORDER BY table_name, ordinal_position;
