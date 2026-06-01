"use client";

import { HelpCircle } from "lucide-react";

interface QuestionCardProps {
  question: string;
  hint?: string;
  children: React.ReactNode;
  fallback?: {
    label: string;
    onUse: () => void;
  };
}

export function QuestionCard({ question, hint, children, fallback }: QuestionCardProps) {
  return (
    <div className="bg-surface rounded-card shadow-card p-6 border border-border">
      <p className="font-serif text-xl text-fg mb-1 leading-snug">{question}</p>
      {hint && (
        <p className="font-sans text-sm text-muted mb-4 leading-relaxed">{hint}</p>
      )}
      {!hint && <div className="mb-4" />}

      <div className="space-y-3">{children}</div>

      {fallback && (
        <div className="mt-4 pt-4 border-t border-border">
          <button
            onClick={fallback.onUse}
            className="flex items-center gap-2 text-xs font-sans text-muted hover:text-fg transition-colors"
          >
            <HelpCircle size={13} />
            Je ne sais pas — {fallback.label}
          </button>
        </div>
      )}
    </div>
  );
}
