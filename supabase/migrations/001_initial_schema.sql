-- PELOTE_APP initial PostgreSQL schema.
-- Scope: extensions, enum types, tables, keys, checks, unique constraints, and indexes only.
-- Deliberately excluded: RLS, policies, custom functions, triggers, views, and seed data.

create extension if not exists pgcrypto;
create extension if not exists citext;

create type public.profile_role as enum ('PLAYER', 'ADMIN');
create type public.team_status as enum ('ACTIVE', 'INCOMPLETE', 'ARCHIVED');
create type public.training_period_status as enum (
  'PREPARATION',
  'AVAILABILITIES_OPEN',
  'PLANNING_IN_PROGRESS',
  'PUBLISHED',
  'COMPLETED',
  'CANCELLED'
);
create type public.training_event_status as enum ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED');
create type public.availability_status as enum ('UNAVAILABLE', 'AVAILABLE', 'PREFERRED');
create type public.availability_exception_type as enum ('UNAVAILABLE_EXCEPTION', 'AVAILABLE_EXCEPTION');
create type public.planning_version_status as enum ('DRAFT', 'VALIDATED', 'PUBLISHED', 'ARCHIVED');
create type public.competition_status as enum ('DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED');
create type public.competition_match_status as enum ('SCHEDULED', 'COMPLETED', 'POSTPONED', 'CANCELLED');
create type public.replacement_request_status as enum ('REQUESTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED');
create type public.notification_status as enum ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED');
create type public.notification_log_channel as enum ('EMAIL', 'PUSH', 'SMS');
create type public.notification_log_status as enum ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED');

-- Player business profile, optionally linked to a Supabase Auth account.
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete restrict,
  first_name text not null,
  last_name text not null,
  email citext not null unique,
  phone text,
  role public.profile_role not null default 'PLAYER',
  active boolean not null default true,
  notification_preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deactivated_at timestamptz,
  constraint profiles_notification_preferences_object check (jsonb_typeof(notification_preferences) = 'object'),
  constraint profiles_deactivation_consistency check (
    (active and deactivated_at is null) or (not active and deactivated_at is not null)
  )
);
comment on table public.profiles is 'Player business profiles optionally associated with Supabase Auth users.';

-- Singleton settings for the club managed in this V1 application.
create table public.club_settings (
  id uuid primary key default gen_random_uuid(),
  club_name text not null,
  timezone text not null default 'Europe/Paris',
  locale text not null default 'fr-FR',
  week_starts_on smallint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint club_settings_week_starts_on_range check (week_starts_on between 1 and 7)
);
comment on table public.club_settings is 'Settings for the single club supported by V1.';
create unique index club_settings_singleton_idx on public.club_settings ((true));

-- Sporting season boundaries and archival state.
create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  start_date date not null,
  end_date date not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint seasons_date_range check (end_date >= start_date)
);
comment on table public.seasons is 'Sporting seasons that isolate registrations, teams, planning, and competitions.';

-- Configurable pelote disciplines.
create table public.disciplines (
  id uuid primary key default gen_random_uuid(),
  name citext not null unique,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);
comment on table public.disciplines is 'Configurable sporting disciplines.';

-- Configurable and ordered player series.
create table public.series (
  id uuid primary key default gen_random_uuid(),
  name citext not null unique,
  sort_order integer not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint series_sort_order_non_negative check (sort_order >= 0)
);
comment on table public.series is 'Configurable and ordered sporting series.';

-- Configurable categories of installations.
create table public.installation_types (
  id uuid primary key default gen_random_uuid(),
  name citext not null unique,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);
comment on table public.installation_types is 'Configurable types of sporting installations.';

-- Physical club installations.
create table public.installations (
  id uuid primary key default gen_random_uuid(),
  name citext not null unique,
  installation_type_id uuid not null references public.installation_types(id) on delete restrict,
  address text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);
comment on table public.installations is 'Physical installations usable for training and competitions.';

