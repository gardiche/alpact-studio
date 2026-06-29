import type {
  MonthlyPnL,
  MonthlyCashflow,
  MonthlyBFR,
  AnnualPnL,
  AnnualFinancingPlan,
  AnnualBalance,
  AnnualAmortization,
  Investment,
  BpContext,
} from "@/types/business-plan";

function sumRange<T>(arr: T[], start: number, end: number, key: keyof T): number {
  return arr.slice(start, end).reduce((s, row) => s + (Number(row[key]) || 0), 0);
}

export function buildAnnualPnL(pnl: MonthlyPnL[]): AnnualPnL[] {
  const result: AnnualPnL[] = [];
  for (let y = 0; y < 3; y++) {
    const s = y * 12;
    const e = s + 12;
    const revenue = sumRange(pnl, s, e, "revenue");
    const variableCosts = sumRange(pnl, s, e, "variableCosts");
    const grossMargin = revenue - variableCosts;
    const externalCosts = sumRange(pnl, s, e, "externalCosts");
    const valueAdded = grossMargin - externalCosts;

    result.push({
      year: y + 1,
      revenue,
      variableCosts,
      grossMargin,
      grossMarginRate: revenue > 0 ? grossMargin / revenue : 0,
      externalCosts,
      valueAdded,
      valueAddedRate: revenue > 0 ? valueAdded / revenue : 0,
      taxesAndDuties: sumRange(pnl, s, e, "taxesAndDuties"),
      subsidies: sumRange(pnl, s, e, "subsidies"),
      payroll: sumRange(pnl, s, e, "payroll"),
      ebitda: sumRange(pnl, s, e, "ebitda"),
      depreciation: sumRange(pnl, s, e, "depreciation"),
      operatingResult: sumRange(pnl, s, e, "operatingResult"),
      financialExpenses: sumRange(pnl, s, e, "financialExpenses"),
      currentResult: sumRange(pnl, s, e, "currentResult"),
      carryForwardLoss: pnl[e - 1]?.carryForwardLoss ?? 0,
      tax: sumRange(pnl, s, e, "tax"),
      netResult: sumRange(pnl, s, e, "netResult"),
    });
  }
  return result;
}

export function buildFinancingPlan(
  annualPnl: AnnualPnL[],
  bfr: MonthlyBFR[],
  cashflow: MonthlyCashflow[],
  investments: Investment[],
  bpContext: BpContext
): AnnualFinancingPlan[] {
  const result: AnnualFinancingPlan[] = [];
  let cumulativeSurplus = 0;

  for (let y = 0; y < 3; y++) {
    const s = y * 12;
    const e = s + 12;

    const bfrEnd = bfr[e - 1]?.bfr ?? 0;
    const bfrStart = y === 0 ? 0 : (bfr[s - 1]?.bfr ?? 0);
    const bfrVariation = Math.max(0, bfrEnd - bfrStart);

    const yearInvestments = investments
      .filter((inv) => inv.month > s && inv.month <= e)
      .reduce((sum, inv) => sum + inv.amount_ht, 0);

    const loanRepayments = sumRange(cashflow, s, e, "loanRepayments");

    // CAF = net result + depreciation
    const netResult = annualPnl[y].netResult;
    const depreciation = annualPnl[y].depreciation;
    const caf = netResult + depreciation;

    const negativeCaf = caf < 0 ? Math.abs(caf) : 0;
    const positiveCaf = caf > 0 ? caf : 0;

    const totalEmploys = bfrVariation + yearInvestments + loanRepayments + negativeCaf;

    // Resources
    let capitalFounders = 0;
    let capitalInvestors = 0;
    let associateCA = 0;
    let bankLoans = 0;
    let subsidiesAmount = 0;
    let refundableAdvances = 0;

    if (y === 0) {
      capitalFounders = bpContext.founder_contribution ?? 0;
      associateCA = bpContext.associate_current_account ?? 0;
      bankLoans = bpContext.bank_loan_amount ?? 0;
      capitalInvestors = 0;
    }

    // Subsidies from exceptional inflows (excluding founder/capital/loans which are at month 1)
    const yearSubsidies = cashflow
      .slice(s, e)
      .reduce((sum, m, idx) => {
        if (y === 0 && idx === 0) return sum;
        return sum;
      }, 0);
    subsidiesAmount = yearSubsidies;

    const totalResources = capitalFounders + capitalInvestors + associateCA + bankLoans + subsidiesAmount + refundableAdvances + positiveCaf;

    const surplus = totalResources - totalEmploys;
    cumulativeSurplus += surplus;

    result.push({
      year: y + 1,
      bfrVariation,
      investments: yearInvestments,
      loanRepayments,
      negativeCaf,
      totalEmploys,
      capitalFounders,
      capitalInvestors,
      associateCurrentAccounts: associateCA,
      bankLoans,
      subsidies: subsidiesAmount,
      refundableAdvances,
      positiveCaf,
      totalResources,
      surplus,
      cumulativeSurplus,
    });
  }

  return result;
}

