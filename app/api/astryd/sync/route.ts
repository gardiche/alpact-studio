// POST /api/astryd/sync
// Webhook appelé par Astryd (Edge Function) pour synchroniser
// les données-clé d'un user vers Alpact Studio.
// Authentifié via un secret partagé (ASTRYD_SYNC_SECRET).

import { createClient as createServerClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface AstrydSyncPayload {
  email: string;
  astryd_user_id?: string;

  // Scores d'alignement
  score_global?: number;
  score_energie?: number;
  score_temps?: number;
  score_finances?: number;
  score_soutien?: number;
  score_competences?: number;
  score_motivation?: number;

  // Zones d'attention
  attention_zones?: Array<{
    label: string;
    niveau: "critique" | "attention";
    explication: string;
  }>;

  // Activité
  last_checkin_at?: string;
  last_journal_at?: string;
  last_action_completed_at?: string;
  micro_actions_done?: number;
  journal_entries_count?: number;
  sessions_count?: number;
}

function verifyWebhookSecret(req: NextRequest): boolean {
  const secret = req.headers.get("x-astryd-secret");
  const expected = process.env.ASTRYD_SYNC_SECRET;
  if (!expected || !secret) return false;
  return secret === expected;
}

export async function POST(req: NextRequest) {
  // 1. Vérifier le secret
  if (!verifyWebhookSecret(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 2. Parser le body
  let payload: AstrydSyncPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!payload.email) {
    return NextResponse.json({ error: "email_required" }, { status: 400 });
  }

  // 3. Utiliser le service_role pour bypasser le RLS
  //    (le webhook n'a pas de session user)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 4. Trouver l'user Alpact par email
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", payload.email)
    .single();

  if (!profile) {
    // L'user n'a pas de compte Alpact Studio — on ignore silencieusement
    // (cas où l'user utilise Astryd sans Alpact)
    return NextResponse.json({
      synced: false,
      reason: "user_not_found_in_alpact",
    });
  }

  // 5. Upsert les données dans astryd_sync
  const { error } = await supabase.from("astryd_sync").upsert(
    {
      user_id: profile.id,
      astryd_email: payload.email,
      astryd_user_id: payload.astryd_user_id ?? null,
      score_global: payload.score_global ?? null,
      score_energie: payload.score_energie ?? null,
      score_temps: payload.score_temps ?? null,
      score_finances: payload.score_finances ?? null,
      score_soutien: payload.score_soutien ?? null,
      score_competences: payload.score_competences ?? null,
      score_motivation: payload.score_motivation ?? null,
      attention_zones: payload.attention_zones ?? [],
      last_checkin_at: payload.last_checkin_at ?? null,
      last_journal_at: payload.last_journal_at ?? null,
      last_action_completed_at: payload.last_action_completed_at ?? null,
      micro_actions_done: payload.micro_actions_done ?? 0,
      journal_entries_count: payload.journal_entries_count ?? 0,
      sessions_count: payload.sessions_count ?? 0,
      synced_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("[astryd/sync] Upsert error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ synced: true, user_id: profile.id });
}
