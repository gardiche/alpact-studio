"use client";

import { useState } from "react";
import { Toaster } from "sonner";
import { GynaProvider, useGyna } from "@/lib/gyna/gyna-store";
import { OnboardingFlow } from "@/components/gyna/onboarding/OnboardingFlow";
import { NavBar, type GynaView } from "@/components/gyna/layout/NavBar";
import { Dashboard } from "@/components/gyna/dashboard/Dashboard";
import { PlanScreen } from "@/components/gyna/plan/PlanScreen";

export default function GynaPage() {
  return (
    <>
      {/* Google Fonts for Gyna's design system */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
      />
      <div className="gyna-scope min-h-screen">
        <GynaProvider seed>
          <GynaInner />
        </GynaProvider>
        <Toaster position="bottom-right" />
      </div>
    </>
  );
}

function GynaInner() {
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [view, setView] = useState<GynaView>("prospects");
  const { setConfig } = useGyna();

  if (!onboardingComplete) {
    return (
      <OnboardingFlow
        onComplete={(cfg) => {
          setConfig(cfg);
          setOnboardingComplete(true);
        }}
      />
    );
  }

  return (
    <>
      <NavBar current={view} onChange={setView} />
      {view === "prospects" ? <Dashboard /> : <PlanScreen />}
    </>
  );
}
