"use client";

import { Plus, Trash2 } from "lucide-react";
import { useBusinessPlanStore } from "@/lib/store/useBusinessPlanStore";
import { QuestionCard } from "../QuestionCard";
import type { FixedCostForm } from "@/types/business-plan";

const SAAS_TOOLS = [
  { label: "Produit & hebergement" },
  { label: "Vente & relation client" },
  { label: "Marketing & mesure" },
  { label: "Creation & design" },
  { label: "Ops, finance & admin" },
  { label: "Collaboration interne" },
];

const OFFICE_OPTIONS = [
  { value: "home", label: "A domicile" },
  { value: "coworking", label: "Coworking" },
  { value: "office", label: "Bureau fixe" },
] as const;

function newCost(category: FixedCostForm["category"] = "other"): FixedCostForm {
  return {
    id: crypto.randomUUID(),
    category,
    label: "",
    amount_monthly: null,
    source: "user_input",
  };
}

interface FixedCostsStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function FixedCostsStep({ onNext, onBack }: FixedCostsStepProps) {
  const { fixedCosts, addFixedCost, updateFixedCost, removeFixedCost, markBlockComplete } =
    useBusinessPlanStore();

  const officeEntry = fixedCosts.find((c) => c.category === "rent" || c.category === "coworking");
  const saasCosts = fixedCosts.filter((c) => c.category === "saas_tools");
  const otherCosts = fixedCosts.filter(
    (c) => c.category !== "rent" && c.category !== "coworking" && c.category !== "saas_tools"
  );

  const totalFixed = fixedCosts.reduce((s, c) => s + (c.amount_monthly ?? 0), 0);

  function handleOfficeChoice(type: "home" | "coworking" | "office") {
    if (officeEntry) removeFixedCost(officeEntry.id);
    if (type === "home") return;
    addFixedCost({
      id: crypto.randomUUID(),
      category: type === "coworking" ? "coworking" : "rent",
      label: type === "coworking" ? "Coworking" : "Bureau",
      amount_monthly: null,
      source: "user_input",
    });
  }

  function addSaasTool(tool: { label: string }) {
    addFixedCost({
      id: crypto.randomUUID(),
      category: "saas_tools",
      label: tool.label,
      amount_monthly: null,
      source: "user_input",
    });
  }

  function handleNext() {
    markBlockComplete(3);
    onNext();
  }

