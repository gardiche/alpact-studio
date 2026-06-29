"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle, Clock, DollarSign, ShieldCheck, TrendingUp, Wallet } from "lucide-react";
import { useBusinessPlanStore } from "@/lib/store/useBusinessPlanStore";
import { calculateProjections } from "@/lib/business-plan/engine/calculateProjections";
import type { ProjectData, Scenario } from "@/types/business-plan";

const SCENARIO_OPTIONS: { value: Scenario; label: string; desc: string }[] = [
  { value: "conservative", label: "Conservateur", desc: "Croissance x0.7, churn x1.3, couts x1.15" },
  { value: "moderate", label: "Modere", desc: "Hypotheses saisies sans stress test" },
  { value: "aggressive", label: "Agressif", desc: "Croissance x1.4, churn x0.7, couts x0.9" },
];

function fmt(n: number | null | undefined, unit = "EUR") {
  if (n == null || Number.isNaN(n)) return "-";
  return `${Math.round(n).toLocaleString("fr-FR")} ${unit}`;
}

function pct(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "-";
  return `${n.toFixed(2)}x`;
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
      is_created: store.isCreated ?? false,
      legal_form: store.legalForm ?? undefined,
      start_date: store.startDate ?? undefined,
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
        growth_model: h.growth_model ?? "linear",
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
      investments: (store.investments ?? []).map((inv) => ({
        ...inv,
        project_id: project.id,
        amount_ht: inv.amount_ht ?? 0,
        created_at: now,
        updated_at: now,
      })),
      subsidies: (store.subsidies ?? []).map((sub) => ({
        ...sub,
        project_id: project.id,
        amount: sub.amount ?? 0,
        expected_date: sub.expected_date ?? "",
        source: "user_input" as const,
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
        founder_contribution: store.bpContext.founder_contribution ?? undefined,
        capital_social: store.bpContext.capital_social ?? undefined,
        associate_current_account: store.bpContext.associate_current_account ?? undefined,
        bank_loan_amount: store.bpContext.bank_loan_amount ?? undefined,
        loan_duration_months: store.bpContext.loan_duration_months ?? undefined,
        annual_interest_rate: store.bpContext.annual_interest_rate ?? undefined,
        deferment_months: store.bpContext.deferment_months ?? undefined,
        working_capital_buffer: store.bpContext.working_capital_buffer ?? undefined,
        vat_rate: store.bpContext.vat_rate ?? undefined,
        deadline: store.bpContext.deadline ?? undefined,
        market_context: store.bpContext.market_context || undefined,
        competitive_advantage: store.bpContext.competitive_advantage || undefined,
        team_narrative: store.bpContext.team_narrative || undefined,
        created_at: now,
        updated_at: now,
      },
    };
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
  const year1Revenue = projections?.pnl.slice(0, 12).reduce((s, m) => s + m.revenue, 0) ?? 0;
  const year2Revenue = projections?.pnl.slice(12, 24).reduce((s, m) => s + m.revenue, 0) ?? 0;
  const year3Revenue = projections?.pnl.slice(24, 36).reduce((s, m) => s + m.revenue, 0) ?? 0;
  const year3Ebitda = projections?.pnl.slice(24, 36).reduce((s, m) => s + m.ebitda, 0) ?? 0;

  const blockingIssues: string[] = [];
  const alerts: string[] = [];

  if (store.revenueLines.length === 0) blockingIssues.push("Ajoute au moins une ligne de revenu.");
  if (store.treasury.cash_balance === null) blockingIssues.push("Renseigne la tresorerie initiale.");
  if (!store.bpContext.target_audience) blockingIssues.push("Choisis le destinataire du dossier.");

  if (store.revenueLines.length > 0 && store.fixedCosts.length === 0 && store.variableCosts.length === 0) {
    alerts.push("Aucune charge n'est renseignee : le scenario sera trop optimiste.");
  }
  if (store.teamMembers.length === 0) alerts.push("Aucune equipe renseignee : masse salariale a zero.");
  if (projections?.indicators.runway !== null && (projections?.indicators.runway ?? 99) < 6) {
    alerts.push(`Runway critique : ${projections?.indicators.runway} mois.`);
  }
  if (projections?.indicators.minDscr !== null && (projections?.indicators.minDscr ?? 99) < 1.2) {
    alerts.push(`DSCR minimum fragile : ${pct(projections?.indicators.minDscr)}. Une banque vise souvent > 1.20x.`);
  }
  if ((projections?.indicators.financingGap ?? 0) > 0) {
    alerts.push(`Trou de financement estime : ${fmt(projections?.indicators.financingGap)}.`);
  }
  if ((projections?.indicators.minCashBalance ?? 0) < 0) {
    alerts.push(`Tresorerie negative au point bas : ${fmt(projections?.indicators.minCashBalance)}.`);
  }

  const canGenerate = blockingIssues.length === 0 && !isGenerating;
  const bankGrade =
    blockingIssues.length > 0 ? "A completer" :
    alerts.length === 0 && (projections?.indicators.minDscr == null || projections.indicators.minDscr >= 1.4) ? "Solide" :
    alerts.length <= 2 ? "Defendable" :
    "Risque";

  return (
    <div className="space-y-6">
      <div className="bg-surface rounded-card shadow-card p-5 border border-border">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-sans font-semibold text-sm text-fg">Controle bancaire</p>
            <p className="text-xs text-muted mt-1">
              Lecture rapide du dossier avant generation : financement, tresorerie, dette et coherence des hypotheses.
            </p>
          </div>
          <span
            className="px-3 py-1.5 rounded-full text-xs font-sans font-semibold"
            style={{
              color: bankGrade === "Solide" ? "#1cb785" : bankGrade === "Defendable" ? "#ff8f27" : "#ff4f3f",
              background: bankGrade === "Solide" ? "#1cb78512" : bankGrade === "Defendable" ? "#ff8f2712" : "#ff4f3f12",
            }}
          >
            {bankGrade}
          </span>
        </div>

        <div className="mt-4 h-2 bg-beige rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${completeness}%`,
              background: completeness >= 80 ? "#1cb785" : completeness >= 50 ? "#ff8f27" : "#ff4f3f",
            }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-muted">
          <span>Completude des donnees</span>
          <span className="font-semibold text-fg">{completeness}%</span>
        </div>
      </div>

      {blockingIssues.length > 0 && (
        <div className="space-y-2">
          {blockingIssues.map((issue) => (
            <div key={issue} className="flex items-start gap-3 px-4 py-3 rounded-xl border border-red/20 bg-red/5">
              <AlertCircle size={15} className="text-red flex-shrink-0 mt-0.5" />
              <p className="text-sm font-sans text-fg">{issue}</p>
            </div>
          ))}
        </div>
      )}

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div key={alert} className="flex items-start gap-3 px-4 py-3 rounded-xl border border-orange/20 bg-orange/5">
              <AlertCircle size={15} className="text-orange flex-shrink-0 mt-0.5" />
              <p className="text-sm font-sans text-fg">{alert}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-surface rounded-card shadow-card p-5 border border-border">
        <p className="font-sans font-semibold text-sm text-fg mb-3">Scenario de projection</p>
        <div className="grid grid-cols-3 gap-3">
          {SCENARIO_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => setScenario(s.value)}
              className={`p-3 rounded-xl border text-left transition-all ${
                scenario === s.value ? "border-green bg-green/5" : "border-border bg-bg hover:border-green/30"
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

      {projections && (
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: "Runway",
              value: projections.indicators.runway === null ? "+36 mois" : `${projections.indicators.runway} mois`,
              icon: Clock,
              color: projections.indicators.runway === null || projections.indicators.runway >= 12 ? "#1cb785" : projections.indicators.runway < 6 ? "#ff4f3f" : "#ff8f27",
            },
            {
              label: "DSCR minimum",
              value: projections.indicators.minDscr === null ? "Pas de dette" : pct(projections.indicators.minDscr),
              icon: ShieldCheck,
              color: projections.indicators.minDscr === null || projections.indicators.minDscr >= 1.4 ? "#1cb785" : projections.indicators.minDscr < 1.2 ? "#ff4f3f" : "#ff8f27",
            },
            {
              label: "Tresorerie min.",
              value: fmt(projections.indicators.minCashBalance),
              icon: Wallet,
              color: projections.indicators.minCashBalance >= 0 ? "#1cb785" : "#ff4f3f",
            },
            {
              label: "Trou financement",
              value: fmt(Math.max(0, projections.indicators.financingGap)),
              icon: DollarSign,
              color: projections.indicators.financingGap <= 0 ? "#1cb785" : "#ff4f3f",
            },
            {
              label: "CA annee 1",
              value: fmt(year1Revenue),
              icon: TrendingUp,
              color: "#111111",
            },
            {
              label: "EBITDA annee 3",
              value: fmt(year3Ebitda),
              icon: CheckCircle,
              color: year3Ebitda >= 0 ? "#1cb785" : "#ff4f3f",
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-surface rounded-card shadow-card p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={15} className="text-muted" />
                <p className="text-xs font-sans text-muted uppercase tracking-wide">{label}</p>
              </div>
              <p className="font-serif text-2xl" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-surface rounded-card shadow-card p-5 border border-border">
        <p className="font-sans font-semibold text-sm text-fg mb-3">Synthese bancaire</p>
        <div className="grid grid-cols-3 gap-3 text-sm">
          {[
            ["CA annee 1", fmt(year1Revenue)],
            ["CA annee 2", fmt(year2Revenue)],
            ["CA annee 3", fmt(year3Revenue)],
            ["Pret demande", fmt(store.bpContext.bank_loan_amount ?? store.bpContext.funding_amount_requested)],
            ["Apports + capital", fmt((store.bpContext.founder_contribution ?? 0) + (store.bpContext.capital_social ?? 0) + (store.bpContext.associate_current_account ?? 0))],
            ["Investissements + buffer", fmt((store.investments ?? []).reduce((s, inv) => s + (inv.amount_ht ?? 0), 0) + (store.bpContext.working_capital_buffer ?? 0))],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-bg border border-border p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
              <p className="font-sans font-semibold text-fg mt-1">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-full font-sans text-sm font-medium text-muted border border-border hover:border-fg hover:text-fg transition-all"
        >
          Retour
        </button>
        <div className="flex flex-col items-end gap-2">
          {!canGenerate && !isGenerating && (
            <p className="max-w-xs text-right text-xs text-muted">
              Complete les points bloquants ci-dessus pour activer la generation.
            </p>
          )}
          <button
            onClick={() => canGenerate && onGenerate(scenario)}
            disabled={!canGenerate}
            className="flex items-center gap-2 px-6 py-3 rounded-full font-sans text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: canGenerate ? "#1cb785" : "#999999" }}
          >
            {isGenerating ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Generation en cours...
              </>
            ) : (
              "Generer le business plan"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

