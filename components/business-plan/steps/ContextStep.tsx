"use client";

import { useBusinessPlanStore } from "@/lib/store/useBusinessPlanStore";
import { QuestionCard } from "../QuestionCard";

const AUDIENCE_OPTIONS = [
  { value: "bank", label: "Banque", desc: "Prêt bancaire, ouverture de compte pro" },
  { value: "investor", label: "Investisseur", desc: "Business angels, VCs, fonds" },
  { value: "bpi", label: "BPI France", desc: "Subvention, prêt innovation, garantie" },
  { value: "partner", label: "Partenaire", desc: "Accord commercial, distribution" },
  { value: "internal", label: "Usage interne", desc: "Pilotage, CA, équipe" },
] as const;

interface ContextStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function ContextStep({ onNext, onBack }: ContextStepProps) {
  const { bpContext, setBpContext, markBlockComplete } = useBusinessPlanStore();

  function handleNext() {
    markBlockComplete(8);
    onNext();
  }

  const canProceed = !!bpContext.target_audience;

  return (
    <div className="space-y-5">
      {/* Audience */}
      <QuestionCard
        question="C'est pour qui ce business plan ?"
        hint="Le ton, les sections et les données mises en avant s'adaptent automatiquement."
      >
        <div className="grid grid-cols-1 gap-2">
          {AUDIENCE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setBpContext({ target_audience: opt.value })}
              className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${
                bpContext.target_audience === opt.value
                  ? "border-green bg-green/5"
                  : "border-border bg-bg hover:border-green/30"
              }`}
            >
              <div>
                <span className={`text-sm font-sans font-semibold ${bpContext.target_audience === opt.value ? "text-green" : "text-fg"}`}>
                  {opt.label}
                </span>
                <p className="text-xs text-muted">{opt.desc}</p>
              </div>
              {bpContext.target_audience === opt.value && (
                <span className="w-5 h-5 rounded-full bg-green flex items-center justify-center text-white text-xs flex-shrink-0">✓</span>
              )}
            </button>
          ))}
        </div>
      </QuestionCard>

      {/* Funding */}
      {bpContext.target_audience !== "internal" && (
        <QuestionCard question="Tu demandes combien, et pour quoi faire ?">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted w-24 flex-shrink-0">Montant demandé</span>
              <div className="relative">
                <input
                  type="number"
                  value={bpContext.funding_amount_requested ?? ""}
                  onChange={(e) =>
                    setBpContext({ funding_amount_requested: e.target.value ? Number(e.target.value) : null })
                  }
                  placeholder="Facultatif"
                  className="w-36 pl-3 pr-7 py-2 rounded-xl text-sm font-sans text-fg bg-bg border border-border focus:outline-none focus:ring-2 focus:ring-green/20"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted">€</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted mb-1.5">Utilisation prévue des fonds</p>
              <textarea
                value={bpContext.funding_usage}
                onChange={(e) => setBpContext({ funding_usage: e.target.value })}
                placeholder="Ex : 60% recrutement, 30% marketing, 10% R&D"
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl text-sm font-sans text-fg bg-bg border border-border focus:outline-none focus:ring-2 focus:ring-green/20 resize-none"
              />
            </div>
          </div>
        </QuestionCard>
      )}

      {/* Deadline */}
      <QuestionCard
        question="C'est pour quand ?"
        hint="Facultatif. Si tu as un RDV, on le mentionne dans l'introduction."
      >
        <input
          type="date"
          value={bpContext.deadline ?? ""}
          onChange={(e) => setBpContext({ deadline: e.target.value || null })}
          className="w-48 px-3 py-2 rounded-xl text-sm font-sans text-fg bg-bg border border-border focus:outline-none focus:ring-2 focus:ring-green/20"
        />
      </QuestionCard>

      {/* Qualitative context */}
      <QuestionCard
        question="Quelques éléments qualitatifs pour enrichir la narration"
        hint="Facultatif — mais plus tu en dis, plus le BP sera personnalisé."
      >
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-fg mb-1">Ton marché</p>
            <textarea
              value={bpContext.market_context}
              onChange={(e) => setBpContext({ market_context: e.target.value })}
              placeholder="Taille du marché, tendances, opportunité que tu adresses…"
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-sans text-fg bg-bg border border-border focus:outline-none focus:ring-2 focus:ring-green/20 resize-none"
            />
          </div>
          <div>
            <p className="text-xs font-medium text-fg mb-1">Ton avantage concurrentiel</p>
            <textarea
              value={bpContext.competitive_advantage}
              onChange={(e) => setBpContext({ competitive_advantage: e.target.value })}
              placeholder="Ce qui te différencie vraiment de la concurrence…"
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-sans text-fg bg-bg border border-border focus:outline-none focus:ring-2 focus:ring-green/20 resize-none"
            />
          </div>
          <div>
            <p className="text-xs font-medium text-fg mb-1">L'histoire de l'équipe</p>
            <textarea
              value={bpContext.team_narrative}
              onChange={(e) => setBpContext({ team_narrative: e.target.value })}
              placeholder="Pourquoi vous ? Quelle expertise, quelle expérience pertinente…"
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-sans text-fg bg-bg border border-border focus:outline-none focus:ring-2 focus:ring-green/20 resize-none"
            />
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
          Voir le récapitulatif →
        </button>
      </div>
    </div>
  );
}
