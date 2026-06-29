import { cn } from "@/lib/gyna/utils";

export type GynaView = "prospects" | "plan";

type Props = {
  current: GynaView;
  onChange: (v: GynaView) => void;
};

const TABS: { id: GynaView; label: string }[] = [
  { id: "prospects", label: "Tes prospects" },
  { id: "plan", label: "Plan d'acquisition" },
];

export function NavBar({ current, onChange }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 flex items-center justify-between h-24">
        <div className="flex items-center">
          <img src="/gyna.svg" alt="Gyna" className="h-24 w-auto object-contain" />
        </div>

        <nav className="flex items-center gap-1" aria-label="Navigation principale">
          {TABS.map((t) => {
            const active = t.id === current;
            return (
              <button
                key={t.id}
                onClick={() => onChange(t.id)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  active
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
                aria-current={active ? "page" : undefined}
              >
                {t.label}
              </button>
            );
          })}
        </nav>

        <span className="hidden sm:inline font-mono text-xs uppercase tracking-wider text-muted-foreground">
          v0.3
        </span>
      </div>
    </header>
  );
}
