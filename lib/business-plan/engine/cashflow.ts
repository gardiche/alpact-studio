import type { MonthlyCashflow, MonthlyPnL, MonthlyBFR, Treasury } from "@/types/business-plan";

export function calculateCashflow(
  pnl: MonthlyPnL[],
  bfr: MonthlyBFR[],
  treasury: Treasury,
  months = 36
): MonthlyCashflow[] {
  const cashflow: MonthlyCashflow[] = [];
  let endingBalance = treasury.cash_balance;

  const clientDelayMonths = Math.round((treasury.payment_delay_clients_days ?? 30) / 30);
  const supplierDelayMonths = Math.round((treasury.payment_delay_suppliers_days ?? 30) / 30);

  const totalLoanPayment = (treasury.outstanding_loans ?? []).reduce(
    (sum, loan) => sum + loan.monthly_payment,
    0
  );

  // Annual tax buckets — split IS across quarters
  const annualTaxBuckets: Record<number, number> = {};
  for (const row of pnl) {
    if (row.tax > 0) {
      // Tax paid in month of year-end + 3 months
      const paymentMonth = Math.min(row.month + 3, months);
      annualTaxBuckets[paymentMonth] = (annualTaxBuckets[paymentMonth] ?? 0) + row.tax;
    }
  }

  for (let n = 1; n <= months; n++) {
    const revenueMonth = n - clientDelayMonths;
    const clientReceipts = revenueMonth >= 1 ? (pnl[revenueMonth - 1]?.revenue ?? 0) : 0;

    // Exceptional inflows
    let exceptionalInflows = 0;
    if (treasury.fundraising_date) {
      const leveeMonth = monthsDiff(new Date(), new Date(treasury.fundraising_date));
      if (leveeMonth === n && (treasury.fundraising_amount ?? 0) > 0) {
        exceptionalInflows += treasury.fundraising_amount!;
      }
    }
    if (treasury.pending_grants && n === 3) {
      exceptionalInflows += treasury.pending_grants;
    }

    const totalInflows = clientReceipts + exceptionalInflows;

    // Supplier payments with delay
    const costsMonth = n - supplierDelayMonths;
    const supplierPayments = costsMonth >= 1
      ? (pnl[costsMonth - 1]?.variableCosts ?? 0) + (pnl[costsMonth - 1]?.fixedCosts ?? 0)
      : 0;

    const salaryPayments = pnl[n - 1]?.payroll ?? 0;
    const loanRepayments = totalLoanPayment;
    const taxPayments = annualTaxBuckets[n] ?? 0;

    const totalOutflows = supplierPayments + salaryPayments + loanRepayments + taxPayments;
    const netCashflow = totalInflows - totalOutflows;
    const bfrVariation = bfr[n - 1]?.bfrVariation ?? 0;
    const adjustedCashflow = netCashflow - bfrVariation;

    endingBalance = endingBalance + adjustedCashflow;

    cashflow.push({
      month: n,
      clientReceipts,
      exceptionalInflows,
      totalInflows,
      supplierPayments,
      salaryPayments,
      loanRepayments,
      taxPayments,
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
