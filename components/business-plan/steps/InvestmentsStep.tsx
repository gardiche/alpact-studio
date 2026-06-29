"use client";

import { Plus, Trash2 } from "lucide-react";
import { useBusinessPlanStore } from "@/lib/store/useBusinessPlanStore";
import { QuestionCard } from "../QuestionCard";
import type { InvestmentForm, InvestmentCategory } from "@/types/business-plan";
import { INVESTMENT_AMORTIZATION_YEARS } from "@/types/business-plan";

const CATEGORY_LABELS: Record<InvestmentCategory, string> = {
  software_dev: "Developpement logiciel",
  hardware: "Materiel informatique",
  design_branding: "Design / branding",
  infrastructure: "Infrastructure technique",
  office_furniture: "Mobilier / amenagement",
  deposit: "Depot de garantie",
  establishment_fees: "Frais d'etablissement",
  trademark_patent: "Marque / brevet",
  other: "Autre",
};

const QUICK_ADD: { category: InvestmentCategory; label: string; hint: string }[] = [
  { category: "software_dev", label: "Dev produit (MVP)", hint: "Cout de developpement initial" },
  { category: "hardware", label: "Ordinateurs / ecrans", hint: "Equipement de l'equipe" },
  { category: "design_branding", label: "Identite visuelle", hint: "Logo, charte, site vitrine" },
  { category: "infrastructure", label: "Serveurs / cloud", hint: "Setup initial infrastructure" },
  { category: "office_furniture", label: "Mobilier bureau", hint: "Bureaux, chaises, ecrans" },
  { category: "deposit", label: "Depot de garantie", hint: "Caution local commercial" },
  { category: "establishment_fees", label: "Frais de creation", hint: "Greffe, statuts, comptable" },
  { category: "trademark_patent", label: "Depot de marque", hint: "INPI, brevet, protection" },
];

function newInvestment(category: InvestmentCategory = "other"): InvestmentForm {
  return {
    id: crypto.randomUUID(),
    category,
    label: "",
    amount_ht: null,
    month: 1,
    amortization_years: INVESTMENT_AMORTIZATION_YEARS[category],
    source: "user_input",
  };
}

interface InvestmentsStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function InvestmentsStep({ onNext, onBack }: InvestmentsStepProps) {
  const { investments, addInvestment, updateInvestment, removeInvestment, markBlockComplete } =
    useBusinessPlanStore();

  const totalInvestments = investments.reduce((s, inv) => s + (inv.amount_ht ?? 0), 0);

  function handleQuickAdd(item: (typeof QUICK_ADD)[number]) {
    const exists = investments.some(
      (inv) => inv.category === item.category && inv.label === item.label
    );
    if (exists) return;
    addInvestment({
      ...newInvestment(item.category),
      label: item.label,
    });
  }

  function handleCategoryChange(id: string, category: InvestmentCategory) {
    updateInvestment(id, {
      category,
      amortization_years: INVESTMENT_AMORTIZATION_YEARS[category],
    });
  }

  function handleNext() {
    markBlockComplete(5);
    onNext();
  }

  return (
    <div className="space-y-5">
      <QuestionCard
        question="Quels investissements pour demarrer ?"
        hint="Liste tout ce que tu dois acheter ou financer avant de generer du chiffre d'affaires. Ces montants seront amortis sur la duree adaptee."
      >
        <div className="flex flex-wrap gap-2 mb-4">
          {QUICK_ADD.map((item) => {
            const added = investments.some(
              (inv) => inv.category === item.category && inv.label === item.label
            );
            return (
              <button
                key={item.label}
                onClick={() => handleQuickAdd(item)}
                title={item.hint}
                className={`px-3 py-1.5 rounded-full text-xs font-sans font-medium border transition-all ${
                  added
                    ? "bg-green/10 text-green border-green/20 cursor-default"
                    : "bg-beige text-muted border-border hover:border-green/40 hover:text-green"
                }`}
              >
                {added ? "OK " : "+ "}
                {item.label}
              </button>
            );
          })}
        </div>

        {investments.length > 0 && (
          <div className="space-y-2">
            {investments.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center gap-2 p-2 rounded-xl bg-bg border border-border"
              >
                <select
                  value={inv.category}
                  onChange={(e) =>
                    handleCategoryChange(inv.id, e.target.value as InvestmentCategory)
                  }
                  className="px-2 py-2 rounded-lg font-sans text-xs text-fg bg-surface border border-border focus:outline-none min-w-[130px]"
                >
                  {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={inv.label}
                  onChange={(e) => updateInvestment(inv.id, { label: e.target.value })}
                  placeholder="Description"
                  className="flex-1 px-3 py-2 rounded-lg font-sans text-xs text-fg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-green/20"
                />

                <div className="relative">
                  <input
                    type="number"
                    value={inv.amount_ht ?? ""}
                    onChange={(e) =>
                      updateInvestment(inv.id, {
                        amount_ht: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    placeholder="0"
                    className="w-24 pl-2 pr-7 py-2 rounded-lg font-sans text-xs text-fg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-green/20"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted">
                    HT
                  </span>
                </div>

                <select
                  value={inv.month}
                  onChange={(e) => updateInvestment(inv.id, { month: Number(e.target.value) })}
                  className="px-2 py-2 rounded-lg font-sans text-xs text-fg bg-surface border border-border focus:outline-none w-16"
                  title="Mois de l'investissement"
                >
                  {Array.from({ length: 36 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      M{i + 1}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-1">
                  <select
                    value={inv.amortization_years}
                    onChange={(e) =>
                      updateInvestment(inv.id, { amortization_years: Number(e.target.value) })
                    }
                    className="px-1 py-2 rounded-lg font-sans text-[10px] text-fg bg-surface border border-border focus:outline-none w-14"
                    title="Duree d'amortissement"
                  >
                    <option value={0}>-</option>
                    <option value={1}>1 an</option>
                    <option value={2}>2 ans</option>
                    <option value={3}>3 ans</option>
                    <option value={5}>5 ans</option>
                    <option value={7}>7 ans</option>
                    <option value={10}>10 ans</option>
                  </select>
                </div>

                <button
                  onClick={() => removeInvestment(inv.id)}
                  className="text-muted hover:text-red transition-colors flex-shrink-0"
                  aria-label="Supprimer"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => addInvestment(newInvestment())}
          className="text-xs font-sans text-muted hover:text-green flex items-center gap-1 mt-3 transition-colors"
        >
          <Plus size={12} /> Ajouter un investissement
        </button>
      </QuestionCard>

      {totalInvestments > 0 && (
        <div className="p-3 bg-green/5 border border-green/15 rounded-xl">
          <p className="text-sm font-sans font-semibold text-green">
            Investissements totaux : {Math.round(totalInvestments).toLocaleString("fr-FR")} EUR HT
          </p>
          <p className="text-xs font-sans text-muted mt-0.5">
            {investments.length} poste{investments.length > 1 ? "s" : ""} —
            amortis sur le plan de financement
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
