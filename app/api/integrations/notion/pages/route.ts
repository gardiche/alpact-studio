// GET /api/integrations/notion/pages
// Liste toutes les pages/databases accessibles via l'intégration + l'état de sélection.

import { NextResponse } from "next/server";
import { listAccessiblePages } from "@/lib/integrations/notion/client";
import { getIntegration, getSelectedPages } from "@/lib/integrations/notion/storage";
import { ensureUserId } from "@/lib/integrations/notion/session";

export const runtime = "nodejs";

export async function GET() {
  const userId = await ensureUserId();
  const integration = await getIntegration(userId);
  if (!integration) {
    return NextResponse.json({ error: "not_connected" }, { status: 401 });
  }

  try {
    const [pages, selected] = await Promise.all([
      listAccessiblePages(integration.access_token),
      getSelectedPages(userId),
    ]);
    const selectedIds = new Set(selected.filter((s) => s.selected).map((s) => s.page_id));
    return NextResponse.json({
      workspace_name: integration.workspace_name,
      pages: pages.map((p) => ({ ...p, selected: selectedIds.has(p.id) })),
      total: pages.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
