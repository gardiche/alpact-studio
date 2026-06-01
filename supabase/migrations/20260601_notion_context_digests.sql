-- ============================================================
-- Table notion_context_digests — résumé structuré du contexte Notion
-- ============================================================
-- Stocke le digest généré par Claude à partir du snapshot Notion.
-- Recalculé uniquement quand le snapshot change (compare snapshot_id).
-- Utilisé par : copilot (system prompt), brief pré-séance, hub insights.

create table public.notion_context_digests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  snapshot_id uuid not null references public.notion_snapshots(id) on delete cascade,

  -- Sections structurées du digest
  identity text,         -- nom du projet, mission, proposition de valeur
  strategy text,         -- roadmap, objectifs, métriques cibles, vision
  progress text,         -- état d'avancement concret
  signals text,          -- ce qui a bougé récemment, ce qui stagne
  resources text,        -- outils, process, équipe, stack mentionnés

  -- Résumé court (injecté dans le system prompt copilot)
  summary text not null, -- max ~500 chars, résumé condensé du projet

  -- Métadonnées
  model text not null default 'claude-sonnet-4-20250514',
  input_tokens integer,
  output_tokens integer,
  generated_at timestamptz not null default now(),

  unique(user_id) -- un seul digest actif par user
);

create index notion_context_digests_user_idx on public.notion_context_digests(user_id);
create index notion_context_digests_snapshot_idx on public.notion_context_digests(snapshot_id);

-- RLS
alter table public.notion_context_digests enable row level security;

-- L'user voit uniquement son propre digest
create policy "notion_context_digests_select_own" on public.notion_context_digests
  for select using (auth.uid() = user_id);

-- L'user peut insérer/mettre à jour son propre digest
create policy "notion_context_digests_insert_own" on public.notion_context_digests
  for insert with check (auth.uid() = user_id);

create policy "notion_context_digests_update_own" on public.notion_context_digests
  for update using (auth.uid() = user_id);

create policy "notion_context_digests_delete_own" on public.notion_context_digests
  for delete using (auth.uid() = user_id);

-- La structure peut lire le digest d'un entrepreneur de sa cohorte
-- (pour le brief pré-séance)
create policy "notion_context_digests_select_org" on public.notion_context_digests
  for select using (
    exists(
      select 1
      from public.cohort_members cm
      join public.cohorts c on c.id = cm.cohort_id
      join public.org_memberships m on m.org_id = c.org_id
      where cm.user_id = notion_context_digests.user_id
        and m.user_id = auth.uid()
    )
  );
