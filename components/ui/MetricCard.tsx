interface MetricCardProps {
  label: string;
  value: string;
  subLabel?: string;
  icon?: React.ReactNode;
  accent?: string;
}

export function MetricCard({ label, value, subLabel, icon, accent }: MetricCardProps) {
  return (
    <div className="bg-surface rounded-card shadow-card p-6 flex-1 min-w-0">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-sans font-medium text-muted uppercase tracking-wide">
          {label}
        </span>
        {icon && <span className="text-muted">{icon}</span>}
      </div>
      <div
        className="text-2xl font-serif mb-1"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </div>
      {subLabel && (
        <p className="text-xs font-sans text-muted">{subLabel}</p>
      )}
    </div>
  );
}
