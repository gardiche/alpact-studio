// GET /api/integrations/notion/status
// Returns the Notion connection state for the current user.

import { NextResponse } from "next/server";
import { getIntegration, getSnapshot } from "@/lib/integrations/notion/storage";
import { ensureUserId } from "@/lib/integrations/notion/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    const userId = await ensureUserId();
    const integration = await getIntegration(userId);

    if (!integration) {
      return NextResponse.json({ connected: false });
    }

    const snapshot = await getSnapshot(userId);
    return NextResponse.json({
      connected: true,
      workspace_id: integration.workspace_id,
      workspace_name: integration.workspace_name,
      workspace_icon: integration.workspace_icon,
      notion_user_email: integration.notion_user_email,
      notion_user_name: integration.notion_user_name,
      connected_at: integration.connected_at,
      last_synced_at: integration.last_synced_at,
      pages_in_snapshot: snapshot?.pages.length ?? 0,
      total_chars: snapshot?.total_chars ?? 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    console.error("[notion/status] Failed to load status", { message });
    return NextResponse.json(
      { connected: false, error: message },
      { status: message.includes("authentifi") ? 401 : 500 }
    );
  }
}
