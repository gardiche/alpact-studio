import type { ProjectData, Scenario } from "@/types/business-plan";

const MULTIPLIERS: Record<Scenario, { growth: number; churn: number; costs: number }> = {
  conservative: { growth: 0.7, churn: 1.3, costs: 1.15 },
  moderate: { growth: 1.0, churn: 1.0, costs: 1.0 },
  aggressive: { growth: 1.4, churn: 0.7, costs: 0.9 },
};

export function applyScenario(data: ProjectData, scenario: Scenario): ProjectData {
  const m = MULTIPLIERS[scenario];

  return {
    ...data,
    growthHypotheses: data.growthHypotheses.map((h) => ({
      ...h,
      monthly_new_customers: h.monthly_new_customers * m.growth,
      churn_rate_monthly: h.churn_rate_monthly != null ? h.churn_rate_monthly * m.churn : undefined,
    })),
    fixedCosts: data.fixedCosts.map((c) => ({
      ...c,
      amount_monthly: c.amount_monthly * m.costs,
    })),
    variableCosts: data.variableCosts.map((c) => ({
      ...c,
      current_amount_monthly: c.current_amount_monthly != null ? c.current_amount_monthly * m.costs : undefined,
      unit_cost: c.unit_cost != null ? c.unit_cost * m.costs : undefined,
    })),
    teamMembers: data.teamMembers.map((t) => ({
      ...t,
      net_salary_monthly: t.net_salary_monthly != null ? t.net_salary_monthly * m.costs : undefined,
    })),
    investments: (data.investments ?? []).map((inv) => ({
      ...inv,
      amount_ht: inv.amount_ht * m.costs,
    })),
    bpContext: {
      ...data.bpContext,
      working_capital_buffer: data.bpContext.working_capital_buffer != null ? data.bpContext.working_capital_buffer * m.costs : undefined,
    },
  };
}
