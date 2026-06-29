// Starts the Notion OAuth flow.

import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { buildAuthUrl } from "@/lib/integrations/notion/oauth";
import { ensureUserId } from "@/lib/integrations/notion/session";

export const runtime = "nodejs";

function getRedirectUri(req: NextRequest): string {
  return new URL("/api/integrations/notion/callback", req.nextUrl.origin).toString();
}

export async function GET(req: NextRequest) {
  try {
    await ensureUserId();

    const state = randomBytes(24).toString("hex");
    const redirectUri = getRedirectUri(req);
    const authUrl = buildAuthUrl(state, redirectUri);

    console.info("[notion/connect] Starting OAuth", { redirectUri });

    const response = NextResponse.redirect(authUrl);
    response.cookies.set("alpact_notion_oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    console.error("[notion/connect] OAuth start failed", { message });

    const url = new URL("/integrations", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
    url.searchParams.set("notion_error", message);
    return NextResponse.redirect(url);
  }
}
