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
// Queries
// ============================================================

export async function getHubMetrics(): Promise<HubMetrics> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data } = await supabase
    .from("hub_metrics")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!data) {
    // Fallback — pas de métriques encore
    return {
      mrr: "—",
      mrrTrend: "",
      runway: "—",
      runwayStatus: "ok",
      priorite: "—",
      alertes: 0,
    };
  }

  return {
    mrr: data.mrr ?? "—",
    mrrTrend: data.mrr_trend ?? "",
    runway: data.runway ?? "—",
    runwayStatus: data.runway_status ?? "ok",
    priorite: data.priorite ?? "—",
    alertes: data.alertes ?? 0,
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
