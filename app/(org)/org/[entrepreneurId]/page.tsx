import { notFound } from "next/navigation";
import { EntrepreneurHeader } from "@/components/org/EntrepreneurHeader";
import { MilestonesTimeline } from "@/components/org/MilestonesTimeline";
import { ToolsUsage } from "@/components/org/ToolsUsage";
import { AccompanistNotes } from "@/components/org/AccompanistNotes";
import { SignalsTimeline } from "@/components/org/SignalsTimeline";
import { getCohortMemberDetail } from "@/lib/org/cohortRepository";

export default async function EntrepreneurDetailPage({
  params,
}: {
  params: Promise<{ entrepreneurId: string }>;
}) {
  const { entrepreneurId } = await params;
  const member = await getCohortMemberDetail(entrepreneurId);
  if (!member) notFound();

  return (
    <div className="min-h-screen bg-bg p-8">
      <div className="max-w-5xl mx-auto">
        <EntrepreneurHeader member={member} />

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-4">
            <SignalsTimeline
              weather={member.weather}
              tensions={member.tensions}
              actions={member.actions}
            />
            <MilestonesTimeline milestones={member.milestones} />
            <AccompanistNotes notes={member.notes} />
          </div>
          <div className="col-span-1">
            <ToolsUsage tools={member.tools} />
          </div>
        </div>
      </div>
    </div>
  );
}
