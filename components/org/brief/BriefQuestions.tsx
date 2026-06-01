"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";

interface Props {
  memberId: string;
}

type Status = "idle" | "loading" | "streaming" | "done" | "fallback" | "error";

const FALLBACK_QUESTIONS = [
  "Comment tu te sens depuis notre dernière séance ?",
  "Quelle est la décision qui t'occupe le plus en ce moment ?",
  "Qu'est-ce qui te retient d'avancer sur ce sujet ?",
  "De quoi as-tu besoin que tu n'arrives pas à formuler ?",
  "Si tu devais ne garder qu'un seul chantier ces 15 prochains jours, lequel ?",
];

export function BriefQuestions({ memberId }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function generate() {
    setStatus("loading");
    setText("");
    setError(null);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch("/api/org/brief-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
        signal: ctrl.signal,
      });

      if (res.status === 503) {
        const data = await res.json().catch(() => ({}));
        if (data?.fallback) {
          setStatus("fallback");
          return;
        }
      }

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? "Erreur lors de la génération");
        setStatus("error");
        return;
      }

      setStatus("streaming");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") {
            setStatus("done");
            continue;
          }
          try {
            const data = JSON.parse(payload);
            if (data.error) {
              setError(data.error);
              setStatus("error");
            } else if (data.content) {
              setText((t) => t + data.content);
            }
          } catch {
            /* ignore partial */
          }
        }
      }
      setStatus((s) => (s === "streaming" ? "done" : s));
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError((e as Error).message);
      setStatus("error");
    }
  }

  useEffect(() => {
    generate();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId]);

  if (status === "fallback" || status === "error") {
    return (
      <div>
        <div className="mb-3 p-3 rounded-xl bg-bg/40 border border-border">
          <p className="font-sans text-xs text-muted">
            {status === "fallback"
              ? "L'IA n'est pas configurée — questions par défaut affichées."
              : `Génération indisponible : ${error}. Questions par défaut affichées.`}
          </p>
        </div>
        <ol className="space-y-2.5">
          {FALLBACK_QUESTIONS.map((q, i) => (
            <li key={i} className="flex gap-3 font-sans text-sm text-fg leading-relaxed">
              <span className="font-serif text-muted" style={{ fontFamily: "DM Serif Display" }}>
                {i + 1}.
              </span>
              <span>{q}</span>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex items-center gap-3 py-2">
        <Sparkles size={16} className="text-blue animate-pulse" style={{ color: "#2D5BE3" }} />
        <p className="font-sans text-sm text-muted">L'IA prépare les questions…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="whitespace-pre-wrap font-sans text-sm text-fg leading-relaxed">
        {text}
        {status === "streaming" && (
          <span
            className="inline-block w-2 h-4 ml-0.5 align-text-bottom animate-pulse"
            style={{ background: "#2D5BE3" }}
          />
        )}
      </div>
      {status === "done" && (
        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between print:hidden">
          <p className="font-sans text-[11px] text-muted">
            Généré par Claude — relisez et adaptez avant la séance.
          </p>
          <button
            onClick={generate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-sans text-xs font-medium text-muted hover:text-fg hover:bg-bg transition-colors"
          >
            <RefreshCw size={12} />
            Régénérer
          </button>
        </div>
      )}
    </div>
  );
}
