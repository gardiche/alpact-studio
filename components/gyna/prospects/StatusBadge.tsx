import { cn } from "@/lib/gyna/utils";
import type { Status } from "@/lib/gyna/prospects";

const STYLES: Record<Status, string> = {
  "À qualifier": "bg-muted text-foreground border-border",
  "Qualifié": "bg-primary/10 text-primary border-primary/20",
  "En séquence": "bg-foreground/5 text-foreground border-foreground/10",
  "RDV pris": "bg-[color:var(--success)]/10 text-[color:var(--success)] border-[color:var(--success)]/20",
  "Closing": "bg-[color:var(--success)] text-[color:var(--success-foreground)] border-transparent",
  "Perdu": "bg-destructive/10 text-destructive border-destructive/20",
  "Exclu": "bg-destructive text-destructive-foreground border-transparent",
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        STYLES[status],
        className,
      )}
    >
      {status}
    </span>
  );
}