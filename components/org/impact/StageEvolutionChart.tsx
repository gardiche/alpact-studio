"use client";

import { ArrowUp, Minus } from "lucide-react";
import type { StageEvolution } from "@/types";

interface Props {
  evolution: StageEvolution;
}

export function StageEvolutionChart({ evolution }: Props) {
  const max = Math.max(
    1,
    ...evolution.rows.map((r) => Math.max(r.initial_count, r.current_count))
  );

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
          Évolution des stades
        </h2>
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-sans text-xs font-medium"
          style={{ background: "rgba(28,183,133,0.12)", color: "#1cb785" }}
        >
          <ArrowUp size={12} />
          {evolution.members_progressed} entrepreneur{evolution.members_progressed > 1 ? "s" : ""} a
          {evolution.members_progressed > 1 ? "ont" : ""} progressé ·{" "}
          {evolution.members_progressed_pct}%
        </span>
      </div>
      <p className="font-sans text-xs text-muted mb-5">
        Comparaison entre l'arrivée dans la cohorte et la situation actuelle.
      </p>

      {/* Légende */}
      <div className="flex items-center gap-4 mb-4">
        <div className="inline-flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-3 rounded"
            style={{ background: "#E4E0DB" }}
          />
          <span className="font-sans text-xs text-muted">À l'arrivée</span>
        </div>
        <div className="inline-flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-3 rounded"
            style={{ background: "#2D5BE3" }}
          />
          <span className="font-sans text-xs text-muted">Aujourd'hui</span>
        </div>
      </div>

      <div className="space-y-3">
        {evolution.rows.map((row) => {
          const initialPct = (row.initial_count / max) * 100;
          const currentPct = (row.current_count / max) * 100;
          const delta = row.delta;
          return (
            <div key={row.stage}>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="font-sans text-sm font-medium text-fg">{row.label}</span>
                <div className="flex items-center gap-3">
                  <span className="font-sans text-xs text-muted">
                    {row.initial_count} → {row.current_count}
                  </span>
                  {delta !== 0 ? (
                    <span
                      className="inline-flex items-center gap-0.5 font-sans text-xs font-semibold"
                      style={{ color: delta > 0 ? "#1cb785" : "#ff4f3f" }}
                    >
                      {delta > 0 ? "+" : ""}
                      {delta}
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-muted">
                      <Minus size={12} />
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <div className="h-2.5 rounded-full bg-bg overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${initialPct}%`,
                      background: "#E4E0DB",
                    }}
                  />
                </div>
                <div className="h-2.5 rounded-full bg-bg overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${currentPct}%`,
                      background: "#2D5BE3",
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
