// Stockage des intégrations Notion dans Supabase.
// Tables utilisées : notion_integrations, notion_selected_pages,
//   notion_snapshots, notion_snapshot_pages.
// Les access_token sont chiffrés en AES-256-GCM avant écriture.

import { createClient } from "@/lib/supabase/server";
import { encrypt, decrypt } from "./crypto";
import type {
  NotionIntegration,
  NotionContextSnapshot,
  SelectedNotionPage,
} from "@/types/integrations";

// ============================================================
// Intégration : token + workspace
// ============================================================

export async function saveIntegration(integration: NotionIntegration): Promise<void> {
  const supabase = await createClient();
  const encryptedToken = encrypt(integration.access_token);

  const { error } = await supabase.from("notion_integrations").upsert(
    {
      user_id: integration.user_id,
      workspace_id: integration.workspace_id,
      workspace_name: integration.workspace_name,
      workspace_icon: integration.workspace_icon,
      access_token: encryptedToken,
      bot_id: integration.bot_id,
      notion_user_id: integration.notion_user_id,
      notion_user_email: integration.notion_user_email,
      notion_user_name: integration.notion_user_name,
      connected_at: integration.connected_at,
      last_synced_at: integration.last_synced_at,
    },
    { onConflict: "user_id" }
  );

  if (error) throw new Error(`saveIntegration: ${error.message}`);
}

export async function getIntegration(userId: string): Promise<NotionIntegration | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notion_integrations")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;

  return {
    user_id: data.user_id,
    workspace_id: data.workspace_id,
    workspace_name: data.workspace_name,
    workspace_icon: data.workspace_icon,
    access_token: decrypt(data.access_token),
    bot_id: data.bot_id,
    notion_user_id: data.notion_user_id,
    notion_user_email: data.notion_user_email,
    notion_user_name: data.notion_user_name,
    connected_at: data.connected_at,
    last_synced_at: data.last_synced_at,
  };
}

export async function deleteIntegration(userId: string): Promise<void> {
  const supabase = await createClient();

  // Supprimer les snapshots et leurs pages (cascade via FK)
  await supabase.from("notion_snapshots").delete().eq("user_id", userId);
  // Supprimer les pages sélectionnées
  await supabase.from("notion_selected_pages").delete().eq("user_id", userId);
  // Supprimer l'intégration
  const { error } = await supabase
    .from("notion_integrations")
    .delete()
    .eq("user_id", userId);

  if (error) throw new Error(`deleteIntegration: ${error.message}`);
}

// ============================================================
// Sélection des pages à inclure dans le contexte
// ============================================================

export async function saveSelectedPages(
  userId: string,
  pages: SelectedNotionPage[]
): Promise<void> {
  const supabase = await createClient();

  // Supprimer l'ancienne sélection
  await supabase.from("notion_selected_pages").delete().eq("user_id", userId);

  if (pages.length === 0) return;

  // Insérer la nouvelle sélection
  const rows = pages.map((p) => ({
    user_id: userId,
    page_id: p.page_id,
    title: p.title,
    selected: p.selected,
  }));

  const { error } = await supabase.from("notion_selected_pages").insert(rows);
  if (error) throw new Error(`saveSelectedPages: ${error.message}`);
}

export async function getSelectedPages(userId: string): Promise<SelectedNotionPage[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notion_selected_pages")
    .select("page_id, title, selected")
    .eq("user_id", userId);

  if (error) throw new Error(`getSelectedPages: ${error.message}`);

  return (data ?? []).map((row) => ({
    page_id: row.page_id,
    title: row.title,
    selected: row.selected,
  }));
}

// ============================================================
// Snapshot du contexte extrait (résultat de la dernière sync)
// ============================================================

export async function saveSnapshot(snapshot: NotionContextSnapshot): Promise<void> {
  const supabase = await createClient();

  // Insérer le snapshot parent
  const { data: snap, error: snapError } = await supabase
    .from("notion_snapshots")
    .insert({
      user_id: snapshot.user_id,
      workspace_id: snapshot.workspace_id,
      total_chars: snapshot.total_chars,
      synced_at: snapshot.synced_at,
    })
    .select("id")
    .single();

  if (snapError || !snap) {
    throw new Error(`saveSnapshot: ${snapError?.message ?? "no id returned"}`);
  }

  // Insérer les pages du snapshot
  if (snapshot.pages.length > 0) {
    const rows = snapshot.pages.map((p) => ({
      snapshot_id: snap.id,
      page_id: p.page_id,
      title: p.title,
      url: p.url,
      content: p.content,
      last_edited_time: p.last_edited_time,
    }));

    const { error: pagesError } = await supabase
      .from("notion_snapshot_pages")
      .insert(rows);

    if (pagesError) {
      throw new Error(`saveSnapshot pages: ${pagesError.message}`);
    }
  }
}

export async function getSnapshot(userId: string): Promise<NotionContextSnapshot | null> {
  const supabase = await createClient();

  // Récupérer le dernier snapshot
  const { data: snap, error: snapError } = await supabase
    .from("notion_snapshots")
    .select("*")
    .eq("user_id", userId)
    .order("synced_at", { ascending: false })
    .limit(1)
    .single();

  if (snapError || !snap) return null;

  // Récupérer les pages de ce snapshot
  const { data: pages } = await supabase
    .from("notion_snapshot_pages")
    .select("*")
    .eq("snapshot_id", snap.id);

  return {
    user_id: snap.user_id,
    workspace_id: snap.workspace_id,
    total_chars: snap.total_chars,
    synced_at: snap.synced_at,
    pages: (pages ?? []).map((p) => ({
      page_id: p.page_id,
      title: p.title,
      url: p.url ?? "",
      content: p.content,
      last_edited_time: p.last_edited_time ?? "",
    })),
  };
}
