"use client";

import { Check } from "lucide-react";

const BLOCKS = [
  { label: "Activite" },
  { label: "Croissance" },
  { label: "Equipe" },
  { label: "Charges fixes" },
  { label: "Charges variables" },
  { label: "Investissements" },
  { label: "Tresorerie" },
  { label: "Financement" },
  { label: "Contexte" },
];

interface WizardProgressProps {
  currentBlock: number;
  completedBlocks: number[];
  onBlockClick?: (block: number) => void;
}

export function WizardProgress({ currentBlock, completedBlocks, onBlockClick }: WizardProgressProps) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {BLOCKS.map((block, i) => {
        const isCompleted = completedBlocks.includes(i);
        const isActive = currentBlock === i;
        const isClickable = isCompleted || i <= Math.max(...completedBlocks, -1) + 1;

        return (
          <button
            key={i}
            onClick={() => isClickable && onBlockClick?.(i)}
            disabled={!isClickable}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans font-medium
              transition-all duration-150
              ${isActive
                ? "bg-green text-white"
                : isCompleted
                  ? "bg-green/10 text-green border border-green/20"
                  : "bg-beige text-muted border border-border"
              }
              ${isClickable && !isActive ? "cursor-pointer hover:border-green/40" : ""}
              ${!isClickable ? "opacity-40 cursor-not-allowed" : ""}
            `}
          >
            {isCompleted && !isActive && <Check size={11} className="text-green" />}
            <span>{i + 1}. {block.label}</span>
          </button>
        );
      })}
    </div>
  );
}