  return (
    <div className="space-y-5">
      <QuestionCard question="Bureau, coworking, ou tu travailles depuis chez toi ?">
        <div className="flex flex-wrap gap-2">
          {OFFICE_OPTIONS.map((opt) => {
            const isActive =
              opt.value === "home"
                ? !officeEntry
                : officeEntry?.category === (opt.value === "coworking" ? "coworking" : "rent");

            return (
              <button
                key={opt.value}
                onClick={() => handleOfficeChoice(opt.value)}
                className={`px-4 py-2 rounded-full text-sm font-sans font-medium border transition-all ${
                  isActive
                    ? "bg-green text-white border-green"
                    : "bg-beige text-fg border-border hover:border-green/40"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {officeEntry && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-muted">Montant mensuel :</span>
            <div className="relative">
              <input
                type="number"
                value={officeEntry.amount_monthly ?? ""}
                onChange={(e) =>
                  updateFixedCost(officeEntry.id, {
                    amount_monthly: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="0"
                className="w-28 pl-3 pr-7 py-2 rounded-lg font-sans text-sm text-fg bg-bg border border-border focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green transition-all"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted">EUR</span>
            </div>
          </div>
        )}
      </QuestionCard>

      <QuestionCard
        question="Tes outils et abonnements SaaS ?"
        hint="Ajoute les grandes familles que tu utilises, puis renseigne ton budget mensuel global."
      >
        <div className="flex flex-wrap gap-2 mb-3">
          {SAAS_TOOLS.map((tool) => {
            const alreadyAdded = saasCosts.some((c) => c.label === tool.label);
            return (
              <button
                key={tool.label}
                onClick={() => !alreadyAdded && addSaasTool(tool)}
                className={`px-3 py-1.5 rounded-full text-xs font-sans font-medium border transition-all ${
                  alreadyAdded
                    ? "bg-green/10 text-green border-green/20 cursor-default"
                    : "bg-beige text-muted border-border hover:border-green/40 hover:text-green"
                }`}
              >
                {alreadyAdded ? "OK " : "+ "}
                {tool.label}
              </button>
            );
          })}
        </div>

        {saasCosts.length > 0 && (
          <div className="space-y-2">
            {saasCosts.map((cost) => (
              <div key={cost.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={cost.label}
                  onChange={(e) => updateFixedCost(cost.id, { label: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-lg font-sans text-xs text-fg bg-bg border border-border focus:outline-none focus:ring-2 focus:ring-green/20"
                />
                <div className="relative">
                  <input
                    type="number"
                    value={cost.amount_monthly ?? ""}
                    onChange={(e) =>
                      updateFixedCost(cost.id, { amount_monthly: Number(e.target.value) || null })
                    }
                    placeholder="0"
                    className="w-24 pl-2 pr-9 py-2 rounded-lg font-sans text-xs text-fg bg-bg border border-border focus:outline-none focus:ring-2 focus:ring-green/20"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted">EUR</span>
                </div>
                <button
                  onClick={() => removeFixedCost(cost.id)}
                  className="text-muted hover:text-red transition-colors"
                  aria-label="Supprimer"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => addFixedCost(newCost("saas_tools"))}
          className="text-xs font-sans text-muted hover:text-green flex items-center gap-1 mt-2 transition-colors"
        >
          <Plus size={12} /> Autre abonnement
        </button>
      </QuestionCard>

      <QuestionCard question="Autres charges fixes recurrentes ?">
        <div className="space-y-2">
          {otherCosts.map((cost) => (
            <div key={cost.id} className="flex items-center gap-2">
              <select
                value={cost.category}
                onChange={(e) =>
                  updateFixedCost(cost.id, { category: e.target.value as FixedCostForm["category"] })
                }
                className="px-2 py-2 rounded-lg font-sans text-xs text-fg bg-bg border border-border focus:outline-none"
              >
                <option value="insurance">Assurance</option>
                <option value="accounting">Comptable</option>
                <option value="legal">Juridique</option>
                <option value="telecom">Telephone / internet</option>
                <option value="travel">Deplacements</option>
                <option value="other">Autre</option>
              </select>
              <input
                type="text"
                value={cost.label}
                onChange={(e) => updateFixedCost(cost.id, { label: e.target.value })}
                placeholder="Description"
                className="flex-1 px-3 py-2 rounded-lg font-sans text-xs text-fg bg-bg border border-border focus:outline-none focus:ring-2 focus:ring-green/20"
              />
              <div className="relative">
                <input
                  type="number"
                  value={cost.amount_monthly ?? ""}
                  onChange={(e) =>
                    updateFixedCost(cost.id, { amount_monthly: Number(e.target.value) || null })
                  }
                  placeholder="0"
                  className="w-24 pl-2 pr-9 py-2 rounded-lg font-sans text-xs text-fg bg-bg border border-border focus:outline-none focus:ring-2 focus:ring-green/20"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted">EUR</span>
              </div>
              <button
                onClick={() => removeFixedCost(cost.id)}
                className="text-muted hover:text-red transition-colors"
                aria-label="Supprimer"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          <button
            onClick={() => addFixedCost(newCost("other"))}
            className="text-xs font-sans text-muted hover:text-green flex items-center gap-1 transition-colors"
          >
            <Plus size={12} /> Ajouter une charge fixe
          </button>
        </div>
      </QuestionCard>

      {totalFixed > 0 && (
        <div className="p-3 bg-green/5 border border-green/15 rounded-xl">
          <p className="text-sm font-sans font-semibold text-green">
            Charges fixes totales : {Math.round(totalFixed).toLocaleString("fr-FR")} EUR / mois
          </p>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-full font-sans text-sm font-medium text-muted border border-border hover:border-fg hover:text-fg transition-all"
        >
          Retour
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-3 rounded-full font-sans text-sm font-semibold text-white transition-all"
          style={{ background: "#1cb785" }}
        >
          Continuer
        </button>
      </div>
    </div>
  );
}
