// POST /api/integrations/notion/sync
// Body: { selected_pages: { id, title, url, last_edited_time }[] }
// Sauvegarde la selection, extrait le contenu, cree un snapshot, puis met a jour le Hub.

import { NextRequest, NextResponse } from "next/server";
import { extractPageContent } from "@/lib/integrations/notion/client";
import {
  getIntegration,
  saveIntegration,
  saveSelectedPages,
  saveSnapshot,
} from "@/lib/integrations/notion/storage";
import { getOrCreateDigest } from "@/lib/integrations/notion/digest";
import { extractAndSaveMetrics } from "@/lib/integrations/notion/metricsExtractor";
import { ensureUserId } from "@/lib/integrations/notion/session";
import type { NotionContextPage, NotionContextSnapshot } from "@/types/integrations";

export const runtime = "nodejs";

interface SyncBody {
  selected_pages: { id: string; title: string; url: string; last_edited_time: string }[];
}

export async function POST(req: NextRequest) {
  const userId = await ensureUserId();
  const integration = await getIntegration(userId);
  if (!integration) {
    return NextResponse.json({ error: "not_connected" }, { status: 401 });
  }

  let body: SyncBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!Array.isArray(body.selected_pages)) {
    return NextResponse.json({ error: "selected_pages_required" }, { status: 400 });
  }

  await saveSelectedPages(
    userId,
    body.selected_pages.map((p) => ({ page_id: p.id, title: p.title, selected: true }))
  );

  try {
    const extracted: NotionContextPage[] = [];
    const queue = [...body.selected_pages];
    const batchSize = 3;

    while (queue.length > 0) {
      const batch = queue.splice(0, batchSize);
      const contents = await Promise.all(
        batch.map(async (p) => {
          try {
            const content = await extractPageContent(integration.access_token, p.id);
            return {
              page_id: p.id,
              title: p.title,
              url: p.url,
              content,
              last_edited_time: p.last_edited_time,
            } satisfies NotionContextPage;
          } catch (err) {
            const message = err instanceof Error ? err.message : "extraction_error";
            return {
              page_id: p.id,
              title: p.title,
              url: p.url,
              content: `[Erreur d'extraction : ${message}]`,
              last_edited_time: p.last_edited_time,
            } satisfies NotionContextPage;
          }
        })
      );
      extracted.push(...contents);
    }

    const total_chars = extracted.reduce((sum, p) => sum + p.content.length, 0);
    const syncedAt = new Date().toISOString();
    const snapshot: NotionContextSnapshot = {
      user_id: userId,
      workspace_id: integration.workspace_id,
      pages: extracted,
      total_chars,
      synced_at: syncedAt,
    };

    const snapshotId = await saveSnapshot(snapshot);
    await saveIntegration({ ...integration, last_synced_at: syncedAt });

    let digestGenerated = false;
    let metricsExtracted = false;
    let metricsError: string | null = null;
    const hasAnthropicKey =
      Boolean(process.env.ANTHROPIC_API_KEY) && process.env.ANTHROPIC_API_KEY !== "sk-ant-placeholder";

    if (hasAnthropicKey) {
      try {
        await getOrCreateDigest(userId, snapshot);
        digestGenerated = true;
      } catch (digestErr) {
        console.warn("[sync] Digest generation failed (non-blocking):", digestErr);
      }
    }

    try {
      await extractAndSaveMetrics(userId, snapshot, snapshotId);
      metricsExtracted = true;
    } catch (err) {
      metricsError = err instanceof Error ? err.message : "metrics_extraction_failed";
      console.warn("[sync] Metrics extraction failed (non-blocking):", err);
    }

    return NextResponse.json({
      success: true,
      pages_synced: extracted.length,
      total_chars,
      synced_at: syncedAt,
      digest_generated: digestGenerated,
      metrics_extracted: metricsExtracted,
      metrics_error: metricsError,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
