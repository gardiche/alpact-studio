// Calculs analytiques purs sur la cohorte.
// Aucun import de la couche démo ni de Supabase — ne reçoit que des données typées.

import type {
  CohortMember,
  CohortMemberDetail,
  EconomicPerformance,
  EntrepreneurStage,
  HighlightedJourney,
  MilestoneCategory,
  MilestonesCategoryRow,
  StageEvolution,
  StageEvolutionRow,
  CohortTrend,
} from "@/types";

// ============================================================
// 1. Performance économique cumulée
// ============================================================

export function computeEconomicPerformance(members: CohortMember[]): EconomicPerformance {
  if (members.length === 0) {
    return {
      total_capital_raised: 0,
      total_revenue: 0,
      total_headcount: 0,
      growing_members_count: 0,
      growing_members_pct: 0,
      avg_capital_per_member: 0,
    };
  }
  const total_capital_raised = members.reduce((s, m) => s + m.capital_raised, 0);
  const total_revenue = members.reduce((s, m) => s + m.revenue_yearly, 0);
  const total_headcount = members.reduce((s, m) => s + m.headcount, 0);
  const growing_members_count = members.filter((m) => m.is_growing).length;
  const growing_members_pct = Math.round((growing_members_count / members.length) * 100);
  const avg_capital_per_member = Math.round(total_capital_raised / members.length);
  return {
    total_capital_raised,
    total_revenue,
    total_headcount,
    growing_members_count,
    growing_members_pct,
    avg_capital_per_member,
  };
}

// ============================================================
// 2. Évolution des stades T0 → T+n
// ============================================================

const STAGE_ORDER: EntrepreneurStage[] = ["idéation", "POC", "early-stage", "traction", "scaling"];
const STAGE_LABEL: Record<EntrepreneurStage, string> = {
  "idéation": "Idéation",
  "POC": "POC",
  "early-stage": "Early-stage",
  "traction": "Traction",
  "scaling": "Scaling",
};

function stageRank(s: EntrepreneurStage) {
  return STAGE_ORDER.indexOf(s);
}

export function computeStageEvolution(members: CohortMember[]): StageEvolution {
  const rows: StageEvolutionRow[] = STAGE_ORDER.map((stage) => {
    const initial_count = members.filter((m) => m.initial_stage === stage).length;
    const current_count = members.filter((m) => m.stage === stage).length;
    return {
      stage,
      label: STAGE_LABEL[stage],
      initial_count,
      current_count,
      delta: current_count - initial_count,
    };
  });
  const members_progressed = members.filter(
    (m) => stageRank(m.stage) > stageRank(m.initial_stage)
  ).length;
  const members_progressed_pct =
    members.length === 0 ? 0 : Math.round((members_progressed / members.length) * 100);
  return { rows, members_progressed, members_progressed_pct };
}

// ============================================================
// 3. Jalons par catégorie
// ============================================================

const CATEGORY_ORDER: MilestoneCategory[] = ["produit", "commercial", "financement", "équipe", "posture"];
const CATEGORY_LABEL: Record<MilestoneCategory, string> = {
  produit: "Produit",
  commercial: "Commercial",
  financement: "Financement",
  équipe: "Équipe",
  posture: "Posture",
};

export function computeMilestonesByCategory(details: CohortMemberDetail[]): MilestonesCategoryRow[] {
  return CATEGORY_ORDER.map((category) => {
    const milestones = details.flatMap((d) => d.milestones.filter((m) => m.category === category));
    const reached = milestones.filter((m) => m.status === "franchi").length;
    const in_progress = milestones.filter((m) => m.status === "en cours").length;
    const blocked = milestones.filter((m) => m.status === "bloqué").length;
    const upcoming = milestones.filter((m) => m.status === "à venir").length;
    return {
      category,
      label: CATEGORY_LABEL[category],
      reached,
      in_progress,
      blocked,
      upcoming,
      total: reached + in_progress + blocked + upcoming,
    };
  });
}

// ============================================================
// 4. Trajectoires marquantes (3 cartes auto-générées)
// ============================================================

function scoreJourney(d: CohortMemberDetail): number {
  let score = 0;
  // Progression de stade
  score += (stageRank(d.stage) - stageRank(d.initial_stage)) * 10;
  // Jalons franchis
  score += d.milestones.filter((m) => m.status === "franchi").length * 4;
  // Capital levé (bonus pour visibilité)
  if (d.capital_raised >= 500_000) score += 12;
  else if (d.capital_raised >= 100_000) score += 6;
  // Croissance
  if (d.is_growing) score += 3;
  // Pénalité alerte
  if (d.status === "alerte") score -= 8;
  return score;
}

function formatCapital(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)} M€`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)} k€`;
  return `${amount} €`;
}

