-- PELOTE_APP Row Level Security policies.
-- Scope: RLS, authentication helpers, and access policies only.
-- Business functions, triggers, views, and seed data are deliberately excluded.

-- Utility functions run as the migration owner to avoid recursive RLS checks on profiles.

begin;
create function public.is_authenticated_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from public.profiles
      where public.profiles.auth_user_id = auth.uid()
        and public.profiles.active
    );
$$;

create function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select profiles.id
  from public.profiles
  where profiles.auth_user_id = auth.uid()
    and profiles.active
  limit 1;
$$;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.auth_user_id = auth.uid()
      and profiles.active
      and profiles.role = 'ADMIN'
  );
$$;

create function public.is_member_of_team(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.team_members
    where public.team_members.team_id = p_team_id
      and public.team_members.player_id = public.current_profile_id()
  );
$$;

create function public.can_view_team(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.teams
    where public.teams.id = p_team_id
      and (
        public.teams.status = 'ACTIVE'
        or public.is_member_of_team(p_team_id)
        or (
          public.teams.status = 'ARCHIVED'
          and exists (
            select 1
            from public.competition_teams
            join public.competitions
              on public.competitions.id = public.competition_teams.competition_id
            where public.competition_teams.team_id = p_team_id
              and public.competitions.status in ('PUBLISHED', 'COMPLETED', 'CANCELLED')
              and (
                exists (
                  select 1
                  from public.competition_teams player_competition_teams
                  join public.team_members
                    on public.team_members.team_id = player_competition_teams.team_id
                  where player_competition_teams.competition_id = public.competition_teams.competition_id
                    and public.team_members.player_id = public.current_profile_id()
                )
                or exists (
                  select 1
                  from public.competition_matches
                  join public.team_members
                    on public.team_members.team_id = public.competition_matches.team_id
                  where public.competition_matches.competition_id = public.competition_teams.competition_id
                    and public.team_members.player_id = public.current_profile_id()
                )
              )
          )
        )
      )
  );
$$;

create function public.can_view_competition(p_competition_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.competitions
    where public.competitions.id = p_competition_id
      and public.competitions.status in ('PUBLISHED', 'COMPLETED', 'CANCELLED')
      and (
        exists (
          select 1
          from public.competition_teams
          join public.team_members
            on public.team_members.team_id = public.competition_teams.team_id
          where public.competition_teams.competition_id = p_competition_id
            and public.team_members.player_id = public.current_profile_id()
        )
        or exists (
          select 1
          from public.competition_matches
          join public.team_members
            on public.team_members.team_id = public.competition_matches.team_id
          where public.competition_matches.competition_id = p_competition_id
            and public.team_members.player_id = public.current_profile_id()
        )
      )
  );
$$;

create function public.is_own_published_assignment(p_assignment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.training_assignments
    join public.planning_versions
      on public.planning_versions.id = public.training_assignments.planning_version_id
    where public.training_assignments.id = p_assignment_id
      and public.training_assignments.player_id = public.current_profile_id()
      and public.planning_versions.status = 'PUBLISHED'
  );
$$;

create function public.has_own_published_assignment_for_event(p_training_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.training_assignments
    join public.planning_versions
      on public.planning_versions.id = public.training_assignments.planning_version_id
    where public.training_assignments.training_event_id = p_training_event_id
      and public.training_assignments.player_id = public.current_profile_id()
      and public.planning_versions.status = 'PUBLISHED'
  );
$$;

create function public.is_event_in_published_planning(p_training_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.training_assignments
    join public.planning_versions
      on public.planning_versions.id = public.training_assignments.planning_version_id
    where public.training_assignments.training_event_id = p_training_event_id
      and public.planning_versions.status = 'PUBLISHED'
  );
$$;

revoke all on function public.is_authenticated_user() from public;
revoke all on function public.current_profile_id() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.is_member_of_team(uuid) from public;
revoke all on function public.can_view_team(uuid) from public;
revoke all on function public.can_view_competition(uuid) from public;
revoke all on function public.is_own_published_assignment(uuid) from public;
revoke all on function public.has_own_published_assignment_for_event(uuid) from public;
revoke all on function public.is_event_in_published_planning(uuid) from public;
grant execute on function public.is_authenticated_user() to authenticated;
grant execute on function public.current_profile_id() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_member_of_team(uuid) to authenticated, service_role;
grant execute on function public.can_view_team(uuid) to authenticated, service_role;
grant execute on function public.can_view_competition(uuid) to authenticated, service_role;
grant execute on function public.is_own_published_assignment(uuid) to authenticated, service_role;
grant execute on function public.has_own_published_assignment_for_event(uuid) to authenticated, service_role;
grant execute on function public.is_event_in_published_planning(uuid) to authenticated, service_role;

