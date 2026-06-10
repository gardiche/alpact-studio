"use client";

import { Download } from "lucide-react";
import type {
  Cohort,
  CohortImpactMetrics,
  CohortMember,
  CohortTrend,
  EconomicPerformance,
  HighlightedJourney,
  MilestonesCategoryRow,
  StageEvolution,
} from "@/types";

function formatEuro(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M€`;
  if (n >= 1_000) return `${Math.round(n / 1_000)} k€`;
  return `${n} €`;
}

interface Props {
  cohort: Cohort;
  members: CohortMember[];
  metrics: CohortImpactMetrics;
  performance: EconomicPerformance;
  evolution: StageEvolution;
  milestones: MilestonesCategoryRow[];
  journeys: HighlightedJourney[];
  trends: CohortTrend[];
}

export function ImpactExportButton(props: Props) {
  const { cohort, members, metrics, performance, evolution, milestones, journeys, trends } = props;

  function handleExport() {
    const L: string[] = [];
    L.push(`RAPPORT D'IMPACT — ${cohort.name}`);
    L.push(`Généré le ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`);
    L.push(`Alpact Studio`);
    L.push("");
    L.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    L.push("PERFORMANCE ÉCONOMIQUE");
    L.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    L.push(`Capital levé cumulé : ${formatEuro(performance.total_capital_raised)}`);
    L.push(`CA annuel cumulé    : ${formatEuro(performance.total_revenue)}`);
    L.push(`Emplois soutenus    : ${performance.total_headcount}`);
    L.push(`Entrepreneurs en croissance : ${performance.growing_members_count}/${members.length} (${performance.growing_members_pct}%)`);
    L.push("");
    L.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    L.push("ÉVOLUTION DES STADES");
    L.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    L.push(`${evolution.members_progressed} entrepreneurs ont progressé sur la période (${evolution.members_progressed_pct}%)`);
    L.push("");
    evolution.rows.forEach((r) => {
      const delta = r.delta > 0 ? `+${r.delta}` : r.delta.toString();
      L.push(`  ${r.label.padEnd(14)} arrivée ${r.initial_count} → aujourd'hui ${r.current_count}  (${delta})`);
    });
    L.push("");
    L.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    L.push("JALONS PAR CATÉGORIE");
    L.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    milestones.forEach((m) => {
      if (m.total === 0) return;
      L.push(`  ${m.label.padEnd(14)} ${m.reached} franchis / ${m.in_progress} en cours / ${m.blocked} bloqués (total ${m.total})`);
    });
    L.push("");
    L.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    L.push("TRAJECTOIRES MARQUANTES");
    L.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    journeys.forEach((j) => {
      L.push(`• ${j.first_name} ${j.last_name} — ${j.project_name}`);
      L.push(`  ${j.headline}`);
      j.key_milestones.forEach((km) => L.push(`  - ${km.title}`));
      if (j.verbatim) L.push(`  « ${j.verbatim} » — ${j.verbatim_author ?? "accompagnateur"}`);
      L.push("");
    });
    L.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    L.push("TENDANCES COHORTE");
    L.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    if (trends.length === 0) {
      L.push("Aucune tendance partagée détectée.");
    } else {
      trends.forEach((t) => {
        L.push(`• ${t.label}`);
        L.push(`  ${t.detail}`);
        if (t.suggested_action) L.push(`  → Suggestion : ${t.suggested_action}`);
        L.push("");
      });
    }
    L.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    L.push("INDICATEURS COHORTE");
    L.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    L.push(`Entrepreneurs au total   : ${metrics.total_members}`);
    L.push(`Actifs                   : ${metrics.active_members}`);
    L.push(`Inactifs                 : ${metrics.inactive_members}`);
    L.push(`En alerte                : ${metrics.alert_members}`);
    L.push(`Taux d'activation outils : ${metrics.activation_rate}%`);
    L.push(`Outils activés en moyenne: ${metrics.avg_tools_activated} / 3`);
    L.push(`Jalons franchis (30 j)   : ${metrics.milestones_reached_this_month}`);
    L.push("");
    L.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    L.push("DÉTAIL DES ENTREPRENEURS");
    L.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    members.forEach((m) => {
      L.push(`• ${m.first_name} ${m.last_name} — ${m.project_name} (${m.sector})`);
      L.push(`  Stade : ${m.initial_stage ?? "—"} → ${m.stage} · Statut : ${m.status} · Équipe : ${m.headcount}`);
      L.push(`  Capital levé : ${formatEuro(m.capital_raised)} · CA annuel : ${formatEuro(m.revenue_yearly)}`);
      if (m.current_milestone) L.push(`  Jalon en cours : ${m.current_milestone}`);
      if (m.alert_reason) L.push(`  ⚠ ${m.alert_reason}`);
      L.push("");
    });

    const blob = new Blob([L.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport-impact-${cohort.name.toLowerCase().replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-fg text-white font-sans text-sm font-medium hover:opacity-90 transition-opacity"
    >
      <Download size={14} />
      Exporter le rapport
    </button>
  );
}
