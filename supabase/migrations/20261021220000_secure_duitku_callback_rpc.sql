-- Restrict payment-state RPC to the trusted backend service role.
-- Pin a safe search_path for this SECURITY DEFINER function.
ALTER FUNCTION public.process_duitku_callback_atomic(
  character varying, numeric, character varying, character varying, character varying, jsonb
) SET search_path = pg_catalog, public, pg_temp;

REVOKE ALL ON FUNCTION public.process_duitku_callback_atomic(
  character varying, numeric, character varying, character varying, character varying, jsonb
) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.process_duitku_callback_atomic(
  character varying, numeric, character varying, character varying, character varying, jsonb
) FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.process_duitku_callback_atomic(
  character varying, numeric, character varying, character varying, character varying, jsonb
) TO service_role;