-- GRANTs control permitted operations; RLS policies filter the permitted rows.
-- Physical deletion is never available through the authenticated database role.
revoke delete on all tables in schema public from authenticated;

alter table public.profiles enable row level security;
alter table public.club_settings enable row level security;
alter table public.seasons enable row level security;
alter table public.disciplines enable row level security;
alter table public.series enable row level security;
alter table public.installation_types enable row level security;
alter table public.installations enable row level security;
alter table public.discipline_installation_types enable row level security;
alter table public.series_compatibilities enable row level security;
alter table public.player_disciplines enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.training_periods enable row level security;
alter table public.training_slots enable row level security;
alter table public.training_events enable row level security;
alter table public.planning_versions enable row level security;
alter table public.training_assignments enable row level security;
alter table public.player_availabilities enable row level security;
alter table public.availability_exceptions enable row level security;
alter table public.competitions enable row level security;
alter table public.competition_teams enable row level security;
alter table public.competition_matches enable row level security;
alter table public.replacement_requests enable row level security;
alter table public.replacements enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_logs enable row level security;
alter table public.audit_logs enable row level security;

-- Public reference data readable by every authenticated user.
create policy "authenticated read club settings" on public.club_settings
  for select to authenticated using (public.is_authenticated_user());
create policy "authenticated read seasons" on public.seasons
  for select to authenticated using (public.is_authenticated_user());
create policy "authenticated read disciplines" on public.disciplines
  for select to authenticated using (public.is_authenticated_user());
create policy "authenticated read series" on public.series
  for select to authenticated using (public.is_authenticated_user());
create policy "authenticated read installation types" on public.installation_types
  for select to authenticated using (public.is_authenticated_user());
create policy "authenticated read installations" on public.installations
  for select to authenticated using (public.is_authenticated_user());
create policy "authenticated read discipline installation types" on public.discipline_installation_types
  for select to authenticated using (public.is_authenticated_user());
create policy "authenticated read series compatibilities" on public.series_compatibilities
  for select to authenticated using (public.is_authenticated_user());

-- Controlled profile updates are deferred to a secure function that only changes
-- first_name, last_name, phone, and notification_preferences.
create policy "player read own profile" on public.profiles
  for select to authenticated using (id = public.current_profile_id());

-- Players can read their registrations, availabilities, and exceptions only.
create policy "player read own registrations" on public.player_disciplines
  for select to authenticated using (player_id = public.current_profile_id());
create policy "player read own availabilities" on public.player_availabilities
  for select to authenticated using (player_id = public.current_profile_id());
create policy "player create own availabilities" on public.player_availabilities
  for insert to authenticated with check (
    player_id = public.current_profile_id()
    and exists (
      select 1
      from public.training_slots slots
      join public.training_periods periods on periods.id = slots.training_period_id
      where slots.id = training_slot_id
        and slots.active
        and periods.status = 'AVAILABILITIES_OPEN'
        and now() >= coalesce(periods.availability_opens_at, '-infinity'::timestamptz)
        and now() < coalesce(periods.availability_closes_at, 'infinity'::timestamptz)
    )
  );
-- Updating an existing availability is deferred to a secure UPSERT function in
-- 003_secure_functions.sql; it will protect player_id, training_slot_id, and status.
create policy "player read own availability exceptions" on public.availability_exceptions
  for select to authenticated using (player_id = public.current_profile_id());
create policy "player create own availability exceptions" on public.availability_exceptions
  for insert to authenticated with check (
    player_id = public.current_profile_id()
    and created_by = public.current_profile_id()
    and exists (
      select 1
      from public.training_events events
      where events.id = training_event_id
        and events.status = 'PUBLISHED'
        and public.has_own_published_assignment_for_event(events.id)
    )
  );

-- SECURITY DEFINER helpers avoid circular RLS dependencies between these tables.
create policy "player read visible teams" on public.teams
  for select to authenticated using (
    public.is_authenticated_user()
    and public.can_view_team(id)
  );
create policy "player read visible team members" on public.team_members
  for select to authenticated using (
    public.is_authenticated_user()
    and public.can_view_team(team_id)
  );

