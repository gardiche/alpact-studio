import { HubHeader } from "@/components/hub/HubHeader";
import { PulseCards } from "@/components/hub/PulseCards";
import { ToolCards } from "@/components/hub/ToolCards";
import { ActivityFeed } from "@/components/hub/ActivityFeed";
import { getHubMetrics, getActivityFeed } from "@/lib/hub/hubRepository";

export default async function HubPage() {
  const [metrics, activity] = await Promise.all([
    getHubMetrics(),
    getActivityFeed(),
  ]);

  return (
    <div className="min-h-screen bg-bg p-8">
      <div className="max-w-6xl mx-auto">
        <HubHeader />
        <PulseCards metrics={metrics} />
        <ToolCards />
        <ActivityFeed items={activity} />
      </div>
    </div>
  );
}
