import {
  getActiveCohort,
  getBaseImpactMetrics,
  getCohortMemberDetails,
  getCohortMembers,
} from "@/lib/org/cohortRepository";
import {
  computeCohortTrends,
  computeEconomicPerformance,
  computeMilestonesByCategory,
  computeStageEvolution,
  pickHighlightedJourneys,
} from "@/lib/org/impactAnalytics";
import { EconomicPerformanceCards } from "@/components/org/impact/EconomicPerformanceCards";
import { HighlightedJourneys } from "@/components/org/impact/HighlightedJourneys";
import { StageEvolutionChart } from "@/components/org/impact/StageEvolutionChart";
import { MilestonesByCategoryChart } from "@/components/org/impact/MilestonesByCategoryChart";
import { ImpactExportButton } from "@/components/org/impact/ImpactExportButton";

export default async function ImpactPage() {
  const [cohort, members, details, metrics] = await Promise.all([
    getActiveCohort(),
    getCohortMembers(),
    getCohortMemberDetails(),
    getBaseImpactMetrics(),
  ]);

  const performance = computeEconomicPerformance(members);
  const evolution = computeStageEvolution(members);
  const milestones = computeMilestonesByCategory(details);
  const journeys = pickHighlightedJourneys(details, 3);
  const trends = computeCohortTrends(details, 5);

  return (
    <div className="min-h-screen bg-bg p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="font-sans text-xs uppercase tracking-wide text-muted mb-1">Impact</p>
            <h1
              className="font-serif text-4xl text-fg leading-tight"
              style={{ fontFamily: "DM Serif Display" }}
            >
              Mesurer l'impact de votre accompagnement
            </h1>
            <p className="font-sans text-sm text-muted mt-1">
              Vue agrégée de la cohorte {cohort.name} · {members.length} entrepreneurs
            </p>
          </div>
          <ImpactExportButton
            cohort={cohort}
            members={members}
            metrics={metrics}
            performance={performance}
            evolution={evolution}
            milestones={milestones}
            journeys={journeys}
            trends={trends}
          />
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {/* 1. Trajectoires marquantes — narratif */}
          <HighlightedJourneys journeys={journeys} />

          {/* 2. Performance économique — chiffres clés */}
          <EconomicPerformanceCards performance={performance} memberCount={members.length} />

          {/* 3. Évolution des stades T0 → T+n */}
          <StageEvolutionChart evolution={evolution} />

          {/* 4. Jalons par catégorie */}
          <MilestonesByCategoryChart rows={milestones} />
        </div>
      </div>
    </div>
  );
}
