// ============================================================
// Notion Context Digest — le cerveau connecté d'Alpact Studio
// ============================================================
// Transforme un snapshot Notion brut (pages + contenu) en un
// résumé structuré et exploitable par le copilot, le brief,
// et les insights hub.
//
// Le digest n'est recalculé que lorsque le snapshot_id change,
// ce qui évite des appels Claude inutiles.
// ============================================================

import { anthropic } from "@/lib/anthropic/client";
import { createClient } from "@/lib/supabase/server";
import type { NotionContextSnapshot, NotionContextPage } from "@/types/integrations";

// ============================================================
// Types
// ============================================================

export interface NotionDigest {
  identity: string | null;
  strategy: string | null;
  progress: string | null;
  signals: string | null;
  resources: string | null;
  summary: string;
  snapshot_id: string;
  generated_at: string;
}

interface DigestRow {
  id: string;
  user_id: string;
  snapshot_id: string;
  identity: string | null;
  strategy: string | null;
  progress: string | null;
  signals: string | null;
  resources: string | null;
  summary: string;
  model: string;
  input_tokens: number | null;
  output_tokens: number | null;
  generated_at: string;
}

// ============================================================
// Prompt pour la génération du digest
// ============================================================

const DIGEST_SYSTEM_PROMPT = `Tu es un analyste expert en accompagnement de startups. Tu reçois le contenu brut des pages Notion d'un fondateur et tu dois en extraire un résumé structuré pour alimenter un outil d'accompagnement.

Ton objectif : comprendre rapidement où en est le fondateur — son projet, sa stratégie, son avancement, ses signaux faibles.

Réponds UNIQUEMENT avec un objet JSON valide, sans markdown autour, sans \`\`\`json, juste le JSON brut. Structure :

{
  "identity": "Nom du projet, mission/vision, proposition de valeur, secteur, cible. 2-3 phrases max.",
  "strategy": "Roadmap, objectifs, métriques cibles, vision court et moyen terme, go-to-market. 2-4 phrases max.",
  "progress": "État d'avancement concret : ce qui est fait, ce qui est en cours, les prochaines étapes. 2-4 phrases max.",
  "signals": "Ce qui a bougé récemment (dates), ce qui stagne, les points d'attention. 2-3 phrases max.",
  "resources": "Outils mentionnés, process en place, taille d'équipe, stack technique, partenaires. 1-2 phrases max.",
  "summary": "Résumé global en 2-3 phrases. Doit suffire à comprendre le projet et son état en 10 secondes."
}

Règles :
- Si une section n'a pas d'information pertinente, mets null.
- Sois factuel : extrais l'information, n'invente rien.
- Utilise les dates et chiffres quand disponibles.
- Le summary est OBLIGATOIRE et ne doit pas dépasser 500 caractères.
- Écris en français.`;

// ============================================================
// Construction du contenu à analyser
// ============================================================

/** Limite de caractères envoyés à Claude (évite les tokens excessifs) */
const MAX_CONTEXT_CHARS = 30_000;

