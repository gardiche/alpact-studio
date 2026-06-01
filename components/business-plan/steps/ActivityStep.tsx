"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useBusinessPlanStore } from "@/lib/store/useBusinessPlanStore";
import { QuestionCard } from "../QuestionCard";
import type { RevenueLineForm } from "@/types/business-plan";

const BILLING_OPTIONS = [
  { value: "monthly", label: "Au mois (abonnement)" },
  { value: "yearly", label: "À l'année" },
  { value: "per_project", label: "Au projet / à la prestation" },
  { value: "per_unit", label: "À l'unité / à la vente" },
] as const;

const PRICE_BRACKETS = [
  { label: "0 — 50 €", value: 25 },
  { label: "50 — 200 €", value: 100 },
  { label: "200 — 1 000 €", value: 500 },
  { label: "+ 1 000 €", value: 2000 },
];

const BUSINESS_TYPES = [
  { value: "saas", label: "SaaS / logiciel" },
  { value: "service", label: "Service / conseil" },
  { value: "marketplace", label: "Marketplace" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "hardware", label: "Hardware / produit physique" },
  { value: "other", label: "Autre" },
] as const;

const STAGES = [
  { value: "pre_revenue", label: "Pré-revenu (pas encore de clients)" },
  { value: "early_revenue", label: "Early revenue (premiers clients)" },
  { value: "scaling", label: "En croissance" },
  { value: "post_funding", label: "Post-levée" },
] as const;

function newLine(): RevenueLineForm {
  return {
    id: crypto.randomUUID(),
    name: "",
    type: "recurring",
    billing_cycle: "monthly",
    unit_price: null,
    current_volume: null,
    source: "user_input",
  };
}

interface ActivityStepProps {
  onNext: () => void;
}

