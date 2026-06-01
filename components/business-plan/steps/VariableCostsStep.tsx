"use client";

import { Plus, Trash2 } from "lucide-react";
import { useBusinessPlanStore } from "@/lib/store/useBusinessPlanStore";
import { QuestionCard } from "../QuestionCard";
import type { VariableCostForm } from "@/types/business-plan";

function newCost(): VariableCostForm {
  return {
    id: crypto.randomUUID(),
    category: "other",
    label: "",
    cost_model: "fixed_monthly",
    current_amount_monthly: null,
    unit_cost: null,
    percentage: null,
    projected_amount_12m: null,
    source: "user_input",
  };
}

interface VariableCostsStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function VariableCostsStep({ onNext, onBack }: VariableCostsStepProps) {
  const { variableCosts, addVariableCost, updateVariableCost, removeVariableCost, markBlockComplete } =
    useBusinessPlanStore();

  function handleNext() {
    markBlockComplete(4);
    onNext();
  }

  return (
    <div className="space-y-5">
      {/* Paid ads */}
      <QuestionCard
        question="Tu fais de la pub payante ? (Google Ads, Meta Ads, LinkedIn…)"
        hint="Budget mensuel actuel, et projection à 12 mois si tu prévois d'augmenter."
      >
        {(() => {
          const ads = variableCosts.find((c) => c.category === "paid_ads");
          return (
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (!ads) {
                      addVariableCost({
                        id: crypto.randomUUID(),
                        category: "paid_ads",
                        label: "Publicité payante",
                        cost_model: "fixed_monthly",
                        current_amount_monthly: null,
                        unit_cost: null,
                        percentage: null,
                        projected_amount_12m: null,
                        source: "user_input",
                      });
                    }
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-sans font-medium border transition-all ${
                    !!ads
                      ? "bg-green text-white border-green"
                      : "bg-beige text-fg border-border hover:border-green/40"
                  }`}
                >
                  Oui
                </button>
                <button
                  onClick={() => ads && removeVariableCost(ads.id)}
                  className={`px-4 py-2 rounded-full text-sm font-sans font-medium border transition-all ${
                    !ads
                      ? "bg-green text-white border-green"
                      : "bg-beige text-fg border-border hover:border-green/40"
                  }`}
                >
                  Non
                </button>
              </div>
              {ads && (
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <p className="text-xs text-muted mb-1">Budget actuel / mois</p>
                    <div className="relative">
                      <input
                        type="number"
                        value={ads.current_amount_monthly ?? ""}
                        onChange={(e) =>
                          updateVariableCost(ads.id, { current_amount_monthly: Number(e.target.value) || null })
                        }
                        placeholder="0"
                        className="w-full pl-3 pr-7 py-2 rounded-lg text-sm font-sans text-fg bg-bg border border-border focus:outline-none focus:ring-2 focus:ring-green/20"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted">€</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-1">Budget prévu à 12 mois</p>
                    <div className="relative">
                      <input
                        type="number"
                        value={ads.projected_amount_12m ?? ""}
                        onChange={(e) =>
                          updateVariableCost(ads.id, { projected_amount_12m: Number(e.target.value) || null })
                        }
                        placeholder="Idem"
                        className="w-full pl-3 pr-7 py-2 rounded-lg text-sm font-sans text-fg bg-bg border border-border focus:outline-none focus:ring-2 focus:ring-green/20"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted">€</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </QuestionCard>

      {/* Per-unit costs */}
      <QuestionCard
        question="Des coûts qui augmentent avec chaque client ?"
        hint="Ex : frais d'hébergement, coût de support, API tierces par utilisateur."
      >
        <div className="space-y-2">
          {variableCosts.filter((c) => c.cost_model === "per_unit").map((cost) => (
            <div key={cost.id} className="flex items-center gap-2">
              <input
                type="text"
                value={cost.label}
                onChange={(e) => updateVariableCost(cost.id, { label: e.target.value })}
                placeholder="Ex : Hébergement cloud"
                className="flex-1 px-3 py-2 rounded-lg text-xs font-sans text-fg bg-bg border border-border focus:outline-none focus:ring-2 focus:ring-green/20"
              />
              <div className="relative">
                <input
                  type="number"
                  value={cost.unit_cost ?? ""}
                  onChange={(e) =>
                    updateVariableCost(cost.id, { unit_cost: Number(e.target.value) || null })
                  }
                  placeholder="0"
                  className="w-24 pl-2 pr-12 py-2 rounded-lg text-xs font-sans text-fg bg-bg border border-border focus:outline-none focus:ring-2 focus:ring-green/20"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted">€/client</span>
              </div>
              <button onClick={() => removeVariableCost(cost.id)} className="text-muted hover:text-red">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              addVariableCost({ ...newCost(), cost_model: "per_unit", label: "", category: "hosting_infra" })
            }
            className="text-xs font-sans text-muted hover:text-green flex items-center gap-1 transition-colors"
          >
            <Plus size={12} /> Ajouter un coût par client
          </button>
        </div>
      </QuestionCard>

      {/* Commissions */}
      <QuestionCard
        question="Des commissions ? (apporteurs d'affaires, affiliés, revendeurs…)"
        hint="En % du CA généré."
      >
        <div className="space-y-2">
          {variableCosts.filter((c) => c.cost_model === "percentage_revenue").map((cost) => (
            <div key={cost.id} className="flex items-center gap-2">
              <input
                type="text"
                value={cost.label}
                onChange={(e) => updateVariableCost(cost.id, { label: e.target.value })}
                placeholder="Ex : Commission apporteur"
                className="flex-1 px-3 py-2 rounded-lg text-xs font-sans text-fg bg-bg border border-border focus:outline-none focus:ring-2 focus:ring-green/20"
              />
              <div className="relative">
                <input
                  type="number"
                  value={cost.percentage ?? ""}
                  onChange={(e) =>
                    updateVariableCost(cost.id, { percentage: Number(e.target.value) || null })
                  }
                  placeholder="0"
                  min={0}
                  max={100}
                  className="w-20 pl-2 pr-6 py-2 rounded-lg text-xs font-sans text-fg bg-bg border border-border focus:outline-none focus:ring-2 focus:ring-green/20"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted">%</span>
              </div>
              <button onClick={() => removeVariableCost(cost.id)} className="text-muted hover:text-red">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              addVariableCost({ ...newCost(), cost_model: "percentage_revenue", category: "commissions" })
            }
            className="text-xs font-sans text-muted hover:text-green flex items-center gap-1 transition-colors"
          >
            <Plus size={12} /> Ajouter une commission
          </button>
        </div>
      </QuestionCard>

      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-full font-sans text-sm font-medium text-muted border border-border hover:border-fg hover:text-fg transition-all"
        >
          ← Retour
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-3 rounded-full font-sans text-sm font-semibold text-white transition-all"
          style={{ background: "#1cb785" }}
        >
          Continuer →
        </button>
      </div>
    </div>
  );
}
