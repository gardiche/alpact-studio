// ============================================================
// Notion Metrics Extractor — extraction automatique des KPIs
// ============================================================
// Utilise Claude pour parser les pages Notion et en extraire
// toutes les métriques business chiffrées : MRR, CA, clients,
// runway, burn rate, équipe, pipeline, jalons, signaux, etc.
//
// Appelé après chaque sync Notion. Les métriques extraites
// alimentent hub_metrics, ToolCards, Impact, et le copilot.
// ============================================================

import { anthropic } from "@/lib/anthropic/client";
import { createClient } from "@/lib/supabase/server";
import type { NotionContextSnapshot } from "@/types/integrations";

// ============================================================
// Types
// ============================================================

export interface ExtractedMetrics {
  // Finance
  mrr: number | null;
  mrr_previous: number | null;
  arr: number | null;
  ca_mensuel: number | null;
  ca_annuel: number | null;
  burn_rate: number | null;
  runway_months: number | null;
  tresorerie: number | null;
  capital_raised: number | null;

  // Clients & Produit
  nb_clients: number | null;
  nb_clients_previous: number | null;
  nb_prospects: number | null;
  nb_users: number | null;
  churn_rate: number | null;
  cac: number | null;
  ltv: number | null;
  nps: number | null;

  // Equipe
  headcount: number | null;
  nb_recrutements_en_cours: number | null;

  // Go-to-Market
  nb_leads_mois: number | null;
  taux_conversion: number | null;
  nb_rdv_mois: number | null;

  // Jalons & Priorites
  priorite_active: string | null;
  prochaine_echeance: string | null;
  jalons_recents: Array<{ titre: string; date: string | null; statut: string }>;

  // Signaux
  signaux_positifs: Array<{ texte: string; source: string }>;
  signaux_negatifs: Array<{ texte: string; source: string }>;
  alertes: Array<{ type: string; message: string; severite: "info" | "warning" | "critical" }>;

  // Meta
  confidence: number;
}

// ============================================================
// Prompt d'extraction
// ============================================================

const EXTRACTION_SYSTEM_PROMPT = `Tu es un analyste financier expert. Tu reçois le contenu brut des pages Notion d'un fondateur de startup et tu dois en extraire TOUTES les métriques business chiffrées.

Ton objectif : identifier chaque chiffre, KPI, métrique, montant, pourcentage, effectif, date importante mentionnés dans le contenu.

Réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans \`\`\`json. Structure exacte :

{
  "mrr": null,
  "mrr_previous": null,
  "arr": null,
  "ca_mensuel": null,
  "ca_annuel": null,
  "burn_rate": null,
  "runway_months": null,
  "tresorerie": null,
  "capital_raised": null,
  "nb_clients": null,
  "nb_clients_previous": null,
  "nb_prospects": null,
  "nb_users": null,
  "churn_rate": null,
  "cac": null,
  "ltv": null,
  "nps": null,
  "headcount": null,
  "nb_recrutements_en_cours": null,
  "nb_leads_mois": null,
  "taux_conversion": null,
  "nb_rdv_mois": null,
  "priorite_active": null,
  "prochaine_echeance": null,
  "jalons_recents": [],
  "signaux_positifs": [],
  "signaux_negatifs": [],
  "alertes": [],
  "confidence": 0.5
}

Règles STRICTES :
- Tous les montants en EUROS, sans symbole (juste le nombre). Ex: 13100 pas "13 100 €".
- Les pourcentages en nombre décimal. Ex: 5.2 pas "5,2%".
- Si une donnée N'EST PAS trouvée, mets null — n'invente JAMAIS un chiffre.
- runway_months : calcule-le si tu as la trésorerie et le burn rate (trésorerie / burn_rate).
- mrr_previous : le MRR du mois précédent si mentionné, sinon null.
- Pour les jalons_recents : ne garde que les 5 plus récents, avec { "titre": "...", "date": "YYYY-MM-DD" ou null, "statut": "franchi" | "en cours" | "bloqué" }.
- Pour signaux_positifs/negatifs : extrais les faits marquants, { "texte": "...", "source": "titre de la page Notion" }.
- Pour alertes : identifie les risques/urgences, { "type": "finance"|"produit"|"equipe"|"commercial"|"legal", "message": "...", "severite": "info"|"warning"|"critical" }.
- confidence : entre 0 et 1. 0.9+ si beaucoup de données chiffrées précises. 0.3 si peu de données ou ambiguës.
- Écris en français.
- Priorise les données les plus RÉCENTES si des chiffres différents sont trouvés pour la même métrique.`;

// ============================================================
// Construction du contexte à analyser
// ============================================================

const MAX_EXTRACTION_CHARS = 40_000;

