"use client";

import { Users, Flag, AlertTriangle } from "lucide-react";
import type { CohortImpactMetrics } from "@/types";

interface Props {
  metrics: CohortImpactMetrics;
}

export function CohortMetrics({ metrics }: Props) {
  const cards = [
    {
      label: "Entrepreneurs actifs",
      value: `${metrics.active_members}/${metrics.total_members}`,
      sub: `${metrics.retention_rate}% de rétention`,
      icon: Users,
      accent: "#1cb785",
    },
    {
      label: "Jalons franchis (30 j)",
      value: metrics.milestones_reached_this_month.toString(),
      sub: `${metrics.milestones_in_progress} en cours`,
      icon: Flag,
      accent: "#2D5BE3",
    },
    {
      label: "Alertes actives",
      value: metrics.alert_members.toString(),
      sub:
        metrics.alert_members === 0
          ? "Tout va bien"
          : `${metrics.inactive_members} inactifs à relancer`,
      icon: AlertTriangle,
      accent: metrics.alert_members > 0 ? "#ff4f3f" : "#1cb785",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.label}
            className="bg-surface rounded-[20px] shadow-card p-6"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="font-sans text-xs uppercase tracking-wide text-muted font-medium">
                {c.label}
              </span>
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: `${c.accent}14` }}
              >
                <Icon size={16} style={{ color: c.accent }} />
              </div>
            </div>
            <div className="font-serif text-3xl text-fg mb-1" style={{ fontFamily: "DM Serif Display" }}>
              {c.value}
            </div>
            <p className="font-sans text-xs text-muted">{c.sub}</p>
          </div>
        );
      })}
    </div>
  );
}
