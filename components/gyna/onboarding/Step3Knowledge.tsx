import { Label } from "@/components/gyna/ui/label";
import { Textarea } from "@/components/gyna/ui/textarea";
import type { GynaConfig } from "@/lib/gyna/gyna-config";

type Props = {
  config: GynaConfig;
  update: (patch: Partial<GynaConfig>) => void;
};

export function Step3Knowledge({ config, update }: Props) {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-display font-semibold text-foreground">
          Ce que tu sais déjà.
        </h1>
        <p className="text-muted-foreground">Optionnel. Vraiment.</p>
      </header>

      <div className="space-y-2">
        <Label htmlFor="apprentissages">
          Si tu as déjà des intuitions sur ce qui marche ou ne marche pas — un
          type de structure à éviter, un canal qui convertit mieux — note-le
          ici. Sinon, laisse vide&nbsp;: Gyna apprendra avec toi.
        </Label>
        <Textarea
          id="apprentissages"
          value={config.apprentissagesInitiaux}
          onChange={(e) => update({ apprentissagesInitiaux: e.target.value })}
          rows={7}
          placeholder="Ce que tu as observé jusqu'ici…"
          className="resize-none"
          autoFocus
        />
        <p className="text-xs text-muted-foreground pt-1">
          Tu pourras toujours ajouter ou corriger ces apprentissages plus tard,
          à chaque fois que tu qualifies un prospect.
        </p>
      </div>
    </div>
  );
}