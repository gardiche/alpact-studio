import type { BpContext, MonthlyCashflow, MonthlyPnL, MonthlyBFR, Treasury } from "@/types/business-plan";
import type { MonthlyDebtService } from "./debt";

export function calculateCashflow(
  pnl: MonthlyPnL[],
  bfr: MonthlyBFR[],
  treasury: Treasury,
  context: BpContext | undefined,
  debtService: MonthlyDebtService[] = [],
  months = 36,
  investmentsByMonth: number[] = [],
  monthlySubsidies: number[] = []
): MonthlyCashflow[] {
  const cashflow: MonthlyCashflow[] = [];
  let endingBalance = treasury.cash_balance;
  const vatRate = (context?.vat_rate ?? 20) / 100;

  const clientDelayMonths = Math.round((treasury.payment_delay_clients_days ?? 30) / 30);
  const supplierDelayMonths = Math.round((treasury.payment_delay_suppliers_days ?? 30) / 30);

  const totalLoanPayment = (treasury.outstanding_loans ?? []).reduce(
    (sum, loan) => sum + loan.monthly_payment,
    0
  );

  const annualTaxBuckets: Record<number, number> = {};
  for (const row of pnl) {
    if (row.tax > 0) {
      const paymentMonth = Math.min(row.month + 3, months);
      annualTaxBuckets[paymentMonth] = (annualTaxBuckets[paymentMonth] ?? 0) + row.tax;
    }
  }

  for (let n = 1; n <= months; n++) {
    const revenueMonth = n - clientDelayMonths;
    const clientReceipts = revenueMonth >= 1 ? (pnl[revenueMonth - 1]?.revenue ?? 0) : 0;
    const vatCollected = revenueMonth >= 1 ? clientReceipts * vatRate : 0;

    let exceptionalInflows = 0;
    if (n === 1) {
      exceptionalInflows += context?.founder_contribution ?? 0;
      exceptionalInflows += context?.capital_social ?? 0;
      exceptionalInflows += context?.associate_current_account ?? 0;
      exceptionalInflows += context?.bank_loan_amount ?? context?.funding_amount_requested ?? 0;
    }
    if (treasury.fundraising_date) {
      const leveeMonth = monthsDiff(new Date(), new Date(treasury.fundraising_date));
      if (leveeMonth === n && (treasury.fundraising_amount ?? 0) > 0) {
        exceptionalInflows += treasury.fundraising_amount!;
      }
    }
    // Subsidies from detailed entries
    exceptionalInflows += monthlySubsidies[n - 1] ?? 0;

    const totalInflows = clientReceipts + vatCollected + exceptionalInflows;

    const costsMonth = n - supplierDelayMonths;
    const supplierPayments = costsMonth >= 1
      ? (pnl[costsMonth - 1]?.variableCosts ?? 0) + (pnl[costsMonth - 1]?.externalCosts ?? 0)
      : 0;
    const vatDeductible = costsMonth >= 1 ? supplierPayments * vatRate : 0;
    const vatPayments = n % 3 === 0 ? Math.max(0, vatCollected - vatDeductible) : 0;

    const salaryPayments = pnl[n - 1]?.payroll ?? 0;
    const loanRepayments = totalLoanPayment + (debtService[n - 1]?.principal ?? 0);
    const interestPayments = debtService[n - 1]?.interest ?? 0;
    const taxPayments = annualTaxBuckets[n] ?? 0;
    const capexPayments = investmentsByMonth[n - 1] ?? 0;

    const totalOutflows = supplierPayments + vatDeductible + salaryPayments + loanRepayments + interestPayments + taxPayments + vatPayments + capexPayments;
    const netCashflow = totalInflows - totalOutflows;
    const bfrVariation = bfr[n - 1]?.bfrVariation ?? 0;
    const adjustedCashflow = netCashflow;

    endingBalance = endingBalance + adjustedCashflow;

    cashflow.push({
      month: n,
      clientReceipts,
      vatCollected,
      vatDeductible,
      vatPayments,
      exceptionalInflows,
      totalInflows,
      supplierPayments,
      salaryPayments,
      loanRepayments,
      interestPayments,
      taxPayments,
      capexPayments,
      totalOutflows,
      netCashflow,
      bfrVariation,
      adjustedCashflow,
      endingBalance,
    });
  }

  return cashflow;
}

function monthsDiff(from: Date, to: Date): number {
  return (
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth()) +
    1
  );
}
