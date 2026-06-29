import type { BpContext, Treasury } from "@/types/business-plan";

export interface MonthlyDebtService {
  month: number;
  principal: number;
  interest: number;
  totalPayment: number;
  endingPrincipal: number;
}

export function calculateBankDebtService(
  context: BpContext,
  months = 36
): MonthlyDebtService[] {
  const amount = context.bank_loan_amount ?? context.funding_amount_requested ?? 0;
  const duration = Math.max(1, context.loan_duration_months ?? 60);
  const annualRate = (context.annual_interest_rate ?? 0) / 100;
  const monthlyRate = annualRate / 12;
  const deferment = Math.max(0, context.deferment_months ?? 0);
  const amortizationMonths = Math.max(1, duration - deferment);
  const annuity =
    amount > 0 && monthlyRate > 0
      ? (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -amortizationMonths))
      : amount > 0
        ? amount / amortizationMonths
        : 0;

  let principalRemaining = amount;

  return Array.from({ length: months }, (_, index) => {
    const month = index + 1;
    if (amount <= 0 || month > duration || principalRemaining <= 0) {
      return { month, principal: 0, interest: 0, totalPayment: 0, endingPrincipal: 0 };
    }

    const interest = principalRemaining * monthlyRate;
    const principal = month <= deferment ? 0 : Math.min(principalRemaining, Math.max(0, annuity - interest));
    principalRemaining = Math.max(0, principalRemaining - principal);

    return {
      month,
      principal,
      interest,
      totalPayment: principal + interest,
      endingPrincipal: principalRemaining,
    };
  });
}

export function calculateExistingDebtService(treasury: Treasury, months = 36): MonthlyDebtService[] {
  const loans = treasury.outstanding_loans ?? [];

  return Array.from({ length: months }, (_, index) => {
    const month = index + 1;
    const totalPayment = loans.reduce((sum, loan) => {
      return month <= loan.remaining_months ? sum + loan.monthly_payment : sum;
    }, 0);

    return {
      month,
      principal: totalPayment,
      interest: 0,
      totalPayment,
      endingPrincipal: 0,
    };
  });
}

