import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ProjectData, ProjectionResult, GeneratedBPContent } from "@/types/business-plan";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const AUDIENCE_TONE: Record<string, string> = {
  bank: "Ton formel et prudent, focus sur la capacité de remboursement, la stabilité des revenus, et les garanties.",
  investor: "Ton ambitieux et data-driven, focus sur la traction, la scalabilité, et le potentiel de marché.",
  bpi: "Focus sur l'innovation, l'impact territorial, l'emploi créé, et la dimension R&D.",
  partner: "Ton collaboratif, focus sur la complémentarité, les références clients, et le pipeline.",
  internal: "Ton direct et opérationnel, focus sur les actions concrètes, les décisions à prendre, et la timeline.",
};

function buildSystemPrompt(): string {
  return `Tu es un expert en rédaction de business plans pour des startups françaises en phase early-stage à scaling. Tu rédiges de manière professionnelle, factuelle et convaincante.

RÈGLES ABSOLUES :
- Ne jamais inventer de chiffres. Utilise UNIQUEMENT les indicateurs fournis dans le prompt utilisateur.
- Si une donnée manque, écris "À compléter par le fondateur".
- Adapte le niveau de certitude selon la source de chaque donnée :
  - stripe/qonto : "Les données de facturation confirment..."
  - notion/drive : "Selon les documents du fondateur..."
  - user_input : "Le fondateur estime..."
  - inferred : "Sur la base des données disponibles, nous estimons..."
  - benchmark : "Selon les benchmarks sectoriels..."
- Retourne UNIQUEMENT du JSON valide, sans markdown, sans backticks, sans texte avant ou après le JSON.
- Chaque section doit faire entre 150 et 400 mots.
- Rédige en français.`;
}

