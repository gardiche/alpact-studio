"use client";

import { Download } from "lucide-react";
import type { Cohort, CohortImpactMetrics, CohortMember } from "@/types";

interface Props {
  cohort: Cohort;
  metrics: CohortImpactMetrics;
  members: CohortMember[];
}

function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-baseline justify-between py-3 border-b border-border last:border-b-0">
      <span className="font-sans text-sm text-fg">{label}</span>
      <span
        className="font-serif text-2xl"
        style={{ fontFamily: "DM Serif Display", color: color ?? "#111" }}
      >
        {value}
      </span>
    </div>
  );
}

export function ImpactReport({ cohort, metrics, members }: Props) {
  function handleExport() {
    const lines = [
      `Rapport d'impact — ${cohort.name}`,
      ``,
      `Cohorte : ${metrics.total_members} entrepreneurs`,
      `Entrepreneurs actifs : ${metrics.active_members} (${metrics.retention_rate}%)`,
      `Taux d'activation outils : ${metrics.activation_rate}%`,
      `Jalons franchis (30 derniers jours) : ${metrics.milestones_reached_this_month}`,
      `Jalons en cours : ${metrics.milestones_in_progress}`,
      `Alertes actives : ${metrics.alert_members}`,
      `Outils activés en moyenne : ${metrics.avg_tools_activated} sur 3`,
      ``,
      `Détail entrepreneurs :`,
      ...members.map(
        (m) =>
          `- ${m.first_name} ${m.last_name} (${m.project_name}) · ${m.stage} · ${m.status}` +
          (m.current_milestone ? ` · jalon : ${m.current_milestone}` : "")
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport-impact-${cohort.name.toLowerCase().replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="bg-surface rounded-[20px] p-6" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
          <div>
            <h2 className="font-serif text-xl text-fg" style={{ fontFamily: "DM Serif Display" }}>
              Indicateurs cohorte
            </h2>
            <p className="font-sans text-xs text-muted mt-0.5">
              Vue agrégée — utile pour vos reporting financeurs.
            </p>
          </div>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-fg text-white font-sans text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Download size={14} />
            Exporter le rapport
          </button>
        </div>

        <div className="grid grid-cols-2 gap-x-8">
          <div>
            <StatRow label="Entrepreneurs au total" value={`${metrics.total_members}`} />
            <StatRow label="Actifs" value={`${metrics.active_members}`} color="#1cb785" />
            <StatRow label="Inactifs" value={`${metrics.inactive_members}`} color="#ff8f27" />
            <StatRow label="En alerte" value={`${metrics.alert_members}`} color="#ff4f3f" />
          </div>
          <div>
            <StatRow label="Taux de rétention" value={`${metrics.retention_rate}%`} />
            <StatRow label="Taux d'activation outils" value={`${metrics.activation_rate}%`} />
            <StatRow label="Outils activés en moyenne" value={`${metrics.avg_tools_activated} / 3`} />
            <StatRow
              label="Jalons franchis (30 j)"
              value={`${metrics.milestones_reached_this_month}`}
              color="#2D5BE3"
            />
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-[20px] p-6" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <h2 className="font-serif text-xl text-fg mb-4" style={{ fontFamily: "DM Serif Display" }}>
          Répartition par stade
        </h2>
        <StageBreakdown members={members} />
      </div>
    </div>
  );
}

function StageBreakdown({ members }: { members: CohortMember[] }) {
  const stages: { key: CohortMember["stage"]; label: string }[] = [
    { key: "idéation", label: "Idéation" },
    { key: "POC", label: "POC" },
    { key: "early-stage", label: "Early-stage" },
    { key: "traction", label: "Traction" },
    { key: "scaling", label: "Scaling" },
  ];

  const counts = stages.map((s) => ({
    ...s,
    count: members.filter((m) => m.stage === s.key).length,
  }));
  const max = Math.max(...counts.map((c) => c.count), 1);

  return (
    <div className="space-y-3">
      {counts.map((c) => (
        <div key={c.key}>
          <div className="flex items-baseline justify-between mb-1">
            <span className="font-sans text-sm text-fg">{c.label}</span>
            <span className="font-sans text-xs text-muted">{c.count}</span>
          </div>
          <div className="h-2 rounded-full bg-bg overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(c.count / max) * 100}%`,
                background: c.count > 0 ? "#2D5BE3" : "transparent",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