function buildDigestInput(snapshot: NotionContextSnapshot): string {
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
    if (totalChars >= MAX_CONTEXT_CHARS) {
      lines.push(`\n[... ${sorted.length - sorted.indexOf(page)} pages tronquées pour limiter le contexte]`);
      break;
    }

    const pageHeader = `\n--- PAGE : ${page.title} (modifiée le ${page.last_edited_time}) ---`;
    const content = page.content.trim();

    // Tronquer les pages individuelles trop longues
    const maxPerPage = 5000;
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
// Génération du digest via Claude
// ============================================================

async function generateDigest(
  snapshot: NotionContextSnapshot
): Promise<{
  digest: Omit<NotionDigest, "snapshot_id" | "generated_at">;
  inputTokens: number;
  outputTokens: number;
}> {
  const input = buildDigestInput(snapshot);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1200,
    system: DIGEST_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Voici le contenu Notion du fondateur :\n\n${input}`,
      },
    ],
  });

  // Extraire le texte de la réponse
  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  // Parser le JSON
  let parsed: Record<string, string | null>;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Si Claude n'a pas renvoyé du JSON pur, tenter d'extraire
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("Impossible de parser le digest JSON depuis la réponse Claude");
    }
  }

  return {
    digest: {
      identity: parsed.identity || null,
      strategy: parsed.strategy || null,
      progress: parsed.progress || null,
      signals: parsed.signals || null,
      resources: parsed.resources || null,
      summary: parsed.summary || "Projet en cours — détails non disponibles.",
    },
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

// ============================================================
// API publique
// ============================================================

/**
 * Récupère le digest existant d'un user.
 * Ne génère rien — juste lecture.
 */
export async function getDigest(userId: string): Promise<NotionDigest | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notion_context_digests")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;

  const row = data as DigestRow;
  return {
    identity: row.identity,
    strategy: row.strategy,
    progress: row.progress,
    signals: row.signals,
    resources: row.resources,
    summary: row.summary,
    snapshot_id: row.snapshot_id,
    generated_at: row.generated_at,
  };
}

/**
 * Récupère le digest, et le (re)génère si nécessaire.
 * Compare le snapshot_id courant au dernier digest.
 * Retourne le digest à jour.
 */
export async function getOrCreateDigest(
  userId: string,
  snapshot: NotionContextSnapshot
): Promise<NotionDigest> {
  const supabase = await createClient();

  // 1. Récupérer le snapshot_id courant
  const { data: currentSnap } = await supabase
    .from("notion_snapshots")
    .select("id")
    .eq("user_id", userId)
    .order("synced_at", { ascending: false })
    .limit(1)
    .single();

  const snapshotId = currentSnap?.id;
  if (!snapshotId) {
    return {
      identity: null,
      strategy: null,
      progress: null,
      signals: null,
      resources: null,
      summary: "Aucun contenu Notion synchronisé.",
      snapshot_id: "",
      generated_at: new Date().toISOString(),
    };
  }

  // 2. Vérifier si un digest existe déjà pour ce snapshot
  const { data: existing } = await supabase
    .from("notion_context_digests")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (existing && existing.snapshot_id === snapshotId) {
    // Digest à jour — pas besoin de régénérer
    const row = existing as DigestRow;
    return {
      identity: row.identity,
      strategy: row.strategy,
      progress: row.progress,
      signals: row.signals,
      resources: row.resources,
      summary: row.summary,
      snapshot_id: row.snapshot_id,
      generated_at: row.generated_at,
    };
  }

  // 3. Générer un nouveau digest
  if (snapshot.pages.length === 0) {
    return {
      identity: null,
      strategy: null,
      progress: null,
      signals: null,
      resources: null,
      summary: "Pages Notion synchronisées mais vides.",
      snapshot_id: snapshotId,
      generated_at: new Date().toISOString(),
    };
  }

  const { digest, inputTokens, outputTokens } = await generateDigest(snapshot);
  const now = new Date().toISOString();

  // 4. Upsert en base
  const { error } = await supabase
    .from("notion_context_digests")
    .upsert(
      {
        user_id: userId,
        snapshot_id: snapshotId,
        identity: digest.identity,
        strategy: digest.strategy,
        progress: digest.progress,
        signals: digest.signals,
        resources: digest.resources,
        summary: digest.summary,
        model: "claude-sonnet-4-20250514",
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        generated_at: now,
      },
      { onConflict: "user_id" }
    );

  if (error) {
    console.error("[digest] Erreur upsert:", error.message);
    // On retourne quand même le digest même si la persistence échoue
  }

  return {
    ...digest,
    snapshot_id: snapshotId,
    generated_at: now,
  };
}

/**
 * Construit le bloc de contexte Notion pour injection dans un system prompt.
 * Format compact optimisé pour les tokens.
 */
export function buildNotionContextBlock(digest: NotionDigest): string {
  const sections: string[] = [];

  sections.push("=== CONTEXTE NOTION DU FONDATEUR ===");

  if (digest.identity) {
    sections.push(`[Identité] ${digest.identity}`);
  }
  if (digest.strategy) {
    sections.push(`[Stratégie] ${digest.strategy}`);
  }
  if (digest.progress) {
    sections.push(`[Avancement] ${digest.progress}`);
  }
  if (digest.signals) {
    sections.push(`[Signaux] ${digest.signals}`);
  }
  if (digest.resources) {
    sections.push(`[Ressources] ${digest.resources}`);
  }

  sections.push("=== FIN CONTEXTE NOTION ===");

  return sections.join("\n");
}

/**
 * Raccourci : récupère le digest et le formate pour injection.
 * Retourne null si pas de digest disponible.
 */
export async function getNotionContextForPrompt(userId: string): Promise<string | null> {
  const digest = await getDigest(userId);
  if (!digest || !digest.summary || digest.summary === "Aucun contenu Notion synchronisé.") {
    return null;
  }
  return buildNotionContextBlock(digest);
}