function buildUserPrompt(data: ProjectData, projections: ProjectionResult): string {
  const { project, revenueLines, teamMembers, fixedCosts, variableCosts, treasury, bpContext } = data;
  const { indicators, pnl } = projections;

  const audienceTone = AUDIENCE_TONE[bpContext.target_audience ?? "internal"] ?? AUDIENCE_TONE.internal;

  const year1Revenue = pnl.slice(0, 12).reduce((s, m) => s + m.revenue, 0);
  const year2Revenue = pnl.slice(12, 24).reduce((s, m) => s + m.revenue, 0);
  const year3Revenue = pnl.slice(24, 36).reduce((s, m) => s + m.revenue, 0);
  const year1Ebitda = pnl.slice(0, 12).reduce((s, m) => s + m.ebitda, 0);

  const fmt = (n: number) => Math.round(n).toLocaleString("fr-FR") + " €";

  return `Génère un business plan complet à partir des données suivantes.

DESTINATAIRE : ${bpContext.target_audience ?? "interne"}
TON REQUIS : ${audienceTone}
${bpContext.funding_amount_requested ? `MONTANT DEMANDÉ : ${fmt(bpContext.funding_amount_requested)}` : ""}
${bpContext.funding_usage ? `UTILISATION DES FONDS : ${bpContext.funding_usage}` : ""}
${bpContext.deadline ? `ÉCHÉANCE : ${bpContext.deadline}` : ""}

PROJET :
- Nom : ${project.name}
- Description : ${project.description ?? "Non renseignée"}
- Type : ${project.business_type ?? "Non défini"}
- Stade : ${project.stage ?? "Non défini"}

REVENUS (${revenueLines.length} ligne(s)) :
${revenueLines.map((l) => `- ${l.name} : ${fmt(l.unit_price)}/${l.billing_cycle ?? "unité"}, ${l.current_volume} clients actuels [source: ${l.source}]`).join("\n")}

ÉQUIPE :
${teamMembers.length > 0 ? teamMembers.map((m) => `- ${m.role} (${m.type}, ×${m.count}) : ${m.is_paid && m.net_salary_monthly ? fmt(m.net_salary_monthly) + " net/mois" : "non rémunéré"}, ${m.is_current ? "en poste" : "recrutement prévu le " + m.start_date}`).join("\n") : "Aucun membre renseigné"}

CHARGES FIXES MENSUELLES :
${fixedCosts.length > 0 ? fixedCosts.map((c) => `- ${c.label} (${c.category}) : ${fmt(c.amount_monthly)} [source: ${c.source}]`).join("\n") : "Non renseignées"}

CHARGES VARIABLES :
${variableCosts.length > 0 ? variableCosts.map((c) => `- ${c.label} (${c.category}, ${c.cost_model}) [source: ${c.source}]`).join("\n") : "Non renseignées"}

TRÉSORERIE :
- Cash actuel : ${fmt(treasury.cash_balance)} [source: ${treasury.source}]
${treasury.fundraising_amount ? `- Levée : ${fmt(treasury.fundraising_amount)} (${treasury.fundraising_date ?? "date non précisée"})` : ""}
${(treasury.outstanding_loans ?? []).length > 0 ? `- Prêts en cours : ${treasury.outstanding_loans!.map((l) => `${l.type} ${fmt(l.amount)}, ${l.monthly_payment}€/mois`).join(", ")}` : ""}

INDICATEURS CALCULÉS (scénario ${projections.scenario}) — NE PAS RECALCULER :
- CA Année 1 : ${fmt(year1Revenue)}
- CA Année 2 : ${fmt(year2Revenue)}
- CA Année 3 : ${fmt(year3Revenue)}
- EBITDA Année 1 : ${fmt(year1Ebitda)}
- Runway : ${indicators.runway === null ? "+36 mois" : indicators.runway + " mois"}
- Break-even : ${indicators.breakEvenMonth === null ? "Non atteint sur 36 mois" : "Mois " + indicators.breakEvenMonth}
- MRR actuel : ${fmt(indicators.mrr)}
- ARR actuel : ${fmt(indicators.arr)}
${indicators.ltv ? `- LTV : ${fmt(indicators.ltv)}` : ""}
${indicators.ltvCacRatio ? `- LTV/CAC : ${indicators.ltvCacRatio.toFixed(1)}` : ""}
- Burn rate : ${fmt(indicators.burnRate)}/mois

CONTEXTE QUALITATIF :
${bpContext.market_context ? `Marché : ${bpContext.market_context}` : ""}
${bpContext.competitive_advantage ? `Avantage concurrentiel : ${bpContext.competitive_advantage}` : ""}
${bpContext.team_narrative ? `Équipe : ${bpContext.team_narrative}` : ""}

Retourne ce JSON exact (pas de markdown, pas de backticks) :
{
  "executive_summary": "...",
  "project": "...",
  "market": "...",
  "business_model": "...",
  "team": "...",
  "commercial_strategy": "...",
  "financial_projections": "...",
  "funding_plan": "...",
  "appendix": "..."
}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectData, projections, scenario } = body as {
      projectData: ProjectData;
      projections: ProjectionResult;
      scenario: string;
    };

    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(projectData, projections);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt,
    });

    const streamResult = await model.generateContentStream(userPrompt);

    let rawContent = "";

    const response = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamResult.stream) {
            const text = chunk.text();
            if (text) {
              rawContent += text;
              controller.enqueue(
                new TextEncoder().encode(`data: ${JSON.stringify({ chunk: text })}\n\n`)
              );
            }
          }

          // Parse the complete JSON
          let content: GeneratedBPContent;
          try {
            const cleaned = rawContent.replace(/^```json?\n?/, "").replace(/\n?```$/, "").trim();
            content = JSON.parse(cleaned);
          } catch {
            content = {
              executive_summary: rawContent,
              project: "À compléter par le fondateur",
              market: "À compléter par le fondateur",
              business_model: "À compléter par le fondateur",
              team: "À compléter par le fondateur",
              commercial_strategy: "À compléter par le fondateur",
              financial_projections: "À compléter par le fondateur",
              funding_plan: "À compléter par le fondateur",
              appendix: "",
            };
          }

          const bpId = `bp_${Date.now()}`;
          const bp = {
            id: bpId,
            project_id: projectData.project.id,
            version: 1,
            scenario,
            generated_content: content,
            financial_tables: {
              pnl: projections.pnl,
              cashflow: projections.cashflow,
              bfr: projections.bfr,
              indicators: projections.indicators,
            },
            data_snapshot: projectData,
            completeness_score: 70,
            status: "draft",
            created_at: new Date().toISOString(),
          };

          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ done: true, bpId, bp })}\n\n`
            )
          );
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(response, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("BP generation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Génération échouée" },
      { status: 500 }
    );
  }
}
