import type { FixedCost, VariableCost } from "@/types/business-plan";

export function calculateFixedCosts(costs: FixedCost[], months = 36): number[] {
  const result = Array(months).fill(0);

  for (let n = 1; n <= months; n++) {
    const monthDate = new Date();
    monthDate.setMonth(monthDate.getMonth() + n - 1);

    for (const cost of costs) {
      const start = cost.starts_at ? new Date(cost.starts_at) : new Date(0);
      const end = cost.ends_at ? new Date(cost.ends_at) : new Date("2100-01-01");
      if (monthDate >= start && monthDate <= end) {
        result[n - 1] += cost.amount_monthly;
      }
    }
  }

  return result;
}

export function calculateVariableCosts(
  costs: VariableCost[],
  totalClients: number[],
  totalRevenue: number[],
  months = 36
): number[] {
  const result = Array(months).fill(0);

  for (let n = 1; n <= months; n++) {
    for (const cost of costs) {
      switch (cost.cost_model) {
        case "fixed_monthly": {
          const base = cost.current_amount_monthly ?? 0;
          const target12 = cost.projected_amount_12m ?? base;
          if (n <= 12) {
            result[n - 1] += base + ((target12 - base) * n) / 12;
          } else {
            result[n - 1] += target12;
          }
          break;
        }
        case "per_unit":
          result[n - 1] += (totalClients[n - 1] ?? 0) * (cost.unit_cost ?? 0);
          break;
        case "percentage_revenue":
          result[n - 1] += (totalRevenue[n - 1] ?? 0) * ((cost.percentage ?? 0) / 100);
          break;
      }
    }
  }

  return result;
}