-- Players can read availability periods and slots when responses are open, and published planning.
create policy "player read accessible training periods" on public.training_periods
  for select to authenticated using (
    public.is_authenticated_user()
    and (
      status = 'AVAILABILITIES_OPEN'
      or status in ('PUBLISHED', 'COMPLETED', 'CANCELLED')
    )
  );
create policy "player read accessible training slots" on public.training_slots
  for select to authenticated using (
    public.is_authenticated_user()
    and exists (
      select 1
      from public.training_periods periods
      where periods.id = training_slots.training_period_id
        and periods.status in ('AVAILABILITIES_OPEN', 'PUBLISHED', 'COMPLETED', 'CANCELLED')
    )
  );
create policy "player read published training events" on public.training_events
  for select to authenticated using (
    public.is_authenticated_user()
    and status in ('PUBLISHED', 'CANCELLED', 'COMPLETED')
    and public.is_event_in_published_planning(id)
  );
create policy "player read published planning versions" on public.planning_versions
  for select to authenticated using (
    public.is_authenticated_user()
    and status = 'PUBLISHED'
  );
create policy "player read own published assignments" on public.training_assignments
  for select to authenticated using (
    player_id = public.current_profile_id()
    and exists (
      select 1
      from public.planning_versions versions
      where versions.id = training_assignments.planning_version_id
        and versions.status = 'PUBLISHED'
    )
  );

-- Players can read non-draft competitions, entries, and matches visible to the club.
create policy "player read visible competitions" on public.competitions
  for select to authenticated using (
    public.is_authenticated_user()
    and public.can_view_competition(id)
  );
create policy "player read visible competition teams" on public.competition_teams
  for select to authenticated using (
    public.is_authenticated_user()
    and public.can_view_competition(competition_id)
    and public.is_member_of_team(team_id)
  );
create policy "player read visible competition matches" on public.competition_matches
  for select to authenticated using (
    public.is_authenticated_user()
    and public.can_view_competition(competition_id)
    and public.is_member_of_team(team_id)
  );

-- Players own their replacement requests; only administrators may approve or reject them.
create policy "player read own replacement requests" on public.replacement_requests
  for select to authenticated using (requested_by = public.current_profile_id());
create policy "player create own replacement requests" on public.replacement_requests
  for insert to authenticated with check (
    requested_by = public.current_profile_id()
    and status = 'REQUESTED'
    and public.is_own_published_assignment(training_assignment_id)
  );
create policy "player read own replacements" on public.replacements
  for select to authenticated using (
    replacement_player_id = public.current_profile_id()
    or exists (
      select 1
      from public.training_assignments assignments
      where assignments.id = replacements.original_assignment_id
        and assignments.player_id = public.current_profile_id()
    )
  );

-- Marking viewed_at is deferred to a secure function to protect every other column.
create policy "player read own notifications" on public.notifications
  for select to authenticated using (recipient_id = public.current_profile_id());

