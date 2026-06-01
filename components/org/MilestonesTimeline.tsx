"use client";

import { Check, Clock, AlertCircle, Circle } from "lucide-react";
import type { Milestone, MilestoneStatus, MilestoneCategory } from "@/types";

const STATUS_META: Record<MilestoneStatus, { icon: typeof Check; color: string; bg: string; label: string }> = {
  "franchi": { icon: Check, color: "#1cb785", bg: "rgba(28,183,133,0.12)", label: "Franchi" },
  "en cours": { icon: Clock, color: "#2D5BE3", bg: "rgba(45,91,227,0.12)", label: "En cours" },
  "bloqué": { icon: AlertCircle, color: "#ff4f3f", bg: "rgba(255,79,63,0.12)", label: "Bloqué" },
  "à venir": { icon: Circle, color: "#888888", bg: "rgba(136,136,136,0.12)", label: "À venir" },
};

const CATEGORY_LABEL: Record<MilestoneCategory, string> = {
  produit: "Produit",
  commercial: "Commercial",
  financement: "Financement",
  équipe: "Équipe",
  posture: "Posture",
};

function formatDateShort(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_ORDER: MilestoneStatus[] = ["en cours", "bloqué", "à venir", "franchi"];

interface Props {
  milestones: Milestone[];
}

export function MilestonesTimeline({ milestones }: Props) {
  const sorted = [...milestones].sort((a, b) => {
    return STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
  });

  return (
    <div className="bg-surface rounded-[20px] p-6" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-serif text-xl text-fg" style={{ fontFamily: "DM Serif Display" }}>
          Jalons
        </h2>
        <span className="font-sans text-xs text-muted">{milestones.length} au total</span>
      </div>

      {sorted.length === 0 ? (
        <p className="font-sans text-sm text-muted italic">Aucun jalon défini pour l'instant.</p>
      ) : (
        <div className="space-y-3">
          {sorted.map((m) => {
            const meta = STATUS_META[m.status];
            const Icon = meta.icon;
            return (
              <div
                key={m.id}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-bg/40 transition-colors"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: meta.bg }}
                >
                  <Icon size={15} style={{ color: meta.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-sans text-sm font-semibold text-fg">{m.title}</p>
                    <span className="font-sans text-[10px] text-muted bg-bg px-2 py-0.5 rounded-full border border-border">
                      {CATEGORY_LABEL[m.category]}
                    </span>
                  </div>
                  {m.description && (
                    <p className="font-sans text-xs text-muted mt-1 leading-relaxed">{m.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    <span
                      className="font-sans text-[11px] font-medium"
                      style={{ color: meta.color }}
                    >
                      {meta.label}
                    </span>
                    {m.reached_at && (
                      <span className="font-sans text-[11px] text-muted">
                        · {formatDateShort(m.reached_at)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
