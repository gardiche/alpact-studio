"use client";

import type { AstrydSyncData } from "@/lib/org/cohortRepository";

const GAUGE_LABELS: Record<string, string> = {
  scoreEnergie: "Énergie",
  scoreTemps: "Temps",
  scoreFinances: "Finances",
  scoreSoutien: "Soutien",
  scoreCompetences: "Compétences",
  scoreMotivation: "Motivation",
};

const DECISION_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  GO: { label: "GO", color: "#1cb785", bg: "rgba(28,183,133,0.1)" },
  KEEP: { label: "En réflexion", color: "#ff8f27", bg: "rgba(255,143,39,0.1)" },
  PIVOT: { label: "Pivot", color: "#ff8f27", bg: "rgba(255,143,39,0.1)" },
  STOP: { label: "Arrêt", color: "#ff4f3f", bg: "rgba(255,79,63,0.1)" },
};

function GaugeBar({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? "#1cb785" : value >= 50 ? "#ff8f27" : "#ff4f3f";
  return (
    <div className="flex items-center gap-3">
      <span className="font-sans text-xs text-muted w-24 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="font-sans text-xs font-medium text-fg w-8 text-right">{value}%</span>
    </div>
  );
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days}j`;
  return `il y a ${Math.floor(days / 7)} sem.`;
}

export function AstrydInsights({ data }: { data: AstrydSyncData }) {
  const gauges = Object.entries(GAUGE_LABELS)
    .map(([key, label]) => ({
      label,
      value: data[key as keyof AstrydSyncData] as number | null,
    }))
    .filter((g) => g.value != null) as { label: string; value: number }[];

  const decision = data.decisionState ? DECISION_LABELS[data.decisionState] : null;
  const pendingActions = data.activeMicroCommitments.filter(
    (a) => a.status === "pending" || a.status === "in_progress" || a.status === "todo"
  );
  const criticalZones = data.attentionZones.filter(
    (z) => z.niveau === "critique" || z.niveau === "attention"
  );

  return (
    <div className="bg-surface rounded-card shadow-card p-5 border-l-3" style={{ borderLeftColor: "#ff8f27" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <img src="/Astryd.png" alt="Astryd" className="h-8 w-auto" />
          <span className="font-sans text-xs font-medium text-muted">Données Astryd</span>
        </div>
        {data.syncedAt && (
          <span className="font-sans text-[10px] text-muted">
            Sync {relativeTime(data.syncedAt)}
          </span>
        )}
      </div>

      {/* Score global */}
      {data.scoreGlobal != null && (
        <div className="mb-4">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="font-serif text-2xl text-fg">{data.scoreGlobal}%</span>
            <span className="font-sans text-xs text-muted">alignement global</span>
          </div>
          {data.maturityScore != null && (
            <div className="flex items-center gap-2 mb-3">
              <span className="font-sans text-xs text-muted">
                Maturité : <span className="font-medium text-fg">{data.maturityScore}%</span>
                {data.maturityProgression != null && data.maturityProgression > 0 && (
                  <span className="text-green ml-1">+{data.maturityProgression}pts</span>
                )}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Décision */}
      {decision && (
        <div className="mb-4">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-sans text-xs font-medium"
            style={{ background: decision.bg, color: decision.color }}
          >
            Décision : {decision.label}
          </span>
        </div>
      )}

      {/* Jauges détaillées */}
      {gauges.length > 0 && (
        <div className="space-y-2 mb-4">
          {gauges.map((g) => (
            <GaugeBar key={g.label} label={g.label} value={g.value} />
          ))}
        </div>
      )}

      {/* Zones d'attention */}
      {criticalZones.length > 0 && (
        <div className="mb-4">
          <p className="font-sans text-xs font-semibold text-muted uppercase tracking-wide mb-2">
            Zones d'attention
          </p>
          <div className="space-y-1.5">
            {criticalZones.slice(0, 3).map((z, i) => (
              <div key={i} className="flex items-start gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                  style={{ background: z.niveau === "critique" ? "#ff4f3f" : "#ff8f27" }}
                />
                <span className="font-sans text-xs text-fg leading-snug">{z.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Micro-actions en cours */}
      {pendingActions.length > 0 && (
        <div className="mb-3">
          <p className="font-sans text-xs font-semibold text-muted uppercase tracking-wide mb-2">
            Micro-actions en cours
          </p>
          <div className="space-y-1.5">
            {pendingActions.slice(0, 3).map((a, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-muted text-xs mt-0.5 flex-shrink-0">
                  {a.status === "in_progress" ? "●" : "○"}
                </span>
                <span className="font-sans text-xs text-fg leading-snug">{a.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compteurs */}
      <div className="flex items-center gap-4 pt-3 border-t border-border">
        <span className="font-sans text-xs text-muted">
          {data.checkinsCount} check-in{data.checkinsCount > 1 ? "s" : ""}
        </span>
        <span className="font-sans text-xs text-muted">
          {data.microActionsTotal} micro-action{data.microActionsTotal > 1 ? "s" : ""}
        </span>
        {data.readyScore != null && (
          <span className="font-sans text-xs text-muted">
            Ready score : {data.readyScore}
          </span>
        )}
      </div>
    </div>
  );
}
