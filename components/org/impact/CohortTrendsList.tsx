"use client";

import { AlertTriangle, Flag, Lightbulb } from "lucide-react";
import type { CohortTrend } from "@/types";

interface Props {
  trends: CohortTrend[];
}

export function CohortTrendsList({ trends }: Props) {
  return (
    <section
      className="bg-surface rounded-[20px] p-6"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
    >
      <div className="flex items-baseline justify-between mb-1 flex-wrap gap-2">
        <h2
          className="font-serif text-xl text-fg"
          style={{ fontFamily: "DM Serif Display" }}
        >
          Tendances cohorte
        </h2>
        <span className="font-sans text-xs text-muted">
          {trends.length} signal{trends.length > 1 ? "aux" : ""} partagé{trends.length > 1 ? "s" : ""}
        </span>
      </div>
      <p className="font-sans text-xs text-muted mb-5">
        Ce qui revient le plus dans la cohorte — pour adapter vos masterclasses et interventions collectives.
      </p>

      {trends.length === 0 ? (
        <p className="font-sans text-sm text-muted italic">
          Pas de tendance partagée détectée pour le moment. La cohorte évolue sur des chantiers
          individuels.
        </p>
      ) : (
        <div className="space-y-3">
          {trends.map((t, i) => {
            const isAlert = t.kind === "tension";
            const accent = isAlert ? "#ff8f27" : "#2D5BE3";
            const Icon = isAlert ? AlertTriangle : Flag;
            const pct = Math.round((t.members_affected / t.members_total) * 100);
            return (
              <div
                key={i}
                className="p-4 rounded-[20px] border border-border"
                style={{ borderLeft: `3px solid ${accent}` }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${accent}14` }}
                  >
                    <Icon size={15} style={{ color: accent }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <p className="font-sans text-sm font-semibold text-fg">{t.label}</p>
                      <span
                        className="font-sans text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: `${accent}14`, color: accent }}
                      >
                        {pct}% de la cohorte
                      </span>
                    </div>
                    <p className="font-sans text-xs text-muted leading-relaxed">{t.detail}</p>
                    {t.suggested_action && (
                      <div className="mt-2 flex items-start gap-2 pt-2 border-t border-border">
                        <Lightbulb
                          size={13}
                          className="flex-shrink-0 mt-0.5"
                          style={{ color: "#1cb785" }}
                        />
                        <p className="font-sans text-xs text-fg leading-relaxed">
                          <span className="font-semibold">Suggestion : </span>
                          {t.suggested_action}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
