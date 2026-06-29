import type { MonthlyPnL } from "@/types/business-plan";

const IS_THRESHOLD_ANNUAL = 42500;

export function calculatePnL(
  totalRevenue: number[],
  variableCosts: number[],
  externalCosts: number[],
  payroll: number[],
  depreciation: number[],
  financialExpenses: number[],
  taxesAndDuties: number[],
  subsidies: number[],
  months = 36
): MonthlyPnL[] {
  const pnl: MonthlyPnL[] = [];
  let cumulativeLoss = 0;

  for (let n = 1; n <= months; n++) {
    const i = n - 1;
    const revenue = totalRevenue[i] ?? 0;
    const variable = variableCosts[i] ?? 0;
    const external = externalCosts[i] ?? 0;
    const salary = payroll[i] ?? 0;
    const dep = depreciation[i] ?? 0;
    const financial = financialExpenses[i] ?? 0;
    const taxes = taxesAndDuties[i] ?? 0;
    const subsidy = subsidies[i] ?? 0;

    const grossMargin = revenue - variable;
    const grossMarginRate = revenue > 0 ? grossMargin / revenue : 0;
    const valueAdded = grossMargin - external;
    const ebitda = valueAdded - taxes + subsidy - salary;
    const operatingResult = ebitda - dep;
    const currentResult = operatingResult - financial;

    // IS with carry-forward losses
    let tax = 0;
    if (n % 12 === 0) {
      const yearStart = n - 12;
      let annualCurrentResult = 0;
      for (let m = yearStart; m < n; m++) {
        if (m < i) {
          annualCurrentResult += pnl[m].currentResult;
        } else {
          annualCurrentResult += currentResult;
        }
      }

      const taxableBase = annualCurrentResult + cumulativeLoss;
      if (taxableBase > 0) {
        if (taxableBase <= IS_THRESHOLD_ANNUAL) {
          tax = taxableBase * 0.15;
        } else {
          tax = IS_THRESHOLD_ANNUAL * 0.15 + (taxableBase - IS_THRESHOLD_ANNUAL) * 0.25;
        }
        cumulativeLoss = 0;
      } else {
        cumulativeLoss = taxableBase;
      }
    }

    const netResult = currentResult - tax;

    pnl.push({
      month: n,
      revenue,
      variableCosts: variable,
      grossMargin,
      grossMarginRate,
      externalCosts: external,
      valueAdded,
      taxesAndDuties: taxes,
      subsidies: subsidy,
      payroll: salary,
      ebitda,
      depreciation: dep,
      operatingResult,
      financialExpenses: financial,
      currentResult,
      carryForwardLoss: cumulativeLoss,
      tax,
      netResult,
    });
  }

  return pnl;
}