function buildHeadline(d: CohortMemberDetail): string {
  const parts: string[] = [];

  const progressed = stageRank(d.stage) > stageRank(d.initial_stage);
  if (progressed) {
    parts.push(`passé de ${STAGE_LABEL[d.initial_stage].toLowerCase()} à ${STAGE_LABEL[d.stage].toLowerCase()}`);
  }
  if (d.capital_raised >= 100_000) {
    parts.push(`${formatCapital(d.capital_raised)} levés`);
  } else if (d.revenue_yearly >= 50_000) {
    parts.push(`${formatCapital(d.revenue_yearly)} de CA annuel`);
  }
  const reachedCount = d.milestones.filter((m) => m.status === "franchi").length;
  if (reachedCount >= 2) {
    parts.push(`${reachedCount} jalons franchis`);
  }
  if (parts.length === 0) {
    return `${d.headcount} ETP soutenus, dynamique en cours`;
  }
  return parts.join(" · ");
}

export function pickHighlightedJourneys(
  details: CohortMemberDetail[],
  limit = 3
): HighlightedJourney[] {
  const scored = details
    .map((d) => ({ d, score: scoreJourney(d) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ d }) => {
    const reached = d.milestones
      .filter((m) => m.status === "franchi" && m.reached_at)
      .sort((a, b) => new Date(b.reached_at!).getTime() - new Date(a.reached_at!).getTime())
      .slice(0, 3)
      .map((m) => ({ title: m.title, reached_at: m.reached_at! }));

    const positiveNote = d.notes.find((n) => /\b(bien|bon|excellent|fort|impressionn)/i.test(n.content));
    return {
      member_id: d.id,
      first_name: d.first_name,
      last_name: d.last_name,
      project_name: d.project_name,
      headline: buildHeadline(d),
      initial_stage: d.initial_stage,
      current_stage: d.stage,
      key_milestones: reached,
      verbatim: positiveNote?.content ?? null,
      verbatim_author: positiveNote?.author_name ?? null,
    };
  });
}

// ============================================================
// 5. Tendances cohorte (insight Joanna : sujets partagés)
// ============================================================

export function computeCohortTrends(details: CohortMemberDetail[], limit = 5): CohortTrend[] {
  const total = details.length;
  const trends: CohortTrend[] = [];

  // Tensions par catégorie
  const tensionByKind = new Map<string, Set<string>>();
  details.forEach((d) => {
    d.tensions
      .filter((t) => !t.resolved)
      .forEach((t) => {
        if (!tensionByKind.has(t.kind)) tensionByKind.set(t.kind, new Set());
        tensionByKind.get(t.kind)!.add(d.id);
      });
  });

  const TENSION_LABEL: Record<string, string> = {
    "co-fondateur": "Tensions co-fondateurs",
    "financière": "Stress financier",
    "client": "Recherche de canal d'acquisition",
    "produit": "Clarification produit / proposition de valeur",
    "personnelle": "Charge mentale / isolement",
    "équipe": "Tensions d'équipe",
  };

  const TENSION_ACTION: Record<string, string> = {
    "co-fondateur": "Atelier collectif « Pacte d'associés et postures »",
    "financière": "Masterclass « Lire son P&L et son cash »",
    "client": "Sprint go-to-market commun ou peer review ICP",
    "produit": "Atelier value proposition canvas + tests utilisateurs",
    "personnelle": "Cercle pair-à-pair / mindfulness fondateurs",
    "équipe": "Module RH : premiers recrutements et culture",
  };

  Array.from(tensionByKind.entries())
    .map(([kind, set]) => ({ kind, members: set.size }))
    .filter((t) => t.members >= 2)
    .sort((a, b) => b.members - a.members)
    .forEach((t) => {
      trends.push({
        kind: "tension",
        label: TENSION_LABEL[t.kind] ?? t.kind,
        detail: `${t.members} entrepreneurs concernés sur ${total}`,
        members_affected: t.members,
        members_total: total,
        suggested_action: TENSION_ACTION[t.kind] ?? null,
      });
    });

  // Jalons en difficulté (en cours OU bloqués depuis longtemps)
  const milestoneCountByTitle = new Map<string, { members: Set<string>; blocked: number }>();
  details.forEach((d) => {
    d.milestones
      .filter((m) => m.status === "bloqué" || m.status === "en cours")
      .forEach((m) => {
        const key = m.title.toLowerCase();
        if (!milestoneCountByTitle.has(key)) {
          milestoneCountByTitle.set(key, { members: new Set(), blocked: 0 });
        }
        const entry = milestoneCountByTitle.get(key)!;
        entry.members.add(d.id);
        if (m.status === "bloqué") entry.blocked += 1;
      });
  });

  Array.from(milestoneCountByTitle.entries())
    .map(([key, v]) => ({ key, members: v.members.size, blocked: v.blocked }))
    .filter((m) => m.members >= 2)
    .sort((a, b) => b.blocked - a.blocked || b.members - a.members)
    .slice(0, 2)
    .forEach((m) => {
      trends.push({
        kind: "milestone_stuck",
        label: m.key.charAt(0).toUpperCase() + m.key.slice(1),
        detail: `${m.members} entrepreneurs sur le même chantier${m.blocked > 0 ? `, ${m.blocked} bloqué${m.blocked > 1 ? "s" : ""}` : ""}`,
        members_affected: m.members,
        members_total: total,
        suggested_action: "Session collective sur ce jalon — partage de patterns",
      });
    });

  return trends.slice(0, limit);
}