-- Administrators receive explicit SELECT, INSERT, and UPDATE access only.
-- There is deliberately no DELETE policy for any table.
create policy "admin read all business data" on public.profiles for select to authenticated using (public.is_admin());
create policy "admin create profiles" on public.profiles for insert to authenticated with check (public.is_admin());
create policy "admin update profiles" on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin read club settings" on public.club_settings for select to authenticated using (public.is_admin());
create policy "admin create club settings" on public.club_settings for insert to authenticated with check (public.is_admin());
create policy "admin update club settings" on public.club_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin read seasons" on public.seasons for select to authenticated using (public.is_admin());
create policy "admin create seasons" on public.seasons for insert to authenticated with check (public.is_admin());
create policy "admin update seasons" on public.seasons for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin read disciplines" on public.disciplines for select to authenticated using (public.is_admin());
create policy "admin create disciplines" on public.disciplines for insert to authenticated with check (public.is_admin());
create policy "admin update disciplines" on public.disciplines for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin read series" on public.series for select to authenticated using (public.is_admin());
create policy "admin create series" on public.series for insert to authenticated with check (public.is_admin());
create policy "admin update series" on public.series for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin read installation types" on public.installation_types for select to authenticated using (public.is_admin());
create policy "admin create installation types" on public.installation_types for insert to authenticated with check (public.is_admin());
create policy "admin update installation types" on public.installation_types for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin read installations" on public.installations for select to authenticated using (public.is_admin());
create policy "admin create installations" on public.installations for insert to authenticated with check (public.is_admin());
create policy "admin update installations" on public.installations for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin read discipline installation types" on public.discipline_installation_types for select to authenticated using (public.is_admin());
create policy "admin create discipline installation types" on public.discipline_installation_types for insert to authenticated with check (public.is_admin());
create policy "admin update discipline installation types" on public.discipline_installation_types for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin read series compatibilities" on public.series_compatibilities for select to authenticated using (public.is_admin());
create policy "admin create series compatibilities" on public.series_compatibilities for insert to authenticated with check (public.is_admin());
create policy "admin update series compatibilities" on public.series_compatibilities for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin read player disciplines" on public.player_disciplines for select to authenticated using (public.is_admin());
create policy "admin create player disciplines" on public.player_disciplines for insert to authenticated with check (public.is_admin());
create policy "admin update player disciplines" on public.player_disciplines for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin read teams" on public.teams for select to authenticated using (public.is_admin());
create policy "admin create teams" on public.teams for insert to authenticated with check (public.is_admin());
create policy "admin update teams" on public.teams for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin read team members" on public.team_members for select to authenticated using (public.is_admin());
create policy "admin create team members" on public.team_members for insert to authenticated with check (public.is_admin());
create policy "admin update team members" on public.team_members for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin read training periods" on public.training_periods for select to authenticated using (public.is_admin());
create policy "admin create training periods" on public.training_periods for insert to authenticated with check (public.is_admin());
create policy "admin update training periods" on public.training_periods for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin read training slots" on public.training_slots for select to authenticated using (public.is_admin());
create policy "admin create training slots" on public.training_slots for insert to authenticated with check (public.is_admin());
create policy "admin update training slots" on public.training_slots for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin read training events" on public.training_events for select to authenticated using (public.is_admin());
create policy "admin create training events" on public.training_events for insert to authenticated with check (public.is_admin());
create policy "admin update training events" on public.training_events for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin read planning versions" on public.planning_versions for select to authenticated using (public.is_admin());
create policy "admin create planning versions" on public.planning_versions for insert to authenticated with check (public.is_admin());
create policy "admin update planning versions" on public.planning_versions for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin read training assignments" on public.training_assignments for select to authenticated using (public.is_admin());
create policy "admin create training assignments" on public.training_assignments for insert to authenticated with check (public.is_admin());
create policy "admin update training assignments" on public.training_assignments for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin read player availabilities" on public.player_availabilities for select to authenticated using (public.is_admin());
create policy "admin create player availabilities" on public.player_availabilities for insert to authenticated with check (public.is_admin());
create policy "admin read availability exceptions" on public.availability_exceptions for select to authenticated using (public.is_admin());
create policy "admin create availability exceptions" on public.availability_exceptions for insert to authenticated with check (public.is_admin());
create policy "admin update availability exceptions" on public.availability_exceptions for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin read competitions" on public.competitions for select to authenticated using (public.is_admin());
create policy "admin create competitions" on public.competitions for insert to authenticated with check (public.is_admin());
create policy "admin update competitions" on public.competitions for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin read competition teams" on public.competition_teams for select to authenticated using (public.is_admin());
create policy "admin create competition teams" on public.competition_teams for insert to authenticated with check (public.is_admin());
create policy "admin update competition teams" on public.competition_teams for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin read competition matches" on public.competition_matches for select to authenticated using (public.is_admin());
create policy "admin create competition matches" on public.competition_matches for insert to authenticated with check (public.is_admin());
create policy "admin update competition matches" on public.competition_matches for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin read replacement requests" on public.replacement_requests for select to authenticated using (public.is_admin());
create policy "admin create replacement requests" on public.replacement_requests for insert to authenticated with check (public.is_admin());
create policy "admin update replacement requests" on public.replacement_requests for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin read notifications" on public.notifications for select to authenticated using (public.is_admin());
create policy "admin create notifications" on public.notifications for insert to authenticated with check (public.is_admin());
create policy "admin update notifications" on public.notifications for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Technical logs and effective replacements are read-only until secure server functions exist.
create policy "admin read notification logs" on public.notification_logs
  for select to authenticated using (public.is_admin());
create policy "admin read replacements" on public.replacements
  for select to authenticated using (public.is_admin());
create policy "admin read audit logs" on public.audit_logs
  for select to authenticated using (public.is_admin());
commit;
