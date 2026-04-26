import { DEMO } from "@/lib/demo/data";

export function ActivityFeed() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-xl text-fg">Activité récente</h2>
      </div>

      <div className="bg-surface rounded-card shadow-card divide-y divide-border">
        {DEMO.activity.map((a, i) => (
          <div key={i} className="flex items-start gap-4 px-6 py-4">
            <div className="w-9 h-9 rounded-xl bg-bg flex items-center justify-center text-base flex-shrink-0 border border-border">
              {a.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-sans text-sm font-medium text-fg">{a.text}</p>
              <p className="font-sans text-xs text-muted mt-0.5">{a.sub}</p>
            </div>
            <span className="font-sans text-xs text-muted whitespace-nowrap mt-0.5">{a.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
