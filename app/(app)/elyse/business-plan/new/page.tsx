"use client";

import { useEffect, useState } from "react";
import { BusinessPlanWizard } from "@/components/business-plan/BusinessPlanWizard";
import { useBusinessPlanStore } from "@/lib/store/useBusinessPlanStore";

export default function NewBusinessPlanPage() {
  const resetWizard = useBusinessPlanStore((s) => s.resetWizard);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    resetWizard();
    setReady(true);
  }, [resetWizard]);

  if (!ready) {
    return <div className="min-h-screen bg-bg" />;
  }

  return (
    <div className="min-h-screen bg-bg py-8 px-4">
      <BusinessPlanWizard />
    </div>
  );
}
