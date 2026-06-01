"use client";

import { create } from "zustand";
import type { Organization, OrgMembership } from "@/types";

interface OrgState {
  org: Organization | null;
  member: OrgMembership | null;
  copilotOpen: boolean;

  setOrg: (org: Organization | null) => void;
  setMember: (member: OrgMembership | null) => void;
  toggleCopilot: () => void;
  closeCopilot: () => void;
}

export const useOrgStore = create<OrgState>((set) => ({
  org: null,
  member: null,
  copilotOpen: false,

  setOrg: (org) => set({ org }),
  setMember: (member) => set({ member }),
  toggleCopilot: () => set((s) => ({ copilotOpen: !s.copilotOpen })),
  closeCopilot: () => set({ copilotOpen: false }),
}));
