import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/gyna/ui/button";
import { Calendar } from "@/components/gyna/ui/calendar";
import { Input } from "@/components/gyna/ui/input";
import { Label } from "@/components/gyna/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/gyna/ui/popover";
import { cn } from "@/lib/gyna/utils";
import type { GynaConfig } from "@/lib/gyna/gyna-config";

type Props = {
  config: GynaConfig;
  update: (patch: Partial<GynaConfig>) => void;
};

function parseNum(v: string): number | null {
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function Step2Objectives({ config, update }: Props) {
  const { objectifs } = config;
  const setObj = (patch: Partial<GynaConfig["objectifs"]>) =>
    update({ objectifs: { ...objectifs, ...patch } });

  const echeanceDate = objectifs.echeance ? new Date(objectifs.echeance) : undefined;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-display font-semibold text-foreground">
          Tes objectifs sur la période.
        </h1>
        <p className="text-muted-foreground">
          Un cap, pas un dogme.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="rdv">Nombre de RDV visés</Label>
          <Input
            id="rdv"
            type="number"
            inputMode="numeric"
            min={0}
            value={objectifs.rdv ?? ""}
            onChange={(e) => setObj({ rdv: parseNum(e.target.value) })}
            className="font-mono"
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="closings">Nombre de closings visés</Label>
          <Input
            id="closings"
            type="number"
            inputMode="numeric"
            min={0}
            value={objectifs.closings ?? ""}
            onChange={(e) => setObj({ closings: parseNum(e.target.value) })}
            className="font-mono"
            placeholder="0"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="echeance">Échéance</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="echeance"
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !echeanceDate && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {echeanceDate ? (
                <span className="font-mono">
                  {format(echeanceDate, "d MMMM yyyy", { locale: fr })}
                </span>
              ) : (
                <span>Choisis une date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={echeanceDate}
              onSelect={(d) =>
                setObj({ echeance: d ? d.toISOString() : null })
              }
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>

      <p className="text-sm text-muted-foreground border-l-2 border-border pl-3">
        Ces chiffres ne sont pas figés — Gyna les recalibre avec toi au fil des
        résultats.
      </p>
    </div>
  );
}