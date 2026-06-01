import { anthropic } from "@/lib/anthropic/client";
import { getCohortMemberDetail } from "@/lib/org/cohortRepository";
import { buildBriefContext } from "@/lib/org/briefBuilder";
import { getDigest, buildNotionContextBlock } from "@/lib/integrations/notion/digest";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `Tu es l'assistant d'un accompagnateur d'entrepreneurs (incubateur / accélérateur).
Ton rôle : préparer une séance de coaching en générant 4 à 6 questions ouvertes que l'accompagnateur peut poser à l'entrepreneur.

Principes :
- Pose des questions ouvertes, jamais fermées.
- Vise la posture entrepreneuriale autant que le projet — émotion, énergie, tensions, charge mentale.
- Sois direct et bienveillant, jamais condescendant.
- Utilise le tutoiement.
- Pas de préambule, pas de conclusion : juste les questions, numérotées de 1 à N.
- Chaque question fait UNE phrase, courte.
- Adapte ton ton à la situation : si l'entrepreneur est en alerte, montre de la considération ; s'il avance bien, pousse-le un cran plus loin.`;

async function buildUserPrompt(memberId: string): Promise<string | null> {
  const member = await getCohortMemberDetail(memberId);
  if (!member) return null;
  const ctx = buildBriefContext(member);

  const lines: string[] = [];
  lines.push(`Entrepreneur : ${member.first_name} ${member.last_name}`);
  lines.push(`Projet : ${member.project_name} — ${member.project_description}`);
  lines.push(`Stade : ${member.stage} · Secteur : ${member.sector} · Équipe : ${member.team_size}`);
  lines.push(`Statut cohorte : ${member.status}${member.alert_reason ? ` (${member.alert_reason})` : ""}`);
  lines.push("");

  lines.push(`Météo récente : ${ctx.weather.summary}`);
  if (ctx.weather.highlights.length > 0) {
    lines.push("Verbatims récents :");
    ctx.weather.highlights.forEach((h) => lines.push(`  - « ${h.note} »`));
  }
  lines.push("");

  if (ctx.activeTensions.length > 0) {
    lines.push("Tensions actives :");
    ctx.activeTensions.forEach((t) => lines.push(`  - [${t.kind}] ${t.description}`));
    lines.push("");
  }

  if (ctx.openActions.length > 0) {
    lines.push("Actions en cours :");
    ctx.openActions.forEach((a) => lines.push(`  - ${a.title} (${a.status})`));
    lines.push("");
  }

  if (ctx.inProgressMilestones.length > 0) {
    lines.push("Jalons en cours :");
    ctx.inProgressMilestones.forEach((m) => lines.push(`  - ${m.title}`));
    lines.push("");
  }

  if (member.notes.length > 0) {
    lines.push("Notes de l'accompagnateur :");
    member.notes.slice(0, 3).forEach((n) => lines.push(`  - « ${n.content} »`));
  }

  // Injecter le contexte Notion si l'entrepreneur a connecté son workspace
  if (member.user_id) {
    try {
      const digest = await getDigest(member.user_id);
      if (digest && digest.summary && digest.summary !== "Aucun contenu Notion synchronisé.") {
        lines.push("");
        lines.push(buildNotionContextBlock(digest));
      }
    } catch {
      // Silencieux — le brief fonctionne sans Notion
    }
  }

  lines.push("");
  lines.push("Génère 4 à 6 questions à poser en séance, numérotées.");
  return lines.join("\n");
}

export async function POST(request: NextRequest) {
  const { memberId } = await request.json();
  if (!memberId || typeof memberId !== "string") {
    return NextResponse.json({ error: "memberId requis" }, { status: 400 });
  }

  const userPrompt = await buildUserPrompt(memberId);
  if (!userPrompt) {
    return NextResponse.json({ error: "Entrepreneur introuvable" }, { status: 404 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY manquante", fallback: true },
      { status: 503 }
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = anthropic.messages.stream({
          model: "claude-sonnet-4-20250514",
          max_tokens: 600,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userPrompt }],
        });

        for await (const event of anthropicStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const data = JSON.stringify({ content: event.delta.text });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erreur Anthropic";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
