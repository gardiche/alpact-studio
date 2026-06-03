// Point d'entrée unique pour les données du hub entrepreneur.
// Lit les données depuis Supabase via le client serveur.

import { createClient } from "@/lib/supabase/server";

// ============================================================
// Types (internes au hub — pas exportés dans types/index.ts)
// ============================================================

export interface HubMetrics {
  mrr: string;
  mrrTrend: string;
  runway: string;
  runwayStatus: "ok" | "warning" | "critical";
  priorite: string;
  alertes: number;
  // Données numériques enrichies (depuis Notion metrics extraction)
  mrrNumeric: number | null;
  arrNumeric: number | null;
  burnRate: number | null;
  runwayMonths: number | null;
  tresorerie: number | null;
  capitalRaised: number | null;
  nbClients: number | null;
  nbProspects: number | null;
  headcount: number | null;
  churnRate: number | null;
  nbLeadsMois: number | null;
  tauxConversion: number | null;
  prochaineEcheance: string | null;
  toolSignals: Record<string, ToolSignal> | null;
  lastExtractionAt: string | null;
  extractionConfidence: number | null;
}

export interface ToolSignal {
  status: "active" | "warning" | "critical";
  signal: string;
  items: string[];
}

export interface ActivityItem {
  id: string;
  icon: string;
  text: string;
  sub: string;
  time: string; // "il y a 1h", "hier", etc.
}

// ============================================================
// Helpers
// ============================================================

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days}j`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `il y a ${weeks} sem.`;
  return `il y a ${Math.floor(days / 30)} mois`;
}

// ============================================================
// Astryd Signal Builder (source : astryd_sync, PAS Notion)
// ============================================================

async function buildAstrydSignalFromSync(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<ToolSignal> {
  const { data: rawData } = await supabase
    .from("astryd_sync")
    .select(
      "score_global, decision_state, idea_title, maturity_score, " +
      "active_micro_commitments, recent_checkins, attention_zones, " +
      "ready_score, checkins_count, micro_actions_total, synced_at"
    )
    .eq("user_id", userId)
    .single();

  // Pas de données Astryd → signal d'attente
  if (!rawData) {
    return { status: "active", signal: "En attente de synchronisation Astryd", items: [] };
  }

  // Cast — les colonnes existent en DB (migration v2) mais ne sont pas dans le typegen
  const data = rawData as Record<string, unknown>;

  // ── Extraire les champs typés ──
  const scoreGlobal = typeof data.score_global === "number" ? data.score_global : null;
  const decisionState = typeof data.decision_state === "string" ? data.decision_state : null;
  const ideaTitle = typeof data.idea_title === "string" ? data.idea_title : null;
  const maturityScore = typeof data.maturity_score === "number" ? data.maturity_score : null;
  const checkinsCount = typeof data.checkins_count === "number" ? data.checkins_count : 0;
  const microActions = Array.isArray(data.active_micro_commitments)
    ? (data.active_micro_commitments as { status: string }[])
    : [];
  const zones = Array.isArray(data.attention_zones)
    ? (data.attention_zones as { label: string; niveau: string }[])
    : [];

  // ── Déterminer le signal principal ──
  let status: ToolSignal["status"] = "active";
  let signal = "Parcours en cours";
  const items: string[] = [];

  // 1. Score d'alignement global
  if (scoreGlobal != null) {
    if (scoreGlobal >= 70) {
      signal = `Alignement : ${scoreGlobal}% — bonne trajectoire`;
    } else if (scoreGlobal >= 50) {
      status = "warning";
      signal = `Alignement : ${scoreGlobal}% — points d'attention`;
    } else {
      status = "critical";
      signal = `Alignement : ${scoreGlobal}% — action requise`;
    }
  }

  // 2. Décision sur l'idée
  if (decisionState) {
    const decisionLabels: Record<string, string> = {
      GO: "Décision : GO",
      KEEP: "Décision : en réflexion",
      PIVOT: "Décision : pivot envisagé",
      STOP: "Décision : arrêt du projet",
    };
    items.push(decisionLabels[decisionState] ?? `Décision : ${decisionState}`);
  }

  // 3. Score de maturité
  if (maturityScore != null) {
    items.push(`Maturité : ${maturityScore}%`);
  }

  // 4. Micro-actions actives
  if (microActions.length > 0) {
    const pending = microActions.filter(
      (a) => a.status === "pending" || a.status === "in_progress"
    ).length;
    if (pending > 0) {
      items.push(`${pending} micro-action${pending > 1 ? "s" : ""} en cours`);
    }
  }

  // 5. Zones d'attention critiques
  if (zones.length > 0) {
    const critiques = zones.filter((z) => z.niveau === "critique");
    if (critiques.length > 0) {
      if (status !== "critical") status = "warning";
      items.push(`${critiques.length} zone${critiques.length > 1 ? "s" : ""} critique${critiques.length > 1 ? "s" : ""}`);
    }
  }

  // 6. Check-ins
  if (checkinsCount > 0) {
    items.push(`${checkinsCount} check-in${checkinsCount > 1 ? "s" : ""}`);
  }

  // 7. Idée en cours
  if (ideaTitle && items.length < 3) {
    items.push(`Projet : ${ideaTitle}`);
  }

  return { status, signal, items: items.slice(0, 3) };
}

