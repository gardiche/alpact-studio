// DEMO MODE — vue structure
// Représente une structure d'accompagnement type (StartHEP-like) avec sa cohorte.
import type {
  Organization,
  OrgMembership,
  Cohort,
  CohortMember,
  CohortMemberDetail,
  CohortImpactMetrics,
  Milestone,
  ToolUsage,
  AccompanistNote,
} from "@/types";
import { getMemberSignals } from "./org-signals";

const now = Date.now();
const hours = (n: number) => 1000 * 60 * 60 * n;
const days = (n: number) => hours(24 * n);

export const DEMO_ORG: Organization = {
  id: "org-starthep",
  name: "StartHEP",
  type: "incubateur",
  logo_url: null,
  city: "Lyon",
  created_at: new Date(now - days(900)).toISOString(),
};

export const DEMO_ORG_MEMBER: OrgMembership = {
  id: "mem-delphine",
  org_id: DEMO_ORG.id,
  user_id: "user-delphine",
  role: "owner",
  first_name: "Delphine",
  last_name: "Benzoni",
  email: "delphine@starthep.fr",
  avatar_url: null,
  created_at: new Date(now - days(900)).toISOString(),
};

export const DEMO_COHORT: Cohort = {
  id: "cohort-2026",
  org_id: DEMO_ORG.id,
  name: "Promo Printemps 2026",
  start_date: new Date(now - days(120)).toISOString(),
  end_date: new Date(now + days(60)).toISOString(),
  status: "active",
};

export const DEMO_COHORT_MEMBERS: CohortMember[] = [
  {
    id: "cm-1",
    cohort_id: DEMO_COHORT.id,
    user_id: "user-eva",
    first_name: "Eva",
    last_name: "Marquet",
    email: "eva@caudia.io",
    avatar_url: null,
    project_name: "Caudia",
    project_description: "Pilotage RH et financier pour PME industrielles",
    sector: "SaaS B2B",
    stage: "traction",
    initial_stage: "POC",
    team_size: 4,
    status: "actif",
    last_active_at: new Date(now - hours(2)).toISOString(),
    joined_at: new Date(now - days(115)).toISOString(),
    active_tool: "elyse",
    current_milestone: "Premier client payant signé",
    alert_reason: null,
    capital_raised: 80000,
    revenue_yearly: 18000,
    headcount: 4,
    is_growing: true,
  },
  {
    id: "cm-2",
    cohort_id: DEMO_COHORT.id,
    user_id: "user-jerome",
    first_name: "Jérôme",
    last_name: "Vidal",
    email: "jerome@faibrik.com",
    avatar_url: null,
    project_name: "Faibrik",
    project_description: "Marketplace industrielle pour fabricants français",
    sector: "Marketplace",
    stage: "early-stage",
    initial_stage: "POC",
    team_size: 3,
    status: "actif",
    last_active_at: new Date(now - hours(14)).toISOString(),
    joined_at: new Date(now - days(115)).toISOString(),
    active_tool: "gyna",
    current_milestone: "Cadrage ICP V2",
    alert_reason: null,
    capital_raised: 35000,
    revenue_yearly: 8500,
    headcount: 3,
    is_growing: true,
  },
  {
    id: "cm-3",
    cohort_id: DEMO_COHORT.id,
    user_id: "user-elsa",
    first_name: "Elsa",
    last_name: "Kiefer",
    email: "elsa@oteocare.fr",
    avatar_url: null,
    project_name: "Oteo Care",
    project_description: "Plateforme de soutien psychologique pour aidants",
    sector: "Healthtech",
    stage: "POC",
    initial_stage: "idéation",
    team_size: 2,
    status: "alerte",
    last_active_at: new Date(now - days(12)).toISOString(),
    joined_at: new Date(now - days(110)).toISOString(),
    active_tool: null,
    current_milestone: "Validation canal d'acquisition",
    alert_reason: "Pas de connexion depuis 12 jours · runway < 4 mois",
    capital_raised: 50000,
    revenue_yearly: 0,
    headcount: 2,
    is_growing: false,
  },
  {
    id: "cm-4",
    cohort_id: DEMO_COHORT.id,
    user_id: "user-laura",
    first_name: "Laura",
    last_name: "Bensimon",
    email: "laura@datalumni.com",
    avatar_url: null,
    project_name: "Datalumni",
    project_description: "Réseau d'alumni pour grandes écoles",
    sector: "SaaS Education",
    stage: "scaling",
    initial_stage: "traction",
    team_size: 8,
    status: "actif",
    last_active_at: new Date(now - hours(6)).toISOString(),
    joined_at: new Date(now - days(115)).toISOString(),
    active_tool: "gyna",
    current_milestone: "Lancement campagne outbound H2",
    alert_reason: null,
    capital_raised: 1200000,
    revenue_yearly: 480000,
    headcount: 8,
    is_growing: true,
  },
  {
    id: "cm-5",
    cohort_id: DEMO_COHORT.id,
    user_id: "user-malik",
    first_name: "Malik",
    last_name: "Ndiaye",
    email: "malik@trasso.app",
    avatar_url: null,
    project_name: "Trasso",
    project_description: "Outil de traçabilité supply chain agroalimentaire",
    sector: "Foodtech",
    stage: "idéation",
    initial_stage: "idéation",
    team_size: 2,
    status: "inactif",
    last_active_at: new Date(now - days(6)).toISOString(),
    joined_at: new Date(now - days(60)).toISOString(),
    active_tool: "astryd",
    current_milestone: "Clarification de la proposition de valeur",
    alert_reason: null,
    capital_raised: 0,
    revenue_yearly: 0,
    headcount: 2,
    is_growing: false,
  },
  {
    id: "cm-6",
    cohort_id: DEMO_COHORT.id,
    user_id: "user-camille",
    first_name: "Camille",
    last_name: "Roussel",
    email: "camille@niveo.studio",
    avatar_url: null,
    project_name: "Niveo",
    project_description: "Outil de design system pour équipes produit",
    sector: "Devtools",
    stage: "early-stage",
    initial_stage: "POC",
    team_size: 5,
    status: "actif",
    last_active_at: new Date(now - hours(30)).toISOString(),
    joined_at: new Date(now - days(115)).toISOString(),
    active_tool: "astryd",
    current_milestone: "Première levée de fonds (seed)",
    alert_reason: null,
    capital_raised: 150000,
    revenue_yearly: 42000,
    headcount: 5,
    is_growing: true,
  },
];

