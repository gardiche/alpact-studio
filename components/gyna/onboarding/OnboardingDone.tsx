import { Button } from "@/components/gyna/ui/button";

type Props = {
  onFinish: () => void;
};

export function OnboardingDone({ onFinish }: Props) {
  return (
    <div className="space-y-8 text-center">
      <div className="space-y-3">
        <div className="font-mono text-xs uppercase tracking-widest text-success">
          Prêt
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-semibold text-foreground">
          Ton espace Gyna est prêt.
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Premier réflexe&nbsp;: ajoute un prospect, et dis-nous ce que tu sais
          de lui — Gyna fera le reste.
        </p>
      </div>
      <Button size="lg" onClick={onFinish} className="font-medium">
        Ajouter mon premier prospect
      </Button>
    </div>
  );
}