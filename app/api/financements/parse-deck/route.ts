import { NextRequest, NextResponse } from "next/server";
import { parseDeck } from "@/lib/financements/geminiService";

export async function POST(req: NextRequest) {
  try {
    const { base64Data, mimeType } = await req.json() as {
      base64Data: string;
      mimeType: string;
    };

    if (!base64Data || !mimeType) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    const result = await parseDeck(base64Data, mimeType);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur lors de l'analyse";
    console.error("parse-deck error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
