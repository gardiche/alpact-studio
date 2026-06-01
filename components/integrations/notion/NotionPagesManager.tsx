"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  Search,
  FileText,
  Database,
  Check,
  RefreshCw,
  ExternalLink,
  ArrowLeft,
  AlertCircle,
  Sparkles,
  Star,
  Layers,
  BookOpen,
  Archive,
} from "lucide-react";
import type { NotionPageRef, NotionPageCategory } from "@/types/integrations";

interface PageWithSelection extends NotionPageRef {
  selected: boolean;
}

interface PagesResponse {
  workspace_name: string;
  pages: PageWithSelection[];
  total: number;
}

interface SyncResponse {
  success: boolean;
  pages_synced: number;
  total_chars: number;
  synced_at: string;
}

// Labels et couleurs par catégorie
const CATEGORY_META: Record<
  NotionPageCategory,
  { label: string; icon: typeof Star; color: string; description: string }
> = {
  strategic: {
    label: "Stratégique",
    icon: Star,
    color: "#2D5BE3",
    description: "Pitch, roadmap, vision, business plan",
  },
  narrative: {
    label: "Contenu",
    icon: BookOpen,
    color: "#1cb785",
    description: "Pages avec du contenu narratif",
  },
  operational: {
    label: "Opérationnel",
    icon: Layers,
    color: "#ff8f27",
    description: "Process, templates, guides",
  },
  data: {
    label: "Données",
    icon: Database,
    color: "#9d89fc",
    description: "Bases de données, tableaux, CRM",
  },
  empty: {
    label: "Vide",
    icon: Archive,
    color: "#999",
    description: "Pages sans contenu significatif",
  },
};

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `il y a ${d}j`;
}

// Ordre des catégories dans l'affichage
const CATEGORY_ORDER: NotionPageCategory[] = [
  "strategic",
  "narrative",
  "operational",
  "data",
  "empty",
];

