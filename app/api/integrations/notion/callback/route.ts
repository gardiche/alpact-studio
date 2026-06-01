// Callback OAuth Notion :
// 1. vérifie le state CSRF
// 2. échange le code contre un access_token
// 3. sauvegarde l'intégration
// 4. redirige vers /integrations/notion (page de sélection des pages)

import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken } from "@/lib/integrations/notion/oauth";
import { saveIntegration } from "@/lib/integrations/notion/storage";
import { ensureUserId } from "@/lib/integrations/notion/session";

export const runtime = "nodejs";

function errorRedirect(req: NextRequest, reason: string) {
  const url = new URL("/integrations", req.url);
  url.searchParams.set("notion_error", reason);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  if (error) return errorRedirect(req, error);
  if (!code || !state) return errorRedirect(req, "missing_params");

  const storedState = req.cookies.get("alpact_notion_oauth_state")?.value;
  if (!storedState || storedState !== state) {
    return errorRedirect(req, "state_mismatch");
  }

  try {
    const token = await exchangeCodeForToken(code);
    const userId = await ensureUserId();

    await saveIntegration({
      user_id: userId,
      workspace_id: token.workspace_id,
      workspace_name: token.workspace_name ?? "Workspace sans nom",
      workspace_icon: token.workspace_icon,
      access_token: token.access_token,
      bot_id: token.bot_id,
      notion_user_id: token.owner?.user?.id ?? null,
      notion_user_email: token.owner?.user?.person?.email ?? null,
      notion_user_name: token.owner?.user?.name ?? null,
      connected_at: new Date().toISOString(),
      last_synced_at: null,
    });

    const successUrl = new URL("/integrations/notion", req.url);
    successUrl.searchParams.set("just_connected", "1");
    const response = NextResponse.redirect(successUrl);
    // nettoyer le cookie de state
    response.cookies.delete("alpact_notion_oauth_state");
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return errorRedirect(req, encodeURIComponent(message).slice(0, 120));
  }
}
