import { useRef, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

import { Button } from "@/components/gyna/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/gyna/ui/dialog";
import { useGyna } from "@/lib/gyna/gyna-store";
import { SOURCES, TAILLES, type Source, type Taille } from "@/lib/gyna/prospects";

type Props = { open: boolean; onOpenChange: (v: boolean) => void };

type Row = Record<string, string>;

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const pick = (row: Row, keys: string[]) => {
  for (const k of keys) {
    const found = Object.keys(row).find((rk) => norm(rk) === norm(k));
    if (found && row[found]) return String(row[found]).trim();
  }
  return "";
};

const matchTaille = (raw: string): Taille => {
  const v = norm(raw);
  for (const t of TAILLES) if (norm(t) === v) return t;
  const n = parseInt(v.replace(/\D+/g, ""), 10);
  if (!Number.isNaN(n)) {
    if (n <= 10) return "1-10";
    if (n <= 50) return "11-50";
    if (n <= 200) return "51-200";
    return "200+";
  }
  return "11-50";
};

const matchSource = (raw: string): Source => {
  const v = norm(raw);
  for (const s of SOURCES) if (norm(s) === v) return s;
  if (v.includes("linkedin")) return "LinkedIn";
  if (v.includes("mail") || v.includes("email")) return "Email à froid";
  if (v.includes("appel") || v.includes("call") || v.includes("phone")) return "Appel à froid";
  if (v.includes("event") || v.includes("salon")) return "Événement";
  if (v.includes("ref") || v.includes("reco")) return "Référence";
  return "Autre";
};

export function ImportProspectsDialog({ open, onOpenChange }: Props) {
  const { addProspect } = useGyna();
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState<Row[] | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setPreview(null);
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFile = async (file: File) => {
    setParsing(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Row>(sheet, { defval: "", raw: false });
      if (rows.length === 0) {
        toast.error("Fichier vide", { description: "Aucune ligne trouvée." });
        return;
      }
      setPreview(rows);
      setFileName(file.name);
    } catch (e) {
      toast.error("Lecture impossible", {
        description: "Vérifie que ton fichier est bien un .csv ou .xlsx.",
      });
    } finally {
      setParsing(false);
    }
  };

  const doImport = () => {
    if (!preview) return;
    let added = 0;
    let skipped = 0;
    for (const row of preview) {
      const prenom = pick(row, ["prenom", "first name", "firstname", "prénom"]);
      const nom = pick(row, ["nom", "last name", "lastname", "name"]);
      const entreprise = pick(row, ["entreprise", "company", "société", "societe", "organisation"]);
      const role = pick(row, ["role", "fonction", "title", "poste", "job"]);
      if (!prenom || !nom || !entreprise || !role) {
        skipped++;
        continue;
      }
      addProspect({
        prenom,
        nom,
        entreprise,
        role,
        email: pick(row, ["email", "mail", "e-mail"]) || undefined,
        telephone: pick(row, ["telephone", "phone", "téléphone", "tel"]) || undefined,
        secteur: pick(row, ["secteur", "industry", "industrie"]),
        taille: matchTaille(pick(row, ["taille", "size", "employees", "effectif"])),
        source: matchSource(pick(row, ["source", "canal", "channel"])),
        recommandePar: pick(row, ["recommande par", "referrer", "recommandé par"]) || undefined,
        contexte: pick(row, ["contexte", "notes", "context", "note"]),
      });
      added++;
    }
    toast.success(`${added} prospect${added > 1 ? "s" : ""} importé${added > 1 ? "s" : ""}`, {
      description: skipped > 0 ? `${skipped} ligne(s) ignorée(s) — colonnes obligatoires manquantes.` : "Scores calculés.",
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Importer un fichier</DialogTitle>
          <DialogDescription>
            CSV ou XLSX. Colonnes attendues : <span className="font-mono text-xs">prenom, nom, entreprise, role, email, telephone, secteur, taille, source, contexte</span>.
            On reconnaît aussi les équivalents anglais.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card/50 p-8 cursor-pointer hover:border-foreground/30 transition-colors">
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
              }}
            />
            <div className="text-sm text-foreground font-medium">
              {fileName || "Clique pour choisir un fichier"}
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              .csv · .xls · .xlsx — jusqu'à 5 Mo
            </div>
          </label>

          {preview && (
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-mono mb-2">
                Aperçu — {preview.length} ligne{preview.length > 1 ? "s" : ""}
              </div>
              <div className="text-xs text-foreground space-y-1 max-h-40 overflow-auto">
                {preview.slice(0, 5).map((r, i) => (
                  <div key={i} className="truncate font-mono">
                    {pick(r, ["prenom", "first name"])} {pick(r, ["nom", "last name"])} — {pick(r, ["entreprise", "company"])}
                  </div>
                ))}
                {preview.length > 5 && (
                  <div className="text-muted-foreground">+ {preview.length - 5} autres…</div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => { reset(); onOpenChange(false); }}>
            Annuler
          </Button>
          <Button onClick={doImport} disabled={!preview || parsing}>
            {parsing ? "Lecture…" : preview ? `Importer ${preview.length} prospect${preview.length > 1 ? "s" : ""}` : "Importer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}