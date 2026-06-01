import type { TeamMember } from "@/types/business-plan";

const EMPLOYER_COEF: Record<TeamMember["type"], number> = {
  employee: 1.82,
  founder: 1.45,
  freelance: 1.0,
};

export function computeMemberCost(member: TeamMember): number {
  if (!member.is_paid || !member.net_salary_monthly) return 0;
  const coef = EMPLOYER_COEF[member.type];
  return member.net_salary_monthly * coef * member.count;
}

export function calculatePayroll(members: TeamMember[], months = 36): number[] {
  const payroll = Array(months).fill(0);

  for (let n = 1; n <= months; n++) {
    const monthDate = new Date();
    monthDate.setMonth(monthDate.getMonth() + n - 1);

    for (const member of members) {
      const startDate = new Date(member.start_date);
      if (startDate <= monthDate) {
        payroll[n - 1] += computeMemberCost(member);
      }
    }
  }

  return payroll;
}
