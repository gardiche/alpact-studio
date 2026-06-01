"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  WizardState,
  RevenueLineForm,
  GrowthHypothesisForm,
  TeamMemberForm,
  FixedCostForm,
  VariableCostForm,
  TreasuryForm,
  BpContextForm,
  Project,
} from "@/types/business-plan";

function defaultTreasury(): TreasuryForm {
  return {
    cash_balance: null,
    fundraising_amount: null,
    fundraising_date: null,
    has_loans: false,
    outstanding_loans: [],
    pending_grants: null,
    accounts_receivable: null,
    payment_delay_clients_days: 30,
    payment_delay_suppliers_days: 30,
    source: "user_input",
  };
}

function defaultBpContext(): BpContextForm {
  return {
    target_audience: undefined,
    funding_amount_requested: null,
    funding_usage: "",
    deadline: null,
    market_context: "",
    competitive_advantage: "",
    team_narrative: "",
  };
}

interface BusinessPlanStore extends WizardState {
  // Navigation
  goToBlock: (block: number) => void;
  markBlockComplete: (block: number) => void;

  // Project
  setProject: (fields: Partial<Pick<WizardState, "projectName" | "projectDescription" | "businessType" | "stage">>) => void;

  // Revenue lines
  addRevenueLine: (line: RevenueLineForm) => void;
  updateRevenueLine: (id: string, fields: Partial<RevenueLineForm>) => void;
  removeRevenueLine: (id: string) => void;

  // Growth hypotheses
  addGrowthHypothesis: (hyp: GrowthHypothesisForm) => void;
  updateGrowthHypothesis: (id: string, fields: Partial<GrowthHypothesisForm>) => void;

  // Team
  addTeamMember: (member: TeamMemberForm) => void;
  updateTeamMember: (id: string, fields: Partial<TeamMemberForm>) => void;
  removeTeamMember: (id: string) => void;

  // Fixed costs
  addFixedCost: (cost: FixedCostForm) => void;
  updateFixedCost: (id: string, fields: Partial<FixedCostForm>) => void;
  removeFixedCost: (id: string) => void;

  // Variable costs
  addVariableCost: (cost: VariableCostForm) => void;
  updateVariableCost: (id: string, fields: Partial<VariableCostForm>) => void;
  removeVariableCost: (id: string) => void;

  // Treasury
  setTreasury: (fields: Partial<TreasuryForm>) => void;

  // BP Context
  setBpContext: (fields: Partial<BpContextForm>) => void;

  // Reset
  resetWizard: () => void;

  // Computed helpers
  getCompletenessScore: () => number;
}

const initialState: WizardState = {
  projectId: null,
  currentBlock: 0,
  completedBlocks: [],
  projectName: "",
  projectDescription: "",
  businessType: undefined,
  stage: undefined,
  revenueLines: [],
  growthHypotheses: [],
  teamMembers: [],
  fixedCosts: [],
  variableCosts: [],
  treasury: defaultTreasury(),
  bpContext: defaultBpContext(),
};

export const useBusinessPlanStore = create<BusinessPlanStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      goToBlock: (block) => set({ currentBlock: block }),

      markBlockComplete: (block) =>
        set((s) => ({
          completedBlocks: s.completedBlocks.includes(block)
            ? s.completedBlocks
            : [...s.completedBlocks, block],
        })),

      setProject: (fields) => set(fields),

      addRevenueLine: (line) =>
        set((s) => ({ revenueLines: [...s.revenueLines, line] })),
      updateRevenueLine: (id, fields) =>
        set((s) => ({
          revenueLines: s.revenueLines.map((l) => (l.id === id ? { ...l, ...fields } : l)),
        })),
      removeRevenueLine: (id) =>
        set((s) => ({
          revenueLines: s.revenueLines.filter((l) => l.id !== id),
          growthHypotheses: s.growthHypotheses.filter((h) => h.revenue_line_id !== id),
        })),

      addGrowthHypothesis: (hyp) =>
        set((s) => ({ growthHypotheses: [...s.growthHypotheses, hyp] })),
      updateGrowthHypothesis: (id, fields) =>
        set((s) => ({
          growthHypotheses: s.growthHypotheses.map((h) =>
            h.id === id ? { ...h, ...fields } : h
          ),
        })),

      addTeamMember: (member) =>
        set((s) => ({ teamMembers: [...s.teamMembers, member] })),
      updateTeamMember: (id, fields) =>
        set((s) => ({
          teamMembers: s.teamMembers.map((m) => (m.id === id ? { ...m, ...fields } : m)),
        })),
      removeTeamMember: (id) =>
        set((s) => ({ teamMembers: s.teamMembers.filter((m) => m.id !== id) })),

      addFixedCost: (cost) =>
        set((s) => ({ fixedCosts: [...s.fixedCosts, cost] })),
      updateFixedCost: (id, fields) =>
        set((s) => ({
          fixedCosts: s.fixedCosts.map((c) => (c.id === id ? { ...c, ...fields } : c)),
        })),
      removeFixedCost: (id) =>
        set((s) => ({ fixedCosts: s.fixedCosts.filter((c) => c.id !== id) })),

      addVariableCost: (cost) =>
        set((s) => ({ variableCosts: [...s.variableCosts, cost] })),
      updateVariableCost: (id, fields) =>
        set((s) => ({
          variableCosts: s.variableCosts.map((c) => (c.id === id ? { ...c, ...fields } : c)),
        })),
      removeVariableCost: (id) =>
        set((s) => ({ variableCosts: s.variableCosts.filter((c) => c.id !== id) })),

      setTreasury: (fields) =>
        set((s) => ({ treasury: { ...s.treasury, ...fields } })),

      setBpContext: (fields) =>
        set((s) => ({ bpContext: { ...s.bpContext, ...fields } })),

      resetWizard: () => set(initialState),

      getCompletenessScore: () => {
        const s = get();
        let score = 0;
        const total = 7;
        if (s.revenueLines.length > 0) score++;
        if (s.growthHypotheses.length > 0) score++;
        if (s.teamMembers.length > 0) score++;
        if (s.fixedCosts.length > 0) score++;
        if (s.variableCosts.length > 0 || s.fixedCosts.length > 0) score++;
        if (s.treasury.cash_balance !== null) score++;
        if (s.bpContext.target_audience) score++;
        return Math.round((score / total) * 100);
      },
    }),
    {
      name: "alpact_bp_wizard",
    }
  )
);
