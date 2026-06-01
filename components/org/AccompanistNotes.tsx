"use client";

import { useState } from "react";
import type { AccompanistNote } from "@/types";

function formatDate(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (d === 0) return "Aujourd'hui";
  if (d === 1) return "Hier";
  if (d < 7) return `Il y a ${d} jours`;
  const date = new Date(iso);
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

interface Props {
  notes: AccompanistNote[];
}

export function AccompanistNotes({ notes: initialNotes }: Props) {
  const [notes, setNotes] = useState(initialNotes);
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);

  function addNote() {
    const content = draft.trim();
    if (!content) return;
    const newNote: AccompanistNote = {
      id: `local-${Date.now()}`,
      cohort_member_id: notes[0]?.cohort_member_id ?? "",
      author_id: "user-delphine",
      author_name: "Delphine",
      content,
      created_at: new Date().toISOString(),
    };
    setNotes([newNote, ...notes]);
    setDraft("");
    setFocused(false);
  }

  return (
    <div className="bg-surface rounded-[20px] p-6" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <h2 className="font-serif text-xl text-fg mb-5" style={{ fontFamily: "DM Serif Display" }}>
        Notes d'accompagnement
      </h2>

      <div className="mb-4">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Ajouter une note privée — signaux faibles, ressentis, décisions à suivre…"
          rows={focused || draft ? 3 : 2}
          className="w-full px-4 py-3 rounded-xl bg-bg border border-border font-sans text-sm text-fg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue transition-all resize-none"
        />
        {(focused || draft) && (
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => {
                setDraft("");
                setFocused(false);
              }}
              className="px-3 py-1.5 rounded-full font-sans text-xs font-medium text-muted hover:text-fg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={addNote}
              disabled={!draft.trim()}
              className="px-3 py-1.5 rounded-full font-sans text-xs font-medium text-white bg-fg disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              Enregistrer
            </button>
          </div>
        )}
      </div>

      {notes.length === 0 ? (
        <p className="font-sans text-sm text-muted italic">Aucune note pour le moment.</p>
      ) : (
        <div className="space-y-3">
          {notes.map((n) => (
            <div key={n.id} className="p-3 rounded-xl bg-bg/50 border border-border">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-sans text-xs font-semibold text-fg">{n.author_name}</span>
                <span className="font-sans text-[11px] text-muted">{formatDate(n.created_at)}</span>
              </div>
              <p className="font-sans text-sm text-fg leading-relaxed">{n.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
