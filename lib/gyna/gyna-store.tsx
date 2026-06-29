import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { emptyConfig, type GynaConfig } from "./gyna-config";
import {
  buildBatch,
  channelStats,
  generatePlan,
  isActiveForPlan,
  type BatchItem,
  type CanalStat,
  type PlanStep,
} from "./plan";
import {
  buildDemoProspects,
  extractExclusionWords,
  initialExclusionWords,
  newId,
  now,
  recommendCanal,
  scoreProspect,
  type Prospect,
  type ScoreInput,
  type Source,
  type Status,
  type StatusEvent,
  type Taille,
} from "./prospects";

export type AddProspectInput = ScoreInput & {
  prenom: string;
  nom: string;
  entreprise: string;
  secteur: string;
  recommandePar?: string;
};

type Ctx = {
  config: GynaConfig;
  setConfig: (c: GynaConfig) => void;
  prospects: Prospect[];
  motsExclusAppris: string[];
  today: string;
  plans: Record<string, PlanStep[]>;
  channelStats: CanalStat[];
  batch: BatchItem[];
  addProspect: (input: AddProspectInput) => { prospect: Prospect; excludedSuggested: boolean };
  updateStatus: (id: string, status: Status, reason?: string) => void;
  addNote: (id: string, text: string) => void;
  recomputeAllScores: () => void;
  scoreDraft: (draft: ScoreInput) => ReturnType<typeof scoreProspect>;
  markStepDone: (prospectId: string, stepIndex: number) => void;
  postponeStep: (prospectId: string, stepIndex: number, newDateISO: string) => void;
  removeExclusionWord: (word: string) => void;
  recalcAllPlans: () => void;
  ensurePlanFor: (prospectId: string) => void;
};

const GynaContext = createContext<Ctx | null>(null);

const DAY = 86400_000;

function buildDemoPlans(prospects: Prospect[], config: GynaConfig): Record<string, PlanStep[]> {
  const stats = channelStats(prospects);
  const out: Record<string, PlanStep[]> = {};
  const now = Date.now();
  // Custom start offsets (days ago) so the demo batch is populated.
  const offsets: Record<string, number> = {
    p6: 6, // Vincent — Qualifié, first step overdue ~6d
    p7: 7, // Camille — En séquence
    p8: 0, // Hugo — Qualifié, due today
  };
  for (const p of prospects) {
    if (!isActiveForPlan(p.status)) continue;
    const off = offsets[p.id] ?? 0;
    const start = new Date(now - off * DAY).toISOString();
    const steps = generatePlan(p, config, stats, start);
    // Camille has already done step 1.
    if (p.id === "p7" && steps.length > 0) {
      steps[0] = { ...steps[0], done: true, doneAt: new Date(now - 6 * DAY).toISOString() };
    }
    out[p.id] = steps;
  }
  return out;
}

