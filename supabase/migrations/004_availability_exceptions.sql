-- Availability exceptions declared before planning generation.

begin;

-- Existing exception data is fictitious and incompatible with the new model.
truncate table public.availability_exceptions;

-- Remove existing policies safely.
drop policy if exists "player read own availability exceptions"
  on public.availability_exceptions;

drop policy if exists "player create own availability exceptions"
  on public.availability_exceptions;

drop policy if exists "admin read availability exceptions"
  on public.availability_exceptions;

drop policy if exists "admin create availability exceptions"
  on public.availability_exceptions;

drop policy if exists "admin update availability exceptions"
  on public.availability_exceptions;

-- Remove the previous RPC and index safely.
drop function if exists public.upsert_own_availability_exception(
  uuid,
  public.availability_exception_type,
  text
);

drop index if exists public.availability_exceptions_event_idx;

-- Replace the event-based exception model with:
-- 1. a one-off exception for a recurring slot on a specific date;
-- 2. a global unavailability period.
alter table public.availability_exceptions
  drop constraint if exists availability_exceptions_player_id_training_event_id_key,
  drop column if exists training_event_id,
  add column training_slot_id uuid
    references public.training_slots(id)
    on delete restrict,
  add column start_date date not null,
  add column end_date date not null,
  add column active boolean not null default true,
  add column cancelled_at timestamptz,
  add constraint availability_exceptions_date_range
    check (end_date >= start_date),
  add constraint availability_exceptions_cancellation_consistency
    check (
      (active and cancelled_at is null)
      or
      (not active and cancelled_at is not null)
    ),
  add constraint availability_exceptions_category_consistency
    check (
      (
        training_slot_id is null
        and exception_type = 'UNAVAILABLE_EXCEPTION'
      )
      or
      (
        training_slot_id is not null
        and start_date = end_date
      )
    );

-- One active exception per player, recurring slot and date.
create unique index availability_exceptions_active_slot_date_unique_idx
  on public.availability_exceptions (
    player_id,
    training_slot_id,
    start_date
  )
  where active and training_slot_id is not null;

-- One identical active global absence per player and date range.
create unique index availability_exceptions_active_period_unique_idx
  on public.availability_exceptions (
    player_id,
    start_date,
    end_date
  )
  where active and training_slot_id is null;

-- Lookup indexes.
create index availability_exceptions_player_idx
  on public.availability_exceptions (player_id);

create index availability_exceptions_start_date_idx
  on public.availability_exceptions (start_date);

create index availability_exceptions_end_date_idx
  on public.availability_exceptions (end_date);

create index availability_exceptions_active_idx
  on public.availability_exceptions (active);

create index availability_exceptions_training_slot_idx
  on public.availability_exceptions (training_slot_id);

comment on table public.availability_exceptions is
  'Player availability overrides declared before planning: one recurring slot on one date, or a global unavailability date range.';

comment on column public.availability_exceptions.training_slot_id is
  'Recurring slot for a one-off exception; NULL identifies a global unavailability period.';

comment on column public.availability_exceptions.start_date is
  'Inclusive exception start date; equal to end_date for a one-off slot exception.';

comment on column public.availability_exceptions.end_date is
  'Inclusive exception end date; equal to start_date for a one-off slot exception.';

-- Read-only RLS access.
-- All writes go through SECURITY DEFINER functions.
create policy "player read own availability exceptions"
  on public.availability_exceptions
  for select
  to authenticated
  using (
    player_id = public.current_profile_id()
  );

create policy "admin read availability exceptions"
  on public.availability_exceptions
  for select
  to authenticated
  using (
    public.is_admin()
  );

-- ============================================================
-- One-off exception for a recurring training slot
-- ============================================================

