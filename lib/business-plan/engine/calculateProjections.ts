import type { ProjectData, ProjectionResult, Scenario, Investment, Subsidy } from "@/types/business-plan";
import { calculateRevenueLineProjection, aggregateRevenue } from "./revenue";
import { calculatePayroll } from "./payroll";
import { calculateFixedCosts, calculateVariableCosts } from "./costs";
import { calculatePnL } from "./pnl";
import { calculateBFR } from "./bfr";
import { calculateCashflow } from "./cashflow";
import { calculateIndicators } from "./indicators";
import { applyScenario } from "./scenarios";
import { calculateBankDebtService } from "./debt";
import { calculateAmortizations, calculateInvestmentsByMonth } from "./amortization";
import { calculateTaxesAndDuties } from "./taxes";
import { calculateSubsidies } from "./subsidies";
import { buildAnnualPnL, buildFinancingPlan, buildBalanceSheet } from "./annualTables";

const MONTHS = 36;

function toInvestments(data: ProjectData): Investment[] {
  return (data.investments ?? []).map((inv) => ({
    ...inv,
    project_id: data.project.id,
    amount_ht: inv.amount_ht ?? 0,
    created_at: "",
    updated_at: "",
  }));
}

function toSubsidies(data: ProjectData): Subsidy[] {
  return (data.subsidies ?? []).map((sub) => ({
    ...sub,
    project_id: data.project.id,
    amount: sub.amount ?? 0,
    expected_date: sub.expected_date ?? "",
    source: "user_input" as const,
    created_at: "",
    updated_at: "",
  }));
}

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
  const externalCosts = calculateFixedCosts(data.fixedCosts, MONTHS);
  const variableCosts = calculateVariableCosts(
    data.variableCosts,
    totalClients,
    totalRevenue,
    MONTHS
  );
  const payroll = calculatePayroll(data.teamMembers, MONTHS);
  const bankDebtService = calculateBankDebtService(data.bpContext, MONTHS);
  const financialExpenses = bankDebtService.map((m) => m.interest);

  // Investments & amortizations
  const investments = toInvestments(data);
  const { monthly: depreciation, annual: amortizations } = calculateAmortizations(investments, MONTHS);
  const investmentsByMonth = calculateInvestmentsByMonth(investments, MONTHS);

  // Taxes & duties (hors IS)
  const taxesAndDuties = calculateTaxesAndDuties(payroll, MONTHS);

  // Subsidies
  const subsidyList = toSubsidies(data);
  const monthlySubsidies = calculateSubsidies(subsidyList, data.project.start_date, MONTHS);

  // Financial tables
  const pnl = calculatePnL(
    totalRevenue, variableCosts, externalCosts, payroll,
    depreciation, financialExpenses, taxesAndDuties, monthlySubsidies, MONTHS
  );

  const bfr = calculateBFR(
    totalRevenue,
    variableCosts,
    externalCosts,
    data.treasury.payment_delay_clients_days,
    data.treasury.payment_delay_suppliers_days,
    MONTHS
  );

  const cashflow = calculateCashflow(
    pnl, bfr, data.treasury, data.bpContext,
    bankDebtService, MONTHS, investmentsByMonth, monthlySubsidies
  );

  const indicators = calculateIndicators(
    pnl, cashflow, data.revenueLines, data.growthHypotheses,
    data.variableCosts, data, investments
  );

  // Annual tables
  const annualPnl = buildAnnualPnL(pnl);
  const financingPlan = buildFinancingPlan(annualPnl, bfr, cashflow, investments, data.bpContext);
  const balance = buildBalanceSheet(annualPnl, bfr, cashflow, amortizations, investments, data.bpContext);

  return {
    scenario,
    pnl,
    cashflow,
    bfr,
    annualPnl,
    financingPlan,
    balance,
    amortizations,
    indicators,
  };
}
