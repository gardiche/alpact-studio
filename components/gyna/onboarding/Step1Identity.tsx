import { Label } from "@/components/gyna/ui/label";
import { Textarea } from "@/components/gyna/ui/textarea";
import type { GynaConfig } from "@/lib/gyna/gyna-config";

type Props = {
  config: GynaConfig;
  update: (patch: Partial<GynaConfig>) => void;
};

export function Step1Identity({ config, update }: Props) {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-display font-semibold text-foreground">
          Commençons par toi.
        </h1>
        <p className="text-muted-foreground">
          Deux phrases suffisent. Tu pourras affiner plus tard.
        </p>
      </header>

      <div className="space-y-2">
        <Label htmlFor="produit" className="text-foreground">
          Que vends-tu&nbsp;?
        </Label>
        <Textarea
          id="produit"
          value={config.produit}
          onChange={(e) => update({ produit: e.target.value })}
          placeholder="Ex : une suite d'outils SaaS pour les structures qui accompagnent des entrepreneurs"
          rows={3}
          className="resize-none"
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cible" className="text-foreground">
          À qui, si tu devais le dire en une phrase&nbsp;?
        </Label>
        <Textarea
          id="cible"
          value={config.ciblePhrase}
          onChange={(e) => update({ ciblePhrase: e.target.value })}
          placeholder="Ex : aux structures d'accompagnement privées de taille moyenne"
          rows={3}
          className="resize-none"
        />
      </div>
    </div>
  );
}