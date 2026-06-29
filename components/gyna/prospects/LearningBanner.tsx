import { Sparkles } from "lucide-react";

import { learnedInsights, type Prospect } from "@/lib/gyna/prospects";

function phrase(i: ReturnType<typeof learnedInsights>[number]): string {
  const pct = Math.round(i.rate * 100);
  const base = Math.round(i.baseline * 100);
  const lift = i.rate > i.baseline ? "mieux" : "moins bien";
  if (i.field === "source") {
    return `Sur tes prospects qualifiés, ceux reçus via ${i.value} convertissent ${lift} (${pct}% vs ${base}% en moyenne). Gyna en tient compte dans les scores ci-dessous.`;
  }
  if (i.field === "taille") {
    return `Les entreprises de taille ${i.value} convertissent ${lift} chez toi (${pct}% vs ${base}%). Pris en compte dans le scoring.`;
  }
  return `Les prospects dont le profil contient "${i.value}" convertissent ${lift} chez toi (${pct}% vs ${base}%). Pris en compte dans le scoring.`;
}

export function LearningBanner({ prospects }: { prospects: Prospect[] }) {
  const insights = learnedInsights(prospects);
  if (insights.length === 0) return null;
  const top = insights.slice(0, 2);

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-md bg-primary/10 p-1.5 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-widest text-primary">
            Gyna observe
          </div>
          {top.map((i, idx) => (
            <p key={idx} className="text-sm text-foreground leading-relaxed">
              {phrase(i)}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}