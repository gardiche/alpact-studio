-- ============================================================
-- Alpact Studio — Schéma initial
-- ============================================================
-- Conventions :
--   * Tous les identifiants sont des UUID
--   * Les timestamptz sont en UTC, défaut now()
--   * Les enums sont des `text` avec CHECK pour rester souples
--   * RLS activé par défaut sur toutes les tables métier
-- ============================================================

-- Extensions
create extension if not exists "pgcrypto";

-- ============================================================
-- 1. PROFILES — extension de auth.users
-- ============================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('entrepreneur', 'structure')),
  first_name text,
  last_name text,
  avatar_url text,
  is_readonly_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles(role);

-- ============================================================
-- 2. ENTREPRENEURS — projet du fondateur (1 par profile entrepreneur)
-- ============================================================

create table public.entrepreneur_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  project_name text,
  project_description text,
  sector text,
  stage text check (stage in ('idéation', 'POC', 'early-stage', 'traction', 'scaling')),
  initial_stage text check (initial_stage in ('idéation', 'POC', 'early-stage', 'traction', 'scaling')),
  team_size integer,
  founded_at date,
  capital_raised numeric default 0,
  revenue_yearly numeric default 0,
  headcount integer default 1,
  is_growing boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 3. ORGANIZATIONS — structures d'accompagnement
-- ============================================================

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('incubateur', 'accélérateur', 'pépinière', 'réseau')),
  logo_url text,
  city text,
  is_readonly_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.org_memberships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'accompagnateur', 'viewer')),
  created_at timestamptz not null default now(),
  unique(org_id, user_id)
);

create index org_memberships_user_idx on public.org_memberships(user_id);
create index org_memberships_org_idx on public.org_memberships(org_id);

-- ============================================================
-- 4. COHORTS — promotions d'une organisation
-- ============================================================

create table public.cohorts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now()
);

create index cohorts_org_idx on public.cohorts(org_id);

-- ============================================================
-- 5. COHORT_MEMBERS — entrepreneurs dans une cohorte
-- ============================================================
-- Note : un cohort_member peut référencer un entrepreneur_profile
-- (cas où l'entrepreneur a un compte Alpact) OU pas (cas où la
-- structure l'a juste ajouté comme contact, sans qu'il se soit
-- encore créé un compte).

create table public.cohort_members (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.cohorts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  -- Données de base (recopiées du profile pour avoir l'historique au moment de l'ajout)
  first_name text not null,
  last_name text not null,
  email text not null,
  avatar_url text,
  project_name text not null,
  project_description text,
  sector text,
  stage text check (stage in ('idéation', 'POC', 'early-stage', 'traction', 'scaling')),
  initial_stage text check (initial_stage in ('idéation', 'POC', 'early-stage', 'traction', 'scaling')),
  team_size integer default 1,
  -- Données vivantes
  status text not null default 'actif' check (status in ('actif', 'inactif', 'alerte')),
  last_active_at timestamptz,
  joined_at timestamptz not null default now(),
  active_tool text check (active_tool in ('astryd', 'elyse', 'gyna')),
  current_milestone text,
  alert_reason text,
  -- Performance économique
  capital_raised numeric default 0,
  revenue_yearly numeric default 0,
  headcount integer default 1,
  is_growing boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cohort_members_cohort_idx on public.cohort_members(cohort_id);
create index cohort_members_user_idx on public.cohort_members(user_id);
create index cohort_members_status_idx on public.cohort_members(status);

-- ============================================================
-- 6. MILESTONES — jalons par entrepreneur
-- ============================================================

create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  cohort_member_id uuid not null references public.cohort_members(id) on delete cascade,
  category text not null check (category in ('produit', 'commercial', 'financement', 'équipe', 'posture')),
  title text not null,
  description text,
  status text not null default 'à venir' check (status in ('à venir', 'en cours', 'franchi', 'bloqué')),
  reached_at timestamptz,
  created_at timestamptz not null default now()
);

create index milestones_member_idx on public.milestones(cohort_member_id);
create index milestones_status_idx on public.milestones(status);

-- ============================================================
-- 7. SIGNAUX FAIBLES (météo / tensions / actions)
-- ============================================================

create table public.weather_signals (
  id uuid primary key default gen_random_uuid(),
  cohort_member_id uuid not null references public.cohort_members(id) on delete cascade,
  mood text not null check (mood in ('ensoleillé', 'nuageux', 'orageux', 'brumeux')),
  note text,
  created_at timestamptz not null default now()
);

create index weather_signals_member_idx on public.weather_signals(cohort_member_id, created_at desc);

