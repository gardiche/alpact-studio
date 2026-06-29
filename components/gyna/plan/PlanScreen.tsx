import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CalendarIcon,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  RefreshCw,
  Trophy,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfidenceGauge } from "@/components/gyna/ConfidenceGauge";
import { Button } from "@/components/gyna/ui/button";
import { Calendar } from "@/components/gyna/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/gyna/ui/popover";
import { useGyna } from "@/lib/gyna/gyna-store";
import {
  channelStats,
  isActiveForPlan,
  nextStep,
  stepStatus,
  synthesisPhrase,
  type BatchItem,
  type CanalStat,
  type PlanStep,
  type Priority,
} from "@/lib/gyna/plan";
import { learnedInsights, type Prospect } from "@/lib/gyna/prospects";
import { cn } from "@/lib/gyna/utils";

export function PlanScreen() {
  const {
    prospects, plans, today, batch, motsExclusAppris,
    markStepDone, postponeStep, removeExclusionWord, recalcAllPlans,
  } = useGyna();

  const stats = useMemo(() => channelStats(prospects), [prospects]);
  const synthese = useMemo(() => synthesisPhrase(stats), [stats]);

  const inSequence = useMemo(
    () => prospects.filter((p) => isActiveForPlan(p.status)),
    [prospects],
  );

  const [batchTick, setBatchTick] = useState(0);
  const recomputeBatch = () => {
    recalcAllPlans();
    setBatchTick((n) => n + 1);
    toast("Batch recalculé", {
      description: `${batch.length} action${batch.length > 1 ? "s" : ""} priorisée${batch.length > 1 ? "s" : ""}.`,
    });
  };

  return (
    <main className="bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12 space-y-10">
        <header>
          <h1 className="text-4xl sm:text-5xl font-display font-semibold text-foreground">
            Plan d'acquisition
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ce que tu peux faire cette semaine, classé par ce qui a le plus de chance de convertir chez toi.
          </p>
        </header>

        {/* SECTION 1 — channel insight */}
        <ChannelInsightBanner stats={stats} synthese={synthese} />

        {/* SECTION 2 — sequence per prospect */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-display font-semibold text-foreground">
              Séquence recommandée
            </h2>
            <p className="text-sm text-muted-foreground">
              {inSequence.length} prospect{inSequence.length > 1 ? "s" : ""} en séquence ou en attente d'approche.
            </p>
          </div>

          {inSequence.length === 0 ? (
            <EmptyCard text="Aucun prospect qualifié pour l'instant. Passe-en quelques uns en « Qualifié » depuis Tes prospects." />
          ) : (
            <ul className="space-y-3">
              {inSequence.map((p) => (
                <ProspectTimelineRow
                  key={p.id}
                  prospect={p}
                  steps={plans[p.id] ?? []}
                  today={today}
                  onMarkDone={(i) => {
                    markStepDone(p.id, i);
                    toast("Étape marquée comme faite", {
                      description: "Gyna replanifie la suivante automatiquement.",
                    });
                  }}
                  onPostpone={(i, d) => postponeStep(p.id, i, d)}
                />
              ))}
            </ul>
          )}
        </section>

        {/* SECTION 3 — daily batch */}
        <section className="space-y-4" key={batchTick}>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-display font-semibold text-foreground">
                À faire aujourd'hui
              </h2>
              <p className="text-sm text-muted-foreground font-mono">
                {batch.length} action{batch.length > 1 ? "s" : ""} priorisée{batch.length > 1 ? "s" : ""}
              </p>
            </div>
            <Button variant="outline" onClick={recomputeBatch} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Recalculer mon batch
            </Button>
          </div>

          {batch.length === 0 ? (
            <EmptyCard text="Rien à faire aujourd'hui. Profite, ou avance des prospects." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {batch.map((item) => (
                <BatchCard
                  key={item.prospect.id}
                  item={item}
                  onDone={() => {
                    markStepDone(item.prospect.id, item.stepIndex);
                    toast("Action validée", { description: "Belle exécution." });
                  }}
                  onPostpone={(d) => {
                    postponeStep(item.prospect.id, item.stepIndex, d);
                    toast("Action reportée");
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {/* SECTION 4 — learned knowledge */}
        <LearnedKnowledgePanel
          prospects={prospects}
          stats={stats}
          motsExclus={motsExclusAppris}
          onRemoveWord={(w) => {
            removeExclusionWord(w);
            toast(`"${w}" retiré des exclusions apprises`);
          }}
        />
      </div>
    </main>
  );
}

/* --------------------------------- Section 1 -------------------------------- */

function ChannelInsightBanner({
  stats,
  synthese,
}: {
  stats: CanalStat[];
  synthese: { text: string; hasWinner: boolean };
}) {
  return (
    <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-primary" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-primary">
          Ce qui marche pour toi
        </span>
      </div>

      {stats.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucun canal mesuré pour l'instant. Marque des prospects comme « RDV pris », « Closing », « Perdu » ou « Exclu » pour que Gyna calcule un taux.
        </p>
      ) : (
        <ol className="space-y-2">
          {stats.map((s, i) => {
            const pct = Math.round(s.rate * 100);
            return (
              <li key={s.canal} className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted-foreground w-5">#{i + 1}</span>
                <span className="font-medium text-foreground min-w-[120px]">{s.canal}</span>
                <div className="flex-1 h-1.5 rounded-full bg-primary/10 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-700"
                    style={{ width: `${Math.max(2, pct)}%` }}
                  />
                </div>
                <span className="font-mono text-xs text-foreground tabular-nums w-16 text-right">
                  {pct}%
                </span>
                <span className="font-mono text-[11px] text-muted-foreground w-24 text-right">
                  sur {s.total} prospect{s.total > 1 ? "s" : ""}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <p className={cn(
        "text-sm leading-relaxed border-l-2 pl-3",
        synthese.hasWinner
          ? "border-primary text-foreground"
          : "border-border text-muted-foreground",
      )}>
        {synthese.text}
      </p>
    </section>
  );
}

/* --------------------------------- Section 2 -------------------------------- */

function ProspectTimelineRow({
  prospect,
  steps,
  today,
  onMarkDone,
  onPostpone,
}: {
  prospect: Prospect;
  steps: PlanStep[];
  today: string;
  onMarkDone: (i: number) => void;
  onPostpone: (i: number, dateISO: string) => void;
}) {
  const nx = nextStep(steps);
  return (
    <li className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="font-medium text-foreground">
            {prospect.prenom} {prospect.nom}
          </div>
          <div className="text-xs text-muted-foreground">
            {prospect.entreprise} · {prospect.role}
          </div>
        </div>
        <div className="w-full sm:w-56">
          <ConfidenceGauge score={prospect.scoreDetail.total} label="Score" />
        </div>
      </div>

      {steps.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          Plan en cours de génération…
        </p>
      ) : (
        <ol className="flex flex-col sm:flex-row sm:items-stretch gap-3">
          {steps.map((s, i) => {
            const status = stepStatus(s, today);
            const isNext = !!nx && nx.index === i;
            return (
              <li
                key={i}
                className={cn(
                  "flex-1 rounded-lg border p-3 space-y-2 transition-colors",
                  s.done
                    ? "bg-muted/40 border-border"
                    : status === "En retard"
                      ? "border-destructive/40 bg-destructive/5"
                      : isNext
                        ? "border-primary/40 bg-primary/5"
                        : "border-border bg-card",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Étape {i + 1}
                  </span>
                  <StepStatusPill status={status} />
                </div>
                <div className="text-sm font-medium text-foreground">{s.canal}</div>
                <div className="font-mono text-[11px] text-muted-foreground">
                  {format(new Date(s.dueDate), "EEE d MMM", { locale: fr })}
                </div>
                {!s.done && isNext && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-1"
                    onClick={() => onMarkDone(i)}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Marquer comme fait
                  </Button>
                )}
                {!s.done && isNext && (
                  <PostponePopover
                    onPick={(d) => onPostpone(i, d.toISOString())}
                    trigger={
                      <Button size="sm" variant="ghost" className="w-full gap-1 text-muted-foreground">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        Reporter
                      </Button>
                    }
                  />
                )}
              </li>
            );
          })}
        </ol>
      )}
    </li>
  );
}

function StepStatusPill({ status }: { status: ReturnType<typeof stepStatus> }) {
  const cls =
    status === "Fait"
      ? "bg-[color:var(--success)]/10 text-[color:var(--success)]"
      : status === "En retard"
        ? "bg-destructive/10 text-destructive"
        : "bg-primary/10 text-primary";
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", cls)}>
      {status}
    </span>
  );
}

/* --------------------------------- Section 3 -------------------------------- */

function BatchCard({
  item,
  onDone,
  onPostpone,
}: {
  item: BatchItem;
  onDone: () => void;
  onPostpone: (dateISO: string) => void;
}) {
  const { prospect, step, overdueDays, priority } = item;
  const overdue = overdueDays > 0;
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 space-y-3",
        overdue ? "border-destructive/30" : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-medium text-foreground text-sm">
            {prospect.prenom} {prospect.nom}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {prospect.entreprise}
          </div>
        </div>
        <PriorityBadge priority={priority} overdue={overdue} />
      </div>

      <MiniGauge score={prospect.scoreDetail.total} />

      <div className="rounded-md bg-muted/40 px-3 py-2 text-sm">
        <div className="text-foreground font-medium">{step.canal}</div>
        <div className="flex items-center gap-1 mt-0.5 font-mono text-[11px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          {overdue
            ? `En retard de ${overdueDays}j`
            : `À faire aujourd'hui`}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" className="flex-1 gap-1" onClick={onDone}>
          <Check className="h-3.5 w-3.5" />
          Fait
        </Button>
        <PostponePopover
          onPick={(d) => onPostpone(d.toISOString())}
          trigger={
            <Button size="sm" variant="outline" className="flex-1 gap-1">
              <CalendarIcon className="h-3.5 w-3.5" />
              Reporter
            </Button>
          }
        />
      </div>
    </div>
  );
}

function PriorityBadge({ priority, overdue }: { priority: Priority; overdue: boolean }) {
  const cls =
    priority === "Haute" && overdue
      ? "bg-destructive/10 text-destructive border-destructive/30"
      : priority === "Haute"
        ? "bg-primary/10 text-primary border-primary/30"
        : priority === "Moyenne"
          ? "bg-foreground/5 text-foreground border-foreground/15"
          : "bg-muted text-muted-foreground border-border";
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap", cls)}>
      {priority}
    </span>
  );
}

function MiniGauge({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Score
        </span>
        <span className="font-mono text-xs text-foreground tabular-nums">{clamped.toFixed(0)}</span>
      </div>
      <div className="relative h-1.5 rounded-full bg-muted">
        <div
          className="absolute top-0 left-0 h-full rounded-full bg-primary/25 transition-all duration-700"
          style={{ width: `${clamped}%` }}
        />
        <div
          className="absolute -top-0.5 h-2.5 w-2.5 -ml-1 rounded-full bg-primary transition-all duration-700"
          style={{ left: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

function PostponePopover({
  onPick,
  trigger,
}: {
  onPick: (date: Date) => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="single"
          onSelect={(d) => {
            if (d) {
              onPick(d);
              setOpen(false);
            }
          }}
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}

/* --------------------------------- Section 4 -------------------------------- */

function LearnedKnowledgePanel({
  prospects,
  stats,
  motsExclus,
  onRemoveWord,
}: {
  prospects: Prospect[];
  stats: CanalStat[];
  motsExclus: string[];
  onRemoveWord: (w: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const qualifiedCount = prospects.filter((p) =>
    ["Qualifié", "En séquence", "RDV pris", "Closing"].includes(p.status),
  ).length;
  const insights = useMemo(() => learnedInsights(prospects).slice(0, 3), [prospects]);

  return (
    <section className="rounded-2xl border border-border bg-card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
      >
        <div className="flex items-center gap-2">
          <span className="font-display font-semibold text-foreground">
            Ce que Gyna a appris jusqu'ici
          </span>
          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
            transparence
          </span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-5 border-t border-border pt-4">
          <div>
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              Mots-clés à exclure
            </h3>
            {motsExclus.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun mot d'exclusion appris pour l'instant.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {motsExclus.map((w) => (
                  <li
                    key={w}
                    className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/5 px-2.5 py-1 text-xs text-destructive font-mono"
                  >
                    {w}
                    <button
                      onClick={() => onRemoveWord(w)}
                      className="ml-0.5 rounded-full hover:bg-destructive/10 p-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-destructive"
                      aria-label={`Retirer ${w} des exclusions`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              Patterns de conversion détectés
            </h3>
            {insights.length === 0 && stats.length < 2 ? (
              <p className="text-sm text-muted-foreground">
                Encore trop tôt — Gyna a besoin de plus de prospects finalisés pour formuler un pattern fiable.
              </p>
            ) : (
              <ul className="space-y-1.5 text-sm text-foreground list-disc pl-5">
                {insights.map((i, idx) => {
                  const pct = Math.round(i.rate * 100);
                  const base = Math.round(i.baseline * 100);
                  const sens = i.rate > i.baseline ? "mieux" : "moins bien";
                  const label =
                    i.field === "source" ? `Source ${i.value}` :
                    i.field === "taille" ? `Taille ${i.value}` :
                    `Profils mentionnant "${i.value}"`;
                  return (
                    <li key={idx}>
                      {label} convertit {sens} chez toi — {pct}% vs {base}% en moyenne ({i.total} prospect{i.total > 1 ? "s" : ""}).
                    </li>
                  );
                })}
                {insights.length === 0 && stats[0] && (
                  <li>
                    Canal le plus fort observé : {stats[0].canal} à {Math.round(stats[0].rate * 100)}% de conversion sur {stats[0].total} prospect{stats[0].total > 1 ? "s" : ""}.
                  </li>
                )}
              </ul>
            )}
          </div>

          <p className="font-mono text-xs text-muted-foreground border-t border-border pt-3">
            Basé sur {qualifiedCount} prospect{qualifiedCount > 1 ? "s" : ""} qualifié{qualifiedCount > 1 ? "s" : ""} au total.
          </p>
        </div>
      )}
    </section>
  );
}

/* ---------------------------------- shared ---------------------------------- */

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}