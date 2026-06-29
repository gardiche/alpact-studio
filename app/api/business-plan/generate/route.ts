import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import type { ProjectData, ProjectionResult, GeneratedBPContent } from "@/types/business-plan";

function getGeminiApiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    ""
  ).trim();
}

function getGeminiClient() {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error(
      "Clé Gemini manquante. Ajoute GEMINI_API_KEY dans .env.local puis redémarre le serveur local."
    );
  }

  return new GoogleGenAI({ apiKey });
}

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
- Pour un destinataire banque, insiste sur la capacite de remboursement, le DSCR, la tresorerie minimale, les ressources propres et l utilisation des fonds.
- Si le DSCR est faible ou la tresorerie devient negative, mentionne le risque explicitement.
- Rédige en français.`;
}

function buildUserPrompt(data: ProjectData, projections: ProjectionResult): string {
  const { project, revenueLines, teamMembers, fixedCosts, variableCosts, investments, subsidies, treasury, bpContext } = data;
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

INVESTISSEMENTS :
${(investments ?? []).length > 0 ? investments!.map((inv) => `- ${inv.label} (${inv.category}) : ${fmt(inv.amount_ht)} HT, mois ${inv.month}, amortissement ${inv.amortization_years} ans`).join("\n") : "Aucun investissement renseigné"}

SUBVENTIONS / AIDES :
${(subsidies ?? []).length > 0 ? subsidies!.map((sub) => `- ${sub.name} : ${fmt(sub.amount)}, attendue le ${sub.expected_date ?? "non précisé"}`).join("\n") : "Aucune aide renseignée"}

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
- DSCR minimum : ${indicators.minDscr === null ? "Pas de dette bancaire" : indicators.minDscr.toFixed(2) + "x"}
- Service de dette annee 1 : ${fmt(indicators.year1DebtService)}
- EBITDA annee 1 : ${fmt(indicators.year1Ebitda)}
- Tresorerie minimale : ${fmt(indicators.minCashBalance)}
- Besoin de financement estime : ${fmt(indicators.financingNeed)}
- Ecart de financement : ${fmt(indicators.financingGap)}
- Dette nette / EBITDA annee 3 : ${indicators.debtToEbitdaYear3 === null ? "Non calculable" : indicators.debtToEbitdaYear3.toFixed(2) + "x"}
- Point mort (break-even en €) : ${indicators.breakEvenRevenue ? fmt(indicators.breakEvenRevenue) : "Non calculable"}
- CAF : An1 ${fmt(indicators.caf[0])}, An2 ${fmt(indicators.caf[1])}, An3 ${fmt(indicators.caf[2])}
- Taux de marge brute : An1 ${(indicators.grossMarginRate[0] * 100).toFixed(1)}%, An2 ${(indicators.grossMarginRate[1] * 100).toFixed(1)}%, An3 ${(indicators.grossMarginRate[2] * 100).toFixed(1)}%
- Taux de valeur ajoutee : An1 ${(indicators.valueAddedRate[0] * 100).toFixed(1)}%, An2 ${(indicators.valueAddedRate[1] * 100).toFixed(1)}%, An3 ${(indicators.valueAddedRate[2] * 100).toFixed(1)}%

SOLDES INTERMEDIAIRES DE GESTION (SIG) annuels :
${[0, 1, 2].map((y) => {
  const s = y * 12;
  const e = s + 12;
  const rev = pnl.slice(s, e).reduce((a, m) => a + m.revenue, 0);
  const vc = pnl.slice(s, e).reduce((a, m) => a + m.variableCosts, 0);
  const gm = pnl.slice(s, e).reduce((a, m) => a + m.grossMargin, 0);
  const ext = pnl.slice(s, e).reduce((a, m) => a + m.externalCosts, 0);
  const va = pnl.slice(s, e).reduce((a, m) => a + m.valueAdded, 0);
  const pay = pnl.slice(s, e).reduce((a, m) => a + m.payroll, 0);
  const ebitda = pnl.slice(s, e).reduce((a, m) => a + m.ebitda, 0);
  const dep = pnl.slice(s, e).reduce((a, m) => a + m.depreciation, 0);
  const net = pnl.slice(s, e).reduce((a, m) => a + m.netResult, 0);
  return `Annee ${y + 1} : CA ${fmt(rev)} | -CV ${fmt(vc)} = Marge brute ${fmt(gm)} | -Ext ${fmt(ext)} = VA ${fmt(va)} | -Salaires ${fmt(pay)} = EBE ${fmt(ebitda)} | -Amort ${fmt(dep)} | Resultat net ${fmt(net)}`;
}).join("\n")}

PLAN DE FINANCEMENT :
- Apport fondateurs : ${fmt(bpContext.founder_contribution ?? 0)}
- Capital social : ${fmt(bpContext.capital_social ?? 0)}
- Compte courant associe : ${fmt(bpContext.associate_current_account ?? 0)}
- Pret bancaire : ${fmt(bpContext.bank_loan_amount ?? bpContext.funding_amount_requested ?? 0)}
- Duree : ${bpContext.loan_duration_months ?? 60} mois
- Taux annuel estime : ${bpContext.annual_interest_rate ?? 0}%
- Differe : ${bpContext.deferment_months ?? 0} mois
- Investissements totaux : ${fmt((investments ?? []).reduce((s, inv) => s + inv.amount_ht, 0))}
- Buffer BFR / securite : ${fmt(bpContext.working_capital_buffer ?? 0)}
- TVA : ${bpContext.vat_rate ?? 20}%

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

    const genAI = getGeminiClient();
    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `${systemPrompt}\n\n${userPrompt}`,
      config: { responseMimeType: "application/json" },
    });

    const rawContent = result.text ?? "";

    const response = new ReadableStream({
      async start(controller) {
        try {
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
              annualPnl: projections.annualPnl,
              financingPlan: projections.financingPlan,
              balance: projections.balance,
              amortizations: projections.amortizations,
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