export function buildBalanceSheet(
  annualPnl: AnnualPnL[],
  bfr: MonthlyBFR[],
  cashflow: MonthlyCashflow[],
  amortizations: AnnualAmortization[],
  investments: Investment[],
  bpContext: BpContext
): AnnualBalance[] {
  const result: AnnualBalance[] = [];
  let retainedEarnings = 0;

  for (let y = 0; y < 3; y++) {
    const e = (y + 1) * 12;

    // Assets
    const totalInvestedUpToYear = investments
      .filter((inv) => inv.month <= e)
      .reduce((sum, inv) => sum + inv.amount_ht, 0);

    const totalDepreciation = amortizations.reduce((sum, a) => {
      let dep = 0;
      for (let yr = 0; yr <= y; yr++) dep += a.yearlyDepreciation[yr];
      return sum + dep;
    }, 0);

    const grossAssets = totalInvestedUpToYear;
    const netAssets = Math.max(0, grossAssets - totalDepreciation);
    const clientReceivables = bfr[e - 1]?.accountsReceivable ?? 0;

    // TVA receivables approximation
    const vatReceivables = 0;

    const cashBalance = cashflow[e - 1]?.endingBalance ?? 0;
    const totalAssets = netAssets + clientReceivables + vatReceivables + cashBalance;

    // Liabilities
    const capital = (y === 0 ? (bpContext.capital_social ?? 0) + (bpContext.founder_contribution ?? 0) : result[y - 1]?.capital ?? 0);
    const associateCA = bpContext.associate_current_account ?? 0;

    retainedEarnings += annualPnl[y].netResult;

    const totalEquity = capital + associateCA + retainedEarnings;

    // Financial debts remaining
    const totalLoanRepaid = cashflow.slice(0, e).reduce((s, m) => s + m.loanRepayments, 0);
    const initialDebt = (bpContext.bank_loan_amount ?? 0);
    const financialDebts = Math.max(0, initialDebt - totalLoanRepaid);

    const supplierPayables = bfr[e - 1]?.accountsPayable ?? 0;
    const vatPayable = 0;
    const taxPayable = annualPnl[y].tax;
    const totalLiabilities = financialDebts + supplierPayables + vatPayable + taxPayable;
    const totalPassif = totalEquity + totalLiabilities;

    result.push({
      year: y + 1,
      grossAssets,
      accumulatedDepreciation: totalDepreciation,
      netAssets,
      clientReceivables,
      vatReceivables,
      cashBalance,
      totalAssets,
      capital,
      associateCurrentAccounts: associateCA,
      retainedEarnings,
      totalEquity,
      financialDebts,
      supplierPayables,
      vatPayable,
      taxPayable,
      totalLiabilities,
      totalPassif,
    });
  }

  return result;
}
