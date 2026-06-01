"use client";

import { Plus, Trash2 } from "lucide-react";
import { useBusinessPlanStore } from "@/lib/store/useBusinessPlanStore";
import { QuestionCard } from "../QuestionCard";

interface TreasuryStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function TreasuryStep({ onNext, onBack }: TreasuryStepProps) {
  const { treasury, setTreasury, markBlockComplete } = useBusinessPlanStore();

  function handleNext() {
    markBlockComplete(5);
    onNext();
  }

  const canProceed = treasury.cash_balance !== null;

  return (
    <div className="space-y-5">
      {/* Cash balance */}
      <QuestionCard
        question="Combien tu as en banque aujourd'hui ?"
        hint="Le solde cumulé de tous tes comptes professionnels. C'est le point de départ du plan de trésorerie."
      >
        <div className="relative w-40">
          <input
            type="number"
            value={treasury.cash_balance ?? ""}
            onChange={(e) =>
              setTreasury({ cash_balance: e.target.value !== "" ? Number(e.target.value) : null })
            }
            placeholder="0"
            className="w-full pl-3 pr-7 py-3 rounded-xl font-sans text-sm text-fg bg-bg border border-border focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green transition-all"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">€</span>
        </div>
      </QuestionCard>

      {/* Fundraising */}
      <QuestionCard question="Tu as levé des fonds ? Ou tu prévois une levée ?">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted mb-1.5">Montant levé ou prévu</p>
            <div className="relative">
              <input
                type="number"
                value={treasury.fundraising_amount ?? ""}
                onChange={(e) =>
                  setTreasury({ fundraising_amount: e.target.value ? Number(e.target.value) : null })
                }
                placeholder="Facultatif"
                className="w-full pl-3 pr-7 py-2 rounded-xl text-sm font-sans text-fg bg-bg border border-border focus:outline-none focus:ring-2 focus:ring-green/20"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted">€</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted mb-1.5">Date (réelle ou prévue)</p>
            <input
              type="date"
              value={treasury.fundraising_date ?? ""}
              onChange={(e) => setTreasury({ fundraising_date: e.target.value || null })}
              className="w-full px-3 py-2 rounded-xl text-sm font-sans text-fg bg-bg border border-border focus:outline-none focus:ring-2 focus:ring-green/20"
            />
          </div>
        </div>
      </QuestionCard>

      {/* Loans */}
      <QuestionCard question="Des prêts en cours ? (BPI, bancaire, prêt d'honneur…)">
        <div className="space-y-2">
          {treasury.outstanding_loans.map((loan, i) => (
            <div key={i} className="bg-bg rounded-xl p-3 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <select
                  value={loan.type}
                  onChange={(e) => {
                    const loans = [...treasury.outstanding_loans];
                    loans[i] = { ...loans[i], type: e.target.value };
                    setTreasury({ outstanding_loans: loans });
                  }}
                  className="flex-1 px-2 py-1.5 rounded-lg text-xs font-sans text-fg bg-surface border border-border focus:outline-none"
                >
                  <option value="bpi">BPI</option>
                  <option value="bank">Prêt bancaire</option>
                  <option value="honor">Prêt d'honneur</option>
                  <option value="other">Autre</option>
                </select>
                <button
                  onClick={() => {
                    const loans = treasury.outstanding_loans.filter((_, j) => j !== i);
                    setTreasury({ outstanding_loans: loans });
                  }}
                  className="ml-2 text-muted hover:text-red transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: "amount", label: "Capital restant", suffix: "€" },
                  { key: "monthly_payment", label: "Mensualité", suffix: "€/mois" },
                  { key: "remaining_months", label: "Mois restants", suffix: "mois" },
                ].map(({ key, label, suffix }) => (
                  <div key={key}>
                    <p className="text-[10px] text-muted mb-1">{label}</p>
                    <div className="relative">
                      <input
                        type="number"
                        value={(loan as Record<string, number | string>)[key] ?? ""}
                        onChange={(e) => {
                          const loans = [...treasury.outstanding_loans];
                          loans[i] = { ...loans[i], [key]: Number(e.target.value) };
                          setTreasury({ outstanding_loans: loans });
                        }}
                        placeholder="0"
                        className="w-full pl-2 pr-1 py-1.5 rounded-lg text-xs font-sans text-fg bg-surface border border-border focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button
            onClick={() =>
              setTreasury({
                outstanding_loans: [
                  ...treasury.outstanding_loans,
                  { type: "bpi", amount: 0, monthly_payment: 0, remaining_months: 0 },
                ],
              })
            }
            className="text-xs font-sans text-muted hover:text-green flex items-center gap-1 transition-colors"
          >
            <Plus size={12} /> Ajouter un prêt
          </button>
        </div>
      </QuestionCard>

      {/* Grants + receivables */}
      <QuestionCard question="D'autres éléments financiers à intégrer ?">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="text-xs text-muted w-36 flex-shrink-0">Subventions en attente</label>
            <div className="relative">
              <input
                type="number"
                value={treasury.pending_grants ?? ""}
                onChange={(e) => setTreasury({ pending_grants: Number(e.target.value) || null })}
                placeholder="0"
                className="w-32 pl-3 pr-7 py-2 rounded-lg text-sm font-sans text-fg bg-bg border border-border focus:outline-none focus:ring-2 focus:ring-green/20"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted">€</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-muted w-36 flex-shrink-0">Factures clients en attente</label>
            <div className="relative">
              <input
                type="number"
                value={treasury.accounts_receivable ?? ""}
                onChange={(e) => setTreasury({ accounts_receivable: Number(e.target.value) || null })}
                placeholder="0"
                className="w-32 pl-3 pr-7 py-2 rounded-lg text-sm font-sans text-fg bg-bg border border-border focus:outline-none focus:ring-2 focus:ring-green/20"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted">€</span>
            </div>
          </div>
        </div>
      </QuestionCard>

      {/* Payment delays */}
      <QuestionCard
        question="Délais de paiement"
        hint="Ces délais impactent directement ton plan de trésorerie."
      >
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-xs text-muted mb-1.5">Tes clients te paient en combien de jours ?</p>
            <div className="flex gap-2">
              {[0, 15, 30, 45, 60].map((d) => (
                <button
                  key={d}
                  onClick={() => setTreasury({ payment_delay_clients_days: d })}
                  className={`px-3 py-1.5 rounded-full text-xs font-sans font-medium border transition-all ${
                    treasury.payment_delay_clients_days === d
                      ? "bg-green text-white border-green"
                      : "bg-beige text-fg border-border hover:border-green/40"
                  }`}
                >
                  {d === 0 ? "Immédiat" : `J+${d}`}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted mb-1.5">Tu paies tes fournisseurs en combien de jours ?</p>
            <div className="flex gap-2">
              {[0, 15, 30, 45, 60].map((d) => (
                <button
                  key={d}
                  onClick={() => setTreasury({ payment_delay_suppliers_days: d })}
                  className={`px-3 py-1.5 rounded-full text-xs font-sans font-medium border transition-all ${
                    treasury.payment_delay_suppliers_days === d
                      ? "bg-green text-white border-green"
                      : "bg-beige text-fg border-border hover:border-green/40"
                  }`}
                >
                  {d === 0 ? "Immédiat" : `J+${d}`}
                </button>
              ))}
            </div>
          </div>
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
