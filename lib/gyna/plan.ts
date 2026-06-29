import type { GynaConfig } from "./gyna-config";
import {
  FINAL_STATUSES,
  POSITIVE_STATUSES,
  type Prospect,
  type Source,
  type Status,
} from "./prospects";

/* ----------------------- Channel conversion stats ----------------------- */

export type CanalStat = {
  canal: Source;
  total: number;
  positives: number;
  rate: number;
};

export function channelStats(prospects: Prospect[]): CanalStat[] {
  const m = new Map<Source, { total: number; positives: number }>();
  for (const p of prospects) {
    if (!FINAL_STATUSES.includes(p.status)) continue;
    const cur = m.get(p.source) ?? { total: 0, positives: 0 };
    cur.total += 1;
    if (POSITIVE_STATUSES.includes(p.status)) cur.positives += 1;
    m.set(p.source, cur);
  }
  return Array.from(m.entries())
    .map(([canal, v]) => ({ canal, ...v, rate: v.positives / Math.max(1, v.total) }))
    .sort((a, b) => b.rate - a.rate);
}

/** Returns the top stat if it beats some other (>= 3 each side) by 2x. */
export function winningChannel(stats: CanalStat[]): CanalStat | null {
  const eligible = stats.filter((s) => s.total >= 3);
  if (eligible.length < 2) return null;
  const top = eligible[0];
  const others = eligible.slice(1);
  const beaten = others.find((o) => top.rate >= 2 * Math.max(o.rate, 0.0001));
  return beaten ? top : null;
}

export type SynthesisPhrase = {
  text: string;
  hasWinner: boolean;
};

export function synthesisPhrase(stats: CanalStat[]): SynthesisPhrase {
  const winner = winningChannel(stats);
  if (winner) {
    return {
      hasWinner: true,
      text: `Concentre ton énergie sur ${winner.canal} cette semaine — c'est ce qui convertit le mieux pour toi en ce moment.`,
    };
  }
  return {
    hasWinner: false,
    text: "Pas encore assez de données pour trancher entre tes canaux — continue à varier et qualifier.",
  };
}

/* ------------------------------ Plan steps ------------------------------ */

export type PlanStep = {
  canal: string;
  dueDate: string; // ISO
  done: boolean;
  doneAt?: string;
};

/** Map prospect source → canal label used in the user's checklist. */
const SOURCE_TO_CANAL: Record<Source, string> = {
  "Référence": "Référence",
  "Appel à froid": "Appel direct",
  "Email à froid": "Email",
  "LinkedIn": "LinkedIn",
  "Événement": "Événements",
  "Autre": "Email",
};

const FALLBACK_CANAUX = ["Email", "Appel direct", "LinkedIn"];

function isCanalCoherent(canal: string, p: Prospect): boolean {
  const c = canal.toLowerCase();
  if (c.includes("email") && !p.email) return false;
  if (c.includes("appel") && !p.telephone) return false;
  return true;
}

function pickFirstCanal(
  p: Prospect,
  config: GynaConfig,
  winner: CanalStat | null,
): string {
  if (p.source === "Référence") return "Message via la référence";
  if (winner) {
    const winnerCanal = SOURCE_TO_CANAL[winner.canal];
    if (isCanalCoherent(winnerCanal, p)) return winnerCanal;
  }
  const fromConfig = config.canaux[0]?.nom;
  if (fromConfig && isCanalCoherent(fromConfig, p)) return fromConfig;
  const fallback =
    FALLBACK_CANAUX.find((c) => isCanalCoherent(c, p)) ?? SOURCE_TO_CANAL[p.source];
  return fallback;
}

/**
 * Generate a plan timeline (max 3 steps): step 1 (first approach) +
 * config.relances.nombre follow-ups, spaced by config.relances.delaiJours,
 * alternating canal when several are available.
 */
