import { Checkbox } from "@/components/gyna/ui/checkbox";
import { Input } from "@/components/gyna/ui/input";
import { Label } from "@/components/gyna/ui/label";
import { CANAUX_DISPONIBLES, type GynaConfig } from "@/lib/gyna/gyna-config";

type Props = {
  config: GynaConfig;
  update: (patch: Partial<GynaConfig>) => void;
};

function parseNum(v: string): number | null {
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function Step4Channels({ config, update }: Props) {
  const isChecked = (nom: string) =>
    config.canaux.some((c) => c.nom === nom);

  const toggle = (nom: string, checked: boolean) => {
    if (checked) {
      update({ canaux: [...config.canaux, { nom, tauxReponse: null }] });
    } else {
      update({ canaux: config.canaux.filter((c) => c.nom !== nom) });
    }
  };

  const setTaux = (nom: string, taux: number | null) => {
    update({
      canaux: config.canaux.map((c) =>
        c.nom === nom ? { ...c, tauxReponse: taux } : c,
      ),
    });
  };

  const setRelances = (patch: Partial<GynaConfig["relances"]>) =>
    update({ relances: { ...config.relances, ...patch } });

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-display font-semibold text-foreground">
          Tes canaux disponibles.
        </h1>
        <p className="text-muted-foreground">
          Coche ceux que tu utilises. Renseigne un taux si tu en as un.
        </p>
      </header>

      <div className="space-y-3">
        {CANAUX_DISPONIBLES.map((nom) => {
          const checked = isChecked(nom);
          const canal = config.canaux.find((c) => c.nom === nom);
          return (
            <div
              key={nom}
              className="rounded-lg border border-border bg-card p-4 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  id={`canal-${nom}`}
                  checked={checked}
                  onCheckedChange={(v) => toggle(nom, v === true)}
                />
                <Label
                  htmlFor={`canal-${nom}`}
                  className="cursor-pointer text-foreground font-medium"
                >
                  {nom}
                </Label>
              </div>
              {checked && (
                <div className="mt-3 pl-7 space-y-1">
                  <Label
                    htmlFor={`taux-${nom}`}
                    className="text-xs text-muted-foreground"
                  >
                    Taux de réponse observé jusqu'ici (%)
                  </Label>
                  <Input
                    id={`taux-${nom}`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={100}
                    value={canal?.tauxReponse ?? ""}
                    onChange={(e) =>
                      setTaux(nom, parseNum(e.target.value))
                    }
                    placeholder="Pas encore de données ? Laisse vide."
                    className="font-mono max-w-xs"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <div>
          <h2 className="font-display font-semibold text-foreground">
            Ta politique de relance.
          </h2>
          <p className="text-sm text-muted-foreground">
            Combien de fois tu relances, et à quel rythme. Tu pourras toujours changer.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="nb-relances" className="text-xs text-muted-foreground">
              Nombre de relances
            </Label>
            <Input
              id="nb-relances"
              type="number"
              inputMode="numeric"
              min={0}
              max={5}
              value={config.relances.nombre}
              onChange={(e) =>
                setRelances({ nombre: Math.max(0, parseNum(e.target.value) ?? 0) })
              }
              className="font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="delai-relances" className="text-xs text-muted-foreground">
              Délai entre chaque relance (jours)
            </Label>
            <Input
              id="delai-relances"
              type="number"
              inputMode="numeric"
              min={1}
              max={30}
              value={config.relances.delaiJours}
              onChange={(e) =>
                setRelances({ delaiJours: Math.max(1, parseNum(e.target.value) ?? 1) })
              }
              className="font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
}