"use client";

import { useMemo, useState } from "react";
import { useBusinessPlanStore } from "@/lib/store/useBusinessPlanStore";
import { calculateProjections } from "@/lib/business-plan/engine/calculateProjections";
import type { ProjectData, Scenario } from "@/types/business-plan";
import { AlertCircle, CheckCircle, TrendingUp, Clock, DollarSign, Users } from "lucide-react";

const SCENARIO_OPTIONS: { value: Scenario; label: string; desc: string }[] = [
  { value: "conservative", label: "Conservateur", desc: "Croissance ×0.7, churn ×1.3, coûts ×1.15" },
  { value: "moderate", label: "Modéré", desc: "Base — tes hypothèses telles quelles" },
  { value: "aggressive", label: "Agressif", desc: "Croissance ×1.4, churn ×0.7, coûts ×0.9" },
];

function fmt(n: number | null | undefined, unit = "€") {
  if (n == null) return "—";
  return `${Math.round(n).toLocaleString("fr-FR")} ${unit}`;
}

interface ReviewStepProps {
  onGenerate: (scenario: Scenario) => void;
  onBack: () => void;
  isGenerating: boolean;
}

export function ReviewStep({ onGenerate, onBack, isGenerating }: ReviewStepProps) {
  const store = useBusinessPlanStore();
  const [scenario, setScenario] = useState<Scenario>("moderate");

  const projectData: ProjectData | null = useMemo(() => {
    if (store.revenueLines.length === 0) return null;

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

    const revenueLines = store.revenueLines.map((l) => ({
      ...l,
      project_id: project.id,
      unit_price: l.unit_price ?? 0,
      current_volume: l.current_volume ?? 0,
      created_at: now,
      updated_at: now,
    }));

    const growthHypotheses = store.growthHypotheses.map((h) => ({
      ...h,
      monthly_new_customers: h.monthly_new_customers ?? 0,
      growth_model: h.growth_model ?? "linear",
      churn_rate_monthly: h.churn_rate_monthly ?? undefined,
      target_revenue_12m: h.target_revenue_12m ?? undefined,
      created_at: now,
      updated_at: now,
    }));

    const teamMembers = store.teamMembers.map((m) => ({
      ...m,
      project_id: project.id,
      start_date: m.start_date || today,
      net_salary_monthly: m.net_salary_monthly ?? undefined,
      total_cost_monthly: undefined as number | undefined,
      created_at: now,
      updated_at: now,
    }));

    const fixedCosts = store.fixedCosts.map((c) => ({
      ...c,
      project_id: project.id,
      amount_monthly: c.amount_monthly ?? 0,
      created_at: now,
      updated_at: now,
    }));

    const variableCosts = store.variableCosts.map((c) => ({
      ...c,
      project_id: project.id,
      current_amount_monthly: c.current_amount_monthly ?? undefined,
      unit_cost: c.unit_cost ?? undefined,
      percentage: c.percentage ?? undefined,
      projected_amount_12m: c.projected_amount_12m ?? undefined,
      created_at: now,
      updated_at: now,
    }));

    const treasury = {
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
    };

    const bpContext = {
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
    };

    return { project, revenueLines, growthHypotheses, teamMembers, fixedCosts, variableCosts, treasury, bpContext };
  }, [store]);

  const projections = useMemo(() => {
    if (!projectData) return null;
    try {
      return calculateProjections(projectData, scenario);
    } catch {
      return null;
    }
  }, [projectData, scenario]);

  const completeness = store.getCompletenessScore();

  const alerts: string[] = [];
  if (store.revenueLines.length > 0 && store.variableCosts.length === 0 && store.fixedCosts.length === 0) {
    alerts.push("Tu n'as pas renseigné de charges — le modèle sera trop optimiste.");
  }
  if (projections?.indicators.runway !== null && (projections?.indicators.runway ?? 99) < 6) {
    alerts.push(`Runway critique : ${projections?.indicators.runway} mois dans ce scénario.`);
  }
  if (store.teamMembers.length === 0) {
    alerts.push("Aucun membre d'équipe renseigné — la masse salariale sera à zéro.");
  }

  return (
    <div className="space-y-6">
      {/* Completeness */}
      <div className="bg-surface rounded-card shadow-card p-5 border border-border">
        <div className="flex items-center justify-between mb-3">
          <p className="font-sans font-semibold text-sm text-fg">Score de complétude</p>
          <span
            className="text-lg font-serif"
            style={{ color: completeness >= 80 ? "#1cb785" : completeness >= 50 ? "#ff8f27" : "#ff4f3f" }}
          >
            {completeness}%
          </span>
        </div>
        <div className="h-2 bg-beige rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${completeness}%`,
              background: completeness >= 80 ? "#1cb785" : completeness >= 50 ? "#ff8f27" : "#ff4f3f",
            }}
          />
        </div>
        <p className="text-xs text-muted mt-2">
          {completeness < 50
            ? "Beaucoup de données manquantes — le BP sera générique."
            : completeness < 80
              ? "Données suffisantes pour un BP solide."
              : "Excellent niveau de détail — le BP sera très personnalisé."}
        </p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className="flex items-start gap-3 px-4 py-3 rounded-xl border"
              style={{ background: "#ff8f2708", borderColor: "#ff8f2730" }}
            >
              <AlertCircle size={15} style={{ color: "#ff8f27" }} className="flex-shrink-0 mt-0.5" />
              <p className="text-sm font-sans text-fg">{alert}</p>
            </div>
          ))}
        </div>
      )}

      {/* Scenario picker */}
      <div className="bg-surface rounded-card shadow-card p-5 border border-border">
        <p className="font-sans font-semibold text-sm text-fg mb-3">Scénario de projection</p>
        <div className="grid grid-cols-3 gap-3">
          {SCENARIO_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => setScenario(s.value)}
              className={`p-3 rounded-xl border text-left transition-all ${
                scenario === s.value
                  ? "border-green bg-green/5"
                  : "border-border bg-bg hover:border-green/30"
              }`}
            >
              <p className={`text-sm font-sans font-semibold ${scenario === s.value ? "text-green" : "text-fg"}`}>
                {s.label}
              </p>
              <p className="text-[10px] text-muted mt-0.5 leading-relaxed">{s.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Key indicators */}
      {projections && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface rounded-card shadow-card p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={15} className="text-muted" />
              <p className="text-xs font-sans text-muted uppercase tracking-wide">Runway</p>
            </div>
            <p
              className="font-serif text-2xl"
              style={{
                color:
                  projections.indicators.runway === null
                    ? "#1cb785"
                    : projections.indicators.runway < 6
                      ? "#ff4f3f"
                      : projections.indicators.runway < 12
                        ? "#ff8f27"
                        : "#1cb785",
              }}
            >
              {projections.indicators.runway === null
                ? "+36 mois"
                : `${projections.indicators.runway} mois`}
            </p>
          </div>

          <div className="bg-surface rounded-card shadow-card p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={15} className="text-muted" />
              <p className="text-xs font-sans text-muted uppercase tracking-wide">Break-even</p>
            </div>
            <p className="font-serif text-2xl text-fg">
              {projections.indicators.breakEvenMonth === null
                ? "Non atteint"
                : `Mois ${projections.indicators.breakEvenMonth}`}
            </p>
          </div>

          <div className="bg-surface rounded-card shadow-card p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={15} className="text-muted" />
              <p className="text-xs font-sans text-muted uppercase tracking-wide">MRR actuel</p>
            </div>
            <p className="font-serif text-2xl text-fg">
              {fmt(projections.indicators.mrr)}
            </p>
          </div>

          <div className="bg-surface rounded-card shadow-card p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={15} className="text-muted" />
              <p className="text-xs font-sans text-muted uppercase tracking-wide">CA Année 1</p>
            </div>
            <p className="font-serif text-2xl text-fg">
              {fmt(projections.pnl.slice(0, 12).reduce((s, m) => s + m.revenue, 0))}
            </p>
          </div>

          {projections.indicators.ltv && (
            <div className="bg-surface rounded-card shadow-card p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Users size={15} className="text-muted" />
                <p className="text-xs font-sans text-muted uppercase tracking-wide">LTV</p>
              </div>
              <p className="font-serif text-2xl text-fg">{fmt(projections.indicators.ltv)}</p>
            </div>
          )}

          <div className="bg-surface rounded-card shadow-card p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={15} className="text-muted" />
              <p className="text-xs font-sans text-muted uppercase tracking-wide">EBITDA Mois 36</p>
            </div>
            <p
              className="font-serif text-2xl"
              style={{ color: (projections.pnl[35]?.ebitda ?? 0) >= 0 ? "#1cb785" : "#ff4f3f" }}
            >
              {fmt(projections.pnl[35]?.ebitda)}
            </p>
          </div>
        </div>
      )}

      {/* Summary of inputs */}
      <div className="bg-surface rounded-card shadow-card p-5 border border-border space-y-3">
        <p className="font-sans font-semibold text-sm text-fg">Récapitulatif des données</p>
        {[
          { icon: "📊", label: "Offres", value: `${store.revenueLines.length} ligne(s) de revenu` },
          { icon: "👥", label: "Équipe", value: `${store.teamMembers.length} profil(s)` },
          { icon: "🏢", label: "Charges fixes", value: `${store.fixedCosts.length} poste(s)` },
          { icon: "📈", label: "Charges variables", value: `${store.variableCosts.length} poste(s)` },
          {
            icon: "💰",
            label: "Trésorerie initiale",
            value: store.treasury.cash_balance != null ? fmt(store.treasury.cash_balance) : "Non renseignée",
          },
          { icon: "🎯", label: "Destinataire", value: store.bpContext.target_audience ?? "Non défini" },
        ].map(({ icon, label, value }) => (
          <div key={label} className="flex items-center justify-between text-sm">
            <span className="font-sans text-muted">
              {icon} {label}
            </span>
            <span className="font-sans font-medium text-fg">{value}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-full font-sans text-sm font-medium text-muted border border-border hover:border-fg hover:text-fg transition-all"
        >
          ← Retour
        </button>
        <button
          onClick={() => onGenerate(scenario)}
          disabled={isGenerating || store.revenueLines.length === 0}
          className="flex items-center gap-2 px-6 py-3 rounded-full font-sans text-sm font-semibold text-white transition-all disabled:opacity-40"
          style={{ background: "#1cb785" }}
        >
          {isGenerating ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Génération en cours…
            </>
          ) : (
            "Générer le business plan →"
          )}
        </button>
      </div>
    </div>
  );
}
