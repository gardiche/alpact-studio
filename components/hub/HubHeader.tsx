"use client";

import { useAppStore } from "@/lib/store/useAppStore";

function getSalut() {
  return new Date().getHours() >= 18 ? "Bonsoir," : "Bonjour,";
}

function getFormattedDate() {
  return new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function HubHeader() {
  const user = useAppStore((s) => s.user);
  const firstName = user?.first_name ?? user?.email?.split("@")[0] ?? "vous";

  return (
    <div className="mb-8">
      <h1 className="font-serif text-5xl text-fg" style={{ fontFamily: 'DM Serif Display', fontSize: 48, lineHeight: 1.1 }}>
        {getSalut()} <span style={{ position: 'relative', display: 'inline-block' }}>
          {firstName}.
          <img src="/s1.svg" alt="" style={{ position: 'absolute', left: 0, bottom: -14, width: '140%' }} />
        </span>
      </h1>
      <div style={{ marginBottom: 8, marginTop: 20 }} />
      <p className="font-sans text-sm text-muted capitalize">
        {getFormattedDate()}
      </p>
    </div>
  );
}
