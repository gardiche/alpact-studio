-- ============================================================
-- Tables de synchronisation Astryd → Alpact Studio
-- ============================================================
-- Stocke les données-clé d'Astryd pour les rendre lisibles
-- par le hub, le brief, et les insights Alpact Studio.
-- Alimenté par le webhook Astryd après chaque action user.

-- Synthèse du profil Astryd d'un entrepreneur
create table public.astryd_sync (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,

  -- Identifiants Astryd
  astryd_user_id text,               -- user_id côté Supabase Astryd
  astryd_email text not null,         -- email pour le matching

  -- Score d'alignement (6 jauges)
  score_global numeric,
  score_energie numeric,
  score_temps numeric,
  score_finances numeric,
  score_soutien numeric,
  score_competences numeric,
  score_motivation numeric,

  -- Zones d'attention (JSON array simplifié)
  attention_zones jsonb default '[]'::jsonb,

  -- Dernière activité
  last_checkin_at timestamptz,
  last_journal_at timestamptz,
  last_action_completed_at timestamptz,
  micro_actions_done integer default 0,
  journal_entries_count integer default 0,
  sessions_count integer default 0,

  -- Métadonnées
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(user_id)
);

create index astryd_sync_user_idx on public.astryd_sync(user_id);
create index astryd_sync_email_idx on public.astryd_sync(astryd_email);

-- RLS
alter table public.astryd_sync enable row level security;

-- L'entrepreneur voit ses propres données Astryd
create policy "astryd_sync_select_own" on public.astryd_sync
  for select using (auth.uid() = user_id);

-- Insert/update par le service (via service_role_key dans le webhook)
create policy "astryd_sync_insert_own" on public.astryd_sync
  for insert with check (auth.uid() = user_id);

create policy "astryd_sync_update_own" on public.astryd_sync
  for update using (auth.uid() = user_id);

-- La structure peut voir les données Astryd de ses entrepreneurs
create policy "astryd_sync_select_org" on public.astryd_sync
  for select using (
    exists(
      select 1
      from public.cohort_members cm
      join public.cohorts c on c.id = cm.cohort_id
      join public.org_memberships m on m.org_id = c.org_id
      where cm.user_id = astryd_sync.user_id
        and m.user_id = auth.uid()
    )
  );

-- Trigger updated_at
create trigger astryd_sync_set_updated_at
  before update on public.astryd_sync
  for each row execute function public.set_updated_at();
