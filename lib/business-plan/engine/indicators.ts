import type {
  Indicators,
  MonthlyPnL,
  MonthlyCashflow,
  RevenueLine,
  GrowthHypothesis,
  VariableCost,
} from "@/types/business-plan";

export function calculateIndicators(
  pnl: MonthlyPnL[],
  cashflow: MonthlyCashflow[],
  revenueLines: RevenueLine[],
  growthHypotheses: GrowthHypothesis[],
  variableCosts: VariableCost[]
): Indicators {
  // Runway: first month where ending balance < 0
  const runwayMonth = cashflow.findIndex((m) => m.endingBalance < 0);
  const runway = runwayMonth === -1 ? null : runwayMonth + 1;

  // Break-even month: first month where EBITDA > 0
  const breakEvenIdx = pnl.findIndex((m) => m.ebitda > 0);
  const breakEvenMonth = breakEvenIdx === -1 ? null : breakEvenIdx + 1;

  // Break-even in clients: fixed_costs / (price - variable_cost_per_unit)
  const avgUnitPrice =
    revenueLines.reduce((s, l) => s + l.unit_price, 0) / Math.max(revenueLines.length, 1);
  const perUnitCosts = variableCosts
    .filter((c) => c.cost_model === "per_unit")
    .reduce((s, c) => s + (c.unit_cost ?? 0), 0);
  const avgFixedMonth12 = pnl[11]?.fixedCosts ?? 0;
  const margin = avgUnitPrice - perUnitCosts;
  const breakEvenClients = margin > 0 ? Math.ceil(avgFixedMonth12 / margin) : 0;

  // Burn rate: avg outflows last 3 months of data
  const last3 = cashflow.slice(-3);
  const burnRate =
    last3.length > 0 ? last3.reduce((s, m) => s + m.totalOutflows, 0) / last3.length : 0;

  // CAC: paid_ads budget / new clients (month 12)
  const marketingMonth12 = pnl[11]?.variableCosts ?? 0;
  const newClientsMonth12 = growthHypotheses.reduce(
    (s, h) => s + h.monthly_new_customers,
    0
  );
  const cac = newClientsMonth12 > 0 ? marketingMonth12 / newClientsMonth12 : null;

  // LTV: unit_price / churn_rate (recurring only)
  const recurringLines = revenueLines.filter((l) => l.type === "recurring");
  let ltv: number | null = null;
  if (recurringLines.length > 0) {
    const hyp = growthHypotheses.find((h) =>
      recurringLines.some((l) => l.id === h.revenue_line_id)
    );
    if (hyp?.churn_rate_monthly && hyp.churn_rate_monthly > 0) {
      const avgPrice =
        recurringLines.reduce((s, l) => s + l.unit_price, 0) / recurringLines.length;
      ltv = avgPrice / hyp.churn_rate_monthly;
    }
  }

  const ltvCacRatio = ltv !== null && cac !== null && cac > 0 ? ltv / cac : null;

  // MRR / ARR (month 1)
  const mrr = pnl[0]?.revenue ?? 0;
  const arr = mrr * 12;

  return {
    runway,
    breakEvenMonth,
    breakEvenClients,
    burnRate,
    cac,
    ltv,
    ltvCacRatio,
    mrr,
    arr,
  };
}