export function ActivityStep({ onNext }: ActivityStepProps) {
  const {
    projectName, projectDescription, businessType, stage,
    revenueLines,
    setProject, addRevenueLine, updateRevenueLine, removeRevenueLine,
    markBlockComplete,
  } = useBusinessPlanStore();

  const [showPriceBracket, setShowPriceBracket] = useState<Record<string, boolean>>({});

  function handleAddLine() {
    addRevenueLine(newLine());
  }

  function handleNext() {
    markBlockComplete(0);
    onNext();
  }

  const canProceed =
    projectName.trim().length > 0 &&
    businessType &&
    stage &&
    revenueLines.length > 0 &&
    revenueLines.every((l) => l.name && l.unit_price !== null);

  return (
    <div className="space-y-5">
      {/* Project description */}
      <QuestionCard
        question="Décris ce que tu vends en une phrase."
        hint="On ne cherche pas un pitch parfait — juste assez pour comprendre ton activité."
      >
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProject({ projectName: e.target.value })}
          placeholder="Ex : Logiciel de gestion RH pour PME"
          className="w-full px-4 py-3 rounded-xl font-sans text-sm text-fg bg-bg border border-border focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green transition-all"
        />
        <textarea
          value={projectDescription}
          onChange={(e) => setProject({ projectDescription: e.target.value })}
          placeholder="Un peu plus de détails si tu veux (facultatif)"
          rows={2}
          className="w-full px-4 py-3 rounded-xl font-sans text-sm text-fg bg-bg border border-border focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green transition-all resize-none"
        />
      </QuestionCard>

      {/* Business type */}
      <QuestionCard question="Quel type d'activité ?">
        <div className="flex flex-wrap gap-2">
          {BUSINESS_TYPES.map((bt) => (
            <button
              key={bt.value}
              onClick={() => setProject({ businessType: bt.value })}
              className={`px-4 py-2 rounded-full text-sm font-sans font-medium border transition-all ${
                businessType === bt.value
                  ? "bg-green text-white border-green"
                  : "bg-beige text-fg border-border hover:border-green/40"
              }`}
            >
              {bt.label}
            </button>
          ))}
        </div>
      </QuestionCard>

      {/* Stage */}
      <QuestionCard question="Où en es-tu ?">
        <div className="flex flex-wrap gap-2">
          {STAGES.map((s) => (
            <button
              key={s.value}
              onClick={() => setProject({ stage: s.value })}
              className={`px-4 py-2 rounded-full text-sm font-sans font-medium border transition-all ${
                stage === s.value
                  ? "bg-green text-white border-green"
                  : "bg-beige text-fg border-border hover:border-green/40"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </QuestionCard>

      {/* Revenue lines */}
      <QuestionCard
        question="Quelles sont tes offres ?"
        hint="Ajoute chaque offre ou produit séparément. Même si tu n'as pas encore de clients."
      >
        <div className="space-y-4">
          {revenueLines.map((line) => (
            <div key={line.id} className="bg-bg rounded-xl p-4 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={line.name}
                  onChange={(e) => updateRevenueLine(line.id, { name: e.target.value })}
                  placeholder="Nom de l'offre (ex : Abonnement Pro)"
                  className="flex-1 px-3 py-2 rounded-lg font-sans text-sm text-fg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green transition-all"
                />
                <button
                  onClick={() => removeRevenueLine(line.id)}
                  className="ml-2 p-2 text-muted hover:text-red transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Billing cycle */}
                <div>
                  <p className="text-xs font-sans text-muted mb-1.5">Comment tu factures ?</p>
                  <div className="flex flex-wrap gap-1.5">
                    {BILLING_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() =>
                          updateRevenueLine(line.id, {
                            billing_cycle: opt.value,
                            type: opt.value === "per_project" ? "one_shot" : "recurring",
                          })
                        }
                        className={`px-2.5 py-1 rounded-full text-xs font-sans font-medium border transition-all ${
                          line.billing_cycle === opt.value
                            ? "bg-green text-white border-green"
                            : "bg-surface text-muted border-border hover:border-green/40"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Unit price */}
                <div>
                  <p className="text-xs font-sans text-muted mb-1.5">Prix moyen</p>
                  {showPriceBracket[line.id] ? (
                    <div className="flex flex-wrap gap-1.5">
                      {PRICE_BRACKETS.map((b) => (
                        <button
                          key={b.label}
                          onClick={() => {
                            updateRevenueLine(line.id, { unit_price: b.value });
                            setShowPriceBracket((p) => ({ ...p, [line.id]: false }));
                          }}
                          className="px-2.5 py-1 rounded-full text-xs font-sans border border-border bg-surface text-muted hover:border-green/40 transition-all"
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          value={line.unit_price ?? ""}
                          onChange={(e) =>
                            updateRevenueLine(line.id, {
                              unit_price: e.target.value ? Number(e.target.value) : null,
                            })
                          }
                          placeholder="0"
                          className="w-full pl-3 pr-7 py-2 rounded-lg font-sans text-sm text-fg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green transition-all"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted">€</span>
                      </div>
                      <button
                        onClick={() => setShowPriceBracket((p) => ({ ...p, [line.id]: true }))}
                        className="text-xs text-muted hover:text-fg underline whitespace-nowrap"
                      >
                        je sais pas
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Current volume */}
              <div>
                <p className="text-xs font-sans text-muted mb-1.5">Combien de clients aujourd'hui ?</p>
                <input
                  type="number"
                  value={line.current_volume ?? ""}
                  onChange={(e) =>
                    updateRevenueLine(line.id, {
                      current_volume: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  placeholder="0"
                  className="w-32 px-3 py-2 rounded-lg font-sans text-sm text-fg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green transition-all"
                />
                {(line.current_volume === 0 || line.current_volume === null) && (
                  <p className="text-xs text-muted mt-1">Mode pré-revenu — on projette depuis zéro.</p>
                )}
              </div>
            </div>
          ))}

          <button
            onClick={handleAddLine}
            className="w-full py-3 rounded-xl border-2 border-dashed border-border text-sm font-sans text-muted hover:border-green/40 hover:text-green transition-all flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Ajouter une offre
          </button>
        </div>
      </QuestionCard>

      {/* CTA */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="px-6 py-3 rounded-full font-sans text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: canProceed ? "#1cb785" : "#ccc" }}
        >
          Continuer →
        </button>
      </div>
    </div>
  );
}