-- Compatibility between disciplines and installation types.
create table public.discipline_installation_types (
  discipline_id uuid not null references public.disciplines(id) on delete restrict,
  installation_type_id uuid not null references public.installation_types(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (discipline_id, installation_type_id)
);
comment on table public.discipline_installation_types is 'Allowed installation types for each discipline.';

-- Symmetric series compatibility pairs scoped to a discipline.
create table public.series_compatibilities (
  id uuid primary key default gen_random_uuid(),
  discipline_id uuid not null references public.disciplines(id) on delete restrict,
  series_a_id uuid not null references public.series(id) on delete restrict,
  series_b_id uuid not null references public.series(id) on delete restrict,
  created_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  constraint series_compatibilities_distinct_series check (series_a_id <> series_b_id)
);
comment on table public.series_compatibilities is 'Symmetric compatible series pairs for a discipline.';
create unique index series_compatibilities_canonical_pair_idx
  on public.series_compatibilities (
    discipline_id,
    least(series_a_id, series_b_id),
    greatest(series_a_id, series_b_id)
  );

-- A player's registration, series, discipline, and season.
create table public.player_disciplines (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.profiles(id) on delete restrict,
  discipline_id uuid not null references public.disciplines(id) on delete restrict,
  season_id uuid not null references public.seasons(id) on delete restrict,
  series_id uuid not null references public.series(id) on delete restrict,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);
comment on table public.player_disciplines is 'Player registrations by season and discipline with the assigned series.';
create unique index player_disciplines_active_unique_idx
  on public.player_disciplines (player_id, discipline_id, season_id)
  where active;
create index player_disciplines_season_discipline_active_idx
  on public.player_disciplines (season_id, discipline_id, active);
create index player_disciplines_player_season_active_idx
  on public.player_disciplines (player_id, season_id, active);

-- Permanent historical player partnership for one season and discipline.
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete restrict,
  discipline_id uuid not null references public.disciplines(id) on delete restrict,
  series_id uuid not null references public.series(id) on delete restrict,
  status public.team_status not null,
  created_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint teams_archived_state check (
    (status = 'ARCHIVED' and archived_at is not null) or
    (status <> 'ARCHIVED' and archived_at is null)
  )
);
comment on table public.teams is 'Permanent and historical teams; changing a durable partnership requires a new team.';
create index teams_season_discipline_status_idx on public.teams (season_id, discipline_id, status);
create index teams_series_status_idx on public.teams (series_id, status);

-- Historical membership periods for teams.
create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete restrict,
  player_id uuid not null references public.profiles(id) on delete restrict,
  start_date date not null,
  end_date date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint team_members_date_range check (end_date is null or end_date >= start_date),
  constraint team_members_active_end_date check ((active and end_date is null) or not active)
);
comment on table public.team_members is 'Historical team memberships with effective dates.';
create unique index team_members_active_member_unique_idx on public.team_members (team_id, player_id) where active;
create index team_members_player_active_idx on public.team_members (player_id, active);
create index team_members_team_active_idx on public.team_members (team_id, active);

-- A season-bound planning period and its availability window.
create table public.training_periods (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete restrict,
  name text not null,
  start_date date not null,
  end_date date not null,
  availability_opens_at timestamptz,
  availability_closes_at timestamptz,
  status public.training_period_status not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz,
  constraint training_periods_date_range check (end_date >= start_date),
  constraint training_periods_availability_window check (
    availability_closes_at is null or
    (availability_opens_at is not null and availability_closes_at > availability_opens_at)
  ),
  constraint training_periods_cancellation_consistency check (
    (status = 'CANCELLED' and cancelled_at is not null) or
    (status <> 'CANCELLED' and cancelled_at is null)
  )
);
comment on table public.training_periods is 'Season-bound planning periods and availability response windows.';
create index training_periods_season_status_idx on public.training_periods (season_id, status);
create index training_periods_dates_idx on public.training_periods (start_date, end_date);

-- Recurring time slots used to collect availability and generate training events.
create table public.training_slots (
  id uuid primary key default gen_random_uuid(),
  training_period_id uuid not null references public.training_periods(id) on delete restrict,
  day_of_week smallint not null,
  start_time time not null,
  end_time time not null,
  discipline_id uuid not null references public.disciplines(id) on delete restrict,
  installation_id uuid not null references public.installations(id) on delete restrict,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint training_slots_day_of_week_range check (day_of_week between 1 and 7),
  constraint training_slots_time_range check (end_time > start_time)
);
comment on table public.training_slots is 'Recurring weekly slots for a training period.';
create index training_slots_period_active_idx on public.training_slots (training_period_id, active);
create index training_slots_discipline_day_idx on public.training_slots (discipline_id, day_of_week);
create index training_slots_installation_idx on public.training_slots (installation_id);