// Détails par entrepreneur — milestones, outils, notes
const DETAIL_MAP: Record<string, { milestones: Milestone[]; tools: ToolUsage[]; notes: AccompanistNote[] }> = {
  "cm-1": {
    milestones: [
      { id: "m1-1", cohort_member_id: "cm-1", category: "produit", title: "MVP livré", description: "Première version utilisable en production", status: "franchi", reached_at: new Date(now - days(80)).toISOString(), created_at: new Date(now - days(110)).toISOString() },
      { id: "m1-2", cohort_member_id: "cm-1", category: "commercial", title: "Premier client payant", description: "Contrat signé avec une PME industrielle de la Loire", status: "franchi", reached_at: new Date(now - days(20)).toISOString(), created_at: new Date(now - days(60)).toISOString() },
      { id: "m1-3", cohort_member_id: "cm-1", category: "financement", title: "Dossier BPI déposé", description: null, status: "en cours", reached_at: null, created_at: new Date(now - days(15)).toISOString() },
      { id: "m1-4", cohort_member_id: "cm-1", category: "commercial", title: "10 clients payants", description: "Objectif fin Q3", status: "à venir", reached_at: null, created_at: new Date(now - days(10)).toISOString() },
    ],
    tools: [
      { tool: "elyse", last_used_at: new Date(now - hours(2)).toISOString(), sessions_count: 18, key_insight: "Runway 9 mois — santé financière stable" },
      { tool: "astryd", last_used_at: new Date(now - days(4)).toISOString(), sessions_count: 7, key_insight: "Décision : ne pas embaucher avant signature 3e client" },
      { tool: "gyna", last_used_at: new Date(now - days(8)).toISOString(), sessions_count: 4, key_insight: "ICP validé : DAF de PME 50-200p" },
    ],
    notes: [
      { id: "n1-1", cohort_member_id: "cm-1", author_id: "user-delphine", author_name: "Delphine", content: "Eva avance vite. Bon timing pour pousser sur la levée seed Q4.", created_at: new Date(now - days(7)).toISOString() },
    ],
  },
  "cm-2": {
    milestones: [
      { id: "m2-1", cohort_member_id: "cm-2", category: "produit", title: "Prototype testé", description: null, status: "franchi", reached_at: new Date(now - days(70)).toISOString(), created_at: new Date(now - days(110)).toISOString() },
      { id: "m2-2", cohort_member_id: "cm-2", category: "commercial", title: "Cadrage ICP V2", description: "Pivot vers les fabricants mécaniques < 50 personnes", status: "en cours", reached_at: null, created_at: new Date(now - days(20)).toISOString() },
      { id: "m2-3", cohort_member_id: "cm-2", category: "commercial", title: "10 RDV qualifiés", description: null, status: "à venir", reached_at: null, created_at: new Date(now - days(15)).toISOString() },
    ],
    tools: [
      { tool: "gyna", last_used_at: new Date(now - hours(14)).toISOString(), sessions_count: 12, key_insight: "Cadence outbound : 3 séquences testées" },
      { tool: "astryd", last_used_at: new Date(now - days(3)).toISOString(), sessions_count: 5, key_insight: "Tension co-fondateur clarifiée" },
      { tool: "elyse", last_used_at: null, sessions_count: 0, key_insight: null },
    ],
    notes: [
      { id: "n2-1", cohort_member_id: "cm-2", author_id: "user-delphine", author_name: "Delphine", content: "À suivre sur la posture commerciale — il s'auto-censure en RDV. Travailler la posture.", created_at: new Date(now - days(10)).toISOString() },
    ],
  },
  "cm-3": {
    milestones: [
      { id: "m3-1", cohort_member_id: "cm-3", category: "produit", title: "POC livré", description: null, status: "franchi", reached_at: new Date(now - days(60)).toISOString(), created_at: new Date(now - days(105)).toISOString() },
      { id: "m3-2", cohort_member_id: "cm-3", category: "commercial", title: "Validation canal d'acquisition", description: "B2B mutuelles vs B2C direct", status: "bloqué", reached_at: null, created_at: new Date(now - days(30)).toISOString() },
      { id: "m3-3", cohort_member_id: "cm-3", category: "financement", title: "Bouclage tour pré-seed", description: null, status: "à venir", reached_at: null, created_at: new Date(now - days(20)).toISOString() },
    ],
    tools: [
      { tool: "elyse", last_used_at: new Date(now - days(15)).toISOString(), sessions_count: 6, key_insight: "Runway critique : 3,8 mois" },
      { tool: "gyna", last_used_at: new Date(now - days(18)).toISOString(), sessions_count: 3, key_insight: "Canal B2B testé sans traction" },
      { tool: "astryd", last_used_at: new Date(now - days(25)).toISOString(), sessions_count: 2, key_insight: null },
    ],
    notes: [
      { id: "n3-1", cohort_member_id: "cm-3", author_id: "user-delphine", author_name: "Delphine", content: "Signal d'alerte. À recontacter cette semaine, runway sous le seuil critique.", created_at: new Date(now - days(2)).toISOString() },
    ],
  },
  "cm-4": {
    milestones: [
      { id: "m4-1", cohort_member_id: "cm-4", category: "commercial", title: "100k€ ARR atteint", description: null, status: "franchi", reached_at: new Date(now - days(95)).toISOString(), created_at: new Date(now - days(110)).toISOString() },
      { id: "m4-2", cohort_member_id: "cm-4", category: "équipe", title: "Recrutement Head of Sales", description: null, status: "franchi", reached_at: new Date(now - days(35)).toISOString(), created_at: new Date(now - days(80)).toISOString() },
      { id: "m4-3", cohort_member_id: "cm-4", category: "commercial", title: "Lancement campagne outbound H2", description: "Cible : DRH grandes écoles", status: "en cours", reached_at: null, created_at: new Date(now - days(10)).toISOString() },
    ],
    tools: [
      { tool: "gyna", last_used_at: new Date(now - hours(6)).toISOString(), sessions_count: 22, key_insight: "Campagne outbound prête au lancement" },
      { tool: "elyse", last_used_at: new Date(now - days(2)).toISOString(), sessions_count: 11, key_insight: "Runway 14 mois — saine croissance" },
      { tool: "astryd", last_used_at: new Date(now - days(5)).toISOString(), sessions_count: 8, key_insight: "Roadmap Q3 alignée" },
    ],
    notes: [],
  },
  "cm-5": {
    milestones: [
      { id: "m5-1", cohort_member_id: "cm-5", category: "posture", title: "Clarification du pourquoi", description: null, status: "franchi", reached_at: new Date(now - days(40)).toISOString(), created_at: new Date(now - days(55)).toISOString() },
      { id: "m5-2", cohort_member_id: "cm-5", category: "produit", title: "Clarification de la proposition de valeur", description: null, status: "en cours", reached_at: null, created_at: new Date(now - days(20)).toISOString() },
    ],
    tools: [
      { tool: "astryd", last_used_at: new Date(now - days(6)).toISOString(), sessions_count: 4, key_insight: "Hypothèse pivot agro→ pharma à creuser" },
      { tool: "elyse", last_used_at: null, sessions_count: 0, key_insight: null },
      { tool: "gyna", last_used_at: null, sessions_count: 0, key_insight: null },
    ],
    notes: [
      { id: "n5-1", cohort_member_id: "cm-5", author_id: "user-delphine", author_name: "Delphine", content: "Stade idéation pur. Lui faire faire le BMC version Astryd avant prochain RDV.", created_at: new Date(now - days(8)).toISOString() },
    ],
  },
  "cm-6": {
    milestones: [
      { id: "m6-1", cohort_member_id: "cm-6", category: "produit", title: "Beta lancée", description: null, status: "franchi", reached_at: new Date(now - days(70)).toISOString(), created_at: new Date(now - days(105)).toISOString() },
      { id: "m6-2", cohort_member_id: "cm-6", category: "commercial", title: "20 design teams onboardées", description: null, status: "franchi", reached_at: new Date(now - days(30)).toISOString(), created_at: new Date(now - days(70)).toISOString() },
      { id: "m6-3", cohort_member_id: "cm-6", category: "financement", title: "Première levée de fonds (seed)", description: "Objectif 800k€ — closing visé fin Q3", status: "en cours", reached_at: null, created_at: new Date(now - days(15)).toISOString() },
    ],
    tools: [
      { tool: "astryd", last_used_at: new Date(now - hours(30)).toISOString(), sessions_count: 14, key_insight: "Pitch deck V3 validé — narrative claire" },
      { tool: "elyse", last_used_at: new Date(now - days(4)).toISOString(), sessions_count: 9, key_insight: "Scénario levée modélisé" },
      { tool: "gyna", last_used_at: new Date(now - days(7)).toISOString(), sessions_count: 5, key_insight: "ICP : Head of Design scale-ups" },
    ],
    notes: [
      { id: "n6-1", cohort_member_id: "cm-6", author_id: "user-delphine", author_name: "Delphine", content: "Très bonne dynamique. Mettre en relation avec Theresa (Bpifrance Lyon).", created_at: new Date(now - days(3)).toISOString() },
    ],
  },
};

