import type { MonthlyBFR } from "@/types/business-plan";

export function calculateBFR(
  totalRevenue: number[],
  variableCosts: number[],
  fixedCosts: number[],
  delayClientsDays: number,
  delaySuppliersDays: number,
  months = 36
): MonthlyBFR[] {
  const bfr: MonthlyBFR[] = [];
  let prevBfr = 0;

  for (let n = 1; n <= months; n++) {
    const revenue = totalRevenue[n - 1] ?? 0;
    const costs = (variableCosts[n - 1] ?? 0) + (fixedCosts[n - 1] ?? 0);

    const accountsReceivable = revenue * (delayClientsDays / 30);
    const accountsPayable = costs * (delaySuppliersDays / 30);
    const bfrValue = accountsReceivable - accountsPayable;
    const bfrVariation = bfrValue - prevBfr;

    bfr.push({
      month: n,
      accountsReceivable,
      accountsPayable,
      bfr: bfrValue,
      bfrVariation,
    });

    prevBfr = bfrValue;
  }

  return bfr;
}