function buildExtractionInput(snapshot: NotionContextSnapshot): string {
  const lines: string[] = [];
  lines.push(`Workspace Notion synchronisé le ${snapshot.synced_at}`);
  lines.push(`Nombre de pages : ${snapshot.pages.length}`);
  lines.push("");

  // Trier par pertinence : les pages modifiées récemment d'abord
  const sorted = [...snapshot.pages].sort(
    (a, b) =>
      new Date(b.last_edited_time).getTime() -
      new Date(a.last_edited_time).getTime()
  );

  let totalChars = 0;

  for (const page of sorted) {
    if (totalChars >= MAX_EXTRACTION_CHARS) {
      lines.push(
        `\n[... ${sorted.length - sorted.indexOf(page)} pages tronquées]`
      );
      break;
    }

    const pageHeader = `\n--- PAGE : ${page.title} (modifiée le ${page.last_edited_time}) ---`;
    const content = page.content.trim();

    const maxPerPage = 6000;
    const truncatedContent =
      content.length > maxPerPage
        ? content.slice(0, maxPerPage) + "\n[... contenu tronqué]"
        : content;

    lines.push(pageHeader);
    if (truncatedContent) {
      lines.push(truncatedContent);
    } else {
      lines.push("(page vide ou sans contenu textuel)");
    }

    totalChars += pageHeader.length + truncatedContent.length;
  }

  return lines.join("\n");
}

// ============================================================
// Extraction via Claude
// ============================================================

async function callClaudeExtraction(
  snapshot: NotionContextSnapshot
): Promise<{ metrics: ExtractedMetrics; inputTokens: number; outputTokens: number }> {
  const input = buildExtractionInput(snapshot);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    system: EXTRACTION_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Voici le contenu Notion du fondateur. Extrais TOUTES les métriques business chiffrées :\n\n${input}`,
      },
    ],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("Impossible de parser les métriques JSON depuis la réponse Claude");
    }
  }

  const metrics: ExtractedMetrics = {
    mrr: asNumber(parsed.mrr),
    mrr_previous: asNumber(parsed.mrr_previous),
    arr: asNumber(parsed.arr),
    ca_mensuel: asNumber(parsed.ca_mensuel),
    ca_annuel: asNumber(parsed.ca_annuel),
    burn_rate: asNumber(parsed.burn_rate),
    runway_months: asNumber(parsed.runway_months),
    tresorerie: asNumber(parsed.tresorerie),
    capital_raised: asNumber(parsed.capital_raised),
    nb_clients: asInt(parsed.nb_clients),
    nb_clients_previous: asInt(parsed.nb_clients_previous),
    nb_prospects: asInt(parsed.nb_prospects),
    nb_users: asInt(parsed.nb_users),
    churn_rate: asNumber(parsed.churn_rate),
    cac: asNumber(parsed.cac),
    ltv: asNumber(parsed.ltv),
    nps: asNumber(parsed.nps),
    headcount: asInt(parsed.headcount),
    nb_recrutements_en_cours: asInt(parsed.nb_recrutements_en_cours),
    nb_leads_mois: asInt(parsed.nb_leads_mois),
    taux_conversion: asNumber(parsed.taux_conversion),
    nb_rdv_mois: asInt(parsed.nb_rdv_mois),
    priorite_active: asString(parsed.priorite_active),
    prochaine_echeance: asString(parsed.prochaine_echeance),
    jalons_recents: asArray(parsed.jalons_recents),
    signaux_positifs: asArray(parsed.signaux_positifs),
    signaux_negatifs: asArray(parsed.signaux_negatifs),
    alertes: asArray(parsed.alertes),
    confidence: asNumber(parsed.confidence) ?? 0.5,
  };

  return {
    metrics,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

// ============================================================
// Helpers de typage
// ============================================================

function asNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function asInt(v: unknown): number | null {
  const n = asNumber(v);
  return n !== null ? Math.round(n) : null;
}

function asString(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null;
  return String(v);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function asArray(v: unknown): any[] {
  return Array.isArray(v) ? v : [];
}

// ============================================================
// Formatage pour l'affichage
// ============================================================

function formatEuro(n: number | null): string {
  if (n === null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".0", "")} M€`;
  if (n >= 1_000) return `${Math.round(n / 1_000)} k€`;
  return `${Math.round(n)} €`;
}