export function getCohortMemberDetail(memberId: string): CohortMemberDetail | null {
  const member = DEMO_COHORT_MEMBERS.find((m) => m.id === memberId);
  if (!member) return null;
  const detail = DETAIL_MAP[memberId] ?? { milestones: [], tools: [], notes: [] };
  const signals = getMemberSignals(memberId);
  return { ...member, ...detail, ...signals };
}

export function computeImpactMetrics(): CohortImpactMetrics {
  const members = DEMO_COHORT_MEMBERS;
  const total = members.length;
  const active = members.filter((m) => m.status === "actif").length;
  const inactive = members.filter((m) => m.status === "inactif").length;
  const alert = members.filter((m) => m.status === "alerte").length;
  const milestonesAll = Object.values(DETAIL_MAP).flatMap((d) => d.milestones);
  const monthAgo = now - days(30);
  const reachedThisMonth = milestonesAll.filter(
    (m) => m.status === "franchi" && m.reached_at && new Date(m.reached_at).getTime() > monthAgo
  ).length;
  const inProgress = milestonesAll.filter((m) => m.status === "en cours").length;
  const avgTools =
    members.reduce((sum, m) => {
      const tools = DETAIL_MAP[m.id]?.tools ?? [];
      return sum + tools.filter((t) => t.sessions_count > 0).length;
    }, 0) / total;
  const activatedAtLeastOne = members.filter((m) => {
    const tools = DETAIL_MAP[m.id]?.tools ?? [];
    return tools.some((t) => t.sessions_count > 0);
  }).length;
  return {
    total_members: total,
    active_members: active,
    inactive_members: inactive,
    alert_members: alert,
    activation_rate: Math.round((activatedAtLeastOne / total) * 100),
    milestones_reached_this_month: reachedThisMonth,
    milestones_in_progress: inProgress,
    avg_tools_activated: Math.round(avgTools * 10) / 10,
    retention_rate: Math.round((active / total) * 100),
  };
}

export const DEMO_ORG_DATA = {
  org: DEMO_ORG,
  member: DEMO_ORG_MEMBER,
  cohort: DEMO_COHORT,
  members: DEMO_COHORT_MEMBERS,
};
