import { MetricCard } from "@/components/ui/MetricCard";
import { DollarSign, Clock, CheckSquare, Bell } from "lucide-react";
import { DEMO } from "@/lib/demo/data";

export function PulseCards() {
  const { mrr, mrrTrend, runway, runwayStatus, priorite, alertes } = DEMO.metrics;

  return (
    <div className="grid grid-cols-4 gap-4 mb-8">
      <MetricCard
        label="MRR"
        value={mrr}
        subLabel={mrrTrend}
        icon={<DollarSign size={16} />}
      />
      <MetricCard
        label="Runway"
        value={runway}
        subLabel={runwayStatus === "warning" ? "⚠️ Sous le seuil recommandé" : "Bonne santé"}
        icon={<Clock size={16} />}
      />
      <MetricCard
        label="Priorité active"
        value={priorite}
        subLabel="Cette semaine"
        icon={<CheckSquare size={16} />}
      />
      <div className="bg-surface rounded-card shadow-card p-6 flex-1 min-w-0">
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-sans font-medium text-muted uppercase tracking-wide">
            Alertes actives
          </span>
          <Bell size={16} className="text-muted" />
        </div>
        <div className="text-2xl font-serif text-fg mb-1">{alertes}</div>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-sans font-medium"
          style={{ background: "rgba(255,143,39,0.1)", color: "#ff8f27" }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#ff8f27" }} />
          À traiter
        </span>
      </div>
    </div>
  );
}