export function GynaProvider({ children, seed = true }: { children: ReactNode; seed?: boolean }) {
  const [config, setConfig] = useState<GynaConfig>(emptyConfig);
  const [prospects, setProspects] = useState<Prospect[]>(() =>
    seed ? buildDemoProspects() : [],
  );
  const [motsExclusAppris, setMotsExclusAppris] = useState<string[]>(() =>
    seed ? initialExclusionWords() : [],
  );
  const [today] = useState<string>(() => new Date().toISOString());
  const [plans, setPlans] = useState<Record<string, PlanStep[]>>(() =>
    seed ? buildDemoPlans(buildDemoProspects(), emptyConfig) : {},
  );

  const recomputeAllScores = useCallback(() => {
    setProspects((prev) => {
      const rebuilt: Prospect[] = [];
      for (const p of prev) {
        const { detail } = scoreProspect(
          {
            source: p.source, taille: p.taille, role: p.role,
            contexte: p.contexte, email: p.email, telephone: p.telephone,
          },
          rebuilt,
          motsExclusAppris,
        );
        rebuilt.push({
          ...p,
          scoreDetail: detail,
          canalRecommande: recommendCanal(p.source, rebuilt),
        });
      }
      return rebuilt;
    });
  }, [motsExclusAppris]);

  const addProspect = useCallback<Ctx["addProspect"]>((input) => {
    let created: Prospect | null = null;
    let excludedSuggested = false;
    setProspects((prev) => {
      const { detail, excluded } = scoreProspect(
        {
          source: input.source, taille: input.taille,
          role: input.role, contexte: input.contexte,
          email: input.email, telephone: input.telephone,
        },
        prev,
        motsExclusAppris,
      );
      excludedSuggested = excluded;
      const t = now();
      const p: Prospect = {
        id: newId(),
        createdAt: t,
        updatedAt: t,
        prenom: input.prenom,
        nom: input.nom,
        entreprise: input.entreprise,
        role: input.role,
        email: input.email,
        telephone: input.telephone,
        secteur: input.secteur,
        taille: input.taille,
        source: input.source,
        recommandePar: input.recommandePar,
        contexte: input.contexte,
        status: "À qualifier",
        history: [{ status: "À qualifier", at: t }],
        notes: [],
        scoreDetail: detail,
        canalRecommande: recommendCanal(input.source, prev),
      };
      created = p;
      return [p, ...prev];
    });
    return { prospect: created!, excludedSuggested };
  }, [motsExclusAppris]);

  const updateStatus = useCallback<Ctx["updateStatus"]>((id, status, reason) => {
    const t = now();
    const evt: StatusEvent = { status, at: t, reason };
    let learnedWords: string[] = [];
    if (status === "Exclu" && reason) {
      learnedWords = extractExclusionWords(reason);
    }
    if (learnedWords.length > 0) {
      setMotsExclusAppris((prev) => Array.from(new Set([...prev, ...learnedWords])));
    }
    setProspects((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status, updatedAt: t, history: [...p.history, evt] }
          : p,
      ),
    );
  }, []);

  const addNote = useCallback<Ctx["addNote"]>((id, text) => {
    const t = now();
    setProspects((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, updatedAt: t, notes: [...p.notes, { at: t, text }] }
          : p,
      ),
    );
  }, []);

  const scoreDraft = useCallback<Ctx["scoreDraft"]>(
    (draft) => scoreProspect(draft, prospects, motsExclusAppris),
    [prospects, motsExclusAppris],
  );

  const ensurePlanFor = useCallback<Ctx["ensurePlanFor"]>(
    (prospectId) => {
      setPlans((prev) => {
        if (prev[prospectId]) return prev;
        const p = prospects.find((x) => x.id === prospectId);
        if (!p || !isActiveForPlan(p.status)) return prev;
        const stats = channelStats(prospects);
        return { ...prev, [prospectId]: generatePlan(p, config, stats, today) };
      });
    },
    [prospects, config, today],
  );

  const recalcAllPlans = useCallback<Ctx["recalcAllPlans"]>(() => {
    const stats = channelStats(prospects);
    setPlans((prev) => {
      const next: Record<string, PlanStep[]> = {};
      for (const p of prospects) {
        if (!isActiveForPlan(p.status)) continue;
        const existing = prev[p.id];
        const start = existing?.[0]?.dueDate ?? today;
        const fresh = generatePlan(p, config, stats, start);
        if (existing) {
          for (let i = 0; i < fresh.length && i < existing.length; i++) {
            if (existing[i].done) {
              fresh[i] = { ...fresh[i], done: true, doneAt: existing[i].doneAt };
            }
          }
        }
        next[p.id] = fresh;
      }
      return next;
    });
  }, [prospects, config, today]);

  const markStepDone = useCallback<Ctx["markStepDone"]>((prospectId, stepIndex) => {
    const t = new Date().toISOString();
    setPlans((prev) => {
      const steps = prev[prospectId];
      if (!steps || !steps[stepIndex]) return prev;
      const updated = steps.map((s, i) =>
        i === stepIndex ? { ...s, done: true, doneAt: t } : s,
      );
      // Reschedule the next undone step to today + delaiJours.
      const nextIdx = updated.findIndex((s, i) => i > stepIndex && !s.done);
      if (nextIdx !== -1) {
        const delai = Math.max(1, config.relances?.delaiJours ?? 3);
        const newDue = new Date(Date.now() + delai * DAY).toISOString();
        updated[nextIdx] = { ...updated[nextIdx], dueDate: newDue };
      }
      return { ...prev, [prospectId]: updated };
    });
  }, [config.relances?.delaiJours]);

  const postponeStep = useCallback<Ctx["postponeStep"]>((prospectId, stepIndex, newDateISO) => {
    setPlans((prev) => {
      const steps = prev[prospectId];
      if (!steps || !steps[stepIndex]) return prev;
      const updated = steps.map((s, i) =>
        i === stepIndex ? { ...s, dueDate: newDateISO } : s,
      );
      return { ...prev, [prospectId]: updated };
    });
  }, []);

  const removeExclusionWord = useCallback<Ctx["removeExclusionWord"]>((word) => {
    setMotsExclusAppris((prev) => prev.filter((w) => w !== word));
  }, []);

  const stats = useMemo(() => channelStats(prospects), [prospects]);
  const batch = useMemo(() => buildBatch(prospects, plans, today), [prospects, plans, today]);

  const value = useMemo<Ctx>(
    () => ({
      config, setConfig,
      prospects, motsExclusAppris,
      today,
      plans,
      channelStats: stats,
      batch,
      addProspect, updateStatus, addNote,
      recomputeAllScores, scoreDraft,
      markStepDone, postponeStep, removeExclusionWord,
      recalcAllPlans, ensurePlanFor,
    }),
    [
      config, prospects, motsExclusAppris, today, plans, stats, batch,
      addProspect, updateStatus, addNote, recomputeAllScores, scoreDraft,
      markStepDone, postponeStep, removeExclusionWord, recalcAllPlans, ensurePlanFor,
    ],
  );

  return <GynaContext.Provider value={value}>{children}</GynaContext.Provider>;
}

export function useGyna() {
  const ctx = useContext(GynaContext);
  if (!ctx) throw new Error("useGyna must be used inside <GynaProvider />");
  return ctx;
}

// Re-export types used widely
export type { Prospect, Source, Status, Taille };