"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBusinessPlanStore } from "@/lib/store/useBusinessPlanStore";
import { WizardProgress } from "./WizardProgress";
import { ActivityStep } from "./steps/ActivityStep";
import { GrowthStep } from "./steps/GrowthStep";
import { TeamStep } from "./steps/TeamStep";
import { FixedCostsStep } from "./steps/FixedCostsStep";
import { VariableCostsStep } from "./steps/VariableCostsStep";
import { TreasuryStep } from "./steps/TreasuryStep";
import { ContextStep } from "./steps/ContextStep";
import { ReviewStep } from "./steps/ReviewStep";
import type { Scenario } from "@/types/business-plan";
import { calculateProjections } from "@/lib/business-plan/engine/calculateProjections";
import type { ProjectData } from "@/types/business-plan";

const BLOCK_LABELS = [
  "Ton activité",
  "Ta croissance",
  "Ton équipe",
  "Dépenses fixes",
  "Dépenses variables",
  "Ta trésorerie",
  "Contexte",
];

export function BusinessPlanWizard() {
  const router = useRouter();
  const { currentBlock, completedBlocks, goToBlock, ...store } = useBusinessPlanStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const isReview = currentBlock === 7;

  function buildProjectData(): ProjectData {
    const now = new Date().toISOString();
    const today = new Date().toISOString().split("T")[0];

    const project = {
      id: store.projectId ?? "demo",
      user_id: "demo",
      name: store.projectName || "Mon projet",
      description: store.projectDescription,
      business_type: store.businessType,
      stage: store.stage,
      country: "FR",
      currency: "EUR",
      created_at: now,
      updated_at: now,
    };

    return {
      project,
      revenueLines: store.revenueLines.map((l) => ({
        ...l,
        project_id: project.id,
        unit_price: l.unit_price ?? 0,
        current_volume: l.current_volume ?? 0,
        created_at: now,
        updated_at: now,
      })),
      growthHypotheses: store.growthHypotheses.map((h) => ({
        ...h,
        monthly_new_customers: h.monthly_new_customers ?? 0,
        growth_model: h.growth_model,
        churn_rate_monthly: h.churn_rate_monthly ?? undefined,
        target_revenue_12m: h.target_revenue_12m ?? undefined,
        created_at: now,
        updated_at: now,
      })),
      teamMembers: store.teamMembers.map((m) => ({
        ...m,
        project_id: project.id,
        start_date: m.start_date || today,
        net_salary_monthly: m.net_salary_monthly ?? undefined,
        total_cost_monthly: undefined,
        created_at: now,
        updated_at: now,
      })),
      fixedCosts: store.fixedCosts.map((c) => ({
        ...c,
        project_id: project.id,
        amount_monthly: c.amount_monthly ?? 0,
        created_at: now,
        updated_at: now,
      })),
      variableCosts: store.variableCosts.map((c) => ({
        ...c,
        project_id: project.id,
        current_amount_monthly: c.current_amount_monthly ?? undefined,
        unit_cost: c.unit_cost ?? undefined,
        percentage: c.percentage ?? undefined,
        projected_amount_12m: c.projected_amount_12m ?? undefined,
        created_at: now,
        updated_at: now,
      })),
      treasury: {
        id: "t1",
        project_id: project.id,
        cash_balance: store.treasury.cash_balance ?? 0,
        fundraising_amount: store.treasury.fundraising_amount ?? undefined,
        fundraising_date: store.treasury.fundraising_date ?? undefined,
        outstanding_loans: store.treasury.outstanding_loans,
        pending_grants: store.treasury.pending_grants ?? undefined,
        accounts_receivable: store.treasury.accounts_receivable ?? undefined,
        payment_delay_clients_days: store.treasury.payment_delay_clients_days,
        payment_delay_suppliers_days: store.treasury.payment_delay_suppliers_days,
        source: store.treasury.source,
        created_at: now,
        updated_at: now,
      },
      bpContext: {
        id: "ctx1",
        project_id: project.id,
        target_audience: store.bpContext.target_audience,
        funding_amount_requested: store.bpContext.funding_amount_requested ?? undefined,
        funding_usage: store.bpContext.funding_usage || undefined,
        deadline: store.bpContext.deadline ?? undefined,
        market_context: store.bpContext.market_context || undefined,
        competitive_advantage: store.bpContext.competitive_advantage || undefined,
        team_narrative: store.bpContext.team_narrative || undefined,
        created_at: now,
        updated_at: now,
      },
    };
  }

  async function handleGenerate(scenario: Scenario) {
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const projectData = buildProjectData();
      const projections = calculateProjections(projectData, scenario);

      const res = await fetch("/api/business-plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectData, projections, scenario }),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}${errorText ? ` — ${errorText}` : ""}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("Pas de stream");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.done && parsed.bpId) {
              // Store BP in localStorage for demo mode
              const existing = JSON.parse(localStorage.getItem("alpact_business_plans") ?? "[]");
              existing.unshift(parsed.bp);
              localStorage.setItem("alpact_business_plans", JSON.stringify(existing));
              router.push(`/elyse/business-plan/${parsed.bpId}`);
              return;
            }
          } catch {
            // streaming chunk, continue
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setGenerationError(`La génération a échoué : ${msg}`);
      setIsGenerating(false);
    }
  }

  function next() {
    goToBlock(Math.min(currentBlock + 1, 7));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    goToBlock(Math.max(currentBlock - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "#1cb78518" }}
          >
            <span className="text-lg">📋</span>
          </div>
          <div>
            <h1 className="font-serif text-2xl text-fg leading-tight">
              {isReview ? "Récapitulatif" : BLOCK_LABELS[currentBlock]}
            </h1>
            <p className="font-sans text-xs text-muted">
              {isReview ? "Vérifie les données avant de générer" : `Étape ${currentBlock + 1} / 7`}
            </p>
          </div>
        </div>

        <WizardProgress
          currentBlock={currentBlock}
          completedBlocks={completedBlocks}
          onBlockClick={goToBlock}
        />
      </div>

      {/* Step content */}
      <div className="animate-fade-in-up">
        {currentBlock === 0 && <ActivityStep onNext={next} />}
        {currentBlock === 1 && <GrowthStep onNext={next} onBack={back} />}
        {currentBlock === 2 && <TeamStep onNext={next} onBack={back} />}
        {currentBlock === 3 && <FixedCostsStep onNext={next} onBack={back} />}
        {currentBlock === 4 && <VariableCostsStep onNext={next} onBack={back} />}
        {currentBlock === 5 && <TreasuryStep onNext={next} onBack={back} />}
        {currentBlock === 6 && <ContextStep onNext={next} onBack={back} />}
        {currentBlock === 7 && (
          <ReviewStep onGenerate={handleGenerate} onBack={back} isGenerating={isGenerating} />
        )}
      </div>

      {generationError && (
        <div
          className="mt-4 px-4 py-3 rounded-xl border text-sm font-sans text-fg"
          style={{ background: "#ff4f3f08", borderColor: "#ff4f3f30" }}
        >
          {generationError}
        </div>
      )}
    </div>
  );
}
