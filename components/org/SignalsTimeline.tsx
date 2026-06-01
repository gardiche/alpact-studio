"use client";

import { Sun, Cloud, CloudRain, CloudFog, AlertTriangle, CheckCircle2, Circle, X } from "lucide-react";
import type { WeatherSignal, TensionSignal, ActionSignal, WeatherMood, ActionStatus } from "@/types";

const MOOD_META: Record<WeatherMood, { icon: typeof Sun; color: string; bg: string; label: string }> = {
  ensoleillé: { icon: Sun, color: "#1cb785", bg: "rgba(28,183,133,0.12)", label: "Ensoleillé" },
  nuageux: { icon: Cloud, color: "#888888", bg: "rgba(136,136,136,0.12)", label: "Nuageux" },
  brumeux: { icon: CloudFog, color: "#9d89fc", bg: "rgba(157,137,252,0.12)", label: "Brumeux" },
  orageux: { icon: CloudRain, color: "#ff4f3f", bg: "rgba(255,79,63,0.12)", label: "Orageux" },
};

const ACTION_META: Record<ActionStatus, { icon: typeof CheckCircle2; color: string }> = {
  "fait": { icon: CheckCircle2, color: "#1cb785" },
  "en cours": { icon: Circle, color: "#2D5BE3" },
  "à faire": { icon: Circle, color: "#888888" },
  "abandonné": { icon: X, color: "#ff4f3f" },
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

interface Props {
  weather: WeatherSignal[];
  tensions: TensionSignal[];
  actions: ActionSignal[];
}

export function SignalsTimeline({ weather, tensions, actions }: Props) {
  const activeTensions = tensions.filter((t) => !t.resolved);
  const openActions = actions.filter((a) => a.status === "à faire" || a.status === "en cours");

  return (
    <div className="bg-surface rounded-[20px] p-6" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <h2 className="font-serif text-xl text-fg mb-1" style={{ fontFamily: "DM Serif Display" }}>
        Signaux faibles
      </h2>
      <p className="font-sans text-xs text-muted mb-5">
        Captés entre les séances — ce qui ne se voit pas en RDV.
      </p>

      {/* Météo */}
      <div className="mb-5">
        <h3 className="font-sans text-xs font-semibold uppercase tracking-wide text-muted mb-2">
          Météo récente
        </h3>
        {weather.length === 0 ? (
          <p className="font-sans text-xs text-muted italic">Aucun signal météo.</p>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {weather.slice(0, 5).map((w) => {
              const meta = MOOD_META[w.mood];
              const Icon = meta.icon;
              return (
                <div
                  key={w.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border"
                  style={{ background: meta.bg }}
                  title={w.note ?? meta.label}
                >
                  <Icon size={14} style={{ color: meta.color }} />
                  <span className="font-sans text-[11px] text-fg">{timeAgo(w.created_at)}</span>
                </div>
              );
            })}
          </div>
        )}
        {weather.find((w) => w.note) && (
          <div className="mt-3 space-y-1.5">
            {weather
              .filter((w) => w.note)
              .slice(0, 2)
              .map((w) => (
                <p key={w.id} className="font-sans text-xs text-fg italic leading-relaxed">
                  « {w.note} » <span className="text-muted not-italic">— {timeAgo(w.created_at)}</span>
                </p>
              ))}
          </div>
        )}
      </div>

      {/* Tensions */}
      <div className="mb-5">
        <h3 className="font-sans text-xs font-semibold uppercase tracking-wide text-muted mb-2">
          Tensions actives ({activeTensions.length})
        </h3>
        {activeTensions.length === 0 ? (
          <p className="font-sans text-xs text-muted italic">Aucune tension identifiée.</p>
        ) : (
          <div className="space-y-2">
            {activeTensions.map((t) => (
              <div key={t.id} className="flex items-start gap-2.5 p-3 rounded-xl bg-bg/60 border border-border">
                <AlertTriangle size={14} className="text-orange flex-shrink-0 mt-0.5" style={{ color: "#ff8f27" }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-sans text-[10px] font-medium uppercase tracking-wide text-muted">
                      {t.kind}
                    </span>
                    <span className="font-sans text-[11px] text-muted">· {timeAgo(t.created_at)}</span>
                  </div>
                  <p className="font-sans text-xs text-fg leading-relaxed">{t.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions en cours */}
      <div>
        <h3 className="font-sans text-xs font-semibold uppercase tracking-wide text-muted mb-2">
          Actions ({openActions.length} ouvertes)
        </h3>
        {actions.length === 0 ? (
          <p className="font-sans text-xs text-muted italic">Aucune action.</p>
        ) : (
          <div className="space-y-1.5">
            {actions.slice(0, 6).map((a) => {
              const meta = ACTION_META[a.status];
              const Icon = meta.icon;
              return (
                <div key={a.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg">
                  <Icon size={14} style={{ color: meta.color }} />
                  <span
                    className={`font-sans text-xs flex-1 ${
                      a.status === "fait" || a.status === "abandonné" ? "text-muted line-through" : "text-fg"
                    }`}
                  >
                    {a.title}
                  </span>
                  <span className="font-sans text-[11px] text-muted whitespace-nowrap">
                    {a.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
