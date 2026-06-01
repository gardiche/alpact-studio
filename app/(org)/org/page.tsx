import { CohortHeader } from "@/components/org/CohortHeader";
import { CohortMetrics } from "@/components/org/CohortMetrics";
import { CohortTable } from "@/components/org/CohortTable";
import {
  getActiveCohort,
  getCohortMembers,
  getBaseImpactMetrics,
} from "@/lib/org/cohortRepository";

export default async function CohortPage() {
  const [cohort, members, metrics] = await Promise.all([
    getActiveCohort(),
    getCohortMembers(),
    getBaseImpactMetrics(),
  ]);

  return (
    <div className="min-h-screen bg-bg p-8">
      <div className="max-w-6xl mx-auto">
        <CohortHeader cohort={cohort} metrics={metrics} />
        <CohortMetrics metrics={metrics} />
        <CohortTable members={members} />
      </div>
    </div>
  );
}
