import { useState } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";

import { Button } from "@/components/gyna/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/gyna/ui/dialog";
import { Input } from "@/components/gyna/ui/input";
import { Label } from "@/components/gyna/ui/label";

type Props = { open: boolean; onOpenChange: (v: boolean) => void };

type Tool = {
  id: "hubspot" | "brevo";
  name: string;
  desc: string;
  hint: string;
};

const TOOLS: Tool[] = [
  {
    id: "hubspot",
    name: "HubSpot",
    desc: "Synchronise tes contacts et deals HubSpot.",
    hint: "Crée une Private App dans HubSpot, copie le token.",
  },
  {
    id: "brevo",
    name: "Brevo",
    desc: "Importe tes contacts Brevo et leurs interactions.",
    hint: "Profil → SMTP & API → Clé API v3.",
  },
];

export function ConnectCrmDialog({ open, onOpenChange }: Props) {
  const [selected, setSelected] = useState<Tool | null>(null);
  const [apiKey, setApiKey] = useState("");

  const reset = () => {
    setSelected(null);
    setApiKey("");
  };

  const connect = () => {
    if (!selected || !apiKey.trim()) return;
    toast.success(`${selected.name} connecté`, {
      description: "La synchro initiale démarre — tes contacts apparaîtront dans quelques minutes.",
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Connecter un CRM</DialogTitle>
          <DialogDescription>
            Gyna importe tes contacts et apprend de tes statuts existants.
          </DialogDescription>
        </DialogHeader>

        {!selected ? (
          <div className="space-y-2 py-2">
            {TOOLS.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelected(t)}
                className="w-full text-left rounded-xl border border-border bg-card p-4 hover:border-foreground/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">{t.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{t.desc}</div>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">Connecter →</div>
                </div>
              </button>
            ))}
            <p className="text-xs text-muted-foreground pt-2">
              Un autre outil ? Dis-le nous — on ajoute les intégrations selon la demande.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Check className="h-4 w-4 text-[color:var(--success)]" />
              <span className="font-medium">{selected.name}</span>
              <button
                onClick={() => setSelected(null)}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground underline"
              >
                changer
              </button>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
                Clé API {selected.name}
              </Label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Colle ta clé ici…"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">{selected.hint}</p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => { reset(); onOpenChange(false); }}>
            Annuler
          </Button>
          {selected && (
            <Button onClick={connect} disabled={!apiKey.trim()}>
              Connecter
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}