-- Real training occurrences shared by planning versions.
create table public.training_events (
  id uuid primary key default gen_random_uuid(),
  training_period_id uuid not null references public.training_periods(id) on delete restrict,
  training_slot_id uuid references public.training_slots(id) on delete restrict,
  discipline_id uuid not null references public.disciplines(id) on delete restrict,
  installation_id uuid not null references public.installations(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.training_event_status not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz,
  cancellation_reason text,
  constraint training_events_time_range check (ends_at > starts_at),
  constraint training_events_cancellation_consistency check (
    (status = 'CANCELLED' and cancelled_at is not null) or
    (status <> 'CANCELLED' and cancelled_at is null)
  )
);
comment on table public.training_events is 'Actual training occurrences; planning versioning applies only to assignments.';
create index training_events_period_starts_at_idx on public.training_events (training_period_id, starts_at);
create index training_events_discipline_starts_at_idx on public.training_events (discipline_id, starts_at);
create index training_events_installation_starts_at_idx on public.training_events (installation_id, starts_at);

-- A player's recurring response for one training slot.
create table public.player_availabilities (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.profiles(id) on delete restrict,
  training_slot_id uuid not null references public.training_slots(id) on delete restrict,
  status public.availability_status not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (player_id, training_slot_id)
);
comment on table public.player_availabilities is 'Player recurring availability response for a training slot.';
create index player_availabilities_slot_status_idx on public.player_availabilities (training_slot_id, status);

-- A player's exception for a specific real training event.
create table public.availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.profiles(id) on delete restrict,
  training_event_id uuid not null references public.training_events(id) on delete restrict,
  exception_type public.availability_exception_type not null,
  reason text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (player_id, training_event_id)
);
comment on table public.availability_exceptions is 'One-off player availability exception for a training event.';
create index availability_exceptions_event_idx on public.availability_exceptions (training_event_id);

-- Versioned draft, validated, published, and archived training plans.
create table public.planning_versions (
  id uuid primary key default gen_random_uuid(),
  training_period_id uuid not null references public.training_periods(id) on delete restrict,
  version_number integer not null,
  status public.planning_version_status not null,
  generated_at timestamptz not null default now(),
  generated_by uuid not null references public.profiles(id) on delete restrict,
  published_at timestamptz,
  published_by uuid references public.profiles(id) on delete restrict,
  notes text,
  archived_at timestamptz,
  unique (training_period_id, version_number),
  constraint planning_versions_version_number_positive check (version_number > 0),
  constraint planning_versions_publication_consistency check (
    (published_at is null and published_by is null) or
    (published_at is not null and published_by is not null)
  ),
  constraint planning_versions_status_publication_consistency check (
    (status in ('DRAFT', 'VALIDATED') and published_at is null and published_by is null) or
    (status = 'PUBLISHED' and published_at is not null and published_by is not null) or
    status = 'ARCHIVED'
  ),
  constraint planning_versions_archival_consistency check (
    (status = 'ARCHIVED' and archived_at is not null) or
    (status <> 'ARCHIVED' and archived_at is null)
  )
);
comment on table public.planning_versions is 'Versioned training plans; published versions are unique per period.';
create unique index planning_versions_one_published_per_period_idx
  on public.planning_versions (training_period_id)
  where status = 'PUBLISHED';
create index planning_versions_period_status_idx on public.planning_versions (training_period_id, status);

-- Player assignment to a real training event in one planning version.
create table public.training_assignments (
  id uuid primary key default gen_random_uuid(),
  planning_version_id uuid not null references public.planning_versions(id) on delete restrict,
  training_event_id uuid not null references public.training_events(id) on delete restrict,
  player_id uuid not null references public.profiles(id) on delete restrict,
  assigned_by uuid not null references public.profiles(id) on delete restrict,
  override_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (planning_version_id, training_event_id, player_id)
);
comment on table public.training_assignments is 'A player assignment for an event in a specific planning version.';
create index training_assignments_player_version_idx on public.training_assignments (player_id, planning_version_id);
create index training_assignments_event_idx on public.training_assignments (training_event_id);

-- Season and discipline-scoped competition lifecycle.
create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete restrict,
  discipline_id uuid not null references public.disciplines(id) on delete restrict,
  series_id uuid references public.series(id) on delete restrict,
  name text not null,
  status public.competition_status not null,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  cancelled_at timestamptz,
  constraint competitions_time_range check (ends_at is null or (starts_at is not null and ends_at > starts_at)),
  constraint competitions_publication_consistency check (
    status <> 'PUBLISHED' or published_at is not null
  ),
  constraint competitions_cancellation_consistency check (
    (status = 'CANCELLED' and cancelled_at is not null) or
    (status <> 'CANCELLED' and cancelled_at is null)
  ),
  constraint competitions_unique_name unique (season_id, discipline_id, name)
);
comment on table public.competitions is 'Competitions scoped to a season, discipline, and optional series.';
create index competitions_season_discipline_status_idx on public.competitions (season_id, discipline_id, status);
create index competitions_starts_at_idx on public.competitions (starts_at);

