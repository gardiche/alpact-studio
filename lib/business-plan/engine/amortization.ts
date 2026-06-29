import type { Investment, AnnualAmortization } from "@/types/business-plan";

export function calculateAmortizations(
  investments: Investment[],
  months = 36
): { monthly: number[]; annual: AnnualAmortization[] } {
  const monthly = Array(months).fill(0);
  const annual: AnnualAmortization[] = [];

  for (const inv of investments) {
    if (inv.amortization_years === 0) {
      // Non-amortizable (e.g. deposit) — no depreciation
      annual.push({
        category: inv.category,
        label: inv.label,
        amount: inv.amount_ht,
        startMonth: inv.month,
        durationYears: 0,
        yearlyDepreciation: [0, 0, 0],
        netBookValue: [inv.amount_ht, inv.amount_ht, inv.amount_ht],
      });
      continue;
    }

    const monthlyDep = inv.amount_ht / (inv.amortization_years * 12);
    const startIdx = inv.month - 1;
    const endIdx = Math.min(startIdx + inv.amortization_years * 12, months);

    for (let i = startIdx; i < endIdx; i++) {
      if (i >= 0 && i < months) {
        monthly[i] += monthlyDep;
      }
    }

    const yearlyDep: [number, number, number] = [0, 0, 0];
    const nbv: [number, number, number] = [inv.amount_ht, inv.amount_ht, inv.amount_ht];

    let totalDepreciated = 0;
    for (let y = 0; y < 3; y++) {
      const yearStart = y * 12;
      const yearEnd = (y + 1) * 12;
      let yearDep = 0;
      for (let m = yearStart; m < yearEnd; m++) {
        if (m >= startIdx && m < endIdx) {
          yearDep += monthlyDep;
        }
      }
      yearlyDep[y] = yearDep;
      totalDepreciated += yearDep;
      nbv[y] = Math.max(0, inv.amount_ht - totalDepreciated);
    }

    annual.push({
      category: inv.category,
      label: inv.label,
      amount: inv.amount_ht,
      startMonth: inv.month,
      durationYears: inv.amortization_years,
      yearlyDepreciation: yearlyDep,
      netBookValue: nbv,
    });
  }

  return { monthly, annual };
}

export function calculateInvestmentsByMonth(
  investments: Investment[],
  months = 36
): number[] {
  const result = Array(months).fill(0);
  for (const inv of investments) {
    const idx = inv.month - 1;
    if (idx >= 0 && idx < months) {
      result[idx] += inv.amount_ht;
    }
  }
  return result;
}
