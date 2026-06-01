"use client";

import { useRouter } from "next/navigation";

const tools = [
  {
    href: "/astryd",
    logo: "/Astryd.png",
    logoHeight: "h-16",
    color: "#ff8f27",
    label: "Opérationnel",
    signal: { status: "active", text: "Pitch deck V2 en cours" },
    items: [
      { icon: "→", text: "3 actions prioritaires cette semaine" },
      { icon: "⏳", text: "À venir : call investisseur 28 avr." },
    ],
  },
  {
    href: "/elyse",
    logo: "/Elyse.png",
    logoHeight: "h-16",
    color: "#1cb785",
    label: "Finance",
    signal: { status: "warning", text: "Runway : 7,8 mois — sous le seuil" },
    items: [
      { icon: "→", text: "Burn en hausse de 18% ce mois" },
      { icon: "⏳", text: "Échéance salaires dans 12j · 8 500 €" },
    ],
  },
  {
    href: "/gyna",
    logo: "/gyna.png",
    logoHeight: "h-16",
    color: "#9d89fc",
    label: "GTM",
    signal: { status: "active", text: "Warm outreach en cours" },
    items: [
      { icon: "→", text: "47 prospects contactés ce mois" },
      { icon: "⏳", text: "À venir : brief freelance ads" },
    ],
  },
];

const signalColor = {
  active: "#1cb785",
  warning: "#ff8f27",
  critical: "#ff4f3f",
};

export function ToolCards() {
  const router = useRouter();

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {tools.map((tool) => {
        const { href, logo, logoHeight, color, label, signal, items } = tool;
        const dot = signalColor[signal.status as keyof typeof signalColor];

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
                {signal.text}
              </span>
            </div>

            {/* Items */}
            <div className="flex flex-col gap-2 border-t border-border pt-3">
              {items.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-muted text-xs mt-0.5 flex-shrink-0">{item.icon}</span>
                  <span className="font-sans text-xs text-muted leading-snug">{item.text}</span>
                </div>
              ))}
            </div>

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
