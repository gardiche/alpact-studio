// POST /api/astryd/sync
// Webhook appelé par Astryd (Edge Function) pour synchroniser
// TOUTES les données-clé d'un user vers Alpact Studio.
// Authentifié via un secret partagé (ASTRYD_SYNC_SECRET).

import { createClient as createServerClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/* ─── Payload complet Astryd → Alpact ─── */
interface AstrydSyncPayload {
  email: string;
  astryd_user_id?: string;

  // ── Profil ──
  display_name?: string;
  ready_score?: number;

  // ── Personnalité ──
  schwartz_values?: Record<string, number>;
  big_five_traits?: Record<string, number>;
  riasec_scores?: Record<string, number>;
  life_spheres?: Record<string, number>;
  user_context?: Record<string, unknown>;

  // ── Idée principale ──
  idea_id?: string;
  idea_title?: string;
  idea_description?: string;

  // ── Décision ──
  decision_state?: "GO" | "KEEP" | "PIVOT" | "STOP";
  decision_rationale?: string;

  // ── Scores d'alignement (6 jauges) ──
  score_global?: number;
  score_energie?: number;
  score_temps?: number;
  score_finances?: number;
  score_soutien?: number;
  score_competences?: number;
  score_motivation?: number;

  // ── Historique alignement ──
  alignment_history?: Array<{
    score: number;
    details: Record<string, number>;
    created_at: string;
  }>;

  // ── Score de maturité ──
  maturity_score?: number;
  maturity_progression?: number;

  // ── Zones d'attention ──
  attention_zones?: Array<{
    label: string;
    niveau: "critique" | "attention";
    explication: string;
  }>;

  // ── Posture assessment ──
  posture_assessment?: {
    life_spheres: Record<string, number>;
    environment: Record<string, number>;
    motivation: number;
    aversion_risque: number;
  };

  // ── Check-ins récents ──
  recent_checkins?: Array<{
    energy_level: number;
    clarity_level: number;
    mood_level: number;
    created_at: string;
  }>;

  // ── Micro-actions actives ──
  active_micro_commitments?: Array<{
    text: string;
    objectif?: string;
    status: string;
    jauge_ciblee?: string;
    due_date?: string;
  }>;

  // ── Dernière session ──
  last_session_summary?: {
    idea_title?: string;
    alignment_scores?: Record<string, number>;
    maturity_score?: number;
    attention_zones?: unknown[];
    decision?: string;
    journal_message_count?: number;
    created_at?: string;
  };

  // ── Compteurs d'activité ──
  last_checkin_at?: string;
  last_journal_at?: string;
  last_action_completed_at?: string;
  micro_actions_done?: number;
  micro_actions_total?: number;
  journal_entries_count?: number;
  sessions_count?: number;
  checkins_count?: number;
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

  // Accepter email au top-level OU dans un sous-objet user
  if (!payload.email && (payload as any).user?.email) {
    payload.email = (payload as any).user.email;
  }

  if (!payload.email) {
    return NextResponse.json({ error: "email_required" }, { status: 400 });
  }

  // 3. Utiliser le service_role pour bypasser le RLS
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
    return NextResponse.json({
      synced: false,
      reason: "user_not_found_in_alpact",
    });
  }

  // 5. Construire l'objet upsert (n'inclut que les champs présents dans le payload)
  const syncData: Record<string, unknown> = {
    user_id: profile.id,
    astryd_email: payload.email,
    astryd_user_id: payload.astryd_user_id ?? null,
    synced_at: new Date().toISOString(),
  };

  // ── Profil ──
  if (payload.display_name !== undefined) syncData.display_name = payload.display_name;
  if (payload.ready_score !== undefined) syncData.ready_score = payload.ready_score;

  // ── Personnalité ──
  if (payload.schwartz_values !== undefined) syncData.schwartz_values = payload.schwartz_values;
  if (payload.big_five_traits !== undefined) syncData.big_five_traits = payload.big_five_traits;
  if (payload.riasec_scores !== undefined) syncData.riasec_scores = payload.riasec_scores;
  if (payload.life_spheres !== undefined) syncData.life_spheres = payload.life_spheres;
  if (payload.user_context !== undefined) syncData.user_context = payload.user_context;

  // ── Idée ──
  if (payload.idea_id !== undefined) syncData.idea_id = payload.idea_id;
  if (payload.idea_title !== undefined) syncData.idea_title = payload.idea_title;
  if (payload.idea_description !== undefined) syncData.idea_description = payload.idea_description;

  // ── Décision ──
  if (payload.decision_state !== undefined) syncData.decision_state = payload.decision_state;
  if (payload.decision_rationale !== undefined) syncData.decision_rationale = payload.decision_rationale;

  // ── Alignement ──
  if (payload.score_global !== undefined) syncData.score_global = payload.score_global;
  if (payload.score_energie !== undefined) syncData.score_energie = payload.score_energie;
  if (payload.score_temps !== undefined) syncData.score_temps = payload.score_temps;
  if (payload.score_finances !== undefined) syncData.score_finances = payload.score_finances;
  if (payload.score_soutien !== undefined) syncData.score_soutien = payload.score_soutien;
  if (payload.score_competences !== undefined) syncData.score_competences = payload.score_competences;
  if (payload.score_motivation !== undefined) syncData.score_motivation = payload.score_motivation;
  if (payload.alignment_history !== undefined) syncData.alignment_history = payload.alignment_history;

  // ── Maturité ──
  if (payload.maturity_score !== undefined) syncData.maturity_score = payload.maturity_score;
  if (payload.maturity_progression !== undefined) syncData.maturity_progression = payload.maturity_progression;

  // ── Zones d'attention ──
  if (payload.attention_zones !== undefined) syncData.attention_zones = payload.attention_zones;

  // ── Posture ──
  if (payload.posture_assessment !== undefined) syncData.posture_assessment = payload.posture_assessment;

  // ── Check-ins récents ──
  if (payload.recent_checkins !== undefined) syncData.recent_checkins = payload.recent_checkins;

  // ── Micro-actions ──
  if (payload.active_micro_commitments !== undefined) syncData.active_micro_commitments = payload.active_micro_commitments;

  // ── Dernière session ──
  if (payload.last_session_summary !== undefined) syncData.last_session_summary = payload.last_session_summary;

  // ── Compteurs d'activité ──
  if (payload.last_checkin_at !== undefined) syncData.last_checkin_at = payload.last_checkin_at;
  if (payload.last_journal_at !== undefined) syncData.last_journal_at = payload.last_journal_at;
  if (payload.last_action_completed_at !== undefined) syncData.last_action_completed_at = payload.last_action_completed_at;
  if (payload.micro_actions_done !== undefined) syncData.micro_actions_done = payload.micro_actions_done;
  if (payload.micro_actions_total !== undefined) syncData.micro_actions_total = payload.micro_actions_total;
  if (payload.journal_entries_count !== undefined) syncData.journal_entries_count = payload.journal_entries_count;
  if (payload.sessions_count !== undefined) syncData.sessions_count = payload.sessions_count;
  if (payload.checkins_count !== undefined) syncData.checkins_count = payload.checkins_count;

  // 6. Upsert
  const { error } = await supabase
    .from("astryd_sync")
    .upsert(syncData, { onConflict: "user_id" });

  if (error) {
    console.error("[astryd/sync] Upsert error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ synced: true, user_id: profile.id });
}
