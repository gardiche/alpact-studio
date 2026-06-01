"use client";

import { useEffect } from "react";
import { useOrgStore } from "@/lib/store/useOrgStore";
import { OrgSidebar } from "./OrgSidebar";
import type { Organization, OrgMembership } from "@/types";

interface OrgShellClientProps {
  org: Organization;
  member: OrgMembership;
  children: React.ReactNode;
}

export function OrgShellClient({ org, member, children }: OrgShellClientProps) {
  const { setOrg, setMember, copilotOpen } = useOrgStore();

  useEffect(() => {
    setOrg(org);
    setMember(member);
  }, [org, member, setOrg, setMember]);

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <OrgSidebar />

      <main
        className={`
          flex-1 overflow-y-auto bg-bg
          transition-all duration-300
          ${copilotOpen ? "mr-[380px]" : ""}
        `}
      >
        {children}
      </main>

      {/* Co-pilote IA (placeholder léger) */}
      {copilotOpen && (
        <aside className="fixed right-0 top-0 h-screen w-[380px] bg-surface border-l border-border z-40 flex flex-col">
          <div className="px-6 py-5 border-b border-border">
            <h2 className="font-serif text-xl text-fg">Co-pilote</h2>
            <p className="font-sans text-xs text-muted mt-0.5">Vue cohorte · {org.name}</p>
          </div>
          <div className="flex-1 p-6">
            <p className="font-sans text-sm text-muted">
              Préparation d'entretien, détection de signaux faibles, synthèse de cohorte —
              bientôt disponible.
            </p>
          </div>
        </aside>
      )}
    </div>
  );
}