create table public.tension_signals (
  id uuid primary key default gen_random_uuid(),
  cohort_member_id uuid not null references public.cohort_members(id) on delete cascade,
  kind text not null check (kind in ('co-fondateur', 'financière', 'client', 'produit', 'personnelle', 'équipe')),
  description text not null,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create index tension_signals_member_idx on public.tension_signals(cohort_member_id);

create table public.action_signals (
  id uuid primary key default gen_random_uuid(),
  cohort_member_id uuid not null references public.cohort_members(id) on delete cascade,
  title text not null,
  status text not null default 'à faire' check (status in ('à faire', 'en cours', 'fait', 'abandonné')),
  due_at timestamptz,
  created_at timestamptz not null default now()
);

create index action_signals_member_idx on public.action_signals(cohort_member_id);

-- ============================================================
-- 8. SESSIONS — RDV d'accompagnement
-- ============================================================

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  cohort_member_id uuid not null references public.cohort_members(id) on delete cascade,
  scheduled_at timestamptz not null,
  duration_min integer not null default 60,
  kind text not null default 'check-up' check (kind in ('check-up', 'deep-dive', 'kickoff', 'closing')),
  status text not null default 'à venir' check (status in ('à venir', 'passée', 'annulée')),
  created_at timestamptz not null default now()
);

create index sessions_member_idx on public.sessions(cohort_member_id, scheduled_at);

-- ============================================================
-- 9. ACCOMPANIST NOTES — notes privées accompagnateur
-- ============================================================

