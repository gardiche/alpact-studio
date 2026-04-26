import { HubHeader } from "@/components/hub/HubHeader";
import { PulseCards } from "@/components/hub/PulseCards";
import { ToolCards } from "@/components/hub/ToolCards";
import { ActivityFeed } from "@/components/hub/ActivityFeed";

export default function HubPage() {
  return (
    <div className="min-h-screen bg-bg p-8">
      <div className="max-w-6xl mx-auto">
        <HubHeader />
        <PulseCards />
        <ToolCards />
        <ActivityFeed />
      </div>
    </div>
  );
}
