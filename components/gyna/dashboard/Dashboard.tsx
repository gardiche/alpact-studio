import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Plug, Plus, Search, Upload } from "lucide-react";
import { useMemo, useState } from "react";

import { ConfidenceGauge } from "@/components/gyna/ConfidenceGauge";
import { AddProspectDialog } from "@/components/gyna/prospects/AddProspectDialog";
import { ConnectCrmDialog } from "@/components/gyna/prospects/ConnectCrmDialog";
import { ImportProspectsDialog } from "@/components/gyna/prospects/ImportProspectsDialog";
import { LearningBanner } from "@/components/gyna/prospects/LearningBanner";
import { ProspectDetailSheet } from "@/components/gyna/prospects/ProspectDetailSheet";
import { StatusBadge } from "@/components/gyna/prospects/StatusBadge";
import { Button } from "@/components/gyna/ui/button";
import { Input } from "@/components/gyna/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/gyna/ui/select";
import { useGyna } from "@/lib/gyna/gyna-store";
import { POSITIVE_STATUSES, SOURCES, STATUSES, type Status } from "@/lib/gyna/prospects";

type SortBy = "score-desc" | "score-asc" | "recent";

export function Dashboard() {
  const { prospects } = useGyna();
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [crmOpen, setCrmOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [canalFilter, setCanalFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortBy>("score-desc");
  const [search, setSearch] = useState("");

  const qualified = prospects.filter((p) =>
    ["Qualifié", "En séquence", "RDV pris", "Closing"].includes(p.status),
  ).length;

  const filtered = useMemo(() => {
    let out = [...prospects];
    if (statusFilter !== "all") out = out.filter((p) => p.status === statusFilter);
    if (canalFilter !== "all") out = out.filter((p) => p.source === canalFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(
        (p) =>
          `${p.prenom} ${p.nom}`.toLowerCase().includes(q) ||
          p.entreprise.toLowerCase().includes(q),
      );
    }
    if (sortBy === "score-desc") out.sort((a, b) => b.scoreDetail.total - a.scoreDetail.total);
    else if (sortBy === "score-asc") out.sort((a, b) => a.scoreDetail.total - b.scoreDetail.total);
    else out.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
    return out;
  }, [prospects, statusFilter, canalFilter, sortBy, search]);

  return (
    <main className="bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
        {/* Title + actions */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl sm:text-5xl font-display font-semibold text-foreground">
              Tes prospects
            </h1>
            <p className="mt-2 text-sm text-muted-foreground font-mono">
              {prospects.length} prospect{prospects.length > 1 ? "s" : ""} ·{" "}
              <span className="text-[color:var(--success)]">{qualified} qualifié{qualified > 1 ? "s" : ""}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2">
              <Upload className="h-4 w-4" />
              Importer mon fichier
            </Button>
            <Button variant="outline" onClick={() => setCrmOpen(true)} className="gap-2">
              <Plug className="h-4 w-4" />
              Connecter un CRM
            </Button>
            <Button onClick={() => setAddOpen(true)} size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Ajouter un prospect
            </Button>
          </div>
        </div>

        {/* Learning banner */}
        <div className="mb-8">
          <LearningBanner prospects={prospects} />
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un prospect…"
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as Status | "all")}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Statut" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={canalFilter} onValueChange={setCanalFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Canal" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous canaux</SelectItem>
              {SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tri" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="score-desc">Score décroissant</SelectItem>
              <SelectItem value="score-asc">Score croissant</SelectItem>
              <SelectItem value="recent">Plus récent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Prospect cards */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
              <p className="text-muted-foreground">Aucun prospect ne correspond à ces filtres.</p>
            </div>
          ) : (
            filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className="group block w-full text-left rounded-xl border border-border bg-card p-4 hover:border-foreground/30 hover:shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-12 md:col-span-3">
                    <div className="font-medium text-foreground">{p.prenom} {p.nom}</div>
                    <div className="text-xs text-muted-foreground truncate">{p.role}</div>
                  </div>
                  <div className="col-span-6 md:col-span-2">
                    <div className="text-sm text-foreground truncate">{p.entreprise}</div>
                    <div className="text-xs text-muted-foreground truncate">{p.secteur}</div>
                  </div>
                  <div className="col-span-12 md:col-span-3">
                    <ConfidenceGauge score={p.scoreDetail.total} label={`Score · ${p.scoreDetail.phase === 1 ? "provisoire" : "affiné"}`} />
                  </div>
                  <div className="col-span-6 md:col-span-2">
                    <StatusBadge status={p.status} />
                    {POSITIVE_STATUSES.includes(p.status) && (
                      <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-[color:var(--success)]">
                        succès
                      </div>
                    )}
                  </div>
                  <div className="col-span-12 md:col-span-2 text-right">
                    <div className="text-xs text-foreground truncate">{p.canalRecommande}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      {formatDistanceToNow(new Date(p.updatedAt), { addSuffix: true, locale: fr })}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <AddProspectDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={(id) => setSelectedId(id)}
      />
      <ImportProspectsDialog open={importOpen} onOpenChange={setImportOpen} />
      <ConnectCrmDialog open={crmOpen} onOpenChange={setCrmOpen} />
      {selectedId && (
        <ProspectDetailSheet
          prospectId={selectedId}
          onOpenChange={(open) => { if (!open) setSelectedId(null); }}
        />
      )}
    </main>
  );
}