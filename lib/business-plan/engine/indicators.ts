import type {
  Indicators,
  MonthlyPnL,
  MonthlyCashflow,
  ProjectData,
  RevenueLine,
  GrowthHypothesis,
  VariableCost,
  Investment,
} from "@/types/business-plan";

export function calculateIndicators(
  pnl: MonthlyPnL[],
  cashflow: MonthlyCashflow[],
  revenueLines: RevenueLine[],
  growthHypotheses: GrowthHypothesis[],
  variableCosts: VariableCost[],
  data?: ProjectData,
  investments: Investment[] = []
): Indicators {
  const runwayMonth = cashflow.findIndex((m) => m.endingBalance < 0);
  const runway = runwayMonth === -1 ? null : runwayMonth + 1;

  const breakEvenIdx = pnl.findIndex((m) => m.ebitda > 0);
  const breakEvenMonth = breakEvenIdx === -1 ? null : breakEvenIdx + 1;

  // Break-even in clients
  const avgUnitPrice =
    revenueLines.reduce((s, l) => s + l.unit_price, 0) / Math.max(revenueLines.length, 1);
  const perUnitCosts = variableCosts
    .filter((c) => c.cost_model === "per_unit")
    .reduce((s, c) => s + (c.unit_cost ?? 0), 0);
  const avgFixedMonth12 = pnl[11]?.externalCosts ?? 0;
  const margin = avgUnitPrice - perUnitCosts;
  const breakEvenClients = margin > 0 ? Math.ceil(avgFixedMonth12 / margin) : 0;

  // Break-even in € (point mort = charges fixes / taux de marge sur coûts variables)
  let breakEvenRevenue: number | null = null;
  const year1Revenue = pnl.slice(0, 12).reduce((s, m) => s + m.revenue, 0);
  const year1Variable = pnl.slice(0, 12).reduce((s, m) => s + m.variableCosts, 0);
  const year1Fixed = pnl.slice(0, 12).reduce((s, m) => s + m.externalCosts + m.payroll + m.taxesAndDuties + m.depreciation, 0);
  const marginRate = year1Revenue > 0 ? (year1Revenue - year1Variable) / year1Revenue : 0;
  if (marginRate > 0) {
    breakEvenRevenue = year1Fixed / marginRate;
  }

  // Burn rate
  const last3 = cashflow.slice(-3);
  const burnRate =
    last3.length > 0 ? last3.reduce((s, m) => s + m.totalOutflows, 0) / last3.length : 0;
  const minCashBalance = cashflow.reduce((min, m) => Math.min(min, m.endingBalance), Number.POSITIVE_INFINITY);

  const year1Ebitda = pnl.slice(0, 12).reduce((s, m) => s + m.ebitda, 0);
  const year1DebtService = cashflow.slice(0, 12).reduce((s, m) => s + m.loanRepayments + m.interestPayments, 0);
  const minDscr = [0, 12, 24]
    .map((start) => {
      const ebitda = pnl.slice(start, start + 12).reduce((s, m) => s + m.ebitda, 0);
      const debtService = cashflow.slice(start, start + 12).reduce((s, m) => s + m.loanRepayments + m.interestPayments, 0);
      return debtService > 0 ? ebitda / debtService : null;
    })
    .filter((v): v is number => v !== null)
    .reduce<number | null>((min, v) => (min === null ? v : Math.min(min, v)), null);

  // Financing need
  const totalInvestments = investments.reduce((s, inv) => s + inv.amount_ht, 0);
  const buffer = data?.bpContext.working_capital_buffer ?? 0;
  const initialCash = data?.treasury.cash_balance ?? 0;
  const requestedFunding = data?.bpContext.funding_amount_requested ?? data?.bpContext.bank_loan_amount ?? 0;
  const founderResources =
    (data?.bpContext.founder_contribution ?? 0) +
    (data?.bpContext.capital_social ?? 0) +
    (data?.bpContext.associate_current_account ?? 0);
  const worstOperatingCashNeed = Math.abs(Math.min(0, ...cashflow.slice(0, 12).map((m) => m.endingBalance - initialCash)));
  const financingNeed = totalInvestments + buffer + worstOperatingCashNeed;
  const financingGap = financingNeed - requestedFunding - founderResources - initialCash;

  const year3Ebitda = pnl.slice(24, 36).reduce((s, m) => s + m.ebitda, 0);
  const debtAtStart = (data?.bpContext.bank_loan_amount ?? data?.bpContext.funding_amount_requested ?? 0) +
    (data?.treasury.outstanding_loans ?? []).reduce((s, l) => s + l.amount, 0);
  const debtRepaid = cashflow.reduce((s, m) => s + m.loanRepayments, 0);
  const netDebtYear3 = Math.max(0, debtAtStart - debtRepaid);
  const debtToEbitdaYear3 = year3Ebitda > 0 ? netDebtYear3 / year3Ebitda : null;

  // CAC
  const marketingMonth12 = pnl[11]?.variableCosts ?? 0;
  const newClientsMonth12 = growthHypotheses.reduce(
    (s, h) => s + h.monthly_new_customers,
    0
  );
  const cac = newClientsMonth12 > 0 ? marketingMonth12 / newClientsMonth12 : null;

  // LTV
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

  const mrr = pnl[0]?.revenue ?? 0;
  const arr = mrr * 12;

  // CAF per year (net result + depreciation)
  const caf: [number, number, number] = [0, 0, 0];
  const grossMarginRateArr: [number, number, number] = [0, 0, 0];
  const valueAddedRateArr: [number, number, number] = [0, 0, 0];

  for (let y = 0; y < 3; y++) {
    const s = y * 12;
    const e = s + 12;
    const yearNet = pnl.slice(s, e).reduce((sum, m) => sum + m.netResult, 0);
    const yearDep = pnl.slice(s, e).reduce((sum, m) => sum + m.depreciation, 0);
    caf[y] = yearNet + yearDep;

    const yearRev = pnl.slice(s, e).reduce((sum, m) => sum + m.revenue, 0);
    const yearGM = pnl.slice(s, e).reduce((sum, m) => sum + m.grossMargin, 0);
    const yearVA = pnl.slice(s, e).reduce((sum, m) => sum + m.valueAdded, 0);
    grossMarginRateArr[y] = yearRev > 0 ? yearGM / yearRev : 0;
    valueAddedRateArr[y] = yearRev > 0 ? yearVA / yearRev : 0;
  }

  return {
    runway,
    breakEvenMonth,
    breakEvenClients,
    breakEvenRevenue,
    burnRate,
    minCashBalance: Number.isFinite(minCashBalance) ? minCashBalance : 0,
    minDscr,
    year1DebtService,
    year1Ebitda,
    financingNeed,
    financingGap,
    debtToEbitdaYear3,
    cac,
    ltv,
    ltvCacRatio,
    mrr,
    arr,
    caf,
    grossMarginRate: grossMarginRateArr,
    valueAddedRate: valueAddedRateArr,
  };
}
