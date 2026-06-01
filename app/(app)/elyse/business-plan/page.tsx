"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Plus, TrendingUp, Clock, ChevronRight, Trash2 } from "lucide-react";
import type { BusinessPlan } from "@/types/business-plan";

const SCENARIO_LABEL: Record<string, string> = {
  conservative: "Conservateur",
  moderate: "Modéré",
  aggressive: "Agressif",
};

const SCENARIO_COLOR: Record<string, string> = {
  conservative: "#ff8f27",
  moderate: "#1cb785",
  aggressive: "#2D5BE3",
};

function fmt(n: number | null | undefined, unit = "€") {
  if (n == null) return "—";
  return `${Math.round(n).toLocaleString("fr-FR")} ${unit}`;
}

export default function BusinessPlanListPage() {
  const [bps, setBps] = useState<BusinessPlan[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("alpact_business_plans") ?? "[]") as BusinessPlan[];
    setBps(stored);
    setLoaded(true);
  }, []);

  function handleDelete(id: string) {
    const updated = bps.filter((b) => b.id !== id);
    setBps(updated);
    localStorage.setItem("alpact_business_plans", JSON.stringify(updated));
  }

  return (
    <div className="min-h-screen bg-bg p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-4xl text-fg mb-1">Business Plans</h1>
            <p className="font-sans text-sm text-muted">
              Génère et exporte ton business plan en quelques minutes.
            </p>
          </div>
          <Link
            href="/elyse/business-plan/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-sans text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "#1cb785" }}
          >
            <Plus size={16} />
            Nouveau BP
          </Link>
        </div>

        {/* List or empty state */}
        {!loaded ? null : bps.length === 0 ? (
          <div className="bg-surface rounded-card shadow-card p-12 border border-border text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: "#1cb78514" }}
            >
              <FileText size={28} style={{ color: "#1cb785" }} />
            </div>
            <h2 className="font-serif text-2xl text-fg mb-2">Aucun business plan</h2>
            <p className="font-sans text-sm text-muted mb-6 max-w-sm mx-auto leading-relaxed">
              Crée ton premier business plan. Le questionnaire guidé te prend 10-15 minutes.
            </p>
            <Link
              href="/elyse/business-plan/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-sans text-sm font-semibold text-white"
              style={{ background: "#1cb785" }}
            >
              <Plus size={15} />
              Commencer
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bps.map((bp) => {
              const projectName =
                (bp.data_snapshot as { project?: { name?: string } })?.project?.name ?? "Business Plan";
              const indicators = bp.financial_tables?.indicators;
              const pnl = bp.financial_tables?.pnl ?? [];
              const year1CA = pnl.slice(0, 12).reduce((s, m) => s + m.revenue, 0);

              return (
                <div
                  key={bp.id}
                  className="bg-surface rounded-card shadow-card border border-border p-5 flex items-center gap-5 group hover:border-green/30 transition-all"
                >
                  {/* Icon */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "#1cb78514" }}
                  >
                    <FileText size={20} style={{ color: "#1cb785" }} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-sans font-semibold text-sm text-fg truncate">{projectName}</p>
                      <span
                        className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{
                          color: SCENARIO_COLOR[bp.scenario] ?? "#111",
                          background: `${SCENARIO_COLOR[bp.scenario] ?? "#111"}14`,
                        }}
                      >
                        {SCENARIO_LABEL[bp.scenario] ?? bp.scenario}
                      </span>
                      <span className="text-[10px] font-sans text-muted px-2 py-0.5 rounded-full bg-beige border border-border flex-shrink-0">
                        v{bp.version}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      {year1CA > 0 && (
                        <div className="flex items-center gap-1">
                          <TrendingUp size={11} className="text-muted" />
                          <span className="font-sans text-xs text-muted">CA An 1 : {fmt(year1CA)}</span>
                        </div>
                      )}
                      {indicators?.runway !== undefined && (
                        <div className="flex items-center gap-1">
                          <Clock size={11} className="text-muted" />
                          <span className="font-sans text-xs text-muted">
                            Runway :{" "}
                            {indicators.runway === null ? "+36 mois" : `${indicators.runway} mois`}
                          </span>
                        </div>
                      )}
                      <span className="font-sans text-xs text-muted">
                        {new Date(bp.created_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (confirm(`Supprimer « ${projectName} » ?`)) handleDelete(bp.id);
                      }}
                      className="p-2 rounded-xl text-muted hover:text-red hover:bg-red/5 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={15} />
                    </button>
                    <Link
                      href={`/elyse/business-plan/${bp.id}`}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full font-sans text-xs font-semibold text-white transition-all hover:opacity-90"
                      style={{ background: "#1cb785" }}
                    >
                      Ouvrir
                      <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
