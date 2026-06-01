"use client";

import { useEffect } from "react";
import { useBusinessPlanStore } from "@/lib/store/useBusinessPlanStore";
import { QuestionCard } from "../QuestionCard";
import type { GrowthHypothesisForm } from "@/types/business-plan";

const GROWTH_MODELS = [
  { value: "linear", label: "Linéaire (stable)" },
  { value: "exponential", label: "Exponentielle (accélération)" },
  { value: "stepped", label: "Par paliers" },
] as const;

interface GrowthStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function GrowthStep({ onNext, onBack }: GrowthStepProps) {
  const {
    revenueLines,
    growthHypotheses,
    stage,
    addGrowthHypothesis,
    updateGrowthHypothesis,
    markBlockComplete,
  } = useBusinessPlanStore();

  // Init hypotheses for each revenue line if missing
  useEffect(() => {
    for (const line of revenueLines) {
      const exists = growthHypotheses.find((h) => h.revenue_line_id === line.id);
      if (!exists) {
        const hyp: GrowthHypothesisForm = {
          id: crypto.randomUUID(),
          revenue_line_id: line.id,
          monthly_new_customers: null,
          growth_model: "linear",
          churn_rate_monthly: null,
          target_revenue_12m: null,
          has_seasonality: false,
          source: "user_input",
        };
        addGrowthHypothesis(hyp);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revenueLines]);

  function handleNext() {
    markBlockComplete(1);
    onNext();
  }

  const canProceed = revenueLines.every((line) => {
    const h = growthHypotheses.find((h) => h.revenue_line_id === line.id);
    return h && h.monthly_new_customers !== null;
  });

  return (
    <div className="space-y-5">
      {revenueLines.map((line) => {
        const hyp = growthHypotheses.find((h) => h.revenue_line_id === line.id);
        if (!hyp) return null;

        return (
          <div key={line.id}>
            <p className="font-sans text-xs font-semibold text-green uppercase tracking-widest mb-3">
              {line.name || "Offre sans nom"}
            </p>

            <div className="space-y-4">
              <QuestionCard
                question={
                  stage === "pre_revenue"
                    ? "Combien de nouveaux clients tu vises le 1er mois ?"
                    : "Combien de nouveaux clients par mois en ce moment ?"
                }
                hint={stage === "pre_revenue" ? "On va projeter depuis cette base." : undefined}
                fallback={{
                  label: "utiliser le benchmark (3-5 nouveaux clients/mois pour un SaaS early)",
                  onUse: () => updateGrowthHypothesis(hyp.id, { monthly_new_customers: 3, source: "benchmark" }),
                }}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={hyp.monthly_new_customers ?? ""}
                    onChange={(e) =>
                      updateGrowthHypothesis(hyp.id, {
                        monthly_new_customers: e.target.value ? Number(e.target.value) : null,
                        source: "user_input",
                      })
                    }
                    placeholder="0"
                    min={0}
                    className="w-28 px-3 py-2.5 rounded-xl font-sans text-sm text-fg bg-bg border border-border focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green transition-all"
                  />
                  <span className="text-sm text-muted font-sans">nouveaux clients / mois</span>
                </div>
              </QuestionCard>

              <QuestionCard question="C'est en accélération, stable, ou irrégulier ?">
                <div className="flex flex-wrap gap-2">
                  {GROWTH_MODELS.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => updateGrowthHypothesis(hyp.id, { growth_model: m.value })}
                      className={`px-4 py-2 rounded-full text-sm font-sans font-medium border transition-all ${
                        hyp.growth_model === m.value
                          ? "bg-green text-white border-green"
                          : "bg-beige text-fg border-border hover:border-green/40"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </QuestionCard>

              {line.type === "recurring" && (
                <QuestionCard
                  question="Tu perds des clients ? Combien sur 10 par mois ?"
                  hint="Le churn, c'est le % de clients qui partent chaque mois. 1 sur 10 = 10% = 0.10"
                  fallback={{
                    label: "benchmark SaaS B2B early-stage (4%/mois)",
                    onUse: () => updateGrowthHypothesis(hyp.id, { churn_rate_monthly: 0.04, source: "benchmark" }),
                  }}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={hyp.churn_rate_monthly != null ? Math.round(hyp.churn_rate_monthly * 100) : ""}
                      onChange={(e) =>
                        updateGrowthHypothesis(hyp.id, {
                          churn_rate_monthly: e.target.value ? Number(e.target.value) / 100 : null,
                          source: "user_input",
                        })
                      }
                      placeholder="0"
                      min={0}
                      max={100}
                      className="w-24 px-3 py-2.5 rounded-xl font-sans text-sm text-fg bg-bg border border-border focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green transition-all"
                    />
                    <span className="text-sm text-muted font-sans">% par mois</span>
                  </div>
                  {hyp.churn_rate_monthly != null && (
                    <p className="text-xs text-muted">
                      → LTV estimée :{" "}
                      {hyp.churn_rate_monthly > 0
                        ? `${Math.round((line.unit_price ?? 0) / hyp.churn_rate_monthly).toLocaleString("fr-FR")} €`
                        : "indéterminée (churn = 0)"}
                    </p>
                  )}
                </QuestionCard>
              )}

              <QuestionCard
                question="Objectif de CA à 12 mois ?"
                fallback={{
                  label: "calculer automatiquement depuis ton rythme d'acquisition",
                  onUse: () =>
                    updateGrowthHypothesis(hyp.id, {
                      target_revenue_12m: null,
                      source: "inferred",
                    }),
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="number"
                      value={hyp.target_revenue_12m ?? ""}
                      onChange={(e) =>
                        updateGrowthHypothesis(hyp.id, {
                          target_revenue_12m: e.target.value ? Number(e.target.value) : null,
                          source: "user_input",
                        })
                      }
                      placeholder="Facultatif"
                      className="w-40 pl-3 pr-7 py-2.5 rounded-xl font-sans text-sm text-fg bg-bg border border-border focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green transition-all"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted">€</span>
                  </div>
                </div>
              </QuestionCard>

              <QuestionCard
                question="Des mois plus forts ou plus faibles ?"
                hint="Ex : e-commerce fort en décembre, tourisme fort en été."
              >
                <div className="flex gap-3">
                  <button
                    onClick={() => updateGrowthHypothesis(hyp.id, { has_seasonality: false })}
                    className={`px-4 py-2 rounded-full text-sm font-sans font-medium border transition-all ${
                      !hyp.has_seasonality
                        ? "bg-green text-white border-green"
                        : "bg-beige text-fg border-border hover:border-green/40"
                    }`}
                  >
                    Non, c'est régulier
                  </button>
                  <button
                    onClick={() => updateGrowthHypothesis(hyp.id, { has_seasonality: true })}
                    className={`px-4 py-2 rounded-full text-sm font-sans font-medium border transition-all ${
                      hyp.has_seasonality
                        ? "bg-green text-white border-green"
                        : "bg-beige text-fg border-border hover:border-green/40"
                    }`}
                  >
                    Oui, j'ai des pics
                  </button>
                </div>
                {hyp.has_seasonality && (
                  <p className="text-xs text-muted mt-2">
                    La saisonnalité détaillée sera configurable après la génération.
                  </p>
                )}
              </QuestionCard>
            </div>

            {revenueLines.indexOf(line) < revenueLines.length - 1 && (
              <div className="h-px bg-border my-6" />
            )}
          </div>
        );
      })}

      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-full font-sans text-sm font-medium text-muted border border-border hover:border-fg hover:text-fg transition-all"
        >
          ← Retour
        </button>
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="px-6 py-3 rounded-full font-sans text-sm font-semibold text-white transition-all disabled:opacity-40"
          style={{ background: canProceed ? "#1cb785" : "#ccc" }}
        >
          Continuer →
        </button>
      </div>
    </div>
  );
}
