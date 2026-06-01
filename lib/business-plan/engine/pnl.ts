import type { MonthlyPnL } from "@/types/business-plan";

const IS_THRESHOLD_ANNUAL = 42500;

export function calculatePnL(
  totalRevenue: number[],
  variableCosts: number[],
  fixedCosts: number[],
  payroll: number[],
  months = 36
): MonthlyPnL[] {
  const pnl: MonthlyPnL[] = [];
  let annualEbitda = 0;
  let annualTaxPaid = 0;

  for (let n = 1; n <= months; n++) {
    const revenue = totalRevenue[n - 1] ?? 0;
    const variable = variableCosts[n - 1] ?? 0;
    const fixed = fixedCosts[n - 1] ?? 0;
    const salary = payroll[n - 1] ?? 0;

    const grossMargin = revenue - variable;
    const grossMarginRate = revenue > 0 ? grossMargin / revenue : 0;
    const ebitda = grossMargin - fixed - salary;

    // Accumulate annual EBITDA for IS calculation
    annualEbitda += ebitda;

    // IS computed at end of fiscal year (every 12 months)
    let tax = 0;
    if (n % 12 === 0 && annualEbitda > 0) {
      const taxableAmount = annualEbitda;
      if (taxableAmount <= IS_THRESHOLD_ANNUAL) {
        tax = taxableAmount * 0.15;
      } else {
        tax = IS_THRESHOLD_ANNUAL * 0.15 + (taxableAmount - IS_THRESHOLD_ANNUAL) * 0.25;
      }
      annualTaxPaid += tax;
      annualEbitda = 0;
    }

    const netResult = ebitda - tax;

    pnl.push({
      month: n,
      revenue,
      variableCosts: variable,
      grossMargin,
      grossMarginRate,
      fixedCosts: fixed,
      payroll: salary,
      ebitda,
      tax,
      netResult,
    });
  }

  return pnl;
}
