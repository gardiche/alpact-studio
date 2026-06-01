-- Ajouter les policies manquantes pour notion_snapshot_pages
-- (insert et delete nécessaires pour la sync)

create policy "notion_snapshot_pages_insert" on public.notion_snapshot_pages
  for insert with check (
    exists(
      select 1 from public.notion_snapshots s
      where s.id = notion_snapshot_pages.snapshot_id
        and s.user_id = auth.uid()
    )
  );

create policy "notion_snapshot_pages_delete" on public.notion_snapshot_pages
  for delete using (
    exists(
      select 1 from public.notion_snapshots s
      where s.id = notion_snapshot_pages.snapshot_id
        and s.user_id = auth.uid()
    )
  );
