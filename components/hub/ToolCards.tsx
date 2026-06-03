"use client";

import { useRouter } from "next/navigation";
import type { HubMetrics, ToolSignal } from "@/lib/hub/hubRepository";

// Données par défaut quand pas de métriques extraites
const defaultTools = [
  {
    href: "/astryd",
    logo: "/Astryd.png",
    logoHeight: "h-16",
    color: "#ff8f27",
    label: "Opérationnel",
    key: "astryd",
    defaultSignal: { status: "active" as const, signal: "Connectez Notion pour voir vos données", items: [] },
  },
  {
    href: "/elyse",
    logo: "/Elyse.png",
    logoHeight: "h-16",
    color: "#1cb785",
    label: "Finance",
    key: "elyse",
    defaultSignal: { status: "active" as const, signal: "Connectez Notion pour voir vos données", items: [] },
  },
  {
    href: "/gyna",
    logo: "/gyna.png",
    logoHeight: "h-16",
    color: "#9d89fc",
    label: "GTM",
    key: "gyna",
    defaultSignal: { status: "active" as const, signal: "Connectez Notion pour voir vos données", items: [] },
  },
];

const signalColor = {
  active: "#1cb785",
  warning: "#ff8f27",
  critical: "#ff4f3f",
};

export function ToolCards({ metrics }: { metrics?: HubMetrics }) {
  const router = useRouter();
  const toolSignals = metrics?.toolSignals ?? null;

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {defaultTools.map((tool) => {
        const { href, logo, logoHeight, color, label, key, defaultSignal } = tool;

        // Utiliser les signaux extraits si disponibles, sinon les défauts
        const signal: ToolSignal = (toolSignals?.[key] as ToolSignal) ?? defaultSignal;
        const dot = signalColor[signal.status];

        return (
          <div
            key={href}
            onClick={() => router.push(href)}
            className="bg-surface rounded-card shadow-card p-6 cursor-pointer hover:shadow-md transition-all duration-150 group flex flex-col gap-4"
            style={{ borderLeft: `3px solid ${color}` }}
          >
            {/* Header : logo + label */}
            <div className="flex items-center justify-between">
              <img src={logo} alt={label} className={`${logoHeight} w-auto object-contain`} />
              <span className="font-sans text-xs font-medium text-muted bg-bg px-2.5 py-1 rounded-full border border-border">
                {label}
              </span>
            </div>

            {/* Signal fort */}
            <div className="flex items-start gap-2.5">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                style={{ background: dot }}
              />
              <span className="font-sans text-sm font-semibold text-fg leading-snug">
                {signal.signal}
              </span>
            </div>

            {/* Items */}
            {signal.items.length > 0 && (
              <div className="flex flex-col gap-2 border-t border-border pt-3">
                {signal.items.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-muted text-xs mt-0.5 flex-shrink-0">→</span>
                    <span className="font-sans text-xs text-muted leading-snug">{item}</span>
                  </div>
                ))}
              </div>
            )}

            {/* CTA */}
            <div className="mt-auto">
              <span className="font-sans text-xs font-medium group-hover:underline" style={{ color }}>
                Ouvrir →
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