function computeMrrTrend(mrr: number | null, mrrPrev: number | null): string {
  if (!mrr || !mrrPrev || mrrPrev === 0) return "";
  const pct = ((mrr - mrrPrev) / mrrPrev) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(0)}% ce mois`;
}

function computeRunwayStatus(months: number | null): "ok" | "warning" | "critical" {
  if (months === null) return "ok";
  if (months < 3) return "critical";
  if (months < 6) return "warning";
  return "ok";
}

// ============================================================
// API publique
// ============================================================

/**
 * Extrait les métriques depuis un snapshot Notion, les persiste,
 * et met à jour hub_metrics + activity_feed.
 */
export async function extractAndSaveMetrics(
  userId: string,
  snapshot: NotionContextSnapshot,
  snapshotId?: string
): Promise<ExtractedMetrics> {
  const supabase = await createClient();

  // 1. Appeler Claude pour l'extraction
  const { metrics, inputTokens, outputTokens } = await callClaudeExtraction(snapshot);

  // 2. Sauvegarder dans extracted_metrics (historique)
  await supabase.from("extracted_metrics").insert({
    user_id: userId,
    snapshot_id: snapshotId ?? null,
    mrr: metrics.mrr,
    mrr_previous: metrics.mrr_previous,
    arr: metrics.arr,
    ca_mensuel: metrics.ca_mensuel,
    ca_annuel: metrics.ca_annuel,
    burn_rate: metrics.burn_rate,
    runway_months: metrics.runway_months,
    tresorerie: metrics.tresorerie,
    capital_raised: metrics.capital_raised,
    nb_clients: metrics.nb_clients,
    nb_clients_previous: metrics.nb_clients_previous,
    nb_prospects: metrics.nb_prospects,
    nb_users: metrics.nb_users,
    churn_rate: metrics.churn_rate,
    cac: metrics.cac,
    ltv: metrics.ltv,
    nps: metrics.nps,
    headcount: metrics.headcount,
    nb_recrutements_en_cours: metrics.nb_recrutements_en_cours,
    nb_leads_mois: metrics.nb_leads_mois,
    taux_conversion: metrics.taux_conversion,
    nb_rdv_mois: metrics.nb_rdv_mois,
    priorite_active: metrics.priorite_active,
    prochaine_echeance: metrics.prochaine_echeance,
    jalons_recents: metrics.jalons_recents,
    signaux_positifs: metrics.signaux_positifs,
    signaux_negatifs: metrics.signaux_negatifs,
    alertes: metrics.alertes,
    confidence: metrics.confidence,
    model: "claude-sonnet-4-20250514",
    input_tokens: inputTokens,
    output_tokens: outputTokens,
  });

  // 3. Calculer les alertes
  const alerteCount = metrics.alertes.filter(
    (a) => a.severite === "warning" || a.severite === "critical"
  ).length;

  // 4. Construire les signaux pour les ToolCards
  const toolSignals = buildToolSignals(metrics);

  // 5. Upsert hub_metrics (source de vérité pour le dashboard)
  const { error } = await supabase.from("hub_metrics").upsert(
    {
      user_id: userId,
      // Colonnes text existantes (pour rétrocompatibilité)
      mrr: formatEuro(metrics.mrr),
      mrr_trend: computeMrrTrend(metrics.mrr, metrics.mrr_previous),
      runway: metrics.runway_months !== null ? `${metrics.runway_months.toFixed(1)} mois` : "—",
      runway_status: computeRunwayStatus(metrics.runway_months),
      priorite: metrics.priorite_active ?? "—",
      alertes: alerteCount,
      // Colonnes numériques enrichies
      mrr_numeric: metrics.mrr,
      mrr_previous: metrics.mrr_previous,
      arr: metrics.arr,
      ca_mensuel: metrics.ca_mensuel,
      burn_rate: metrics.burn_rate,
      runway_months: metrics.runway_months,
      tresorerie: metrics.tresorerie,
      capital_raised: metrics.capital_raised,
      nb_clients: metrics.nb_clients,
      nb_prospects: metrics.nb_prospects,
      headcount: metrics.headcount,
      churn_rate: metrics.churn_rate,
      nb_leads_mois: metrics.nb_leads_mois,
      taux_conversion: metrics.taux_conversion,
      prochaine_echeance: metrics.prochaine_echeance,
      signaux_positifs: metrics.signaux_positifs,
      signaux_negatifs: metrics.signaux_negatifs,
      tool_signals: toolSignals,
      last_extraction_at: new Date().toISOString(),
      extraction_confidence: metrics.confidence,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("[metricsExtractor] hub_metrics upsert error:", error.message);
  }

  // 6. Ajouter un événement dans l'activity feed
  await supabase.from("activity_feed").insert({
    user_id: userId,
    icon: "📊",
    text: "Métriques business mises à jour depuis Notion",
    sub: buildActivitySub(metrics),
    tool: "hub",
  });

  return metrics;
}

/**
 * Construit les signaux dynamiques pour les ToolCards du hub.
 * Remplace les données hardcodées.
 */
function buildToolSignals(metrics: ExtractedMetrics): Record<string, unknown> {
  const signals: Record<string, unknown> = {};

  // Elyse (Finance)
  const elyseItems: string[] = [];
  if (metrics.burn_rate !== null) {
    elyseItems.push(`Burn rate : ${formatEuro(metrics.burn_rate)}/mois`);
  }
  if (metrics.tresorerie !== null) {
    elyseItems.push(`Trésorerie : ${formatEuro(metrics.tresorerie)}`);
  }
  if (metrics.prochaine_echeance) {
    elyseItems.push(`Échéance : ${metrics.prochaine_echeance}`);
  }

  let elyseStatus: "active" | "warning" | "critical" = "active";
  let elyseSignal = "Santé financière stable";
  if (metrics.runway_months !== null) {
    if (metrics.runway_months < 3) {
      elyseStatus = "critical";
      elyseSignal = `Runway critique : ${metrics.runway_months.toFixed(1)} mois`;
    } else if (metrics.runway_months < 6) {
      elyseStatus = "warning";
      elyseSignal = `Runway : ${metrics.runway_months.toFixed(1)} mois — sous le seuil`;
    } else {
      elyseSignal = `Runway : ${metrics.runway_months.toFixed(1)} mois — bonne santé`;
    }
  }

  signals.elyse = {
    status: elyseStatus,
    signal: elyseSignal,
    items: elyseItems.slice(0, 2),
  };

  // Gyna (Go-to-Market)
  const gynaItems: string[] = [];
  if (metrics.nb_prospects !== null) {
    gynaItems.push(`${metrics.nb_prospects} prospects dans le pipeline`);
  }
  if (metrics.nb_leads_mois !== null) {
    gynaItems.push(`${metrics.nb_leads_mois} leads ce mois`);
  }
  if (metrics.nb_clients !== null) {
    gynaItems.push(`${metrics.nb_clients} clients actifs`);
  }
  if (metrics.taux_conversion !== null) {
    gynaItems.push(`Taux de conversion : ${metrics.taux_conversion}%`);
  }

  signals.gyna = {
    status: "active" as const,
    signal: metrics.nb_clients !== null
      ? `${metrics.nb_clients} clients actifs`
      : "Pipeline en cours",
    items: gynaItems.slice(0, 2),
  };

  // Astryd (Opérationnel)
  const astrydItems: string[] = [];
  if (metrics.priorite_active) {
    astrydItems.push(`Priorité : ${metrics.priorite_active}`);
  }
  if (metrics.prochaine_echeance) {
    astrydItems.push(`À venir : ${metrics.prochaine_echeance}`);
  }
  if (metrics.jalons_recents.length > 0) {
    const lastJalon = metrics.jalons_recents[0];
    astrydItems.push(`Jalon : ${lastJalon.titre} (${lastJalon.statut})`);
  }

  signals.astryd = {
    status: "active" as const,
    signal: metrics.priorite_active ?? "Projet en cours",
    items: astrydItems.slice(0, 2),
  };

  return signals;
}

/**
 * Construit le sous-texte de l'activité feed après extraction.
 */
function buildActivitySub(metrics: ExtractedMetrics): string {
  const parts: string[] = [];
  if (metrics.mrr !== null) parts.push(`MRR ${formatEuro(metrics.mrr)}`);
  if (metrics.nb_clients !== null) parts.push(`${metrics.nb_clients} clients`);
  if (metrics.runway_months !== null) parts.push(`runway ${metrics.runway_months.toFixed(1)} mois`);
  if (parts.length === 0) return "Données extraites depuis Notion";
  return parts.join(" · ");
}

/**
 * Récupère les dernières métriques extraites pour un user.
 */
export async function getLatestMetrics(userId: string): Promise<ExtractedMetrics | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("extracted_metrics")
    .select("*")
    .eq("user_id", userId)
    .order("extracted_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  return {
    mrr: data.mrr,
    mrr_previous: data.mrr_previous,
    arr: data.arr,
    ca_mensuel: data.ca_mensuel,
    ca_annuel: data.ca_annuel,
    burn_rate: data.burn_rate,
    runway_months: data.runway_months,
    tresorerie: data.tresorerie,
    capital_raised: data.capital_raised,
    nb_clients: data.nb_clients,
    nb_clients_previous: data.nb_clients_previous,
    nb_prospects: data.nb_prospects,
    nb_users: data.nb_users,
    churn_rate: data.churn_rate,
    cac: data.cac,
    ltv: data.ltv,
    nps: data.nps,
    headcount: data.headcount,
    nb_recrutements_en_cours: data.nb_recrutements_en_cours,
    nb_leads_mois: data.nb_leads_mois,
    taux_conversion: data.taux_conversion,
    nb_rdv_mois: data.nb_rdv_mois,
    priorite_active: data.priorite_active,
    prochaine_echeance: data.prochaine_echeance,
    jalons_recents: data.jalons_recents ?? [],
    signaux_positifs: data.signaux_positifs ?? [],
    signaux_negatifs: data.signaux_negatifs ?? [],
    alertes: data.alertes ?? [],
    confidence: data.confidence ?? 0.5,
  };
}