export function generatePlan(
  p: Prospect,
  config: GynaConfig,
  stats: CanalStat[],
  startISO: string,
): PlanStep[] {
  const winner = winningChannel(stats);
  const first = pickFirstCanal(p, config, winner);

  const alternates = (() => {
    const fromConfig = config.canaux
      .map((c) => c.nom)
      .filter((n) => n !== first && isCanalCoherent(n, p));
    if (fromConfig.length > 0) return fromConfig;
    return FALLBACK_CANAUX.filter((c) => c !== first && isCanalCoherent(c, p));
  })();

  const nb = Math.max(0, config.relances?.nombre ?? 2);
  const delai = Math.max(1, config.relances?.delaiJours ?? 3);
  const start = new Date(startISO);

  const steps: PlanStep[] = [
    { canal: first, dueDate: start.toISOString(), done: false },
  ];
  for (let i = 0; i < nb; i++) {
    const next = new Date(start.getTime() + (i + 1) * delai * 86400_000);
    const canal = alternates.length > 0 ? alternates[i % alternates.length] : first;
    steps.push({ canal, dueDate: next.toISOString(), done: false });
  }
  return steps.slice(0, 3);
}

/* --------------------------- Status helpers ---------------------------- */

export const PLAN_ACTIVE_STATUSES: Status[] = ["Qualifié", "En séquence"];

export function isActiveForPlan(s: Status): boolean {
  return PLAN_ACTIVE_STATUSES.includes(s);
}

/** First step that isn't done — null if every step is done. */
export function nextStep(steps: PlanStep[]): { step: PlanStep; index: number } | null {
  const i = steps.findIndex((s) => !s.done);
  if (i === -1) return null;
  return { step: steps[i], index: i };
}

const DAY = 86400_000;

export function startOfDay(iso: string): number {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function dayDiff(aIso: string, bIso: string): number {
  return Math.round((startOfDay(aIso) - startOfDay(bIso)) / DAY);
}

export type StepStatus = "À faire" | "Fait" | "En retard";

export function stepStatus(step: PlanStep, todayISO: string): StepStatus {
  if (step.done) return "Fait";
  const diff = dayDiff(step.dueDate, todayISO); // negative = past
  if (diff < 0) return "En retard";
  return "À faire";
}

/* ----------------------------- Batch priority ----------------------------- */

export type Priority = "Haute" | "Moyenne" | "Faible";

export function priority(score: number, overdueDays: number): Priority {
  if (score >= 70 || overdueDays > 2) return "Haute";
  if (score >= 40) return "Moyenne";
  return "Faible";
}

export type BatchItem = {
  prospect: Prospect;
  step: PlanStep;
  stepIndex: number;
  overdueDays: number; // 0 if due today, positive if overdue
  priority: Priority;
};

export function buildBatch(
  prospects: Prospect[],
  plans: Record<string, PlanStep[]>,
  todayISO: string,
): BatchItem[] {
  const items: BatchItem[] = [];
  for (const p of prospects) {
    if (!isActiveForPlan(p.status)) continue;
    const steps = plans[p.id];
    if (!steps) continue;
    const nx = nextStep(steps);
    if (!nx) continue;
    const diff = dayDiff(nx.step.dueDate, todayISO); // ≤0 means due today or overdue
    if (diff > 0) continue;
    const overdueDays = -diff;
    items.push({
      prospect: p,
      step: nx.step,
      stepIndex: nx.index,
      overdueDays,
      priority: priority(p.scoreDetail.total, overdueDays),
    });
  }
  // High priority first; then most overdue; then highest score.
  const order: Record<Priority, number> = { Haute: 0, Moyenne: 1, Faible: 2 };
  return items.sort((a, b) => {
    const dp = order[a.priority] - order[b.priority];
    if (dp !== 0) return dp;
    if (b.overdueDays !== a.overdueDays) return b.overdueDays - a.overdueDays;
    return b.prospect.scoreDetail.total - a.prospect.scoreDetail.total;
  });
}