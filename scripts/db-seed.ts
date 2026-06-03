/**
 * Seed les comptes de démo Alpact Studio.
 *
 * Usage : npx tsx scripts/db-seed.ts
 *
 * Crée :
 *   1. demo.structure@alpact.studio (mot de passe : alpact-demo)
 *      → profil structure, organisation StartHEP, cohorte Printemps 2026
 *      → 6 entrepreneurs avec leurs jalons, signaux, notes, tools
 *   2. demo.entrepreneur@alpact.studio (mot de passe : alpact-demo)
 *      → profil entrepreneur, hub metrics, activity feed, notifications
 *
 * Idempotent : si les users existent déjà, on les supprime puis recrée tout.
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import {
  DEMO_ORG,
  DEMO_COHORT,
  DEMO_COHORT_MEMBERS,
} from "../lib/demo/org-data";
import { DEMO_SIGNALS } from "../lib/demo/org-signals";

config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const DEMO_PASSWORD = "alpact-demo";

const STRUCTURE_EMAIL = "demo.structure@alpact.studio";
const ENTREPRENEUR_EMAIL = "demo.entrepreneur@alpact.studio";

// ============================================================
// Données démo pour le hub entrepreneur (issues de lib/demo/data.ts)
// ============================================================

const HUB_METRICS = {
  mrr: "13 100 €",
  mrr_trend: "+7% ce mois",
  runway: "7,8 mois",
  runway_status: "warning",
  priorite: "Finaliser pitch deck",
  alertes: 2,
  mrr_numeric: 13100,
  mrr_previous: 12200,
  arr: 157200,
  ca_mensuel: 13100,
  burn_rate: 9800,
  runway_months: 7.8,
  tresorerie: 84000,
  capital_raised: 150000,
  nb_clients: 12,
  nb_prospects: 47,
  headcount: 4,
  churn_rate: 3.2,
  nb_leads_mois: 23,
  taux_conversion: 8.5,
  prochaine_echeance: "Call investisseur 28 juin",
  tool_signals: {
    astryd: {
      status: "active",
      signal: "Pitch deck V2 en cours",
      items: ["3 actions prioritaires cette semaine", "Call investisseur 28 juin"],
    },
    elyse: {
      status: "warning",
      signal: "Runway : 7,8 mois — sous le seuil",
      items: ["Burn en hausse de 18% ce mois", "Échéance salaires dans 12j · 8 500 €"],
    },
    gyna: {
      status: "active",
      signal: "47 prospects contactés ce mois",
      items: ["Warm outreach en cours", "À venir : brief freelance ads"],
    },
  },
};

const ACTIVITY = [
  { icon: "📊", text: "Runway mis à jour", sub: "Elyse · trésorerie synchronisée", tool: "elyse", hoursAgo: 1 },
  { icon: "🎯", text: "Nouveau prospect ajouté", sub: "Gyna · FinStart SAS", tool: "gyna", hoursAgo: 3 },
  { icon: "✅", text: "Contrat signé — Camille Martin", sub: "Gyna · 4 200 €", tool: "gyna", hoursAgo: 30 },
  { icon: "⚠️", text: "Burn en hausse de 18%", sub: "Elyse · alerte déclenchée", tool: "elyse", hoursAgo: 26 },
  { icon: "📝", text: "Business Plan mis à jour", sub: "Elyse · Livrables", tool: "elyse", hoursAgo: 50 },
];

const NOTIFICATIONS = [
  {
    tool: "elyse",
    type: "critique",
    title: "Runway sous le seuil critique",
    message: "7,8 mois de runway — en dessous du seuil recommandé de 9 mois.",
    link: "/elyse",
    is_read: false,
    minutesAgo: 30,
  },
  {
    tool: "elyse",
    type: "warning",
    title: "Burn mensuel en hausse",
    message: "+18% vs mois dernier — identifier les postes en hausse.",
    link: "/elyse",
    is_read: false,
    minutesAgo: 180,
  },
  {
    tool: "gyna",
    type: "rappel",
    title: "Relance Sophie Arnaud",
    message: "J+5 sans réponse — Growlab. Planifier une relance.",
    link: "/gyna",
    is_read: false,
    minutesAgo: 24 * 60,
  },
  {
    tool: "astryd",
    type: "rappel",
    title: "Call investisseur dans 2 jours",
    message: "Préparer le pitch deck V2 avant le 28 avril.",
    link: "/astryd",
    is_read: true,
    minutesAgo: 48 * 60,
  },
];

const DETAIL_MAP_INLINE = {
  "cm-1": {
    milestones: [
      { category: "produit", title: "MVP livré", description: "Première version utilisable en production", status: "franchi", daysAgo: 80 },
      { category: "commercial", title: "Premier client payant", description: "Contrat signé avec une PME industrielle de la Loire", status: "franchi", daysAgo: 20 },
      { category: "financement", title: "Dossier BPI déposé", description: null, status: "en cours", daysAgo: null },
      { category: "commercial", title: "10 clients payants", description: "Objectif fin Q3", status: "à venir", daysAgo: null },
    ],
    tools: [
      { tool: "elyse", sessions_count: 18, hoursAgo: 2, key_insight: "Runway 9 mois — santé financière stable" },
      { tool: "astryd", sessions_count: 7, hoursAgo: 96, key_insight: "Décision : ne pas embaucher avant signature 3e client" },
      { tool: "gyna", sessions_count: 4, hoursAgo: 192, key_insight: "ICP validé : DAF de PME 50-200p" },
    ],
    notes: [
      { author: "Delphine", content: "Eva avance vite. Bon timing pour pousser sur la levée seed Q4.", daysAgo: 7 },
    ],
  },
  "cm-2": {
    milestones: [
      { category: "produit", title: "Prototype testé", description: null, status: "franchi", daysAgo: 70 },
      { category: "commercial", title: "Cadrage ICP V2", description: "Pivot vers les fabricants mécaniques < 50 personnes", status: "en cours", daysAgo: null },
      { category: "commercial", title: "10 RDV qualifiés", description: null, status: "à venir", daysAgo: null },
    ],
    tools: [
      { tool: "gyna", sessions_count: 12, hoursAgo: 14, key_insight: "Cadence outbound : 3 séquences testées" },
      { tool: "astryd", sessions_count: 5, hoursAgo: 72, key_insight: "Tension co-fondateur clarifiée" },
      { tool: "elyse", sessions_count: 0, hoursAgo: null, key_insight: null },
    ],
    notes: [
      { author: "Delphine", content: "À suivre sur la posture commerciale — il s'auto-censure en RDV. Travailler la posture.", daysAgo: 10 },
    ],
  },
  "cm-3": {
    milestones: [
      { category: "produit", title: "POC livré", description: null, status: "franchi", daysAgo: 60 },
      { category: "commercial", title: "Validation canal d'acquisition", description: "B2B mutuelles vs B2C direct", status: "bloqué", daysAgo: null },
      { category: "financement", title: "Bouclage tour pré-seed", description: null, status: "à venir", daysAgo: null },
    ],
    tools: [
      { tool: "elyse", sessions_count: 6, hoursAgo: 360, key_insight: "Runway critique : 3,8 mois" },
      { tool: "gyna", sessions_count: 3, hoursAgo: 432, key_insight: "Canal B2B testé sans traction" },
      { tool: "astryd", sessions_count: 2, hoursAgo: 600, key_insight: null },
    ],
    notes: [
      { author: "Delphine", content: "Signal d'alerte. À recontacter cette semaine, runway sous le seuil critique.", daysAgo: 2 },
    ],
  },
  "cm-4": {
    milestones: [
      { category: "commercial", title: "100k€ ARR atteint", description: null, status: "franchi", daysAgo: 95 },
      { category: "équipe", title: "Recrutement Head of Sales", description: null, status: "franchi", daysAgo: 35 },
      { category: "commercial", title: "Lancement campagne outbound H2", description: "Cible : DRH grandes écoles", status: "en cours", daysAgo: null },
    ],
    tools: [
      { tool: "gyna", sessions_count: 22, hoursAgo: 6, key_insight: "Campagne outbound prête au lancement" },
      { tool: "elyse", sessions_count: 11, hoursAgo: 48, key_insight: "Runway 14 mois — saine croissance" },
      { tool: "astryd", sessions_count: 8, hoursAgo: 120, key_insight: "Roadmap Q3 alignée" },
    ],
    notes: [],
  },
  "cm-5": {
    milestones: [
      { category: "posture", title: "Clarification du pourquoi", description: null, status: "franchi", daysAgo: 40 },
      { category: "produit", title: "Clarification de la proposition de valeur", description: null, status: "en cours", daysAgo: null },
    ],
    tools: [
      { tool: "astryd", sessions_count: 4, hoursAgo: 144, key_insight: "Hypothèse pivot agro→pharma à creuser" },
      { tool: "elyse", sessions_count: 0, hoursAgo: null, key_insight: null },
      { tool: "gyna", sessions_count: 0, hoursAgo: null, key_insight: null },
    ],
    notes: [
      { author: "Delphine", content: "Stade idéation pur. Lui faire faire le BMC version Astryd avant prochain RDV.", daysAgo: 8 },
    ],
  },
  "cm-6": {
    milestones: [
      { category: "produit", title: "Beta lancée", description: null, status: "franchi", daysAgo: 70 },
      { category: "commercial", title: "20 design teams onboardées", description: null, status: "franchi", daysAgo: 30 },
      { category: "financement", title: "Première levée de fonds (seed)", description: "Objectif 800k€ — closing visé fin Q3", status: "en cours", daysAgo: null },
    ],
    tools: [
      { tool: "astryd", sessions_count: 14, hoursAgo: 30, key_insight: "Pitch deck V3 validé — narrative claire" },
      { tool: "elyse", sessions_count: 9, hoursAgo: 96, key_insight: "Scénario levée modélisé" },
      { tool: "gyna", sessions_count: 5, hoursAgo: 168, key_insight: "ICP : Head of Design scale-ups" },
    ],
    notes: [
      { author: "Delphine", content: "Très bonne dynamique. Mettre en relation avec Theresa (Bpifrance Lyon).", daysAgo: 3 },
    ],
  },
} as const;

// ============================================================
// Utilitaires
// ============================================================

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
const hoursAgo = (n: number) => new Date(Date.now() - n * 3600000).toISOString();
const minutesAgo = (n: number) => new Date(Date.now() - n * 60000).toISOString();
const daysFromNow = (n: number) => new Date(Date.now() + n * 86400000).toISOString();

async function ensureUserDeleted(email: string) {
  const { data: list } = await supabase.auth.admin.listUsers();
  const existing = list?.users.find((u) => u.email === email);
  if (existing) {
    console.log(`   🗑️  Suppression user existant : ${email}`);
    await supabase.auth.admin.deleteUser(existing.id);
  }
}

async function createUser(email: string, role: "structure" | "entrepreneur", firstName: string, lastName: string) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { role, first_name: firstName, last_name: lastName },
  });
  if (error) throw new Error(`createUser ${email}: ${error.message}`);
  if (!data.user) throw new Error(`createUser ${email}: no user returned`);
  return data.user.id;
}

async function markReadonlyDemo(userId: string) {
  const { error } = await supabase
    .from("profiles")
    .update({ is_readonly_demo: true })
    .eq("id", userId);
  if (error) throw new Error(`markReadonlyDemo: ${error.message}`);
}

// ============================================================
// SEED STRUCTURE
// ============================================================

async function seedStructure() {
  console.log("\n📁 Seed compte démo STRUCTURE\n");

  await ensureUserDeleted(STRUCTURE_EMAIL);
  const userId = await createUser(STRUCTURE_EMAIL, "structure", "Delphine", "Benzoni");
  console.log(`   ✅ User créé : ${STRUCTURE_EMAIL} (${userId})`);
  await markReadonlyDemo(userId);

  // Organisation
  const { data: org, error: orgErr } = await supabase
    .from("organizations")
    .insert({
      name: DEMO_ORG.name,
      type: DEMO_ORG.type,
      city: DEMO_ORG.city,
      is_readonly_demo: true,
    })
    .select()
    .single();
  if (orgErr) throw new Error(`org insert: ${orgErr.message}`);
  console.log(`   ✅ Organisation : ${org.name}`);

  // Membership owner
  const { error: memErr } = await supabase
    .from("org_memberships")
    .insert({ org_id: org.id, user_id: userId, role: "owner" });
  if (memErr) throw new Error(`membership insert: ${memErr.message}`);

  // Cohorte
  const { data: cohort, error: cohErr } = await supabase
    .from("cohorts")
    .insert({
      org_id: org.id,
      name: DEMO_COHORT.name,
      start_date: DEMO_COHORT.start_date.slice(0, 10),
      end_date: DEMO_COHORT.end_date?.slice(0, 10) ?? null,
      status: DEMO_COHORT.status,
    })
    .select()
    .single();
  if (cohErr) throw new Error(`cohort insert: ${cohErr.message}`);
  console.log(`   ✅ Cohorte : ${cohort.name}`);

  // Membres
  for (const m of DEMO_COHORT_MEMBERS) {
    const { data: member, error: mErr } = await supabase
      .from("cohort_members")
      .insert({
        cohort_id: cohort.id,
        first_name: m.first_name,
        last_name: m.last_name,
        email: m.email,
        project_name: m.project_name,
        project_description: m.project_description,
        sector: m.sector,
        stage: m.stage,
        initial_stage: m.initial_stage,
        team_size: m.team_size,
        status: m.status,
        last_active_at: m.last_active_at,
        joined_at: m.joined_at,
        active_tool: m.active_tool,
        current_milestone: m.current_milestone,
        alert_reason: m.alert_reason,
        capital_raised: m.capital_raised,
        revenue_yearly: m.revenue_yearly,
        headcount: m.headcount,
        is_growing: m.is_growing,
      })
      .select()
      .single();
    if (mErr) throw new Error(`member ${m.first_name} insert: ${mErr.message}`);

    const detail = DETAIL_MAP_INLINE[m.id as keyof typeof DETAIL_MAP_INLINE];
    if (!detail) continue;

    // Milestones
    if (detail.milestones.length > 0) {
      const rows = detail.milestones.map((ms) => ({
        cohort_member_id: member.id,
        category: ms.category,
        title: ms.title,
        description: ms.description,
        status: ms.status,
        reached_at: ms.daysAgo != null ? daysAgo(ms.daysAgo) : null,
      }));
      const { error } = await supabase.from("milestones").insert(rows);
      if (error) throw new Error(`milestones ${m.first_name}: ${error.message}`);
    }

    // Tools
    if (detail.tools.length > 0) {
      const rows = detail.tools.map((t) => ({
        cohort_member_id: member.id,
        tool: t.tool,
        sessions_count: t.sessions_count,
        last_used_at: t.hoursAgo != null ? hoursAgo(t.hoursAgo) : null,
        key_insight: t.key_insight,
      }));
      const { error } = await supabase.from("tool_usage").insert(rows);
      if (error) throw new Error(`tools ${m.first_name}: ${error.message}`);
    }

    // Notes
    if (detail.notes.length > 0) {
      const rows = detail.notes.map((n) => ({
        cohort_member_id: member.id,
        author_id: userId,
        author_name: n.author,
        content: n.content,
        created_at: daysAgo(n.daysAgo),
      }));
      const { error } = await supabase.from("accompanist_notes").insert(rows);
      if (error) throw new Error(`notes ${m.first_name}: ${error.message}`);
    }

    // Signaux
    const signals = DEMO_SIGNALS[m.id];
    if (signals) {
      if (signals.weather.length > 0) {
        const { error } = await supabase.from("weather_signals").insert(
          signals.weather.map((w) => ({
            cohort_member_id: member.id,
            mood: w.mood,
            note: w.note,
            created_at: w.created_at,
          }))
        );
        if (error) throw new Error(`weather ${m.first_name}: ${error.message}`);
      }
      if (signals.tensions.length > 0) {
        const { error } = await supabase.from("tension_signals").insert(
          signals.tensions.map((t) => ({
            cohort_member_id: member.id,
            kind: t.kind,
            description: t.description,
            resolved: t.resolved,
            created_at: t.created_at,
          }))
        );
        if (error) throw new Error(`tensions ${m.first_name}: ${error.message}`);
      }
      if (signals.actions.length > 0) {
        const { error } = await supabase.from("action_signals").insert(
          signals.actions.map((a) => ({
            cohort_member_id: member.id,
            title: a.title,
            status: a.status,
            due_at: a.due_at,
            created_at: a.created_at,
          }))
        );
        if (error) throw new Error(`actions ${m.first_name}: ${error.message}`);
      }
      const sessions = [signals.next_session, signals.last_session].filter(Boolean);
      if (sessions.length > 0) {
        const { error } = await supabase.from("sessions").insert(
          sessions.map((s) => ({
            cohort_member_id: member.id,
            scheduled_at: s!.scheduled_at,
            duration_min: s!.duration_min,
            kind: s!.kind,
            status: s!.status,
          }))
        );
        if (error) throw new Error(`sessions ${m.first_name}: ${error.message}`);
      }
    }

    console.log(`   ✅ ${m.first_name} ${m.last_name} (${m.project_name})`);
  }

  console.log(`\n   🎯 Structure prête : ${STRUCTURE_EMAIL} / ${DEMO_PASSWORD}`);
}

// ============================================================
// SEED ENTREPRENEUR
// ============================================================

async function seedEntrepreneur() {
  console.log("\n👤 Seed compte démo ENTREPRENEUR\n");

  await ensureUserDeleted(ENTREPRENEUR_EMAIL);
  const userId = await createUser(ENTREPRENEUR_EMAIL, "entrepreneur", "Thomas", "B.");
  console.log(`   ✅ User créé : ${ENTREPRENEUR_EMAIL} (${userId})`);
  await markReadonlyDemo(userId);

  // Profil entrepreneur (projet)
  const { error: epErr } = await supabase.from("entrepreneur_profiles").insert({
    user_id: userId,
    project_name: "Alpact Studio",
    project_description: "Suite SaaS pour fondateurs",
    sector: "SaaS B2B",
    stage: "early-stage",
    initial_stage: "POC",
    team_size: 2,
    capital_raised: 0,
    revenue_yearly: 13100 * 12,
    headcount: 2,
    is_growing: true,
  });
  if (epErr) throw new Error(`entrepreneur_profile: ${epErr.message}`);

  // Hub metrics
  const { error: hmErr } = await supabase.from("hub_metrics").insert({
    user_id: userId,
    mrr: HUB_METRICS.mrr,
    mrr_trend: HUB_METRICS.mrr_trend,
    runway: HUB_METRICS.runway,
    runway_status: HUB_METRICS.runway_status,
    priorite: HUB_METRICS.priorite,
    alertes: HUB_METRICS.alertes,
  });
  if (hmErr) throw new Error(`hub_metrics: ${hmErr.message}`);

  // Activity feed
  const { error: afErr } = await supabase.from("activity_feed").insert(
    ACTIVITY.map((a) => ({
      user_id: userId,
      icon: a.icon,
      text: a.text,
      sub: a.sub,
      tool: a.tool,
      occurred_at: hoursAgo(a.hoursAgo),
    }))
  );
  if (afErr) throw new Error(`activity_feed: ${afErr.message}`);

  // Notifications
  const { error: nErr } = await supabase.from("notifications").insert(
    NOTIFICATIONS.map((n) => ({
      user_id: userId,
      tool: n.tool,
      type: n.type,
      title: n.title,
      message: n.message,
      link: n.link,
      is_read: n.is_read,
      created_at: minutesAgo(n.minutesAgo),
    }))
  );
  if (nErr) throw new Error(`notifications: ${nErr.message}`);

  // Astryd sync (données démo pour la ToolCard Astryd)
  const { error: asErr } = await supabase.from("astryd_sync").upsert({
    user_id: userId,
    astryd_email: ENTREPRENEUR_EMAIL,
    score_global: 72,
    score_energie: 78,
    score_temps: 55,
    score_finances: 68,
    score_soutien: 85,
    score_competences: 80,
    score_motivation: 90,
    decision_state: "GO",
    idea_title: "Alpact Studio",
    idea_description: "Suite SaaS pour fondateurs",
    maturity_score: 64,
    maturity_progression: 12,
    ready_score: 72,
    active_micro_commitments: [
      { text: "Finaliser pitch deck", objectif: "Levee", status: "in_progress", jauge_ciblee: "finances", due_date: "2026-06-10" },
      { text: "Contacter 5 beta-testeurs", objectif: "Validation", status: "pending", jauge_ciblee: "soutien", due_date: "2026-06-08" },
    ],
    attention_zones: [
      { label: "Temps disponible", niveau: "attention", explication: "Score temps bas (55%), risque de surcharge" },
    ],
    recent_checkins: [
      { energy_level: 7, clarity_level: 8, mood_level: 7, created_at: hoursAgo(12) },
      { energy_level: 6, clarity_level: 7, mood_level: 8, created_at: hoursAgo(36) },
    ],
    checkins_count: 14,
    micro_actions_total: 23,
    synced_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (asErr) throw new Error(`astryd_sync: ${asErr.message}`);

  console.log(`   🎯 Entrepreneur prêt : ${ENTREPRENEUR_EMAIL} / ${DEMO_PASSWORD}`);
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log("🌱 Seed des comptes de démo Alpact Studio");
  console.log("==========================================");
  try {
    await seedStructure();
    await seedEntrepreneur();
    console.log("\n✨ Seed terminé avec succès.\n");
    console.log("   Tu peux te connecter avec :");
    console.log(`   • Structure    : ${STRUCTURE_EMAIL} / ${DEMO_PASSWORD}`);
    console.log(`   • Entrepreneur : ${ENTREPRENEUR_EMAIL} / ${DEMO_PASSWORD}\n`);
    // daysFromNow utilisé dans le futur si besoin
    void daysFromNow;
  } catch (err) {
    console.error("\n❌ Erreur :", err);
    process.exitCode = 1;
  }
}

main();