export function NotionPagesManager({ justConnected }: { justConnected: boolean }) {
  const [data, setData] = useState<PagesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResponse | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  useEffect(() => {
    fetch("/api/integrations/notion/pages")
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${r.status}`);
        }
        return (await r.json()) as PagesResponse;
      })
      .then((d) => {
        setData(d);
        // Si des pages étaient déjà sélectionnées (sync précédente), les restaurer
        const alreadySelected = d.pages.filter((p) => p.selected);
        if (alreadySelected.length > 0) {
          setSelection(new Set(alreadySelected.map((p) => p.id)));
        } else {
          // Première connexion : pré-cocher les pages recommandées
          const recommended = d.pages.filter((p) => p.recommended);
          setSelection(new Set(recommended.map((p) => p.id)));
          setHasAutoSelected(true);
        }
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  // Pages filtrées par recherche
  const filtered = useMemo(() => {
    if (!data) return [];
    if (!query.trim()) return data.pages;
    const q = query.toLowerCase();
    return data.pages.filter((p) => p.title.toLowerCase().includes(q));
  }, [data, query]);

  // Pages regroupées par catégorie
  const grouped = useMemo(() => {
    const groups = new Map<NotionPageCategory, PageWithSelection[]>();
    for (const cat of CATEGORY_ORDER) {
      const pages = filtered.filter((p) => p.category === cat);
      if (pages.length > 0) groups.set(cat, pages);
    }
    return groups;
  }, [filtered]);

  // Stats
  const recommendedCount = data?.pages.filter((p) => p.recommended).length ?? 0;

  function toggle(id: string) {
    setSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectRecommended() {
    if (!data) return;
    setSelection(new Set(data.pages.filter((p) => p.recommended).map((p) => p.id)));
  }

  function selectAll() {
    if (!data) return;
    setSelection(new Set(filtered.map((p) => p.id)));
  }

  function deselectAll() {
    setSelection(new Set());
  }

  async function handleSync() {
    if (!data || selection.size === 0) return;
    setSyncing(true);
    setError(null);
    setSyncResult(null);

    const selected = data.pages.filter((p) => selection.has(p.id));
    try {
      const res = await fetch("/api/integrations/notion/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selected_pages: selected.map((p) => ({
            id: p.id,
            title: p.title,
            url: p.url,
            last_edited_time: p.last_edited_time,
          })),
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      setSyncResult(body as SyncResponse);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm("Déconnecter Notion ? Le contexte synchronisé sera supprimé.")) return;
    setDisconnecting(true);
    try {
      await fetch("/api/integrations/notion/disconnect", { method: "POST" });
      window.location.href = "/integrations";
    } catch {
      setDisconnecting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="animate-spin text-muted mr-2" />
        <p className="font-sans text-sm text-muted">Chargement des pages Notion...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6 rounded-[20px] border border-red/30 bg-red/5">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="text-red flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-sans text-sm font-semibold text-red mb-1">
              Impossible de charger vos pages
            </p>
            <p className="font-sans text-xs text-fg mb-3">{error}</p>
            <Link
              href="/integrations"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-fg text-white font-sans text-xs font-medium"
            >
              <ArrowLeft size={12} />
              Retour aux intégrations
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <Link
            href="/integrations"
            className="inline-flex items-center gap-1.5 font-sans text-xs text-muted hover:text-fg transition-colors mb-3"
          >
            <ArrowLeft size={12} />
            Toutes les intégrations
          </Link>
          <h1
            className="font-serif text-3xl text-fg leading-tight"
            style={{ fontFamily: "DM Serif Display" }}
          >
            Notion · {data.workspace_name}
          </h1>
          <p className="font-sans text-sm text-muted mt-1">
            Sélectionnez les pages qui alimentent le contexte de vos outils Alpact.
            <br />
            <span className="text-[11px]">
              Les pages stratégiques sont pré-sélectionnées pour vous.
            </span>
          </p>
        </div>
        <button
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="font-sans text-xs text-muted hover:text-red transition-colors disabled:opacity-50"
        >
          Déconnecter
        </button>
      </div>

      {justConnected && hasAutoSelected && recommendedCount > 0 && (
        <div className="mb-4 p-4 rounded-[20px] border border-green/30 bg-green/5 flex items-start gap-3">
          <Sparkles size={16} style={{ color: "#1cb785" }} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-sans text-sm font-semibold text-fg">
              Notion connecté — {recommendedCount} page{recommendedCount > 1 ? "s" : ""} recommandée{recommendedCount > 1 ? "s" : ""} pré-sélectionnée{recommendedCount > 1 ? "s" : ""}.
            </p>
            <p className="font-sans text-xs text-muted mt-0.5">
              Nous avons identifié vos pages stratégiques. Ajustez la sélection si besoin, puis
              synchronisez.
            </p>
          </div>
        </div>
      )}

      {justConnected && !hasAutoSelected && (
        <div className="mb-4 p-4 rounded-[20px] border border-green/30 bg-green/5 flex items-start gap-3">
          <Sparkles size={16} style={{ color: "#1cb785" }} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-sans text-sm font-semibold text-fg">
              Notion est connecté.
            </p>
            <p className="font-sans text-xs text-muted mt-0.5">
              Sélectionnez les pages à inclure dans votre contexte, puis lancez une première
              synchronisation.
            </p>
          </div>
        </div>
      )}

      {syncResult && (
        <div className="mb-4 p-4 rounded-[20px] border border-green/30 bg-green/5">
          <p className="font-sans text-sm font-semibold text-fg flex items-center gap-2">
            <Check size={14} style={{ color: "#1cb785" }} />
            Contexte synchronisé
          </p>
          <p className="font-sans text-xs text-muted mt-1">
            {syncResult.pages_synced} pages ingérées · {Math.round(syncResult.total_chars / 1000)} k
            caractères extraits · {formatRelative(syncResult.synced_at)}
          </p>
        </div>
      )}

      {error && data && (
        <div className="mb-4 p-3 rounded-xl border border-red/30 bg-red/5 flex items-start gap-2">
          <AlertCircle size={14} className="text-red flex-shrink-0 mt-0.5" />
          <p className="font-sans text-xs text-fg">{error}</p>
        </div>
      )}

      {/* Actions row */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une page..."
            className="w-full pl-9 pr-3 py-2 rounded-full bg-surface border border-border font-sans text-sm text-fg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue transition-all"
          />
        </div>
        <button
          onClick={selectRecommended}
          className="px-3 py-1.5 rounded-full bg-surface border border-border font-sans text-xs text-fg hover:bg-bg transition-colors inline-flex items-center gap-1.5"
        >
          <Star size={11} />
          Recommandées
        </button>
        <button
          onClick={selectAll}
          className="px-3 py-1.5 rounded-full bg-surface border border-border font-sans text-xs text-fg hover:bg-bg transition-colors"
        >
          Tout
        </button>
        <button
          onClick={deselectAll}
          className="px-3 py-1.5 rounded-full bg-surface border border-border font-sans text-xs text-fg hover:bg-bg transition-colors"
        >
          Aucune
        </button>
        <button
          onClick={handleSync}
          disabled={selection.size === 0 || syncing}
          className="px-4 py-2 rounded-full bg-fg text-white font-sans text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 inline-flex items-center gap-2"
        >
          {syncing ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              Synchronisation...
            </>
          ) : (
            <>
              <RefreshCw size={13} />
              Synchroniser ({selection.size})
            </>
          )}
        </button>
      </div>

      {/* Liste pages groupée par catégorie */}
      <div className="space-y-3">
        {grouped.size === 0 ? (
          <div
            className="bg-surface rounded-[20px] p-10 text-center"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
          >
            <p className="font-sans text-sm text-muted mb-2">
              {query ? "Aucune page ne correspond." : "Aucune page partagée."}
            </p>
            {!query && (
              <p className="font-sans text-xs text-muted leading-relaxed max-w-md mx-auto">
                Pour qu'Alpact accède à vos pages, ouvrez Notion, sélectionnez une page, et
                partagez-la avec l'intégration &quot;Alpact Studio&quot; depuis le menu &quot;...&quot;.
              </p>
            )}
          </div>
        ) : (
          Array.from(grouped.entries()).map(([category, pages]) => {
            const meta = CATEGORY_META[category];
            const CatIcon = meta.icon;
            const selectedInCat = pages.filter((p) => selection.has(p.id)).length;

            return (
              <div
                key={category}
                className="bg-surface rounded-[20px] overflow-hidden"
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
              >
                {/* Category header */}
                <div className="px-5 py-3 border-b border-border bg-bg/40 flex items-center gap-3">
                  <CatIcon size={14} style={{ color: meta.color }} />
                  <div className="flex-1 min-w-0">
                    <span
                      className="font-sans text-xs font-semibold uppercase tracking-wide"
                      style={{ color: meta.color }}
                    >
                      {meta.label}
                    </span>
                    <span className="font-sans text-[11px] text-muted ml-2">
                      {meta.description}
                    </span>
                  </div>
                  <span className="font-sans text-[11px] text-muted">
                    {selectedInCat}/{pages.length} sélectionnée{pages.length > 1 ? "s" : ""}
                  </span>
                </div>

                {/* Pages */}
                <ul>
                  {pages.map((page) => {
                    const checked = selection.has(page.id);
                    const Icon = page.object === "database" ? Database : FileText;
                    return (
                      <li
                        key={page.id}
                        className="border-b border-border last:border-b-0 hover:bg-bg/30 transition-colors"
                      >
                        <label className="flex items-center gap-3 px-5 py-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggle(page.id)}
                            className="w-4 h-4 rounded border-border text-fg focus:ring-blue/20 cursor-pointer"
                          />
                          <div className="w-7 h-7 rounded-lg bg-bg flex items-center justify-center flex-shrink-0">
                            {page.icon ? (
                              page.icon.startsWith("http") ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={page.icon} alt="" className="w-5 h-5 object-contain" />
                              ) : (
                                <span className="text-sm">{page.icon}</span>
                              )
                            ) : (
                              <Icon size={13} className="text-muted" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-sans text-sm text-fg truncate">{page.title}</p>
                              {page.recommended && (
                                <span
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0"
                                  style={{
                                    background: "rgba(45,91,227,0.08)",
                                    color: "#2D5BE3",
                                  }}
                                >
                                  <Star size={8} />
                                  Recommandé
                                </span>
                              )}
                            </div>
                            <p className="font-sans text-[11px] text-muted">
                              {page.object === "database" ? "Base" : "Page"} · modifié{" "}
                              {formatRelative(page.last_edited_time)}
                            </p>
                          </div>
                          <a
                            href={page.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-muted hover:text-fg transition-colors"
                            title="Ouvrir dans Notion"
                          >
                            <ExternalLink size={13} />
                          </a>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })
        )}
      </div>

      <p className="font-sans text-[11px] text-muted mt-4 text-center max-w-2xl mx-auto leading-relaxed">
        Astuce : seules les pages explicitement partagées avec l'intégration Alpact Studio
        apparaissent ici. Pour en ajouter, ouvrez Notion, menu &quot;...&quot; d'une page, puis &quot;Connections&quot; et ajoutez Alpact Studio.
      </p>
    </div>
  );
}
