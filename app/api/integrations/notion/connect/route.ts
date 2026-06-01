// Lance le flow OAuth Notion :
// 1. génère un state cryptographique pour prévenir CSRF
// 2. pose un cookie alpact_oauth_state
// 3. redirige vers Notion

import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { buildAuthUrl } from "@/lib/integrations/notion/oauth";
import { ensureUserId } from "@/lib/integrations/notion/session";

export const runtime = "nodejs";

export async function GET() {
  // S'assurer qu'on a un user_id stable côté serveur
  await ensureUserId();

  const state = randomBytes(24).toString("hex");
  const authUrl = buildAuthUrl(state);

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("alpact_notion_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 min suffisent pour compléter le flow
  });
  return response;
}
