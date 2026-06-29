// GET  /api/integrations/notion/metrics - recupere les dernieres metriques
// POST /api/integrations/notion/metrics - force une nouvelle extraction

import { NextResponse } from "next/server";
import { ensureUserId } from "@/lib/integrations/notion/session";
import { getLatestMetrics, extractAndSaveMetrics } from "@/lib/integrations/notion/metricsExtractor";
import { getIntegration, getSnapshot } from "@/lib/integrations/notion/storage";

export const runtime = "nodejs";

export async function GET() {
  const userId = await ensureUserId();

  const metrics = await getLatestMetrics(userId);
  if (!metrics) {
    return NextResponse.json({ metrics: null, message: "no_metrics_yet" });
  }

  return NextResponse.json({ metrics });
}

export async function POST() {
  const userId = await ensureUserId();

  const integration = await getIntegration(userId);
  if (!integration) {
    return NextResponse.json({ error: "notion_not_connected" }, { status: 401 });
  }

  const snapshot = await getSnapshot(userId);
  if (!snapshot) {
    return NextResponse.json(
      { error: "no_snapshot", message: "Synchronisez vos pages Notion d'abord." },
      { status: 404 }
    );
  }

  try {
    const metrics = await extractAndSaveMetrics(userId, snapshot);
    return NextResponse.json({
      success: true,
      metrics,
      message: `${Object.values(metrics).filter((v) => v !== null).length} metriques extraites`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "extraction_error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
