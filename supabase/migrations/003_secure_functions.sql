-- PELOTE_APP secure business operations.
-- Scope: controlled mutations and transactional administrative operations.
-- No tables, RLS policies, views, triggers, seed data, or physical deletes are created.

begin;

create function public.update_own_profile(
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_notification_preferences jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid;
begin
  v_profile_id := public.current_profile_id();

  if auth.uid() is null or v_profile_id is null then
    raise exception 'Active authenticated profile required';
  end if;

  if nullif(pg_catalog.btrim(p_first_name), '') is null or nullif(pg_catalog.btrim(p_last_name), '') is null then
    raise exception 'First name and last name must not be empty';
  end if;

  if p_notification_preferences is null or pg_catalog.jsonb_typeof(p_notification_preferences) <> 'object' then
    raise exception 'Notification preferences must be a JSON object';
  end if;

  update public.profiles
  set first_name = pg_catalog.btrim(p_first_name),
      last_name = pg_catalog.btrim(p_last_name),
      phone = nullif(pg_catalog.btrim(p_phone), ''),
      notification_preferences = p_notification_preferences,
      updated_at = pg_catalog.now()
  where public.profiles.id = v_profile_id;

  return v_profile_id;
end;
$$;

create function public.upsert_own_availability(
  p_training_slot_id uuid,
  p_status public.availability_status
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid;
  v_availability_id uuid;
begin
  v_profile_id := public.current_profile_id();

  if auth.uid() is null or v_profile_id is null then
    raise exception 'Active authenticated profile required';
  end if;

  if p_training_slot_id is null or p_status is null then
    raise exception 'Training slot and availability status are required';
  end if;

  if not exists (
    select 1
    from public.training_slots
    join public.training_periods
      on public.training_periods.id = public.training_slots.training_period_id
    where public.training_slots.id = p_training_slot_id
      and public.training_slots.active
      and public.training_periods.status = 'AVAILABILITIES_OPEN'
      and pg_catalog.now() >= coalesce(public.training_periods.availability_opens_at, '-infinity'::timestamptz)
      and pg_catalog.now() < coalesce(public.training_periods.availability_closes_at, 'infinity'::timestamptz)
  ) then
    raise exception 'Training slot is not available for responses';
  end if;

  insert into public.player_availabilities (
    player_id,
    training_slot_id,
    status
  )
  values (
    v_profile_id,
    p_training_slot_id,
    p_status
  )
  on conflict (player_id, training_slot_id) do update
  set status = excluded.status,
      updated_at = pg_catalog.now()
  returning public.player_availabilities.id into v_availability_id;

  return v_availability_id;
end;
$$;

create function public.admin_upsert_player_availability(
  p_player_id uuid,
  p_training_slot_id uuid,
  p_status public.availability_status,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
  v_availability_id uuid;
  v_old_data jsonb;
begin
  v_actor_id := public.current_profile_id();

  if auth.uid() is null or v_actor_id is null or not public.is_admin() then
    raise exception 'Active administrator required';
  end if;

  if p_player_id is null or p_training_slot_id is null or p_status is null then
    raise exception 'Player, training slot, and availability status are required';
  end if;

  if nullif(pg_catalog.btrim(p_reason), '') is null then
    raise exception 'Administrative correction reason is required';
  end if;

  if not exists (select 1 from public.profiles where public.profiles.id = p_player_id) then
    raise exception 'Player not found';
  end if;

  if not exists (select 1 from public.training_slots where public.training_slots.id = p_training_slot_id) then
    raise exception 'Training slot not found';
  end if;

  select pg_catalog.jsonb_build_object('status', public.player_availabilities.status)
  into v_old_data
  from public.player_availabilities
  where public.player_availabilities.player_id = p_player_id
    and public.player_availabilities.training_slot_id = p_training_slot_id
  for update;

  insert into public.player_availabilities (
    player_id,
    training_slot_id,
    status
  )
  values (
    p_player_id,
    p_training_slot_id,
    p_status
  )
  on conflict (player_id, training_slot_id) do update
  set status = excluded.status,
      updated_at = pg_catalog.now()
  returning public.player_availabilities.id into v_availability_id;

  insert into public.audit_logs (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    old_data,
    new_data,
    created_at
  )
  values (
    v_actor_id,
    'ADMIN_UPSERT_PLAYER_AVAILABILITY',
    'player_availabilities',
    v_availability_id,
    v_old_data,
    pg_catalog.jsonb_build_object(
      'player_id', p_player_id,
      'training_slot_id', p_training_slot_id,
      'status', p_status,
      'reason', pg_catalog.btrim(p_reason)
    ),
    pg_catalog.now()
  );

  return v_availability_id;
end;
$$;

create function public.upsert_own_availability_exception(
  p_training_event_id uuid,
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
  v_exception_id uuid;
begin
  v_profile_id := public.current_profile_id();

  if auth.uid() is null or v_profile_id is null then
    raise exception 'Active authenticated profile required';
  end if;

  if p_training_event_id is null or p_exception_type is null then
    raise exception 'Training event and exception type are required';
  end if;

  if not exists (
    select 1
    from public.training_events
    where public.training_events.id = p_training_event_id
      and public.training_events.status = 'PUBLISHED'
  ) then
    raise exception 'Published training event not found';
  end if;

  if not public.has_own_published_assignment_for_event(p_training_event_id) then
    raise exception 'Published assignment for this event is required';
  end if;

  insert into public.availability_exceptions (
    player_id,
    training_event_id,
    exception_type,
    reason,
    created_by
  )
  values (
    v_profile_id,
    p_training_event_id,
    p_exception_type,
    nullif(pg_catalog.btrim(p_reason), ''),
    v_profile_id
  )
  on conflict (player_id, training_event_id) do update
  set exception_type = excluded.exception_type,
      reason = excluded.reason,
      updated_at = pg_catalog.now()
  returning public.availability_exceptions.id into v_exception_id;

  return v_exception_id;
end;
$$;

create function public.mark_own_notification_viewed(
  p_notification_id uuid
)
returns table (id uuid, viewed_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid;
begin
  v_profile_id := public.current_profile_id();

  if auth.uid() is null or v_profile_id is null then
    raise exception 'Active authenticated profile required';
  end if;

  update public.notifications
  set viewed_at = coalesce(public.notifications.viewed_at, pg_catalog.now()),
      updated_at = pg_catalog.now()
  where public.notifications.id = p_notification_id
    and public.notifications.recipient_id = v_profile_id
  returning public.notifications.id, public.notifications.viewed_at
  into id, viewed_at;

  if id is null then
    raise exception 'Notification not found or access denied';
  end if;

  return next;
end;
$$;

create function public.cancel_own_replacement_request(
  p_replacement_request_id uuid
)
returns table (id uuid, status public.replacement_request_status)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid;
  v_request public.replacement_requests%rowtype;
begin
  v_profile_id := public.current_profile_id();

  if auth.uid() is null or v_profile_id is null then
    raise exception 'Active authenticated profile required';
  end if;

  select *
  into v_request
  from public.replacement_requests
  where public.replacement_requests.id = p_replacement_request_id
  for update;

  if not found then
    raise exception 'Replacement request not found';
  end if;

  if v_request.requested_by <> v_profile_id then
    raise exception 'Replacement request does not belong to current profile';
  end if;

  if v_request.status not in ('REQUESTED', 'IN_REVIEW') then
    raise exception 'Replacement request cannot be cancelled from status %', v_request.status;
  end if;

  update public.replacement_requests
  set status = 'CANCELLED',
      cancelled_at = pg_catalog.now(),
      updated_at = pg_catalog.now()
  where public.replacement_requests.id = v_request.id
  returning public.replacement_requests.id, public.replacement_requests.status
  into id, status;

  return next;
end;
$$;

create function public.publish_planning_version(
  p_planning_version_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
  v_version public.planning_versions%rowtype;
  v_period_id uuid;
  v_period_status public.training_period_status;
  v_previous_version public.planning_versions%rowtype;
begin
  v_actor_id := public.current_profile_id();

  if auth.uid() is null or v_actor_id is null or not public.is_admin() then
    raise exception 'Active administrator required';
  end if;

  select *
  into v_version
  from public.planning_versions
  where public.planning_versions.id = p_planning_version_id
  for update;

  if not found then
    raise exception 'Planning version not found';
  end if;

  if v_version.status not in ('DRAFT', 'VALIDATED') then
    raise exception 'Planning version cannot be published from status %', v_version.status;
  end if;

  v_period_id := v_version.training_period_id;

  select public.training_periods.status
  into v_period_status
  from public.training_periods
  where public.training_periods.id = v_period_id
  for update;

  if not found then
    raise exception 'Training period not found';
  end if;

  if v_period_status in ('COMPLETED', 'CANCELLED') then
    raise exception 'Planning version cannot be published for a completed or cancelled period';
  end if;

  select *
  into v_previous_version
  from public.planning_versions
  where public.planning_versions.training_period_id = v_period_id
    and public.planning_versions.status = 'PUBLISHED'
  for update;

  if found then
    update public.planning_versions
    set status = 'ARCHIVED',
        archived_at = pg_catalog.now()
    where public.planning_versions.id = v_previous_version.id;

    insert into public.audit_logs (
      actor_user_id, action, entity_type, entity_id, old_data, new_data, created_at
    )
    values (
      v_actor_id,
      'ARCHIVE_PLANNING_VERSION',
      'planning_versions',
      v_previous_version.id,
      pg_catalog.jsonb_build_object('status', 'PUBLISHED'),
      pg_catalog.jsonb_build_object('status', 'ARCHIVED', 'archived_at', pg_catalog.now()),
      pg_catalog.now()
    );
  end if;

  update public.planning_versions
  set status = 'PUBLISHED',
      published_at = pg_catalog.now(),
      published_by = v_actor_id,
      archived_at = null
  where public.planning_versions.id = v_version.id;

  update public.training_periods
  set status = 'PUBLISHED',
      updated_at = pg_catalog.now()
  where public.training_periods.id = v_period_id;

  insert into public.audit_logs (
    actor_user_id, action, entity_type, entity_id, old_data, new_data, created_at
  )
  values (
    v_actor_id,
    'PUBLISH_PLANNING_VERSION',
    'planning_versions',
    v_version.id,
    pg_catalog.jsonb_build_object('status', v_version.status),
    pg_catalog.jsonb_build_object('status', 'PUBLISHED', 'published_at', pg_catalog.now(), 'published_by', v_actor_id),
    pg_catalog.now()
  );

  return v_version.id;
end;
$$;

create function public.admin_change_profile_role(
  p_profile_id uuid,
  p_new_role public.profile_role
)
returns table (id uuid, role public.profile_role)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
  v_target public.profiles%rowtype;
  v_active_admin_count integer;
begin
  v_actor_id := public.current_profile_id();

  if auth.uid() is null or v_actor_id is null or not public.is_admin() then
    raise exception 'Active administrator required';
  end if;

  if p_profile_id is null or p_new_role is null then
    raise exception 'Profile and new role are required';
  end if;

  select *
  into v_target
  from public.profiles
  where public.profiles.id = p_profile_id
  for update;

  if not found then
    raise exception 'Profile not found';
  end if;

  if v_target.role = 'ADMIN' and v_target.active and p_new_role = 'PLAYER' then
    perform 1
    from public.profiles
    where public.profiles.active
      and public.profiles.role = 'ADMIN'
    for update;

    select count(*)
    into v_active_admin_count
    from public.profiles
    where public.profiles.active
      and public.profiles.role = 'ADMIN';

    if v_active_admin_count <= 1 then
      raise exception 'Cannot demote the last active administrator';
    end if;
  end if;

  update public.profiles
  set role = p_new_role,
      updated_at = pg_catalog.now()
  where public.profiles.id = v_target.id
  returning public.profiles.id, public.profiles.role into id, role;

  insert into public.audit_logs (
    actor_user_id, action, entity_type, entity_id, old_data, new_data, created_at
  )
  values (
    v_actor_id,
    'CHANGE_PROFILE_ROLE',
    'profiles',
    v_target.id,
    pg_catalog.jsonb_build_object('role', v_target.role),
    pg_catalog.jsonb_build_object('role', p_new_role),
    pg_catalog.now()
  );

  return next;
end;
$$;

create function public.admin_deactivate_profile(
  p_profile_id uuid,
  p_reason text
)
returns table (id uuid, active boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
  v_target public.profiles%rowtype;
  v_active_admin_count integer;
begin
  v_actor_id := public.current_profile_id();

  if auth.uid() is null or v_actor_id is null or not public.is_admin() then
    raise exception 'Active administrator required';
  end if;

  if nullif(pg_catalog.btrim(p_reason), '') is null then
    raise exception 'Deactivation reason is required';
  end if;

  select *
  into v_target
  from public.profiles
  where public.profiles.id = p_profile_id
  for update;

  if not found then
    raise exception 'Profile not found';
  end if;

  if not v_target.active then
    id := v_target.id;
    active := false;
    return next;
    return;
  end if;

  if v_target.role = 'ADMIN' then
    perform 1
    from public.profiles
    where public.profiles.active
      and public.profiles.role = 'ADMIN'
    for update;

    select count(*)
    into v_active_admin_count
    from public.profiles
    where public.profiles.active
      and public.profiles.role = 'ADMIN';

    if v_active_admin_count <= 1 then
      raise exception 'Cannot deactivate the last active administrator';
    end if;
  end if;

  update public.profiles
  set active = false,
      deactivated_at = pg_catalog.now(),
      updated_at = pg_catalog.now()
  where public.profiles.id = v_target.id
  returning public.profiles.id, public.profiles.active into id, active;

  insert into public.audit_logs (
    actor_user_id, action, entity_type, entity_id, old_data, new_data, created_at
  )
  values (
    v_actor_id,
    'DEACTIVATE_PROFILE',
    'profiles',
    v_target.id,
    pg_catalog.jsonb_build_object('active', true),
    pg_catalog.jsonb_build_object('active', false, 'reason', pg_catalog.btrim(p_reason)),
    pg_catalog.now()
  );

  return next;
end;
$$;

-- This function is strictly for initial setup from a controlled server environment.
create function public.bootstrap_first_admin(
  p_auth_user_id uuid,
  p_first_name text,
  p_last_name text,
  p_email citext
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid;
  v_auth_email text;
begin
  -- service_role has no business profile before bootstrap; EXECUTE grants are the access boundary.
  perform pg_catalog.pg_advisory_xact_lock(73981462);

  if p_auth_user_id is null
    or nullif(pg_catalog.btrim(p_first_name), '') is null
    or nullif(pg_catalog.btrim(p_last_name), '') is null
    or nullif(pg_catalog.btrim(p_email::text), '') is null then
    raise exception 'Auth user, first name, last name, and email are required';
  end if;

  if exists (
    select 1
    from public.profiles
    where public.profiles.active
      and public.profiles.role = 'ADMIN'
  ) then
    raise exception 'An active administrator already exists';
  end if;

  select auth.users.email
  into v_auth_email
  from auth.users
  where auth.users.id = p_auth_user_id;

  if not found then
    raise exception 'Auth user not found';
  end if;

  if v_auth_email is null or pg_catalog.lower(v_auth_email) <> pg_catalog.lower(p_email::text) then
    raise exception 'Provided email does not match Auth user email';
  end if;

  select public.profiles.id
  into v_profile_id
  from public.profiles
  where public.profiles.email = p_email
  for update;

  if found then
    if exists (
      select 1
      from public.profiles
      where public.profiles.id = v_profile_id
        and public.profiles.auth_user_id is not null
    ) then
      raise exception 'Existing profile is already linked to an Auth user';
    end if;

    update public.profiles
    set auth_user_id = p_auth_user_id,
        first_name = pg_catalog.btrim(p_first_name),
        last_name = pg_catalog.btrim(p_last_name),
        email = p_email,
        role = 'ADMIN',
        active = true,
        deactivated_at = null,
        updated_at = pg_catalog.now()
    where public.profiles.id = v_profile_id;
  else
    insert into public.profiles (
      auth_user_id,
      first_name,
      last_name,
      email,
      role,
      active,
      notification_preferences
    )
    values (
      p_auth_user_id,
      pg_catalog.btrim(p_first_name),
      pg_catalog.btrim(p_last_name),
      p_email,
      'ADMIN',
      true,
      '{}'::jsonb
    )
    returning public.profiles.id into v_profile_id;
  end if;

  insert into public.audit_logs (
    actor_user_id, action, entity_type, entity_id, old_data, new_data, created_at
  )
  values (
    null,
    'BOOTSTRAP_FIRST_ADMIN',
    'profiles',
    v_profile_id,
    null,
    pg_catalog.jsonb_build_object('role', 'ADMIN', 'active', true),
    pg_catalog.now()
  );

  return v_profile_id;
end;
$$;

create function public.approve_replacement_request(
  p_replacement_request_id uuid,
  p_replacement_player_id uuid,
  p_override_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
  v_request public.replacement_requests%rowtype;
  v_assignment public.training_assignments%rowtype;
  v_event public.training_events%rowtype;
  v_season_id uuid;
  v_replacement_id uuid;
begin
  v_actor_id := public.current_profile_id();

  if auth.uid() is null or v_actor_id is null or not public.is_admin() then
    raise exception 'Active administrator required';
  end if;

  if p_replacement_player_id is null then
    raise exception 'Replacement player is required';
  end if;

  select *
  into v_request
  from public.replacement_requests
  where public.replacement_requests.id = p_replacement_request_id
  for update;

  if not found then
    raise exception 'Replacement request not found';
  end if;

  if v_request.status not in ('REQUESTED', 'IN_REVIEW') then
    raise exception 'Replacement request cannot be approved from status %', v_request.status;
  end if;

  select *
  into v_assignment
  from public.training_assignments
  where public.training_assignments.id = v_request.training_assignment_id
  for update;

  if not found or v_request.requested_by <> v_assignment.player_id then
    raise exception 'Replacement request does not match its original assignment';
  end if;

  select public.training_events.*
  into v_event
  from public.training_events
  where public.training_events.id = v_assignment.training_event_id
  for update;

  if not found then
    raise exception 'Training event not found';
  end if;

  select public.training_periods.season_id
  into v_season_id
  from public.training_periods
  where public.training_periods.id = v_event.training_period_id;

  if not found then
    raise exception 'Training period not found';
  end if;

  if p_replacement_player_id = v_assignment.player_id then
    raise exception 'Replacement player must differ from original player';
  end if;

  if not exists (
    select 1
    from public.profiles
    where public.profiles.id = p_replacement_player_id
      and public.profiles.active
  ) then
    raise exception 'Active replacement player not found';
  end if;

  if not exists (
    select 1
    from public.player_disciplines
    where public.player_disciplines.player_id = p_replacement_player_id
      and public.player_disciplines.discipline_id = v_event.discipline_id
      and public.player_disciplines.season_id = v_season_id
      and public.player_disciplines.active
  ) then
    raise exception 'Replacement player lacks an active registration for this discipline and season';
  end if;

  if exists (
    select 1
    from public.training_assignments
    join public.planning_versions
      on public.planning_versions.id = public.training_assignments.planning_version_id
    join public.training_events
      on public.training_events.id = public.training_assignments.training_event_id
    where public.training_assignments.player_id = p_replacement_player_id
      and public.planning_versions.status = 'PUBLISHED'
      and public.training_events.starts_at < v_event.ends_at
      and public.training_events.ends_at > v_event.starts_at
  ) then
    raise exception 'Replacement player has a conflicting published assignment';
  end if;

  -- TODO: series compatibility and any manual sporting derogation are not yet defined for replacements.
  if nullif(pg_catalog.btrim(p_override_reason), '') is not null then
    p_override_reason := pg_catalog.btrim(p_override_reason);
  end if;

  insert into public.replacements (
    replacement_request_id,
    original_assignment_id,
    replacement_player_id,
    approved_by,
    override_reason,
    approved_at
  )
  values (
    v_request.id,
    v_assignment.id,
    p_replacement_player_id,
    v_actor_id,
    p_override_reason,
    pg_catalog.now()
  )
  returning public.replacements.id into v_replacement_id;

  update public.replacement_requests
  set status = 'APPROVED',
      reviewed_at = pg_catalog.now(),
      reviewed_by = v_actor_id,
      updated_at = pg_catalog.now()
  where public.replacement_requests.id = v_request.id;

  insert into public.audit_logs (
    actor_user_id, action, entity_type, entity_id, old_data, new_data, created_at
  )
  values (
    v_actor_id,
    'APPROVE_REPLACEMENT_REQUEST',
    'replacement_requests',
    v_request.id,
    pg_catalog.jsonb_build_object('status', v_request.status),
    pg_catalog.jsonb_build_object(
      'status', 'APPROVED',
      'replacement_id', v_replacement_id,
      'replacement_player_id', p_replacement_player_id,
      'override_reason', p_override_reason
    ),
    pg_catalog.now()
  );

  return v_replacement_id;
end;
$$;

create function public.cancel_approved_replacement(
  p_replacement_id uuid,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
  v_replacement public.replacements%rowtype;
begin
  v_actor_id := public.current_profile_id();

  if auth.uid() is null or v_actor_id is null or not public.is_admin() then
    raise exception 'Active administrator required';
  end if;

  if nullif(pg_catalog.btrim(p_reason), '') is null then
    raise exception 'Replacement cancellation reason is required';
  end if;

  select *
  into v_replacement
  from public.replacements
  where public.replacements.id = p_replacement_id
  for update;

  if not found then
    raise exception 'Replacement not found';
  end if;

  if v_replacement.cancelled_at is null then
    update public.replacements
    set cancelled_at = pg_catalog.now()
    where public.replacements.id = v_replacement.id;

    insert into public.audit_logs (
      actor_user_id, action, entity_type, entity_id, old_data, new_data, created_at
    )
    values (
      v_actor_id,
      'CANCEL_APPROVED_REPLACEMENT',
      'replacements',
      v_replacement.id,
      pg_catalog.jsonb_build_object('cancelled_at', null),
      pg_catalog.jsonb_build_object('cancelled_at', pg_catalog.now(), 'reason', pg_catalog.btrim(p_reason)),
      pg_catalog.now()
    );
  end if;

  return v_replacement.id;
end;
$$;

revoke all on function public.update_own_profile(text, text, text, jsonb) from public;
revoke all on function public.upsert_own_availability(uuid, public.availability_status) from public;
revoke all on function public.admin_upsert_player_availability(uuid, uuid, public.availability_status, text) from public;
revoke all on function public.upsert_own_availability_exception(uuid, public.availability_exception_type, text) from public;
revoke all on function public.mark_own_notification_viewed(uuid) from public;
revoke all on function public.cancel_own_replacement_request(uuid) from public;
revoke all on function public.publish_planning_version(uuid) from public;
revoke all on function public.admin_change_profile_role(uuid, public.profile_role) from public;
revoke all on function public.admin_deactivate_profile(uuid, text) from public;
revoke all on function public.bootstrap_first_admin(uuid, text, text, citext) from public;
revoke all on function public.approve_replacement_request(uuid, uuid, text) from public;
revoke all on function public.cancel_approved_replacement(uuid, text) from public;

revoke all on function public.update_own_profile(text, text, text, jsonb) from anon;
revoke all on function public.upsert_own_availability(uuid, public.availability_status) from anon;
revoke all on function public.admin_upsert_player_availability(uuid, uuid, public.availability_status, text) from anon;
revoke all on function public.upsert_own_availability_exception(uuid, public.availability_exception_type, text) from anon;
revoke all on function public.mark_own_notification_viewed(uuid) from anon;
revoke all on function public.cancel_own_replacement_request(uuid) from anon;
revoke all on function public.publish_planning_version(uuid) from anon;
revoke all on function public.admin_change_profile_role(uuid, public.profile_role) from anon;
revoke all on function public.admin_deactivate_profile(uuid, text) from anon;
revoke all on function public.bootstrap_first_admin(uuid, text, text, citext) from anon;
revoke all on function public.approve_replacement_request(uuid, uuid, text) from anon;
revoke all on function public.cancel_approved_replacement(uuid, text) from anon;
revoke all on function public.bootstrap_first_admin(uuid, text, text, citext) from authenticated;

grant execute on function public.update_own_profile(text, text, text, jsonb) to authenticated;
grant execute on function public.upsert_own_availability(uuid, public.availability_status) to authenticated;
grant execute on function public.admin_upsert_player_availability(uuid, uuid, public.availability_status, text) to authenticated;
grant execute on function public.upsert_own_availability_exception(uuid, public.availability_exception_type, text) to authenticated;
grant execute on function public.mark_own_notification_viewed(uuid) to authenticated;
grant execute on function public.cancel_own_replacement_request(uuid) to authenticated;
grant execute on function public.publish_planning_version(uuid) to authenticated;
grant execute on function public.admin_change_profile_role(uuid, public.profile_role) to authenticated;
grant execute on function public.admin_deactivate_profile(uuid, text) to authenticated;
grant execute on function public.bootstrap_first_admin(uuid, text, text, citext) to service_role;
grant execute on function public.approve_replacement_request(uuid, uuid, text) to authenticated;
grant execute on function public.cancel_approved_replacement(uuid, text) to authenticated;

commit;
