"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import type { CohortMember, EntrepreneurStatus } from "@/types";

const TOOL_LABEL: Record<string, { label: string; color: string }> = {
  astryd: { label: "Astryd", color: "#ff8f27" },
  elyse: { label: "Elyse", color: "#1cb785" },
  gyna: { label: "Gyna", color: "#9d89fc" },
};

const STATUS_LABEL: Record<EntrepreneurStatus, { label: string; color: string; bg: string }> = {
  actif: { label: "Actif", color: "#1cb785", bg: "rgba(28,183,133,0.1)" },
  inactif: { label: "Inactif", color: "#ff8f27", bg: "rgba(255,143,39,0.1)" },
  alerte: { label: "Alerte", color: "#ff4f3f", bg: "rgba(255,79,63,0.1)" },
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diffMs / (1000 * 60 * 60));
  if (h < 1) return "à l'instant";
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "hier";
  if (d < 7) return `il y a ${d}j`;
  const w = Math.floor(d / 7);
  return `il y a ${w} sem.`;
}

type Filter = "tous" | EntrepreneurStatus;

interface Props {
  members: CohortMember[];
}

export function CohortTable({ members }: Props) {
  const [filter, setFilter] = useState<Filter>("tous");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return members.filter((m) => {
      if (filter !== "tous" && m.status !== filter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return (
          m.first_name.toLowerCase().includes(q) ||
          m.last_name.toLowerCase().includes(q) ||
          m.project_name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [members, filter, query]);

  const counts: Record<Filter, number> = {
    tous: members.length,
    actif: members.filter((m) => m.status === "actif").length,
    inactif: members.filter((m) => m.status === "inactif").length,
    alerte: members.filter((m) => m.status === "alerte").length,
  };

  const filters: Filter[] = ["tous", "actif", "inactif", "alerte"];

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="font-serif text-xl text-fg" style={{ fontFamily: "DM Serif Display" }}>
          Entrepreneurs
        </h2>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher…"
            className="px-3 py-1.5 rounded-full bg-surface border border-border font-sans text-xs text-fg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue transition-all w-44"
          />
        </div>
      </div>

      <div className="flex items-center gap-1 mb-4 bg-surface rounded-full p-1 w-fit shadow-card" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`
              px-3.5 py-1.5 rounded-full font-sans text-xs font-medium transition-all
              ${filter === f ? "bg-bg text-fg" : "text-muted hover:text-fg"}
            `}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="ml-1.5 text-muted">{counts[f]}</span>
          </button>
        ))}
      </div>

      <div className="bg-surface rounded-[20px] overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        {/* Header */}
        <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 border-b border-border bg-bg/50">
          <div className="font-sans text-[11px] font-medium text-muted uppercase tracking-wide">Entrepreneur</div>
          <div className="font-sans text-[11px] font-medium text-muted uppercase tracking-wide">Jalon en cours</div>
          <div className="font-sans text-[11px] font-medium text-muted uppercase tracking-wide">Outil actif</div>
          <div className="font-sans text-[11px] font-medium text-muted uppercase tracking-wide">Dernier passage</div>
          <div className="font-sans text-[11px] font-medium text-muted uppercase tracking-wide">Statut</div>
          <div className="font-sans text-[11px] font-medium text-muted uppercase tracking-wide text-right">Brief</div>
        </div>

        {/* Rows */}
        {filtered.length === 0 && (
          <div className="px-6 py-12 text-center font-sans text-sm text-muted">
            Aucun entrepreneur ne correspond à ce filtre.
          </div>
        )}
        {filtered.map((m) => {
          const status = STATUS_LABEL[m.status];
          const tool = m.active_tool ? TOOL_LABEL[m.active_tool] : null;
          return (
            <div
              key={m.id}
              className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 border-b border-border last:border-b-0 hover:bg-bg/40 transition-colors items-center group"
            >
              <Link href={`/org/${m.id}`} className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-beige flex items-center justify-center flex-shrink-0">
                  <span className="font-sans text-xs font-semibold text-muted">
                    {m.first_name[0]}
                    {m.last_name[0]}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-sans text-sm font-semibold text-fg truncate group-hover:underline">
                    {m.first_name} {m.last_name}
                  </p>
                  <p className="font-sans text-xs text-muted truncate">
                    {m.project_name} · {m.sector}
                  </p>
                </div>
              </Link>

              <Link href={`/org/${m.id}`} className="min-w-0">
                <p className="font-sans text-sm text-fg truncate">
                  {m.current_milestone ?? <span className="text-muted italic">—</span>}
                </p>
                <p className="font-sans text-xs text-muted truncate capitalize">
                  Stade : {m.stage}
                </p>
              </Link>

              <div>
                {tool ? (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-sans text-xs font-medium"
                    style={{ background: `${tool.color}14`, color: tool.color }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: tool.color }} />
                    {tool.label}
                  </span>
                ) : (
                  <span className="font-sans text-xs text-muted italic">aucun</span>
                )}
              </div>

              <div>
                <p className="font-sans text-xs text-fg">{timeAgo(m.last_active_at)}</p>
              </div>

              <div>
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-sans text-xs font-medium"
                  style={{ background: status.bg, color: status.color }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.color }} />
                  {status.label}
                </span>
                {m.alert_reason && (
                  <p className="font-sans text-[11px] text-red mt-1 max-w-[180px] leading-snug">
                    {m.alert_reason}
                  </p>
                )}
              </div>

              <Link
                href={`/org/${m.id}/brief`}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-bg border border-border text-fg hover:bg-fg hover:text-white hover:border-fg transition-colors ml-auto"
                title="Générer un brief pré-séance"
              >
                <Sparkles size={13} />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
