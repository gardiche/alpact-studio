import type { Subsidy } from "@/types/business-plan";

export function calculateSubsidies(
  subsidies: Subsidy[],
  startDate: string | undefined,
  months = 36
): number[] {
  const monthly = Array(months).fill(0);

  for (const sub of subsidies) {
    if (!sub.expected_date || !sub.amount) continue;

    let targetMonth: number;
    if (startDate) {
      const start = new Date(startDate);
      const target = new Date(sub.expected_date);
      const diffMs = target.getTime() - start.getTime();
      targetMonth = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30.44)));
    } else {
      targetMonth = 3;
    }

    const idx = Math.min(Math.max(0, targetMonth - 1), months - 1);
    monthly[idx] += sub.amount;
  }

  return monthly;
}
