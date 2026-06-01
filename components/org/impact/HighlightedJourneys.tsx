"use client";

import Link from "next/link";
import { ArrowUpRight, Quote } from "lucide-react";
import type { HighlightedJourney } from "@/types";

interface Props {
  journeys: HighlightedJourney[];
}

const STAGE_SHORT: Record<string, string> = {
  "idéation": "Idéation",
  "POC": "POC",
  "early-stage": "Early",
  "traction": "Traction",
  "scaling": "Scaling",
};

function formatMonth(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
}

export function HighlightedJourneys({ journeys }: Props) {
  if (journeys.length === 0) {
    return null;
  }

  return (
    <section
      className="bg-surface rounded-[20px] p-6"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
    >
      <div className="flex items-baseline justify-between mb-1">
        <h2
          className="font-serif text-xl text-fg"
          style={{ fontFamily: "DM Serif Display" }}
        >
          Trajectoires marquantes
        </h2>
        <span className="font-sans text-xs text-muted">
          {journeys.length} entrepreneur{journeys.length > 1 ? "s" : ""} mis en avant
        </span>
      </div>
      <p className="font-sans text-xs text-muted mb-5">
        Les progressions les plus visibles de la cohorte — utile pour vos rapports financeurs.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {journeys.map((j) => {
          const progressed = j.initial_stage !== j.current_stage;
          return (
            <Link
              key={j.member_id}
              href={`/org/${j.member_id}`}
              className="group flex flex-col gap-3 p-5 rounded-[20px] border border-border bg-bg/40 hover:bg-bg transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p
                    className="font-serif text-lg text-fg leading-tight"
                    style={{ fontFamily: "DM Serif Display" }}
                  >
                    {j.first_name} {j.last_name}
                  </p>
                  <p className="font-sans text-xs text-muted">{j.project_name}</p>
                </div>
                <ArrowUpRight
                  size={16}
                  className="text-muted group-hover:text-fg transition-colors flex-shrink-0"
                />
              </div>

              {progressed && (
                <div className="inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full bg-surface border border-border">
                  <span className="font-sans text-[10px] text-muted">
                    {STAGE_SHORT[j.initial_stage]}
                  </span>
                  <span className="font-sans text-[10px] text-muted">→</span>
                  <span
                    className="font-sans text-[10px] font-semibold"
                    style={{ color: "#1cb785" }}
                  >
                    {STAGE_SHORT[j.current_stage]}
                  </span>
                </div>
              )}

              <p className="font-sans text-sm text-fg leading-relaxed">{j.headline}</p>

              {j.key_milestones.length > 0 && (
                <ul className="space-y-1 mt-1">
                  {j.key_milestones.map((m, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                        style={{ background: "#1cb785" }}
                      />
                      <span className="font-sans text-xs text-fg leading-snug flex-1">
                        {m.title}
                        <span className="text-muted ml-1">· {formatMonth(m.reached_at)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {j.verbatim && (
                <div className="mt-auto pt-3 border-t border-border">
                  <div className="flex gap-2">
                    <Quote size={12} className="text-muted flex-shrink-0 mt-0.5" />
                    <p className="font-sans text-xs italic text-muted leading-relaxed">
                      « {j.verbatim} »
                      {j.verbatim_author && (
                        <span className="not-italic text-muted block mt-0.5">
                          — {j.verbatim_author}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