// ============================================================
// Queries
// ============================================================

export async function getHubMetrics(): Promise<HubMetrics> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  // Charger hub_metrics ET le signal Astryd en parallèle
  const [{ data }, astrydSignal] = await Promise.all([
    supabase
      .from("hub_metrics")
      .select("*")
      .eq("user_id", user.id)
      .single(),
    buildAstrydSignalFromSync(supabase, user.id),
  ]);

  if (!data) {
    // Fallback — pas de métriques encore
    return {
      mrr: "—",
      mrrTrend: "",
      runway: "—",
      runwayStatus: "ok",
      priorite: "—",
      alertes: 0,
      mrrNumeric: null,
      arrNumeric: null,
      burnRate: null,
      runwayMonths: null,
      tresorerie: null,
      capitalRaised: null,
      nbClients: null,
      nbProspects: null,
      headcount: null,
      churnRate: null,
      nbLeadsMois: null,
      tauxConversion: null,
      prochaineEcheance: null,
      toolSignals: { astryd: astrydSignal },
      lastExtractionAt: null,
      extractionConfidence: null,
    };
  }

  // Fusionner : Astryd vient TOUJOURS de astryd_sync, jamais de Notion
  const baseSignals = (data.tool_signals as Record<string, ToolSignal>) ?? {};
  const mergedSignals: Record<string, ToolSignal> = {
    ...baseSignals,
    astryd: astrydSignal, // écrase toujours le signal Notion
  };

  return {
    mrr: data.mrr ?? "—",
    mrrTrend: data.mrr_trend ?? "",
    runway: data.runway ?? "—",
    runwayStatus: data.runway_status ?? "ok",
    priorite: data.priorite ?? "—",
    alertes: data.alertes ?? 0,
    mrrNumeric: data.mrr_numeric ?? null,
    arrNumeric: data.arr ?? null,
    burnRate: data.burn_rate ?? null,
    runwayMonths: data.runway_months ?? null,
    tresorerie: data.tresorerie ?? null,
    capitalRaised: data.capital_raised ?? null,
    nbClients: data.nb_clients ?? null,
    nbProspects: data.nb_prospects ?? null,
    headcount: data.headcount ?? null,
    churnRate: data.churn_rate ?? null,
    nbLeadsMois: data.nb_leads_mois ?? null,
    tauxConversion: data.taux_conversion ?? null,
    prochaineEcheance: data.prochaine_echeance ?? null,
    toolSignals: mergedSignals,
    lastExtractionAt: data.last_extraction_at ?? null,
    extractionConfidence: data.extraction_confidence ?? null,
  };
}

export async function getActivityFeed(limit = 10): Promise<ActivityItem[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data: rows } = await supabase
    .from("activity_feed")
    .select("*")
    .eq("user_id", user.id)
    .order("occurred_at", { ascending: false })
    .limit(limit);

  return (rows ?? []).map((row) => ({
    id: row.id,
    icon: row.icon ?? "",
    text: row.text,
    sub: row.sub ?? "",
    time: relativeTime(row.occurred_at),
  }));
}
