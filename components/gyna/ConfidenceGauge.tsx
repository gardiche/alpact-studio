import { useEffect, useState } from "react";

type Props = {
  /** Current score 0..100 */
  score: number;
  /** Optional label */
  label?: string;
};

/**
 * Signature component for Gyna: a horizontal axis with a point that moves
 * as the score evolves, leaving a pale trail at its previous position to
 * visualize the "living" nature of the scoring.
 */
export function ConfidenceGauge({ score, label = "Confiance" }: Props) {
  const clamped = Math.max(0, Math.min(100, score));
  const [previous, setPrevious] = useState(clamped);

  useEffect(() => {
    // Capture previous position then update after a tick so the trail is visible.
    const t = window.setTimeout(() => setPrevious(clamped), 900);
    return () => window.clearTimeout(t);
  }, [clamped]);

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="font-mono text-lg text-foreground tabular-nums">
          {clamped.toFixed(0)}
          <span className="text-muted-foreground text-xs ml-0.5">/100</span>
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-muted">
        {/* Trail from previous to current */}
        <div
          className="absolute top-0 h-full rounded-full bg-primary/25 transition-all duration-700 ease-out"
          style={{
            left: `${Math.min(previous, clamped)}%`,
            width: `${Math.abs(clamped - previous)}%`,
          }}
        />
        {/* Current point */}
        <div
          className="absolute -top-1 h-4 w-4 -ml-2 rounded-full bg-primary shadow-sm transition-all duration-700 ease-out"
          style={{ left: `${clamped}%` }}
        />
        {/* Previous ghost point */}
        <div
          className="absolute -top-0.5 h-3 w-3 -ml-1.5 rounded-full bg-primary/30 transition-all duration-700 ease-out"
          style={{ left: `${previous}%` }}
        />
      </div>
    </div>
  );
}