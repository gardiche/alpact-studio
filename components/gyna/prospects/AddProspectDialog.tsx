import { useState } from "react";
import { toast } from "sonner";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/gyna/ui/select";
import { Textarea } from "@/components/gyna/ui/textarea";
import { useGyna } from "@/lib/gyna/gyna-store";
import { SOURCES, TAILLES, type Source, type Taille } from "@/lib/gyna/prospects";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: (id: string) => void;
};

const empty = {
  prenom: "",
  nom: "",
  entreprise: "",
  role: "",
  email: "",
  telephone: "",
  secteur: "",
  taille: "" as Taille | "",
  source: "" as Source | "",
  recommandePar: "",
  contexte: "",
};

export function AddProspectDialog({ open, onOpenChange, onCreated }: Props) {
  const { addProspect } = useGyna();
  const [form, setForm] = useState({ ...empty });

  const canSubmit =
    form.prenom.trim() &&
    form.nom.trim() &&
    form.entreprise.trim() &&
    form.role.trim() &&
    form.taille &&
    form.source;

  const reset = () => setForm({ ...empty });

  const submit = () => {
    if (!canSubmit) return;
    const { prospect, excludedSuggested } = addProspect({
      prenom: form.prenom.trim(),
      nom: form.nom.trim(),
      entreprise: form.entreprise.trim(),
      role: form.role.trim(),
      email: form.email.trim() || undefined,
      telephone: form.telephone.trim() || undefined,
      secteur: form.secteur.trim(),
      taille: form.taille as Taille,
      source: form.source as Source,
      recommandePar: form.recommandePar.trim() || undefined,
      contexte: form.contexte.trim(),
    });
    if (excludedSuggested) {
      toast.warning("Gyna suggère d'exclure ce prospect", {
        description:
          "Le contexte contient des signaux que tu as déjà associés à des exclusions passées. Vérifie sur la fiche.",
      });
    } else {
      toast.success("Prospect ajouté", {
        description: `Score initial : ${prospect.scoreDetail.total}/100`,
      });
    }
    reset();
    onOpenChange(false);
    onCreated?.(prospect.id);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Ajouter un prospect</DialogTitle>
          <DialogDescription>
            Remplis ce que tu sais. Le score se calcule à l'ajout.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prénom *">
              <Input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
            </Field>
            <Field label="Nom *">
              <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
            </Field>
          </div>

          <Field label="Entreprise *">
            <Input value={form.entreprise} onChange={(e) => setForm({ ...form, entreprise: e.target.value })} />
          </Field>

          <Field label="Rôle / Fonction *">
            <Input
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              placeholder="Ex : Directrice partenariats"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Téléphone">
              <Input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
            </Field>
          </div>

          <Field label="Secteur / Industrie">
            <Input value={form.secteur} onChange={(e) => setForm({ ...form, secteur: e.target.value })} placeholder="Texte libre" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Taille de l'entreprise *">
              <Select value={form.taille || undefined} onValueChange={(v) => setForm({ ...form, taille: v as Taille })}>
                <SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger>
                <SelectContent>
                  {TAILLES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Source du contact *">
              <Select value={form.source || undefined} onValueChange={(v) => setForm({ ...form, source: v as Source })}>
                <SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {form.source === "Référence" && (
            <Field label="Recommandé par">
              <Input value={form.recommandePar} onChange={(e) => setForm({ ...form, recommandePar: e.target.value })} placeholder="Nom de la personne" />
            </Field>
          )}

          <div className="space-y-2 pt-2 border-t border-border">
            <Label htmlFor="contexte">
              Colle ici tout ce que tu sais — extrait LinkedIn, notes d'appel,
              contexte de la recommandation, post qu'il a publié.
              <span className="block font-normal text-muted-foreground text-xs mt-0.5">
                Plus tu en mets, plus Gyna affine le score.
              </span>
            </Label>
            <Textarea
              id="contexte"
              value={form.contexte}
              onChange={(e) => setForm({ ...form, contexte: e.target.value })}
              rows={6}
              className="resize-none"
              placeholder="Texte libre, écris comme tu penses…"
            />
            <p className="text-xs text-muted-foreground">
              Gyna analyse ce texte pour détecter des signaux — pas besoin de structurer.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => { reset(); onOpenChange(false); }}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            Ajouter et scorer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground font-mono">{label}</Label>
      {children}
    </div>
  );
}