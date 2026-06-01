"use client";

import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import type { CohortMemberDetail } from "@/types";

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  actif: { label: "Actif", color: "#1cb785", bg: "rgba(28,183,133,0.1)" },
  inactif: { label: "Inactif", color: "#ff8f27", bg: "rgba(255,143,39,0.1)" },
  alerte: { label: "Alerte", color: "#ff4f3f", bg: "rgba(255,79,63,0.1)" },
};

function formatDateFR(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

interface Props {
  member: CohortMemberDetail;
}

export function EntrepreneurHeader({ member }: Props) {
  const status = STATUS_LABEL[member.status];
  return (
    <div className="mb-8">
      <Link
        href="/org"
        className="inline-flex items-center gap-1.5 font-sans text-xs text-muted hover:text-fg transition-colors mb-4"
      >
        <ArrowLeft size={14} />
        Retour à la cohorte
      </Link>

      <div className="flex items-start gap-5">
        <div className="w-16 h-16 rounded-full bg-beige flex items-center justify-center flex-shrink-0">
          <span className="font-serif text-2xl text-muted" style={{ fontFamily: "DM Serif Display" }}>
            {member.first_name[0]}
            {member.last_name[0]}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-serif text-3xl text-fg leading-tight" style={{ fontFamily: "DM Serif Display" }}>
              {member.first_name} {member.last_name}
            </h1>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-sans text-xs font-medium"
              style={{ background: status.bg, color: status.color }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.color }} />
              {status.label}
            </span>
          </div>
          <p className="font-sans text-base text-fg mt-1">
            <span className="font-semibold">{member.project_name}</span> · {member.project_description}
          </p>
          <p className="font-sans text-xs text-muted mt-1">
            {member.sector} · stade {member.stage} · équipe de {member.team_size} · arrivé le{" "}
            {formatDateFR(member.joined_at)}
          </p>
        </div>
        <Link
          href={`/org/${member.id}/brief`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-fg text-white font-sans text-sm font-medium hover:opacity-90 transition-opacity flex-shrink-0"
        >
          <Sparkles size={14} />
          Brief pré-séance
        </Link>
      </div>

      {member.alert_reason && (
        <div className="mt-4 p-4 rounded-[20px] border border-red/30 bg-red/5">
          <p className="font-sans text-xs font-semibold text-red uppercase tracking-wide mb-1">
            Signal d'alerte
          </p>
          <p className="font-sans text-sm text-fg">{member.alert_reason}</p>
        </div>
      )}
    </div>
  );
}
