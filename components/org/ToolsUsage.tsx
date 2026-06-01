"use client";

import type { ToolUsage } from "@/types";

const TOOL_META: Record<string, { label: string; color: string; tagline: string }> = {
  astryd: { label: "Astryd", color: "#ff8f27", tagline: "Copilotage entrepreneurial" },
  elyse: { label: "Elyse", color: "#1cb785", tagline: "Pilotage financier" },
  gyna: { label: "Gyna", color: "#9d89fc", tagline: "Cadrage go-to-market" },
};

function timeAgo(iso: string | null) {
  if (!iso) return "jamais utilisé";
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

interface Props {
  tools: ToolUsage[];
}

export function ToolsUsage({ tools }: Props) {
  return (
    <div className="bg-surface rounded-[20px] p-6" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <h2 className="font-serif text-xl text-fg mb-5" style={{ fontFamily: "DM Serif Display" }}>
        Outils utilisés
      </h2>
      <div className="space-y-4">
        {tools.map((t) => {
          const meta = TOOL_META[t.tool];
          const used = t.sessions_count > 0;
          return (
            <div
              key={t.tool}
              className="p-4 rounded-xl border border-border"
              style={{ borderLeft: `3px solid ${used ? meta.color : "#E4E0DB"}` }}
            >
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="font-sans text-sm font-semibold" style={{ color: used ? meta.color : "#888" }}>
                    {meta.label}
                  </p>
                  <p className="font-sans text-[11px] text-muted">{meta.tagline}</p>
                </div>
                <div className="text-right">
                  <p className="font-sans text-xs text-fg font-medium">{timeAgo(t.last_used_at)}</p>
                  <p className="font-sans text-[11px] text-muted">{t.sessions_count} sessions</p>
                </div>
              </div>
              {t.key_insight && (
                <p className="font-sans text-xs text-fg mt-2 leading-relaxed bg-bg/60 px-3 py-2 rounded-lg">
                  💡 {t.key_insight}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
