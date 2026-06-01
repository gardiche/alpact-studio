import type { ProjectData, ProjectionResult, Scenario } from "@/types/business-plan";
import { calculateRevenueLineProjection, aggregateRevenue } from "./revenue";
import { calculatePayroll } from "./payroll";
import { calculateFixedCosts, calculateVariableCosts } from "./costs";
import { calculatePnL } from "./pnl";
import { calculateBFR } from "./bfr";
import { calculateCashflow } from "./cashflow";
import { calculateIndicators } from "./indicators";
import { applyScenario } from "./scenarios";

const MONTHS = 36;

export function calculateProjections(
  rawData: ProjectData,
  scenario: Scenario = "moderate"
): ProjectionResult {
  const data = applyScenario(rawData, scenario);

  // Revenue
  const lineProjections = data.revenueLines.map((line) => {
    const hypothesis = data.growthHypotheses.find(
      (h) => h.revenue_line_id === line.id
    );
    if (!hypothesis) {
      return Array.from({ length: MONTHS }, (_, i) => ({
        month: i + 1,
        clients: line.current_volume,
        newClients: 0,
        churnedClients: 0,
        revenue: line.current_volume * line.unit_price,
      }));
    }
    return calculateRevenueLineProjection(line, hypothesis, MONTHS);
  });

  const { totalRevenue, totalClients } = aggregateRevenue(lineProjections, MONTHS);

  // Costs
  const fixedCosts = calculateFixedCosts(data.fixedCosts, MONTHS);
  const variableCosts = calculateVariableCosts(
    data.variableCosts,
    totalClients,
    totalRevenue,
    MONTHS
  );
  const payroll = calculatePayroll(data.teamMembers, MONTHS);

  // Financial tables
  const pnl = calculatePnL(totalRevenue, variableCosts, fixedCosts, payroll, MONTHS);
  const bfr = calculateBFR(
    totalRevenue,
    variableCosts,
    fixedCosts,
    data.treasury.payment_delay_clients_days,
    data.treasury.payment_delay_suppliers_days,
    MONTHS
  );
  const cashflow = calculateCashflow(pnl, bfr, data.treasury, MONTHS);
  const indicators = calculateIndicators(
    pnl,
    cashflow,
    data.revenueLines,
    data.growthHypotheses,
    data.variableCosts
  );

  return { scenario, pnl, cashflow, bfr, indicators };
}
