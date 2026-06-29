"use client";

import { Plus, Trash2 } from "lucide-react";
import { useBusinessPlanStore } from "@/lib/store/useBusinessPlanStore";
import { QuestionCard } from "../QuestionCard";
import type { SubsidyForm } from "@/types/business-plan";

interface FinancingStepProps {
  onNext: () => void;
  onBack: () => void;
}

function moneyInput(value: number | null, onChange: (value: number | null) => void, placeholder = "0") {
  return (
    <div className="relative">
      <input
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        placeholder={placeholder}
        className="w-full pl-3 pr-7 py-2.5 rounded-xl text-sm font-sans text-fg bg-bg border border-border focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green"
      />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted">EUR</span>
    </div>
  );
}

function newSubsidy(): SubsidyForm {
  return {
    id: crypto.randomUUID(),
    name: "",
    amount: null,
    expected_date: null,
  };
}

export function FinancingStep({ onNext, onBack }: FinancingStepProps) {
  const { bpContext, setBpContext, subsidies, addSubsidy, updateSubsidy, removeSubsidy, investments, markBlockComplete } = useBusinessPlanStore();

  function handleNext() {
    markBlockComplete(7);
    onNext();
  }

  const requested = bpContext.funding_amount_requested ?? bpContext.bank_loan_amount ?? 0;
  const ownResources =
    (bpContext.founder_contribution ?? 0) +
    (bpContext.capital_social ?? 0) +
    (bpContext.associate_current_account ?? 0);
  const totalInvestments = (investments ?? []).reduce((s, inv) => s + (inv.amount_ht ?? 0), 0);
  const uses = totalInvestments + (bpContext.working_capital_buffer ?? 0);
  const totalSubsidies = (subsidies ?? []).reduce((s, sub) => s + (sub.amount ?? 0), 0);

  return (
    <div className="space-y-5">
      <QuestionCard
        question="Quel financement veux-tu defendre ?"
        hint="Une banque veut comprendre le montant, la duree, le taux attendu et le niveau d'apport des fondateurs."
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted mb-1.5">Montant demande</p>
            {moneyInput(bpContext.funding_amount_requested, (v) =>
              setBpContext({ funding_amount_requested: v, bank_loan_amount: v })
            )}
          </div>
          <div>
            <p className="text-xs text-muted mb-1.5">Pret bancaire retenu</p>
            {moneyInput(bpContext.bank_loan_amount, (v) => setBpContext({ bank_loan_amount: v }))}
          </div>
          <div>
            <p className="text-xs text-muted mb-1.5">Duree du pret</p>
            <select
              value={bpContext.loan_duration_months ?? 60}
              onChange={(e) => setBpContext({ loan_duration_months: Number(e.target.value) })}
              className="w-full px-3 py-2.5 rounded-xl text-sm font-sans text-fg bg-bg border border-border focus:outline-none focus:ring-2 focus:ring-green/20"
            >
              <option value={36}>36 mois</option>
              <option value={48}>48 mois</option>
              <option value={60}>60 mois</option>
              <option value={72}>72 mois</option>
              <option value={84}>84 mois</option>
            </select>
          </div>
          <div>
            <p className="text-xs text-muted mb-1.5">Taux annuel estime</p>
            <div className="relative">
              <input
                type="number"
                value={bpContext.annual_interest_rate ?? ""}
                onChange={(e) => setBpContext({ annual_interest_rate: e.target.value ? Number(e.target.value) : null })}
                className="w-full pl-3 pr-7 py-2.5 rounded-xl text-sm font-sans text-fg bg-bg border border-border focus:outline-none focus:ring-2 focus:ring-green/20"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted">%</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted mb-1.5">Differe de remboursement</p>
            <select
              value={bpContext.deferment_months ?? 0}
              onChange={(e) => setBpContext({ deferment_months: Number(e.target.value) })}
              className="w-full px-3 py-2.5 rounded-xl text-sm font-sans text-fg bg-bg border border-border focus:outline-none focus:ring-2 focus:ring-green/20"
            >
              <option value={0}>Aucun</option>
              <option value={3}>3 mois</option>
              <option value={6}>6 mois</option>
              <option value={12}>12 mois</option>
            </select>
          </div>
          <div>
            <p className="text-xs text-muted mb-1.5">TVA applicable</p>
            <select
              value={bpContext.vat_rate ?? 20}
              onChange={(e) => setBpContext({ vat_rate: Number(e.target.value) })}
              className="w-full px-3 py-2.5 rounded-xl text-sm font-sans text-fg bg-bg border border-border focus:outline-none focus:ring-2 focus:ring-green/20"
            >
              <option value={0}>0%</option>
              <option value={5.5}>5,5%</option>
              <option value={10}>10%</option>
              <option value={20}>20%</option>
            </select>
          </div>
        </div>
      </QuestionCard>

      <QuestionCard
        question="Quelles ressources mets-tu en face ?"
        hint="Plus l'apport est clair, plus le dossier est credible pour une banque."
      >
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-xs text-muted mb-1.5">Apport fondateurs</p>
            {moneyInput(bpContext.founder_contribution, (v) => setBpContext({ founder_contribution: v }))}
          </div>
          <div>
            <p className="text-xs text-muted mb-1.5">Capital social</p>
            {moneyInput(bpContext.capital_social, (v) => setBpContext({ capital_social: v }))}
          </div>
          <div>
            <p className="text-xs text-muted mb-1.5">Compte courant</p>
            {moneyInput(bpContext.associate_current_account, (v) => setBpContext({ associate_current_account: v }))}
          </div>
        </div>
      </QuestionCard>

      <QuestionCard
        question="Subventions et aides attendues ?"
        hint="BPI, France Num, pret d'honneur, ACRE... Ajoute chaque aide avec son montant et la date a laquelle tu l'attends."
      >
        {subsidies.length > 0 && (
          <div className="space-y-2 mb-3">
            {subsidies.map((sub) => (
              <div key={sub.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={sub.name}
                  onChange={(e) => updateSubsidy(sub.id, { name: e.target.value })}
                  placeholder="Nom de l'aide"
                  className="flex-1 px-3 py-2 rounded-lg font-sans text-xs text-fg bg-bg border border-border focus:outline-none focus:ring-2 focus:ring-green/20"
                />
                <div className="relative">
                  <input
                    type="number"
                    value={sub.amount ?? ""}
                    onChange={(e) => updateSubsidy(sub.id, { amount: e.target.value ? Number(e.target.value) : null })}
                    placeholder="0"
                    className="w-24 pl-2 pr-7 py-2 rounded-lg font-sans text-xs text-fg bg-bg border border-border focus:outline-none focus:ring-2 focus:ring-green/20"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted">EUR</span>
                </div>
                <input
                  type="date"
                  value={sub.expected_date ?? ""}
                  onChange={(e) => updateSubsidy(sub.id, { expected_date: e.target.value || null })}
                  className="px-2 py-2 rounded-lg font-sans text-xs text-fg bg-bg border border-border focus:outline-none"
                />
                <button
                  onClick={() => removeSubsidy(sub.id)}
                  className="text-muted hover:text-red transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => addSubsidy(newSubsidy())}
          className="text-xs font-sans text-muted hover:text-green flex items-center gap-1 transition-colors"
        >
          <Plus size={12} /> Ajouter une aide
        </button>
      </QuestionCard>

      <QuestionCard
        question="Coussin de securite"
        hint="Le coussin BFR couvre les decalages de tresorerie des premiers mois."
      >
        <div className="grid grid-cols-1 gap-3">
          <div>
            <p className="text-xs text-muted mb-1.5">Coussin BFR / securite</p>
            {moneyInput(bpContext.working_capital_buffer, (v) => setBpContext({ working_capital_buffer: v }))}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-bg border border-border p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted">Ressources</p>
            <p className="font-serif text-lg text-fg">{Math.round(ownResources + requested + totalSubsidies).toLocaleString("fr-FR")} EUR</p>
            <p className="text-[10px] text-muted mt-0.5">
              Apports {Math.round(ownResources).toLocaleString("fr-FR")} + Pret {Math.round(requested).toLocaleString("fr-FR")}
              {totalSubsidies > 0 ? ` + Aides ${Math.round(totalSubsidies).toLocaleString("fr-FR")}` : ""}
            </p>
          </div>
          <div className="rounded-xl bg-bg border border-border p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted">Emplois</p>
            <p className="font-serif text-lg text-fg">{Math.round(uses).toLocaleString("fr-FR")} EUR</p>
            <p className="text-[10px] text-muted mt-0.5">
              Invest. {Math.round(totalInvestments).toLocaleString("fr-FR")} + BFR {Math.round(bpContext.working_capital_buffer ?? 0).toLocaleString("fr-FR")}
            </p>
          </div>
        </div>
      </QuestionCard>

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

