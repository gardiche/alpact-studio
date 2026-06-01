"use client";

import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
  accent?: string;
}

export function BriefSection({ title, subtitle, children, accent }: Props) {
  return (
    <section
      className="bg-surface rounded-[20px] p-6 print:rounded-none print:shadow-none print:border print:border-border"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
    >
      <div className="flex items-baseline justify-between mb-3 pb-3 border-b border-border">
        <h2
          className="font-serif text-lg text-fg"
          style={{ fontFamily: "DM Serif Display", color: accent ?? "#111" }}
        >
          {title}
        </h2>
        {subtitle && (
          <span className="font-sans text-xs text-muted">{subtitle}</span>
        )}
      </div>
      {children}
    </section>
  );
}