create table public.accompanist_notes (
  id uuid primary key default gen_random_uuid(),
  cohort_member_id uuid not null references public.cohort_members(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  author_name text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index accompanist_notes_member_idx on public.accompanist_notes(cohort_member_id, created_at desc);

-- ============================================================
-- 10. TOOL USAGE — usage Astryd/Elyse/Gyna
-- ============================================================

create table public.tool_usage (
  id uuid primary key default gen_random_uuid(),
  cohort_member_id uuid not null references public.cohort_members(id) on delete cascade,
  tool text not null check (tool in ('astryd', 'elyse', 'gyna')),
  last_used_at timestamptz,
  sessions_count integer not null default 0,
  key_insight text,
  updated_at timestamptz not null default now(),
  unique(cohort_member_id, tool)
);

create index tool_usage_member_idx on public.tool_usage(cohort_member_id);

-- ============================================================
-- 11. HUB ENTREPRENEUR — metrics, activity, notifications
-- ============================================================
-- Données affichées sur le hub entrepreneur (PulseCards, ActivityFeed, etc.)

create table public.hub_metrics (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  mrr text,
  mrr_trend text,
  runway text,
  runway_status text check (runway_status in ('ok', 'warning', 'critical')),
  priorite text,
  alertes integer default 0,
  updated_at timestamptz not null default now()
);

create table public.activity_feed (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  icon text,
  text text not null,
  sub text,
  tool text check (tool in ('astryd', 'elyse', 'gyna', 'hub')),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index activity_feed_user_idx on public.activity_feed(user_id, occurred_at desc);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tool text not null check (tool in ('astryd', 'elyse', 'gyna')),
  type text not null check (type in ('warning', 'critique', 'rappel')),
  title text not null,
  message text,
  link text,
  is_read boolean not null default false,
  email_sent boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications(user_id, is_read, created_at desc);

-- ============================================================
-- 12. INTÉGRATIONS NOTION
-- ============================================================

create table public.notion_integrations (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  workspace_id text not null,
  workspace_name text not null,
  workspace_icon text,
  access_token text not null,
  bot_id text not null,
  notion_user_id text,
  notion_user_email text,
  notion_user_name text,
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz
);

create table public.notion_selected_pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  page_id text not null,
  title text not null,
  selected boolean not null default true,
  unique(user_id, page_id)
);

create index notion_selected_pages_user_idx on public.notion_selected_pages(user_id);

create table public.notion_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  workspace_id text not null,
  total_chars integer not null default 0,
  synced_at timestamptz not null default now()
);

create index notion_snapshots_user_idx on public.notion_snapshots(user_id, synced_at desc);

create table public.notion_snapshot_pages (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.notion_snapshots(id) on delete cascade,
  page_id text not null,
  title text not null,
  url text,
  content text not null,
  last_edited_time timestamptz
);

create index notion_snapshot_pages_snapshot_idx on public.notion_snapshot_pages(snapshot_id);

-- ============================================================
-- 13. ROW LEVEL SECURITY
-- ============================================================
-- Stratégie :
--   * profiles : chacun lit/écrit le sien
--   * entrepreneur_profiles : chacun lit/écrit le sien
--   * organizations + org_memberships : tous les membres lisent, owner écrit
--   * cohorts + cohort_members et tout ce qui descend : membres org lisent/écrivent
--   * hub_metrics, activity_feed, notifications : chacun les siens
--   * notion_* : chacun les siens

alter table public.profiles enable row level security;
alter table public.entrepreneur_profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.org_memberships enable row level security;
alter table public.cohorts enable row level security;
alter table public.cohort_members enable row level security;
alter table public.milestones enable row level security;
alter table public.weather_signals enable row level security;
alter table public.tension_signals enable row level security;
alter table public.action_signals enable row level security;
alter table public.sessions enable row level security;
alter table public.accompanist_notes enable row level security;
alter table public.tool_usage enable row level security;
alter table public.hub_metrics enable row level security;
alter table public.activity_feed enable row level security;
alter table public.notifications enable row level security;
alter table public.notion_integrations enable row level security;
alter table public.notion_selected_pages enable row level security;
alter table public.notion_snapshots enable row level security;
alter table public.notion_snapshot_pages enable row level security;

-- Profiles
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Entrepreneur profiles
create policy "entrepreneur_profiles_select_own" on public.entrepreneur_profiles for select using (auth.uid() = user_id);
create policy "entrepreneur_profiles_upsert_own" on public.entrepreneur_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Org memberships : un user voit les siennes
create policy "org_memberships_select_own" on public.org_memberships for select using (auth.uid() = user_id);

-- Organizations : un user voit celles dont il est membre
create policy "organizations_select_member" on public.organizations
  for select using (
    exists(select 1 from public.org_memberships m where m.org_id = organizations.id and m.user_id = auth.uid())
  );

-- Cohorts : on voit celles des orgs dont on est membre
create policy "cohorts_select_member" on public.cohorts
  for select using (
    exists(select 1 from public.org_memberships m where m.org_id = cohorts.org_id and m.user_id = auth.uid())
  );

-- Cohort members : on voit ceux des cohortes dont on a accès
create policy "cohort_members_select_member" on public.cohort_members
  for select using (
    exists(
      select 1 from public.cohorts c
      join public.org_memberships m on m.org_id = c.org_id
      where c.id = cohort_members.cohort_id and m.user_id = auth.uid()
    )
  );

-- Helper : un user a accès à un cohort_member ?
create or replace function public.user_can_read_cohort_member(member_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.cohort_members cm
    join public.cohorts c on c.id = cm.cohort_id
    join public.org_memberships m on m.org_id = c.org_id
    where cm.id = member_id and m.user_id = auth.uid()
  );
$$;

-- Milestones, signaux, sessions, notes, tool_usage : héritent de l'accès au cohort_member
create policy "milestones_select" on public.milestones for select using (public.user_can_read_cohort_member(cohort_member_id));
create policy "weather_signals_select" on public.weather_signals for select using (public.user_can_read_cohort_member(cohort_member_id));
create policy "tension_signals_select" on public.tension_signals for select using (public.user_can_read_cohort_member(cohort_member_id));
create policy "action_signals_select" on public.action_signals for select using (public.user_can_read_cohort_member(cohort_member_id));
create policy "sessions_select" on public.sessions for select using (public.user_can_read_cohort_member(cohort_member_id));
create policy "accompanist_notes_select" on public.accompanist_notes for select using (public.user_can_read_cohort_member(cohort_member_id));
create policy "tool_usage_select" on public.tool_usage for select using (public.user_can_read_cohort_member(cohort_member_id));

-- Hub
create policy "hub_metrics_select_own" on public.hub_metrics for select using (auth.uid() = user_id);
create policy "hub_metrics_upsert_own" on public.hub_metrics for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "activity_feed_select_own" on public.activity_feed for select using (auth.uid() = user_id);
create policy "activity_feed_insert_own" on public.activity_feed for insert with check (auth.uid() = user_id);
create policy "notifications_select_own" on public.notifications for select using (auth.uid() = user_id);
create policy "notifications_update_own" on public.notifications for update using (auth.uid() = user_id);

-- Notion
create policy "notion_integrations_select_own" on public.notion_integrations for select using (auth.uid() = user_id);
create policy "notion_integrations_upsert_own" on public.notion_integrations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notion_selected_pages_select_own" on public.notion_selected_pages for select using (auth.uid() = user_id);
create policy "notion_selected_pages_upsert_own" on public.notion_selected_pages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notion_snapshots_select_own" on public.notion_snapshots for select using (auth.uid() = user_id);
create policy "notion_snapshots_upsert_own" on public.notion_snapshots for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notion_snapshot_pages_select" on public.notion_snapshot_pages
  for select using (
    exists(select 1 from public.notion_snapshots s where s.id = notion_snapshot_pages.snapshot_id and s.user_id = auth.uid())
  );

-- ============================================================
-- 14. TRIGGERS — updated_at automatique
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger entrepreneur_profiles_set_updated_at before update on public.entrepreneur_profiles for each row execute function public.set_updated_at();
create trigger organizations_set_updated_at before update on public.organizations for each row execute function public.set_updated_at();
create trigger cohort_members_set_updated_at before update on public.cohort_members for each row execute function public.set_updated_at();
create trigger hub_metrics_set_updated_at before update on public.hub_metrics for each row execute function public.set_updated_at();
create trigger tool_usage_set_updated_at before update on public.tool_usage for each row execute function public.set_updated_at();

-- ============================================================
-- 15. TRIGGER — créer un profil à la création d'un user
-- ============================================================
-- Quand un user signup via Supabase auth, on lui crée son profile
-- automatiquement à partir des metadata fournies au signup.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_role text;
begin
  user_role := coalesce(new.raw_user_meta_data->>'role', 'entrepreneur');
  insert into public.profiles (id, email, role, first_name, last_name)
  values (
    new.id,
    new.email,
    user_role,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
