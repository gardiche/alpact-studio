// POST /api/integrations/notion/disconnect
// Supprime l'intégration + sélection + snapshot pour l'utilisateur courant.
// Note : ne révoque pas le token côté Notion — l'utilisateur peut le faire depuis
// son interface Notion (Settings > Connections).

import { NextResponse } from "next/server";
import { deleteIntegration } from "@/lib/integrations/notion/storage";
import { ensureUserId } from "@/lib/integrations/notion/session";

export const runtime = "nodejs";

export async function POST() {
  const userId = await ensureUserId();
  await deleteIntegration(userId);
  return NextResponse.json({ success: true });
}
