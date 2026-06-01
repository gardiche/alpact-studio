"use client";

import type { MilestonesCategoryRow } from "@/types";

interface Props {
  rows: MilestonesCategoryRow[];
}

const STATUS_COLOR = {
  reached: "#1cb785",
  in_progress: "#2D5BE3",
  blocked: "#ff4f3f",
  upcoming: "#E4E0DB",
};

const STATUS_LABEL = {
  reached: "Franchis",
  in_progress: "En cours",
  blocked: "Bloqués",
  upcoming: "À venir",
};

export function MilestonesByCategoryChart({ rows }: Props) {
  const totals = rows.reduce(
    (acc, r) => ({
      reached: acc.reached + r.reached,
      in_progress: acc.in_progress + r.in_progress,
      blocked: acc.blocked + r.blocked,
      upcoming: acc.upcoming + r.upcoming,
    }),
    { reached: 0, in_progress: 0, blocked: 0, upcoming: 0 }
  );

  const grandTotal = rows.reduce((s, r) => s + r.total, 0);
  const max = Math.max(1, ...rows.map((r) => r.total));

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
          Jalons par catégorie
        </h2>
        <span className="font-sans text-xs text-muted">
          {grandTotal} jalons au total · {totals.reached} franchis
        </span>
      </div>
      <p className="font-sans text-xs text-muted mb-5">
        Lecture qualitative de l'accompagnement — où la cohorte avance.
      </p>

      {/* Légende */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        {(["reached", "in_progress", "blocked", "upcoming"] as const).map((status) => (
          <div key={status} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded"
              style={{ background: STATUS_COLOR[status] }}
            />
            <span className="font-sans text-xs text-muted">{STATUS_LABEL[status]}</span>
          </div>
        ))}
      </div>

      {/* Barres */}
      <div className="space-y-3">
        {rows.map((row) => {
          const widthPct = (row.total / max) * 100;
          if (row.total === 0) {
            return (
              <div key={row.category}>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="font-sans text-sm font-medium text-fg">{row.label}</span>
                  <span className="font-sans text-xs text-muted">aucun jalon</span>
                </div>
                <div className="h-6 rounded-lg bg-bg" />
              </div>
            );
          }
          return (
            <div key={row.category}>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="font-sans text-sm font-medium text-fg">{row.label}</span>
                <div className="flex items-center gap-3 font-sans text-xs text-muted">
                  <span>
                    <strong className="text-fg">{row.reached}</strong> / {row.total} franchis
                  </span>
                  {row.blocked > 0 && (
                    <span style={{ color: "#ff4f3f" }} className="font-semibold">
                      {row.blocked} bloqué{row.blocked > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
              <div
                className="h-6 rounded-lg overflow-hidden flex"
                style={{ width: `${widthPct}%`, minWidth: "12%" }}
              >
                {row.reached > 0 && (
                  <div
                    className="h-full"
                    style={{
                      flex: row.reached,
                      background: STATUS_COLOR.reached,
                    }}
                    title={`${row.reached} franchis`}
                  />
                )}
                {row.in_progress > 0 && (
                  <div
                    className="h-full"
                    style={{
                      flex: row.in_progress,
                      background: STATUS_COLOR.in_progress,
                    }}
                    title={`${row.in_progress} en cours`}
                  />
                )}
                {row.blocked > 0 && (
                  <div
                    className="h-full"
                    style={{
                      flex: row.blocked,
                      background: STATUS_COLOR.blocked,
                    }}
                    title={`${row.blocked} bloqués`}
                  />
                )}
                {row.upcoming > 0 && (
                  <div
                    className="h-full"
                    style={{
                      flex: row.upcoming,
                      background: STATUS_COLOR.upcoming,
                    }}
                    title={`${row.upcoming} à venir`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
