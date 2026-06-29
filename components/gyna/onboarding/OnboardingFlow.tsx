import { useState } from "react";

import { Button } from "@/components/gyna/ui/button";
import { emptyConfig, type GynaConfig } from "@/lib/gyna/gyna-config";

import { OnboardingDone } from "./OnboardingDone";
import { ProgressBar } from "./ProgressBar";
import { Step1Identity } from "./Step1Identity";
import { Step2Objectives } from "./Step2Objectives";
import { Step3Knowledge } from "./Step3Knowledge";
import { Step4Channels } from "./Step4Channels";

type Props = {
  onComplete: (config: GynaConfig) => void;
};

const TOTAL_STEPS = 4;

export function OnboardingFlow({ onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [config, setConfig] = useState<GynaConfig>(emptyConfig);

  const update = (patch: Partial<GynaConfig>) =>
    setConfig((c) => ({ ...c, ...patch }));

  const canSkip = step > 1 && step <= TOTAL_STEPS;

  const canAdvance = (() => {
    switch (step) {
      case 1:
        return config.produit.trim().length > 0 && config.ciblePhrase.trim().length > 0;
      case 2:
        return (
          config.objectifs.rdv !== null &&
          config.objectifs.closings !== null &&
          config.objectifs.echeance !== null
        );
      case 3:
        return true;
      case 4:
        return config.canaux.length > 0;
      default:
        return false;
    }
  })();

  const goNext = () => {
    if (step < TOTAL_STEPS) setStep(step + 1);
    else setDone(true);
  };
  const goBack = () => setStep((s) => Math.max(1, s - 1));
  const skip = () => {
    if (step < TOTAL_STEPS) setStep(step + 1);
    else setDone(true);
  };

  if (done) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <OnboardingDone onFinish={() => onComplete(config)} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-10 flex items-center justify-between">
          <img src="/gyna.svg" alt="Gyna" className="h-28 w-auto object-contain" />
        </div>

        <div className="mb-10">
          <ProgressBar current={step} total={TOTAL_STEPS} />
        </div>

        <div className="min-h-[420px]">
          {step === 1 && <Step1Identity config={config} update={update} />}
          {step === 2 && <Step2Objectives config={config} update={update} />}
          {step === 3 && <Step3Knowledge config={config} update={update} />}
          {step === 4 && <Step4Channels config={config} update={update} />}
        </div>

        <div className="mt-10 flex items-center justify-between gap-4 border-t border-border pt-6">
          <div>
            {step > 1 && (
              <Button variant="ghost" onClick={goBack}>
                Précédent
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {canSkip && (
              <Button variant="ghost" onClick={skip} className="text-muted-foreground">
                Passer pour l'instant
              </Button>
            )}
            <Button onClick={goNext} disabled={!canAdvance}>
              {step === TOTAL_STEPS ? "Terminer" : "Suivant"}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