create function public.upsert_own_availability_exception(
  p_training_slot_id uuid,
  p_exception_date date,
  p_exception_type public.availability_exception_type,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid;
  v_slot public.training_slots%rowtype;
  v_period public.training_periods%rowtype;
  v_exception_id uuid;
begin
  v_profile_id := public.current_profile_id();

  if auth.uid() is null or v_profile_id is null then
    raise exception 'Active authenticated profile required';
  end if;

  if p_training_slot_id is null
    or p_exception_date is null
    or p_exception_type is null then
    raise exception
      'Training slot, exception date and exception type are required';
  end if;

  select public.training_slots.*
  into v_slot
  from public.training_slots
  where public.training_slots.id = p_training_slot_id
    and public.training_slots.active;

  if not found then
    raise exception 'Active training slot not found';
  end if;

  select public.training_periods.*
  into v_period
  from public.training_periods
  where public.training_periods.id = v_slot.training_period_id;

  if not found then
    raise exception 'Training period not found';
  end if;

  if not exists (
    select 1
    from public.player_disciplines
    where public.player_disciplines.player_id = v_profile_id
      and public.player_disciplines.season_id = v_period.season_id
      and public.player_disciplines.discipline_id = v_slot.discipline_id
      and public.player_disciplines.active
  ) then
    raise exception
      'Active registration required for this season and discipline';
  end if;

  if p_exception_date < v_period.start_date
    or p_exception_date > v_period.end_date then
    raise exception
      'Exception date must be within the training period';
  end if;

  -- ISO weekday convention:
  -- Monday = 1, Tuesday = 2, ..., Sunday = 7.
  if extract(isodow from p_exception_date)::smallint
    <> v_slot.day_of_week then
    raise exception
      'Exception date must match the training slot weekday';
  end if;

  insert into public.availability_exceptions (
    player_id,
    training_slot_id,
    start_date,
    end_date,
    exception_type,
    reason,
    created_by,
    active,
    cancelled_at
  )
  values (
    v_profile_id,
    p_training_slot_id,
    p_exception_date,
    p_exception_date,
    p_exception_type,
    nullif(pg_catalog.btrim(p_reason), ''),
    v_profile_id,
    true,
    null
  )
  on conflict (
    player_id,
    training_slot_id,
    start_date
  )
  where active and training_slot_id is not null
  do update
  set exception_type = excluded.exception_type,
      reason = excluded.reason,
      updated_at = pg_catalog.now()
  returning public.availability_exceptions.id
  into v_exception_id;

  return v_exception_id;
end;
$$;

-- ============================================================
-- Global unavailability period, for example holidays
-- ============================================================

create function public.create_own_unavailability_period(
  p_start_date date,
  p_end_date date,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid;
  v_exception_id uuid;
begin
  v_profile_id := public.current_profile_id();

  if auth.uid() is null or v_profile_id is null then
    raise exception 'Active authenticated profile required';
  end if;

  if p_start_date is null or p_end_date is null then
    raise exception 'Start date and end date are required';
  end if;

  if p_end_date < p_start_date then
    raise exception 'End date must be on or after start date';
  end if;

  insert into public.availability_exceptions (
    player_id,
    training_slot_id,
    start_date,
    end_date,
    exception_type,
    reason,
    created_by,
    active,
    cancelled_at
  )
  values (
    v_profile_id,
    null,
    p_start_date,
    p_end_date,
    'UNAVAILABLE_EXCEPTION',
    nullif(pg_catalog.btrim(p_reason), ''),
    v_profile_id,
    true,
    null
  )
  returning public.availability_exceptions.id
  into v_exception_id;

  return v_exception_id;
end;
$$;

-- ============================================================
-- Logical cancellation of an exception
-- ============================================================

create function public.cancel_own_availability_exception(
  p_exception_id uuid
)
returns table (
  id uuid,
  active boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid;
  v_exception public.availability_exceptions%rowtype;
begin
  v_profile_id := public.current_profile_id();

  if auth.uid() is null or v_profile_id is null then
    raise exception 'Active authenticated profile required';
  end if;

  if p_exception_id is null then
    raise exception 'Availability exception id is required';
  end if;

  select public.availability_exceptions.*
  into v_exception
  from public.availability_exceptions
  where public.availability_exceptions.id = p_exception_id
    and public.availability_exceptions.player_id = v_profile_id
  for update;

  if not found then
    raise exception 'Availability exception not found';
  end if;

  if v_exception.active then
    update public.availability_exceptions
    set active = false,
        cancelled_at = pg_catalog.now(),
        updated_at = pg_catalog.now()
    where public.availability_exceptions.id = v_exception.id
    returning
      public.availability_exceptions.id,
      public.availability_exceptions.active
    into id, active;
  else
    id := v_exception.id;
    active := false;
  end if;

  return next;
end;
$$;

-- ============================================================
-- Function permissions
-- ============================================================

revoke all on function public.upsert_own_availability_exception(
  uuid,
  date,
  public.availability_exception_type,
  text
) from public;

revoke all on function public.upsert_own_availability_exception(
  uuid,
  date,
  public.availability_exception_type,
  text
) from anon;

revoke all on function public.create_own_unavailability_period(
  date,
  date,
  text
) from public;

revoke all on function public.create_own_unavailability_period(
  date,
  date,
  text
) from anon;

revoke all on function public.cancel_own_availability_exception(
  uuid
) from public;

revoke all on function public.cancel_own_availability_exception(
  uuid
) from anon;

grant execute on function public.upsert_own_availability_exception(
  uuid,
  date,
  public.availability_exception_type,
  text
) to authenticated;

grant execute on function public.create_own_unavailability_period(
  date,
  date,
  text
) to authenticated;

grant execute on function public.cancel_own_availability_exception(
  uuid
) to authenticated;

-- Future computed availability priority:
-- 1. An active global absence covering the date makes the player unavailable.
-- 2. Otherwise, an active one-off exception for the slot and date applies.
-- 3. Otherwise, use the recurring player_availabilities response.

commit;