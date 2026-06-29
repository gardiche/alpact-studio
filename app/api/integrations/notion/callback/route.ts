// Handles the Notion OAuth callback and stores the encrypted token.

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

function getRedirectUri(req: NextRequest): string {
  return new URL("/api/integrations/notion/callback", req.nextUrl.origin).toString();
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");
  const storedState = req.cookies.get("alpact_notion_oauth_state")?.value;

  if (error) {
    console.error("[notion/callback] Notion returned an OAuth error", { error });
    return errorRedirect(req, error);
  }

  if (!code || !state) {
    console.error("[notion/callback] Missing OAuth params", {
      hasCode: Boolean(code),
      hasState: Boolean(state),
    });
    return errorRedirect(req, "missing_params");
  }

  if (!storedState || storedState !== state) {
    console.error("[notion/callback] OAuth state mismatch", {
      hasStoredState: Boolean(storedState),
      hasReturnedState: Boolean(state),
    });
    return errorRedirect(req, "state_mismatch");
  }

  try {
    const redirectUri = getRedirectUri(req);
    console.info("[notion/callback] Exchanging OAuth code", { redirectUri });

    const token = await exchangeCodeForToken(code, redirectUri);
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
    response.cookies.delete("alpact_notion_oauth_state");
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    console.error("[notion/callback] OAuth callback failed", { message });
    return errorRedirect(req, message.slice(0, 300));
  }
}
