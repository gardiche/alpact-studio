"use client";

import type { Cohort, CohortImpactMetrics } from "@/types";

function formatDateRange(start: string, end: string | null) {
  const s = new Date(start);
  const months = ["jan.", "fév.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  const sStr = `${s.getDate()} ${months[s.getMonth()]} ${s.getFullYear()}`;
  if (!end) return `Depuis le ${sStr}`;
  const e = new Date(end);
  const eStr = `${e.getDate()} ${months[e.getMonth()]} ${e.getFullYear()}`;
  return `${sStr} → ${eStr}`;
}

interface Props {
  cohort: Cohort;
  metrics: CohortImpactMetrics;
}

export function CohortHeader({ cohort, metrics }: Props) {
  return (
    <div className="mb-8">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="font-sans text-xs uppercase tracking-wide text-muted mb-1">Cohorte active</p>
          <h1 className="font-serif text-4xl text-fg leading-tight" style={{ fontFamily: "DM Serif Display" }}>
            {cohort.name}
          </h1>
          <p className="font-sans text-sm text-muted mt-1">
            {formatDateRange(cohort.start_date, cohort.end_date)} · {metrics.total_members} entrepreneurs
          </p>
        </div>
        <button className="px-4 py-2 rounded-full bg-fg text-white font-sans text-sm font-medium hover:opacity-90 transition-opacity">
          + Inviter un entrepreneur
        </button>
      </div>
    </div>
  );
}