-- Competition entries for permanent club teams.
create table public.competition_teams (
  competition_id uuid not null references public.competitions(id) on delete restrict,
  team_id uuid not null references public.teams(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (competition_id, team_id)
);
comment on table public.competition_teams is 'Teams entered into competitions.';
create index competition_teams_team_idx on public.competition_teams (team_id);

-- Individual competition matches, optionally linked to one club team.
create table public.competition_matches (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete restrict,
  team_id uuid references public.teams(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz,
  status public.competition_match_status not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz,
  constraint competition_matches_time_range check (ends_at is null or ends_at > starts_at),
  constraint competition_matches_cancellation_consistency check (
    (status = 'CANCELLED' and cancelled_at is not null) or
    (status <> 'CANCELLED' and cancelled_at is null)
  )
);
comment on table public.competition_matches is 'Competition matches with their scheduling lifecycle.';
create index competition_matches_competition_idx on public.competition_matches (competition_id);
create index competition_matches_team_idx on public.competition_matches (team_id);
create index competition_matches_starts_at_idx on public.competition_matches (starts_at);

-- A player request to be replaced for an assigned training event.
create table public.replacement_requests (
  id uuid primary key default gen_random_uuid(),
  training_assignment_id uuid not null references public.training_assignments(id) on delete restrict,
  requested_by uuid not null references public.profiles(id) on delete restrict,
  reason text,
  status public.replacement_request_status not null default 'REQUESTED',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete restrict,
  cancelled_at timestamptz,
  constraint replacement_requests_review_consistency check (
    (status in ('APPROVED', 'REJECTED') and reviewed_at is not null and reviewed_by is not null) or
    (status not in ('APPROVED', 'REJECTED') and reviewed_at is null and reviewed_by is null)
  ),
  constraint replacement_requests_cancellation_consistency check (
    (status = 'CANCELLED' and cancelled_at is not null) or
    (status <> 'CANCELLED' and cancelled_at is null)
  )
);
comment on table public.replacement_requests is 'Player request for a temporary training replacement.';
create unique index replacement_requests_one_open_per_assignment_idx
  on public.replacement_requests (training_assignment_id)
  where status in ('REQUESTED', 'IN_REVIEW');
create index replacement_requests_status_created_at_idx on public.replacement_requests (status, created_at);
create index replacement_requests_requester_status_idx on public.replacement_requests (requested_by, status);

-- Approved temporary player replacement, separate from permanent teams.
create table public.replacements (
  id uuid primary key default gen_random_uuid(),
  replacement_request_id uuid not null unique references public.replacement_requests(id) on delete restrict,
  original_assignment_id uuid not null references public.training_assignments(id) on delete restrict,
  replacement_player_id uuid not null references public.profiles(id) on delete restrict,
  approved_by uuid not null references public.profiles(id) on delete restrict,
  override_reason text,
  approved_at timestamptz not null default now(),
  cancelled_at timestamptz
);
comment on table public.replacements is 'Approved temporary replacements that never alter permanent team membership.';
create index replacements_player_idx on public.replacements (replacement_player_id);
create index replacements_original_assignment_idx on public.replacements (original_assignment_id);

-- Business notification for one recipient and its delivery state.
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete restrict,
  type text not null,
  title text not null,
  body text not null,
  related_entity_type text,
  related_entity_id uuid,
  status public.notification_status not null default 'PENDING',
  viewed_at timestamptz,
  scheduled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz,
  constraint notifications_related_entity_consistency check (
    (related_entity_type is null and related_entity_id is null) or
    (related_entity_type is not null and related_entity_id is not null)
  ),
  constraint notifications_cancellation_consistency check (
    (status = 'CANCELLED' and cancelled_at is not null) or
    (status <> 'CANCELLED' and cancelled_at is null)
  )
);
comment on table public.notifications is 'Business notification for a player, distinct from technical delivery attempts.';
create index notifications_recipient_viewed_at_idx on public.notifications (recipient_id, viewed_at);
create index notifications_recipient_created_at_idx on public.notifications (recipient_id, created_at desc);
create index notifications_status_scheduled_at_idx on public.notifications (status, scheduled_at);

-- Technical delivery attempts for a business notification.
create table public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete restrict,
  attempt_number integer not null,
  channel public.notification_log_channel not null,
  status public.notification_log_status not null,
  attempted_at timestamptz not null default now(),
  provider_message_id text,
  error_message text,
  created_at timestamptz not null default now(),
  unique (notification_id, attempt_number, channel),
  constraint notification_logs_attempt_number_positive check (attempt_number > 0)
);
comment on table public.notification_logs is 'Technical delivery attempts for notifications.';
create index notification_logs_notification_attempted_at_idx on public.notification_logs (notification_id, attempted_at);
create index notification_logs_status_attempted_at_idx on public.notification_logs (status, attempted_at);

-- Immutable business audit entries; writers are added in a later migration.
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id) on delete restrict,
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);
comment on table public.audit_logs is 'Business audit log entries without secrets or credentials.';
create index audit_logs_entity_created_at_idx on public.audit_logs (entity_type, entity_id, created_at desc);
create index audit_logs_actor_created_at_idx on public.audit_logs (actor_user_id, created_at desc);
create index audit_logs_created_at_idx on public.audit_logs (created_at desc);
