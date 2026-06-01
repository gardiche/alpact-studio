"use client";

import { Banknote, TrendingUp, Users, Sparkles } from "lucide-react";
import type { EconomicPerformance } from "@/types";

function formatEuro(amount: number): string {
  if (amount >= 1_000_000) {
    const v = amount / 1_000_000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)} M€`;
  }
  if (amount >= 1_000) {
    return `${Math.round(amount / 1_000)} k€`;
  }
  return `${amount} €`;
}

interface Props {
  performance: EconomicPerformance;
  memberCount: number;
}

export function EconomicPerformanceCards({ performance, memberCount }: Props) {
  const cards = [
    {
      label: "Capital levé cumulé",
      value: formatEuro(performance.total_capital_raised),
      sub:
        performance.avg_capital_per_member > 0
          ? `Moyenne ${formatEuro(performance.avg_capital_per_member)} par entrepreneur`
          : "Aucune levée enregistrée",
      icon: Banknote,
      accent: "#1cb785",
    },
    {
      label: "CA annuel cumulé",
      value: formatEuro(performance.total_revenue),
      sub: `${performance.growing_members_pct}% en croissance`,
      icon: TrendingUp,
      accent: "#2D5BE3",
    },
    {
      label: "Emplois soutenus",
      value: performance.total_headcount.toString(),
      sub: `Sur ${memberCount} projets accompagnés`,
      icon: Users,
      accent: "#9d89fc",
    },
    {
      label: "Entrepreneurs en croissance",
      value: `${performance.growing_members_count}/${memberCount}`,
      sub:
        performance.growing_members_pct >= 60
          ? "Cohorte en bonne santé"
          : "Sous le seuil cible (60%)",
      icon: Sparkles,
      accent: "#ff8f27",
    },
  ];

  return (
    <section>
      <div className="mb-3">
        <h2
          className="font-serif text-xl text-fg"
          style={{ fontFamily: "DM Serif Display" }}
        >
          Performance économique
        </h2>
        <p className="font-sans text-xs text-muted mt-0.5">
          Indicateurs cumulés de la cohorte — chiffres à présenter à vos financeurs.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="bg-surface rounded-[20px] p-5"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="font-sans text-[11px] uppercase tracking-wide text-muted font-medium leading-snug">
                  {c.label}
                </span>
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${c.accent}14` }}
                >
                  <Icon size={15} style={{ color: c.accent }} />
                </div>
              </div>
              <div
                className="font-serif text-3xl text-fg leading-tight mb-1"
                style={{ fontFamily: "DM Serif Display" }}
              >
                {c.value}
              </div>
              <p className="font-sans text-[11px] text-muted leading-snug">{c.sub}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
