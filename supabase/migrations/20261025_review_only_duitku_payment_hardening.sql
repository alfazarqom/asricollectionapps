-- REVIEW ONLY — DO NOT APPLY WITHOUT A SEPARATE, EXPLICIT APPROVAL.
-- Target project: mvwflakurihhakdrlteg
-- This is a draft migration, not an execution record.
-- Preflight required: re-read schema/grants/policies and confirm the approved order-creation path.

begin;

alter table public.orders add column if not exists shipping_approved_at timestamptz;
alter table public.payment_transactions add column if not exists expires_at timestamptz;

create index if not exists payment_transactions_expiry_pending_idx
  on public.payment_transactions (expires_at, id)
  where status in ('creating', 'pending', 'unknown');

create or replace function public.apply_duitku_callback_v1(
  p_merchant_code text, p_merchant_order_id text, p_amount bigint,
  p_reference text, p_result_code text, p_signature_valid boolean,
  p_event_fingerprint text, p_error_message text default null
) returns jsonb
language plpgsql security definer set search_path = pg_catalog, public
as $function$
declare
  v_payment public.payment_transactions%rowtype;
  v_event_id uuid;
  v_new_status text;
begin
  if p_event_fingerprint is null or length(p_event_fingerprint) <> 64 then
    return jsonb_build_object('accepted', false, 'reason', 'invalid_event_fingerprint');
  end if;

  if coalesce(p_signature_valid, false) and p_merchant_code is not null then
    select * into v_payment from public.payment_transactions
      where merchant_order_id = p_merchant_order_id for update;
  end if;

  insert into public.payment_callback_events (
    payment_transaction_id, merchant_order_id, provider, result_code, amount,
    reference, signature_valid, processing_status, error_message, event_fingerprint
  ) values (
    case when v_payment.id is not null then v_payment.id else null end,
    coalesce(p_merchant_order_id, '[missing]'), 'duitku', p_result_code, p_amount,
    p_reference, coalesce(p_signature_valid, false),
    case when coalesce(p_signature_valid, false) then 'received' else 'rejected' end,
    case when coalesce(p_signature_valid, false) then null else coalesce(p_error_message, 'Signature/merchant validation failed') end,
    p_event_fingerprint
  ) on conflict (event_fingerprint) do nothing returning id into v_event_id;

  if v_event_id is null then return jsonb_build_object('accepted', true, 'duplicate', true); end if;
  if not coalesce(p_signature_valid, false) then return jsonb_build_object('accepted', false, 'reason', 'invalid_signature'); end if;

  if v_payment.id is null then
    update public.payment_callback_events set processing_status = 'rejected', error_message = 'Unknown merchant order ID', processed_at = now() where id = v_event_id;
    return jsonb_build_object('accepted', false, 'reason', 'unknown_merchant_order_id');
  end if;
  if p_amount is null or p_amount <> v_payment.amount then
    update public.payment_callback_events set processing_status = 'rejected', error_message = 'Amount mismatch', processed_at = now() where id = v_event_id;
    return jsonb_build_object('accepted', false, 'reason', 'amount_mismatch');
  end if;
  if p_reference is null or (v_payment.duitku_reference is not null and p_reference <> v_payment.duitku_reference) then
    update public.payment_callback_events set processing_status = 'rejected', error_message = 'Provider reference mismatch', processed_at = now() where id = v_event_id;
    return jsonb_build_object('accepted', false, 'reason', 'reference_mismatch');
  end if;
  if p_result_code not in ('00', '01') then
    update public.payment_callback_events set processing_status = 'rejected', error_message = 'Unsupported provider result code', processed_at = now() where id = v_event_id;
    return jsonb_build_object('accepted', false, 'reason', 'unsupported_result_code');
  end if;
  if v_payment.status in ('expired', 'cancelled', 'failed', 'refunded')
     or (v_payment.status = 'paid' and p_result_code <> '00') then
    update public.payment_callback_events set processing_status = 'error', error_message = 'Late callback for terminal payment; manual reconciliation required', processed_at = now() where id = v_event_id;
    return jsonb_build_object('accepted', true, 'needs_reconciliation', true, 'reason', 'terminal_payment_state');
  end if;

  v_new_status := case when p_result_code = '00' then 'paid' else 'failed' end;
  update public.payment_transactions set status = v_new_status,
    duitku_reference = coalesce(duitku_reference, p_reference),
    provider_result_code = p_result_code, callback_received_at = now(),
    paid_at = case when v_new_status = 'paid' then coalesce(paid_at, now()) else paid_at end,
    updated_at = now()
  where id = v_payment.id and status in ('creating', 'pending', 'unknown');

  if v_new_status = 'paid' then
    update public.orders set status = 'paid', paid_at = coalesce(paid_at, now()), updated_at = now()
      where id = v_payment.order_id and status = 'pending';
  else
    update public.orders set status = 'failed', updated_at = now()
      where id = v_payment.order_id and status = 'pending';
  end if;

  update public.payment_callback_events set processing_status = 'processed', processed_at = now() where id = v_event_id;
  return jsonb_build_object('accepted', true, 'duplicate', false, 'payment_status', v_new_status);
end;
$function$;

revoke all on function public.apply_duitku_callback_v1(text, text, bigint, text, text, boolean, text, text) from public, anon, authenticated;
grant execute on function public.apply_duitku_callback_v1(text, text, bigint, text, text, boolean, text, text) to service_role;

create or replace function public.expire_pending_duitku_payments_v1(p_limit integer default 100)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public
as $function$
declare v_expired_ids uuid[]; v_count integer;
begin
  if p_limit is null or p_limit < 1 or p_limit > 500 then raise exception 'p_limit must be between 1 and 500'; end if;
  with candidates as (
    select id from public.payment_transactions
    where status in ('creating', 'pending') and expires_at is not null and expires_at <= now()
    order by expires_at, id limit p_limit for update skip locked
  ), changed as (
    update public.payment_transactions p set status = 'expired', updated_at = now()
    from candidates c where p.id = c.id and p.status in ('creating', 'pending')
    returning p.id, p.order_id
  )
  select array_agg(id), count(*)::integer into v_expired_ids, v_count from changed;

  if coalesce(v_count, 0) > 0 then
    update public.orders o set status = 'expired', updated_at = now()
    where o.status = 'pending' and o.id in (
      select p.order_id from public.payment_transactions p where p.id = any(v_expired_ids) and p.status = 'expired'
    );
  end if;
  return jsonb_build_object('expired_count', coalesce(v_count, 0), 'payment_transaction_ids', coalesce(to_jsonb(v_expired_ids), '[]'::jsonb));
end;
$function$;

revoke all on function public.expire_pending_duitku_payments_v1(integer) from public, anon, authenticated;
grant execute on function public.expire_pending_duitku_payments_v1(integer) to service_role;

-- REVIEW GATE: the following is intentionally commented out. Do not apply until all direct table callers are resolved.
-- revoke all privileges on table public.orders, public.order_items, public.payment_transactions, public.payment_callback_events from public, anon, authenticated;
-- grant select, insert, update, delete on table public.orders, public.order_items, public.payment_transactions, public.payment_callback_events to service_role;

commit;
