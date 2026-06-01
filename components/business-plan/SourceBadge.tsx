import type { DataSource } from "@/types/business-plan";
import { Check, AlertCircle, Info } from "lucide-react";

const SOURCE_CONFIG: Record<DataSource, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  stripe: { label: "Stripe ✓", color: "#1cb785", bg: "#1cb78514", icon: <Check size={10} /> },
  qonto: { label: "Qonto ✓", color: "#1cb785", bg: "#1cb78514", icon: <Check size={10} /> },
  notion: { label: "Notion", color: "#3b82f6", bg: "#3b82f614", icon: <Info size={10} /> },
  drive: { label: "Drive", color: "#3b82f6", bg: "#3b82f614", icon: <Info size={10} /> },
  inferred: { label: "Estimé", color: "#ff8f27", bg: "#ff8f2714", icon: <AlertCircle size={10} /> },
  benchmark: { label: "Benchmark", color: "#ff8f27", bg: "#ff8f2714", icon: <AlertCircle size={10} /> },
  user_input: { label: "Saisi", color: "#888888", bg: "#88888814", icon: null },
};

interface SourceBadgeProps {
  source: DataSource;
  confidenceScore?: number;
}

export function SourceBadge({ source, confidenceScore }: SourceBadgeProps) {
  const config = SOURCE_CONFIG[source];
  const lowConfidence = confidenceScore !== undefined && confidenceScore < 0.7;

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-sans font-medium"
      style={{
        color: lowConfidence ? "#ff8f27" : config.color,
        background: lowConfidence ? "#ff8f2714" : config.bg,
      }}
    >
      {config.icon}
      {lowConfidence ? "À vérifier" : config.label}
    </span>
  );
}
