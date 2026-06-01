// Synthèse déterministe des signaux pour le brief pré-séance
import type {
  CohortMemberDetail,
  WeatherSignal,
  WeatherMood,
} from "@/types";

const DAYS_WINDOW = 21;

const MOOD_SCORE: Record<WeatherMood, number> = {
  ensoleillé: 2,
  nuageux: 0,
  brumeux: -1,
  orageux: -2,
};

function inWindow(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  return diff < DAYS_WINDOW * 24 * 60 * 60 * 1000;
}

export interface WeatherSynthesis {
  trend: "positive" | "stable" | "négative" | "neutre";
  dominant: WeatherMood | null;
  counts: Record<WeatherMood, number>;
  highlights: WeatherSignal[];
  summary: string;
}

export function synthesizeWeather(weather: WeatherSignal[]): WeatherSynthesis {
  const recent = weather.filter((w) => inWindow(w.created_at));
  const counts: Record<WeatherMood, number> = {
    ensoleillé: 0,
    nuageux: 0,
    brumeux: 0,
    orageux: 0,
  };
  recent.forEach((w) => {
    counts[w.mood] += 1;
  });
  if (recent.length === 0) {
    return { trend: "neutre", dominant: null, counts, highlights: [], summary: "Pas de signal récent." };
  }
  const avg = recent.reduce((s, w) => s + MOOD_SCORE[w.mood], 0) / recent.length;
  const trend: WeatherSynthesis["trend"] =
    avg >= 1 ? "positive" : avg <= -1 ? "négative" : Math.abs(avg) < 0.5 ? "stable" : "neutre";
  const dominant = (Object.keys(counts) as WeatherMood[]).reduce((best, m) =>
    counts[m] > counts[best] ? m : best
  );
  const highlights = recent.filter((w) => w.note).slice(0, 3);
  const summaryParts: string[] = [];
  if (trend === "positive") summaryParts.push("Météo récente plutôt positive.");
  else if (trend === "négative") summaryParts.push("Signaux préoccupants sur la période.");
  else if (trend === "stable") summaryParts.push("Météo stable, sans signal fort.");
  else summaryParts.push("Météo contrastée sur la période.");
  return { trend, dominant, counts, highlights, summary: summaryParts.join(" ") };
}

export interface AttentionZone {
  label: string;
  detail: string;
  severity: "haute" | "moyenne" | "basse";
}

export function computeAttentionZones(member: CohortMemberDetail): AttentionZone[] {
  const zones: AttentionZone[] = [];

  if (member.alert_reason) {
    zones.push({
      label: "Signal d'alerte cohorte",
      detail: member.alert_reason,
      severity: "haute",
    });
  }

  const recentNegativeWeather = member.weather
    .filter((w) => inWindow(w.created_at))
    .filter((w) => w.mood === "orageux" || w.mood === "brumeux").length;
  if (recentNegativeWeather >= 2) {
    zones.push({
      label: "Météo dégradée",
      detail: `${recentNegativeWeather} signaux négatifs sur ${DAYS_WINDOW} jours`,
      severity: "haute",
    });
  }

  const activeTensions = member.tensions.filter((t) => !t.resolved);
  activeTensions.slice(0, 3).forEach((t) => {
    zones.push({
      label: `Tension ${t.kind}`,
      detail: t.description,
      severity: activeTensions.length >= 3 ? "haute" : "moyenne",
    });
  });

  const overdue = member.actions.filter(
    (a) =>
      (a.status === "à faire" || a.status === "en cours") &&
      a.due_at &&
      new Date(a.due_at).getTime() < Date.now()
  );
  if (overdue.length > 0) {
    zones.push({
      label: "Actions en retard",
      detail: `${overdue.length} action${overdue.length > 1 ? "s" : ""} dépassée${overdue.length > 1 ? "s" : ""}`,
      severity: "moyenne",
    });
  }

  const blockedMilestones = member.milestones.filter((m) => m.status === "bloqué");
  blockedMilestones.forEach((m) => {
    zones.push({
      label: `Jalon bloqué : ${m.title}`,
      detail: m.description ?? "Pas de description renseignée",
      severity: "haute",
    });
  });

  return zones;
}

export function buildBriefContext(member: CohortMemberDetail) {
  const weather = synthesizeWeather(member.weather);
  const zones = computeAttentionZones(member);
  const openActions = member.actions.filter(
    (a) => a.status === "à faire" || a.status === "en cours"
  );
  const recentDoneActions = member.actions
    .filter((a) => a.status === "fait")
    .slice(0, 3);
  const activeTensions = member.tensions.filter((t) => !t.resolved);
  const inProgressMilestones = member.milestones.filter((m) => m.status === "en cours");

  return {
    weather,
    zones,
    openActions,
    recentDoneActions,
    activeTensions,
    inProgressMilestones,
  };
}
