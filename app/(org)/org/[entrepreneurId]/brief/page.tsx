import { notFound } from "next/navigation";
import { Sun, Cloud, CloudRain, CloudFog, AlertTriangle, CheckCircle2, Flag } from "lucide-react";
import { BriefHeader } from "@/components/org/brief/BriefHeader";
import { BriefSection } from "@/components/org/brief/BriefSection";
import { BriefQuestions } from "@/components/org/brief/BriefQuestions";
import { getCohortMemberDetail } from "@/lib/org/cohortRepository";
import { buildBriefContext } from "@/lib/org/briefBuilder";
import type { WeatherMood } from "@/types";

const MOOD_ICON: Record<WeatherMood, typeof Sun> = {
  ensoleillé: Sun,
  nuageux: Cloud,
  brumeux: CloudFog,
  orageux: CloudRain,
};

const MOOD_COLOR: Record<WeatherMood, string> = {
  ensoleillé: "#1cb785",
  nuageux: "#888888",
  brumeux: "#9d89fc",
  orageux: "#ff4f3f",
};

const TREND_LABEL: Record<string, { label: string; color: string }> = {
  positive: { label: "Tendance positive", color: "#1cb785" },
  stable: { label: "Stable", color: "#888888" },
  négative: { label: "Tendance négative", color: "#ff4f3f" },
  neutre: { label: "Contrastée", color: "#9d89fc" },
};

const SEVERITY_COLOR: Record<string, string> = {
  haute: "#ff4f3f",
  moyenne: "#ff8f27",
  basse: "#888888",
};

export default async function BriefPage({
  params,
}: {
  params: Promise<{ entrepreneurId: string }>;
}) {
  const { entrepreneurId } = await params;
  const member = await getCohortMemberDetail(entrepreneurId);
  if (!member) notFound();

  const ctx = buildBriefContext(member);

  return (
    <div className="min-h-screen bg-bg p-8 print:bg-white print:p-0">
      <div className="max-w-3xl mx-auto print:max-w-full">
        <BriefHeader member={member} />

        <div className="space-y-4 print:space-y-3">
          {/* Météo récente */}
          <BriefSection
            title="Météo récente"
            subtitle={TREND_LABEL[ctx.weather.trend].label}
          >
            <p className="font-sans text-sm text-fg mb-3">{ctx.weather.summary}</p>
            <div className="flex gap-2 flex-wrap mb-3">
              {(Object.keys(ctx.weather.counts) as WeatherMood[]).map((mood) => {
                const count = ctx.weather.counts[mood];
                if (count === 0) return null;
                const Icon = MOOD_ICON[mood];
                return (
                  <span
                    key={mood}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-bg/50"
                  >
                    <Icon size={13} style={{ color: MOOD_COLOR[mood] }} />
                    <span className="font-sans text-xs text-fg capitalize">
                      {mood} · {count}
                    </span>
                  </span>
                );
              })}
            </div>
            {ctx.weather.highlights.length > 0 && (
              <div className="space-y-1.5 mt-3">
                {ctx.weather.highlights.map((h) => (
                  <p key={h.id} className="font-sans text-xs text-fg italic leading-relaxed">
                    « {h.note} »
                  </p>
                ))}
              </div>
            )}
          </BriefSection>

          {/* Zones d'attention */}
          <BriefSection
            title="Zones d'attention"
            subtitle={`${ctx.zones.length} signal${ctx.zones.length > 1 ? "s" : ""}`}
            accent={ctx.zones.length > 0 ? "#ff4f3f" : undefined}
          >
            {ctx.zones.length === 0 ? (
              <p className="font-sans text-sm text-muted italic">
                Aucune zone d'attention particulière. Séance ouverte.
              </p>
            ) : (
              <div className="space-y-2">
                {ctx.zones.map((z, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 p-3 rounded-xl border border-border bg-bg/40"
                    style={{ borderLeft: `3px solid ${SEVERITY_COLOR[z.severity]}` }}
                  >
                    <AlertTriangle size={14} style={{ color: SEVERITY_COLOR[z.severity] }} className="flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-sm font-semibold text-fg">{z.label}</p>
                      <p className="font-sans text-xs text-muted mt-0.5 leading-relaxed">{z.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </BriefSection>

          {/* Actions */}
          <BriefSection
            title="Actions en cours"
            subtitle={`${ctx.openActions.length} ouverte${ctx.openActions.length > 1 ? "s" : ""}`}
          >
            {ctx.openActions.length === 0 ? (
              <p className="font-sans text-sm text-muted italic">Aucune action en cours.</p>
            ) : (
              <ul className="space-y-1.5">
                {ctx.openActions.map((a) => (
                  <li key={a.id} className="flex items-center gap-2.5 text-sm">
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: a.status === "en cours" ? "#2D5BE3" : "#888" }}
                    />
                    <span className="font-sans text-sm text-fg flex-1">{a.title}</span>
                    <span className="font-sans text-[11px] text-muted whitespace-nowrap">
                      {a.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {ctx.recentDoneActions.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border">
                <p className="font-sans text-xs font-semibold uppercase tracking-wide text-muted mb-2">
                  Réalisé récemment
                </p>
                <ul className="space-y-1">
                  {ctx.recentDoneActions.map((a) => (
                    <li key={a.id} className="flex items-center gap-2.5">
                      <CheckCircle2 size={12} style={{ color: "#1cb785" }} className="flex-shrink-0" />
                      <span className="font-sans text-xs text-muted">{a.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </BriefSection>

          {/* Jalon en cours */}
          {ctx.inProgressMilestones.length > 0 && (
            <BriefSection title="Jalons en cours" accent="#2D5BE3">
              <div className="space-y-2">
                {ctx.inProgressMilestones.map((m) => (
                  <div key={m.id} className="flex items-start gap-2.5">
                    <Flag size={14} style={{ color: "#2D5BE3" }} className="flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-sans text-sm font-semibold text-fg">{m.title}</p>
                      {m.description && (
                        <p className="font-sans text-xs text-muted mt-0.5">{m.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </BriefSection>
          )}

          {/* Questions suggérées (IA) */}
          <BriefSection
            title="Questions à poser en séance"
            subtitle="Suggérées par l'IA · à adapter"
            accent="#2D5BE3"
          >
            <BriefQuestions memberId={member.id} />
          </BriefSection>
        </div>

        <p className="font-sans text-[11px] text-muted text-center mt-8 print:mt-4">
          Brief généré le {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} ·
          Alpact Studio
        </p>
      </div>
    </div>
  );
}
