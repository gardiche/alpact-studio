"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { BusinessPlan } from "@/types/business-plan";
import { ArrowLeft, Download, FileText, BarChart3 } from "lucide-react";

const SECTION_LABELS: Record<string, string> = {
  executive_summary: "Résumé exécutif",
  project: "Le projet",
  market: "Le marché",
  business_model: "Modèle économique",
  team: "L'équipe",
  commercial_strategy: "Stratégie commerciale",
  financial_projections: "Projections financières",
  funding_plan: "Plan de financement",
  appendix: "Annexes",
};

const SECTION_ORDER = Object.keys(SECTION_LABELS);

function fmt(n: number | null | undefined, unit = "€") {
  if (n == null) return "—";
  return `${Math.round(n).toLocaleString("fr-FR")} ${unit}`;
}

export default function BusinessPlanViewPage() {
  const { bpId } = useParams<{ bpId: string }>();
  const router = useRouter();
  const [bp, setBp] = useState<BusinessPlan | null>(null);
  const [activeSection, setActiveSection] = useState("executive_summary");
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});
  const [exportingXlsx, setExportingXlsx] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("alpact_business_plans") ?? "[]") as BusinessPlan[];
    const found = stored.find((b) => b.id === bpId);
    if (found) {
      setBp(found);
      setEditedContent((found.generated_content as unknown as Record<string, string>) ?? {});
    }
  }, [bpId]);

  async function handleExportXlsx() {
    if (!bp || exportingXlsx) return;
    setExportingXlsx(true);
    try {
      const projectName =
        (bp.data_snapshot as { project?: { name?: string } })?.project?.name ?? "Business Plan";
      const res = await fetch("/api/business-plan/export/xlsx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pnl: bp.financial_tables?.pnl ?? [],
          cashflow: bp.financial_tables?.cashflow ?? [],
          bfr: bp.financial_tables?.bfr ?? [],
          indicators: bp.financial_tables?.indicators ?? {},
          projectName,
          scenario: bp.scenario,
        }),
      });
      if (!res.ok) throw new Error("Export échoué");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bp_${projectName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_${bp.scenario}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("L'export XLSX a échoué. Réessaie dans quelques secondes.");
    } finally {
      setExportingXlsx(false);
    }
  }

  if (!bp) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <p className="font-sans text-muted mb-4">Business plan introuvable</p>
          <Link href="/elyse/business-plan" className="text-sm font-sans text-green underline">
            ← Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  const indicators = bp.financial_tables?.indicators;
  const pnl = bp.financial_tables?.pnl ?? [];
  const year1CA = pnl.slice(0, 12).reduce((s, m) => s + m.revenue, 0);
  const year2CA = pnl.slice(12, 24).reduce((s, m) => s + m.revenue, 0);
  const year3CA = pnl.slice(24, 36).reduce((s, m) => s + m.revenue, 0);

  const scenarioLabel: Record<string, string> = {
    conservative: "Conservateur",
    moderate: "Modéré",
    aggressive: "Agressif",
  };

  function handleSectionEdit(section: string, value: string) {
    const updated = { ...editedContent, [section]: value };
    setEditedContent(updated);

    // Persist edits to localStorage
    const stored = JSON.parse(localStorage.getItem("alpact_business_plans") ?? "[]") as BusinessPlan[];
    const idx = stored.findIndex((b) => b.id === bpId);
    if (idx !== -1) {
      stored[idx] = { ...stored[idx], generated_content: updated as unknown as BusinessPlan["generated_content"] };
      localStorage.setItem("alpact_business_plans", JSON.stringify(stored));
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/elyse/business-plan"
              className="flex items-center gap-2 text-sm font-sans text-muted hover:text-fg transition-colors"
            >
              <ArrowLeft size={15} />
              Business Plans
            </Link>
            <div className="h-4 w-px bg-border" />
            <div>
              <p className="font-sans text-sm font-semibold text-fg">
                {(bp.data_snapshot as { project?: { name?: string } })?.project?.name ?? "Business Plan"}
              </p>
              <p className="font-sans text-xs text-muted">
                Scénario {scenarioLabel[bp.scenario]} · Version {bp.version} ·{" "}
                {new Date(bp.created_at).toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-sans font-medium text-muted border border-border hover:border-fg hover:text-fg transition-all">
              <Download size={13} />
              Export PDF
            </button>
            <button
              onClick={handleExportXlsx}
              disabled={exportingXlsx}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-sans font-medium text-muted border border-border hover:border-green hover:text-green transition-all disabled:opacity-40"
            >
              {exportingXlsx ? (
                <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
              ) : (
                <Download size={13} />
              )}
              Export XLSX
            </button>
            <Link
              href="/elyse/business-plan/new"
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-sans font-medium text-white transition-all"
              style={{ background: "#1cb785" }}
            >
              Nouveau BP
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8 grid grid-cols-[240px_1fr] gap-8">
        {/* Left nav */}
        <div className="space-y-1 sticky top-[73px] self-start">
          {/* Key indicators summary */}
          {indicators && (
            <div className="bg-surface rounded-card shadow-card p-4 border border-border mb-4 space-y-3">
              <p className="font-sans text-xs font-semibold text-muted uppercase tracking-wide">Indicateurs clés</p>
              {[
                { label: "CA An 1", value: fmt(year1CA) },
                { label: "CA An 2", value: fmt(year2CA) },
                { label: "CA An 3", value: fmt(year3CA) },
                {
                  label: "Runway",
                  value: indicators.runway === null ? "+36 mois" : `${indicators.runway} mois`,
                  color: indicators.runway === null ? "#1cb785" : indicators.runway < 6 ? "#ff4f3f" : "#ff8f27",
                },
                { label: "Break-even", value: indicators.breakEvenMonth ? `Mois ${indicators.breakEvenMonth}` : "Non atteint" },
                { label: "MRR", value: fmt(indicators.mrr) },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between items-baseline">
                  <span className="font-sans text-xs text-muted">{label}</span>
                  <span className="font-sans text-xs font-semibold" style={{ color: color ?? "#111" }}>{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Section nav */}
          <div className="bg-surface rounded-card shadow-card border border-border overflow-hidden">
            {SECTION_ORDER.map((section) => (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={`w-full text-left px-3 py-2.5 text-xs font-sans transition-colors border-b border-border last:border-0 ${
                  activeSection === section
                    ? "bg-green/5 text-green font-semibold"
                    : "text-muted hover:bg-beige hover:text-fg"
                }`}
              >
                {SECTION_LABELS[section]}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {SECTION_ORDER.map((section) => (
            <div
              key={section}
              id={section}
              className={`bg-surface rounded-card shadow-card border border-border overflow-hidden transition-all ${
                activeSection !== section ? "opacity-60" : ""
              }`}
              onClick={() => setActiveSection(section)}
            >
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h2 className="font-serif text-xl text-fg">{SECTION_LABELS[section]}</h2>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-sans text-muted px-2 py-0.5 rounded-full bg-beige border border-border">
                    {scenarioLabel[bp.scenario]}
                  </span>
                  <FileText size={14} className="text-muted" />
                </div>
              </div>
              <div className="p-6">
                {activeSection === section ? (
                  <textarea
                    value={editedContent[section] ?? ""}
                    onChange={(e) => handleSectionEdit(section, e.target.value)}
                    className="w-full font-sans text-sm text-fg leading-relaxed bg-transparent border-none outline-none resize-none min-h-[200px]"
                    style={{ fieldSizing: "content" } as React.CSSProperties}
                    placeholder="Contenu en cours de génération…"
                  />
                ) : (
                  <p className="font-sans text-sm text-fg leading-relaxed whitespace-pre-wrap line-clamp-4">
                    {editedContent[section] || "Contenu en cours de génération…"}
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* Financial tables summary */}
          {pnl.length > 0 && (
            <div className="bg-surface rounded-card shadow-card border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center gap-2">
                <BarChart3 size={16} className="text-green" />
                <h2 className="font-serif text-xl text-fg">Projections financières</h2>
              </div>
              <div className="p-6 overflow-x-auto">
                <table className="w-full text-xs font-sans">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-muted font-medium">Indicateur</th>
                      <th className="text-right py-2 text-muted font-medium">Année 1</th>
                      <th className="text-right py-2 text-muted font-medium">Année 2</th>
                      <th className="text-right py-2 text-muted font-medium">Année 3</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        label: "Chiffre d'affaires",
                        values: [year1CA, year2CA, year3CA],
                      },
                      {
                        label: "Marge brute",
                        values: [
                          pnl.slice(0, 12).reduce((s, m) => s + m.grossMargin, 0),
                          pnl.slice(12, 24).reduce((s, m) => s + m.grossMargin, 0),
                          pnl.slice(24, 36).reduce((s, m) => s + m.grossMargin, 0),
                        ],
                      },
                      {
                        label: "EBITDA",
                        values: [
                          pnl.slice(0, 12).reduce((s, m) => s + m.ebitda, 0),
                          pnl.slice(12, 24).reduce((s, m) => s + m.ebitda, 0),
                          pnl.slice(24, 36).reduce((s, m) => s + m.ebitda, 0),
                        ],
                      },
                    ].map(({ label, values }) => (
                      <tr key={label} className="border-b border-border last:border-0">
                        <td className="py-2.5 text-fg font-medium">{label}</td>
                        {values.map((v, i) => (
                          <td
                            key={i}
                            className="text-right py-2.5 font-medium"
                            style={{ color: v < 0 ? "#ff4f3f" : "#111" }}
                          >
                            {fmt(v)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-[10px] text-muted mt-3">
                  * Exportez en XLSX pour le détail mois par mois avec formules interconnectées.
                </p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center py-4">
            <p className="font-sans text-xs text-muted">
              Généré avec Elyse — Alpact Studio · {new Date(bp.created_at).toLocaleDateString("fr-FR")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
