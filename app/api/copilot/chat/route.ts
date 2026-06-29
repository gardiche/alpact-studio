import { ANTHROPIC_MODEL, anthropic } from "@/lib/anthropic/client";
import { buildSystemPrompt } from "@/lib/anthropic/prompts";
import { getNotionContextForPrompt } from "@/lib/integrations/notion/digest";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Charger le profil depuis la bonne table
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .single();

  // Enrichir avec les infos entrepreneur si applicable
  const { data: entrepreneurProfile } = await supabase
    .from("entrepreneur_profiles")
    .select("*")
    .eq("user_id", authUser.id)
    .single();

  const user = {
    id: authUser.id,
    email: authUser.email ?? "",
    first_name: profile?.first_name ?? "",
    last_name: profile?.last_name ?? "",
    project_name: entrepreneurProfile?.project_name ?? "",
    project_description: entrepreneurProfile?.project_description ?? "",
    stage: entrepreneurProfile?.stage ?? "",
    sector: entrepreneurProfile?.sector ?? "",
    team_size: entrepreneurProfile?.team_size ?? 1,
    founded_at: entrepreneurProfile?.founded_at ?? "",
    avatar_url: profile?.avatar_url ?? "",
    created_at: profile?.created_at ?? new Date().toISOString(),
    updated_at: profile?.updated_at ?? new Date().toISOString(),
  };

  const body = await request.json();
  const { messages, pageContext } = body;

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Charger le contexte Notion du fondateur (ne coûte rien si pas de digest)
  let notionContext: string | null = null;
  try {
    notionContext = await getNotionContextForPrompt(authUser.id);
  } catch (e) {
    // Silencieux — le copilot fonctionne sans Notion
    console.warn("[copilot] Notion context unavailable:", e);
  }

  const systemPrompt = buildSystemPrompt(user, pageContext || "hub", notionContext);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = anthropic.messages.stream({
          model: ANTHROPIC_MODEL,
          max_tokens: 1000,
          system: systemPrompt,
          messages: messages.slice(-10).map((m: { role: string; content: string }) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
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
        controller.error(error);
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
