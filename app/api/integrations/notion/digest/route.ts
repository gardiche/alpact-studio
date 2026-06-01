// GET  /api/integrations/notion/digest — récupère le digest existant
// POST /api/integrations/notion/digest — force la (re)génération du digest

import { NextRequest, NextResponse } from "next/server";
import { ensureUserId } from "@/lib/integrations/notion/session";
import { getDigest, getOrCreateDigest } from "@/lib/integrations/notion/digest";
import { getSnapshot } from "@/lib/integrations/notion/storage";

export const runtime = "nodejs";

export async function GET() {
  try {
    const userId = await ensureUserId();
    const digest = await getDigest(userId);

    if (!digest) {
      return NextResponse.json({ digest: null, message: "no_digest" });
    }

    return NextResponse.json({ digest });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    if (message === "Non authentifié") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(_req: NextRequest) {
  try {
    const userId = await ensureUserId();

    // Récupérer le snapshot courant
    const snapshot = await getSnapshot(userId);
    if (!snapshot) {
      return NextResponse.json(
        { error: "no_snapshot", message: "Synchronisez d'abord vos pages Notion." },
        { status: 404 }
      );
    }

    if (snapshot.pages.length === 0) {
      return NextResponse.json(
        { error: "empty_snapshot", message: "Aucune page avec du contenu." },
        { status: 404 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "sk-ant-placeholder") {
      return NextResponse.json(
        { error: "no_api_key", message: "Clé API Anthropic non configurée." },
        { status: 503 }
      );
    }

    const digest = await getOrCreateDigest(userId, snapshot);

    return NextResponse.json({ digest, regenerated: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    if (message === "Non authentifié") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
