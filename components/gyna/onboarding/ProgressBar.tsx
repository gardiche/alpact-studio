type Props = {
  current: number;
  total: number;
};

export function ProgressBar({ current, total }: Props) {
  const pct = (current / total) * 100;
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Étape {current} sur {total}
        </span>
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {Math.round(pct)}%
        </span>
      </div>
      <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}