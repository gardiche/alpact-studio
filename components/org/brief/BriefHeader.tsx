"use client";

import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import type { CohortMemberDetail } from "@/types";

function formatDateLong(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

interface Props {
  member: CohortMemberDetail;
}

export function BriefHeader({ member }: Props) {
  const session = member.next_session;
  return (
    <header className="mb-8">
      <div className="flex items-center justify-between mb-5 print:hidden">
        <Link
          href={`/org/${member.id}`}
          className="inline-flex items-center gap-1.5 font-sans text-xs text-muted hover:text-fg transition-colors"
        >
          <ArrowLeft size={14} />
          Retour à la fiche
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-fg text-white font-sans text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Printer size={14} />
          Imprimer / PDF
        </button>
      </div>

      <p className="font-sans text-xs uppercase tracking-wide text-muted mb-1">
        Brief pré-séance
      </p>
      <h1
        className="font-serif text-3xl text-fg leading-tight"
        style={{ fontFamily: "DM Serif Display" }}
      >
        {member.first_name} {member.last_name}
      </h1>
      <p className="font-sans text-sm text-fg mt-1">
        <span className="font-semibold">{member.project_name}</span> · {member.sector} · stade{" "}
        {member.stage}
      </p>

      {session && (
        <div className="mt-4 p-4 rounded-[20px] border border-border bg-bg/40">
          <p className="font-sans text-xs uppercase tracking-wide text-muted mb-0.5">
            Prochaine séance
          </p>
          <p className="font-sans text-sm text-fg">
            <span className="font-semibold capitalize">{formatDateLong(session.scheduled_at)}</span> à{" "}
            {formatTime(session.scheduled_at)} · {session.duration_min} min · {session.kind}
          </p>
        </div>
      )}
    </header>
  );
}
