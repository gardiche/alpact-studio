import type { RevenueLine, GrowthHypothesis, MonthlyRevenue } from "@/types/business-plan";

const MONTH_KEYS = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];

function getSeasonalityCoef(month: number, seasonality?: Record<string, number>): number {
  if (!seasonality) return 1;
  const key = MONTH_KEYS[(month - 1) % 12];
  return seasonality[key] ?? 1;
}

export function calculateRevenueLineProjection(
  line: RevenueLine,
  hypothesis: GrowthHypothesis,
  months = 36
): MonthlyRevenue[] {
  const results: MonthlyRevenue[] = [];
  let cumulativeClients = line.current_volume;
  const churnRate = hypothesis.churn_rate_monthly ?? 0;
  const monthlyNew = hypothesis.monthly_new_customers;
  const growthRate = hypothesis.growth_model === "exponential" ? monthlyNew / 100 : 0;

  for (let n = 1; n <= months; n++) {
    let newClients: number;
    let targetClients: number;

    switch (hypothesis.growth_model) {
      case "linear":
        newClients = monthlyNew;
        break;
      case "exponential":
        newClients = Math.round(line.current_volume * Math.pow(1 + growthRate, n) - line.current_volume * Math.pow(1 + growthRate, n - 1));
        break;
      case "stepped":
        // paliers : accélération aux mois 12, 24
        newClients = n <= 12 ? monthlyNew : n <= 24 ? monthlyNew * 1.5 : monthlyNew * 2;
        break;
      default:
        newClients = monthlyNew;
    }

    const churnedClients = line.type === "recurring" ? cumulativeClients * churnRate : 0;

    if (line.type === "recurring") {
      cumulativeClients = Math.max(0, cumulativeClients + newClients - churnedClients);
      targetClients = cumulativeClients;
    } else {
      targetClients = newClients;
      cumulativeClients = cumulativeClients + newClients - churnedClients;
    }

    const seasonal = getSeasonalityCoef(n, hypothesis.seasonality);
    const revenue = targetClients * line.unit_price * seasonal;

    results.push({
      month: n,
      clients: Math.round(cumulativeClients),
      newClients: Math.round(newClients),
      churnedClients: Math.round(churnedClients),
      revenue: Math.max(0, revenue),
    });
  }

  return results;
}

export function aggregateRevenue(
  lineProjections: MonthlyRevenue[][],
  months = 36
): { totalRevenue: number[]; totalClients: number[] } {
  const totalRevenue = Array(months).fill(0);
  const totalClients = Array(months).fill(0);

  for (const projection of lineProjections) {
    for (const m of projection) {
      totalRevenue[m.month - 1] += m.revenue;
      totalClients[m.month - 1] += m.clients;
    }
  }

  return { totalRevenue, totalClients };
}
