import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronDown, ChevronUp, MinusCircle, PlusCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ConfidenceGauge } from "@/components/gyna/ConfidenceGauge";
import { StatusBadge } from "@/components/gyna/prospects/StatusBadge";
import { Button } from "@/components/gyna/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/gyna/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/gyna/ui/sheet";
import { Textarea } from "@/components/gyna/ui/textarea";
import { useGyna } from "@/lib/gyna/gyna-store";
import { NEGATIVE_STATUSES, POSITIVE_STATUSES, STATUSES, type Prospect, type Status } from "@/lib/gyna/prospects";
import { cn } from "@/lib/gyna/utils";

type Props = {
  prospectId: string | null;
  onOpenChange: (open: boolean) => void;
};

export function ProspectDetailSheet({ prospectId, onOpenChange }: Props) {
  const { prospects, updateStatus, addNote, recomputeAllScores } = useGyna();
  const prospect = prospects.find((p) => p.id === prospectId) ?? null;

  const [pendingNegative, setPendingNegative] = useState<Status | null>(null);
  const [reason, setReason] = useState("");
  const [noteText, setNoteText] = useState("");
  const [whyOpen, setWhyOpen] = useState(false);

  // Reset transient UI when switching prospects.
  useEffect(() => {
    setPendingNegative(null);
    setReason("");
    setNoteText("");
    setWhyOpen(false);
  }, [prospectId]);

  if (!prospect) {
    return (
      <Sheet open={false} onOpenChange={onOpenChange}>
        <SheetContent />
      </Sheet>
    );
  }

  const handleStatusClick = (s: Status) => {
    if (s === prospect.status) return;
    if (NEGATIVE_STATUSES.includes(s)) {
      setPendingNegative(s);
      return;
    }
    updateStatus(prospect.id, s);
    if (POSITIVE_STATUSES.includes(s)) {
      toast.success("Bravo — Gyna apprend de ce succès", {
        description: "Le pattern de ce prospect est intégré aux prochains scores.",
      });
      // Trigger a recompute so new patterns reflect immediately.
      setTimeout(() => recomputeAllScores(), 50);
    }
  };

  const confirmNegative = () => {
    if (!pendingNegative) return;
    updateStatus(prospect.id, pendingNegative, reason.trim() || undefined);
    toast(`Marqué "${pendingNegative}"`, {
      description:
        pendingNegative === "Exclu" && reason.trim()
          ? "Gyna a appris les mots-clés de ton retour."
          : "Gyna intègre ce retour dans les prochains scores.",
    });
    setPendingNegative(null);
    setReason("");
    setTimeout(() => recomputeAllScores(), 50);
  };

  const submitNote = () => {
    const t = noteText.trim();
    if (!t) return;
    addNote(prospect.id, t);
    setNoteText("");
  };

  const positives = prospect.scoreDetail.factors.filter((f) => f.positive);
  const negatives = prospect.scoreDetail.factors.filter((f) => !f.positive);

  return (
    <>
      <Sheet open onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <SheetTitle className="sr-only">Fiche prospect</SheetTitle>
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-semibold text-foreground">
                    {prospect.prenom} {prospect.nom}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {prospect.role} · {prospect.entreprise}
                  </p>
                </div>
                <StatusBadge status={prospect.status} />
              </div>

              <div className="pt-2">
                <ConfidenceGauge score={prospect.scoreDetail.total} label="Score Gyna" />
              </div>

              <div>
                {prospect.scoreDetail.phase === 1 ? (
                  <span className="inline-block rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                    Score provisoire — Gyna a besoin de plus de retours pour affiner
                  </span>
                ) : (
                  <button
                    onClick={() => setWhyOpen((v) => !v)}
                    className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-[11px] text-primary hover:bg-primary/15 transition-colors"
                  >
                    Score affiné par l'historique
                    {whyOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    <span className="ml-1 text-primary/70">voir pourquoi</span>
                  </button>
                )}
              </div>
            </div>
          </SheetHeader>

          <div className="px-6 py-6 space-y-6">
            {/* Why this score */}
            <Section title="Pourquoi ce score">
              {(whyOpen || prospect.scoreDetail.phase === 1) ? (
                <ul className="space-y-1.5">
                  {positives.map((f, i) => (
                    <FactorRow key={`p${i}`} factor={f} />
                  ))}
                  {negatives.map((f, i) => (
                    <FactorRow key={`n${i}`} factor={f} />
                  ))}
                  {prospect.scoreDetail.factors.length === 0 && (
                    <li className="text-sm text-muted-foreground">Aucun signal détecté.</li>
                  )}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Clique sur "voir pourquoi" ci-dessus pour voir le détail.
                </p>
              )}
            </Section>

            {/* Meta */}
            <Section title="Informations">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <Meta label="Source">{prospect.source}{prospect.recommandePar ? ` · ${prospect.recommandePar}` : ""}</Meta>
                <Meta label="Canal recommandé">{prospect.canalRecommande}</Meta>
                <Meta label="Secteur">{prospect.secteur || "—"}</Meta>
                <Meta label="Taille">{prospect.taille}</Meta>
                <Meta label="Email">{prospect.email || "—"}</Meta>
                <Meta label="Téléphone">{prospect.telephone || "—"}</Meta>
              </div>
            </Section>

            {/* Contexte */}
            <Section title="Contexte">
              {prospect.contexte ? (
                <p className="whitespace-pre-wrap text-sm text-foreground leading-relaxed rounded-lg border border-border bg-muted/40 p-4">
                  {prospect.contexte}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Aucun contexte saisi.</p>
              )}
            </Section>

            {/* Status selector */}
            <Section title="Statut">
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusClick(s)}
                    className={cn(
                      "transition-opacity",
                      s === prospect.status ? "opacity-100" : "opacity-60 hover:opacity-100",
                    )}
                  >
                    <StatusBadge status={s} />
                  </button>
                ))}
              </div>
              {prospect.history.length > 1 && (
                <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {prospect.history.slice().reverse().map((h, i) => (
                    <li key={i} className="font-mono">
                      {format(new Date(h.at), "d MMM yyyy HH:mm", { locale: fr })}
                      <span className="ml-2 text-foreground">→ {h.status}</span>
                      {h.reason && <span className="ml-2 italic">"{h.reason}"</span>}
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {/* Notes */}
            <Section title="Notes">
              <div className="space-y-3">
                {prospect.notes.length > 0 && (
                  <ul className="space-y-2">
                    {prospect.notes.slice().reverse().map((n, i) => (
                      <li key={i} className="rounded-md border border-border bg-card p-3">
                        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                          {format(new Date(n.at), "d MMM yyyy · HH:mm", { locale: fr })}
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{n.text}</p>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="space-y-2">
                  <Textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    rows={3}
                    placeholder="Ajouter une note…"
                    className="resize-none"
                  />
                  <div className="flex justify-end">
                    <Button size="sm" variant="outline" onClick={submitNote} disabled={!noteText.trim()}>
                      Ajouter la note
                    </Button>
                  </div>
                </div>
              </div>
            </Section>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={pendingNegative !== null} onOpenChange={(v) => { if (!v) { setPendingNegative(null); setReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">
              Pourquoi {pendingNegative === "Exclu" ? "exclure" : "marquer perdu"} ?
            </DialogTitle>
            <DialogDescription>
              Ton retour alimente l'apprentissage de Gyna pour les prochains prospects.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Ex : stagiaire, pas de budget, mauvais timing…"
            className="resize-none"
            autoFocus
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setPendingNegative(null); setReason(""); }}>
              Annuler
            </Button>
            <Button onClick={confirmNegative}>Confirmer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-foreground">{children}</div>
    </div>
  );
}

function FactorRow({ factor }: { factor: { label: string; points: number; positive: boolean } }) {
  return (
    <li className="flex items-center justify-between gap-3 text-sm">
      <span className="flex items-center gap-2">
        {factor.positive ? (
          <PlusCircle className="h-3.5 w-3.5 text-[color:var(--success)]" />
        ) : (
          <MinusCircle className="h-3.5 w-3.5 text-destructive" />
        )}
        <span className="text-foreground">{factor.label}</span>
      </span>
      <span
        className={cn(
          "font-mono tabular-nums",
          factor.positive ? "text-[color:var(--success)]" : "text-destructive",
        )}
      >
        {factor.points > 0 ? "+" : ""}
        {factor.points}
      </span>
    </li>
  );
}