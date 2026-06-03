// GET  /api/integrations/notion/metrics — Récupère les dernières métriques
// POST /api/integrations/notion/metrics — Force une nouvelle extraction

import { NextRequest, NextResponse } from "next/server";
import { ensureUserId } from "@/lib/integrations/notion/session";
import { getLatestMetrics, extractAndSaveMetrics } from "@/lib/integrations/notion/metricsExtractor";
import { getIntegration } from "@/lib/integrations/notion/storage";
import { createClient } from "@/lib/supabase/server";
import type { NotionContextSnapshot, NotionContextPage } from "@/types/integrations";

export const runtime = "nodejs";

export async function GET() {
  const userId = await ensureUserId();

  const metrics = await getLatestMetrics(userId);
  if (!metrics) {
    return NextResponse.json({ metrics: null, message: "no_metrics_yet" });
  }

  return NextResponse.json({ metrics });
}

export async function POST(req: NextRequest) {
  const userId = await ensureUserId();

  // Vérifier que la clé Anthropic est dispo
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "sk-ant-placeholder") {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY non configurée" },
      { status: 503 }
    );
  }

  // Vérifier que Notion est connecté
  const integration = await getIntegration(userId);
  if (!integration) {
    return NextResponse.json({ error: "notion_not_connected" }, { status: 401 });
  }

  // Récupérer le dernier snapshot
  const supabase = await createClient();
  const { data: snap } = await supabase
    .from("notion_snapshots")
    .select("*")
    .eq("user_id", userId)
    .order("synced_at", { ascending: false })
    .limit(1)
    .single();

  if (!snap) {
    return NextResponse.json(
      { error: "no_snapshot", message: "Synchronisez vos pages Notion d'abord." },
      { status: 404 }
    );
  }

  // Reconstruire le snapshot pour l'extraction
  const pages: NotionContextPage[] = (snap.pages as NotionContextPage[]) ?? [];

  const snapshot: NotionContextSnapshot = {
    user_id: userId,
    workspace_id: snap.workspace_id ?? "",
    pages,
    total_chars: pages.reduce((s, p) => s + (p.content?.length ?? 0), 0),
    synced_at: snap.synced_at,
  };

  try {
    const metrics = await extractAndSaveMetrics(userId, snapshot, snap.id);
    return NextResponse.json({
      success: true,
      metrics,
      message: `${Object.values(metrics).filter((v) => v !== null).length} métriques extraites`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "extraction_error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
