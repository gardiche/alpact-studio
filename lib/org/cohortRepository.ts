// Point d'entrée unique pour les données cohorte.
// Lit les données depuis Supabase via le client serveur.
// AUCUN autre fichier ne doit importer org-data.ts directement.

import type {
  Cohort,
  CohortMember,
  CohortMemberDetail,
  CohortImpactMetrics,
  Organization,
  OrgMembership,
  Milestone,
  ToolUsage,
  AccompanistNote,
  WeatherSignal,
  TensionSignal,
  ActionSignal,
  Session,
} from "@/types";
import { createClient } from "@/lib/supabase/server";

// ============================================================
// Organisation & Membership (basés sur l'user connecté)
// ============================================================

export async function getOrganization(): Promise<Organization> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data } = await supabase
    .from("org_memberships")
    .select("organizations(*)")
    .eq("user_id", user.id)
    .single();

  const org = (data?.organizations as any) ?? null;
  if (!org) throw new Error("Aucune organisation trouvée");

  return {
    id: org.id,
    name: org.name,
    type: org.type,
    logo_url: org.logo_url,
    city: org.city,
    created_at: org.created_at,
  };
}

export async function getCurrentMember(): Promise<OrgMembership> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data } = await supabase
    .from("org_memberships")
    .select(`
      id, org_id, user_id, role, created_at,
      profiles!org_memberships_user_id_fkey (
        first_name, last_name, email, avatar_url
      )
    `)
    .eq("user_id", user.id)
    .single();

  if (!data) throw new Error("Membership introuvable");
  const profile = (data.profiles as any) ?? {};

  return {
    id: data.id,
    org_id: data.org_id,
    user_id: data.user_id,
    role: data.role,
    first_name: profile.first_name ?? "",
    last_name: profile.last_name ?? "",
    email: profile.email ?? user.email ?? "",
    avatar_url: profile.avatar_url ?? null,
    created_at: data.created_at,
  };
}

// ============================================================
// Cohorte & Membres
// ============================================================

export async function getActiveCohort(): Promise<Cohort> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  // Trouver l'org de l'utilisateur
  const { data: membership } = await supabase
    .from("org_memberships")
    .select("org_id")
    .eq("user_id", user.id)
    .single();

  if (!membership) throw new Error("Membership introuvable");

  const { data: cohort } = await supabase
    .from("cohorts")
    .select("*")
    .eq("org_id", membership.org_id)
    .eq("status", "active")
    .order("start_date", { ascending: false })
    .limit(1)
    .single();

  if (!cohort) throw new Error("Aucune cohorte active");

  return {
    id: cohort.id,
    org_id: cohort.org_id,
    name: cohort.name,
    start_date: cohort.start_date,
    end_date: cohort.end_date,
    status: cohort.status,
  };
}

export async function getCohortMembers(): Promise<CohortMember[]> {
  const cohort = await getActiveCohort();
  const supabase = await createClient();

  const { data: members, error } = await supabase
    .from("cohort_members")
    .select("*")
    .eq("cohort_id", cohort.id)
    .order("last_name", { ascending: true });

  if (error) throw new Error(`getCohortMembers: ${error.message}`);

  return (members ?? []).map((m) => ({
    id: m.id,
    cohort_id: m.cohort_id,
    user_id: m.user_id ?? "",
    first_name: m.first_name,
    last_name: m.last_name,
    email: m.email,
    avatar_url: m.avatar_url,
    project_name: m.project_name,
    project_description: m.project_description ?? "",
    sector: m.sector ?? "",
    stage: m.stage,
    initial_stage: m.initial_stage,
    team_size: m.team_size ?? 1,
    status: m.status,
    last_active_at: m.last_active_at ?? m.created_at,
    joined_at: m.joined_at,
    active_tool: m.active_tool,
    current_milestone: m.current_milestone,
    alert_reason: m.alert_reason,
    capital_raised: Number(m.capital_raised ?? 0),
    revenue_yearly: Number(m.revenue_yearly ?? 0),
    headcount: m.headcount ?? 1,
    is_growing: m.is_growing ?? false,
  }));
}

// ============================================================
// Détail d'un membre (avec signaux, jalons, notes, tools, sessions)
// ============================================================

export async function getCohortMemberDetail(
  memberId: string
): Promise<CohortMemberDetail | null> {
  const supabase = await createClient();

  // Récupérer le membre
  const { data: m } = await supabase
    .from("cohort_members")
    .select("*")
    .eq("id", memberId)
    .single();

  if (!m) return null;

  // Toutes les sous-requêtes en parallèle
  const [
    { data: milestones },
    { data: tools },
    { data: notes },
    { data: weather },
    { data: tensions },
    { data: actions },
    { data: sessions },
  ] = await Promise.all([
    supabase
      .from("milestones")
      .select("*")
      .eq("cohort_member_id", memberId)
      .order("created_at", { ascending: false }),
    supabase
      .from("tool_usage")
      .select("*")
      .eq("cohort_member_id", memberId),
    supabase
      .from("accompanist_notes")
      .select("*")
      .eq("cohort_member_id", memberId)
      .order("created_at", { ascending: false }),
    supabase
      .from("weather_signals")
      .select("*")
      .eq("cohort_member_id", memberId)
      .order("created_at", { ascending: false }),
    supabase
      .from("tension_signals")
      .select("*")
      .eq("cohort_member_id", memberId)
      .order("created_at", { ascending: false }),
    supabase
      .from("action_signals")
      .select("*")
      .eq("cohort_member_id", memberId)
      .order("created_at", { ascending: false }),
    supabase
      .from("sessions")
      .select("*")
      .eq("cohort_member_id", memberId)
      .order("scheduled_at", { ascending: true }),
  ]);

  const now = new Date();
  const sessionList = sessions ?? [];
  const nextSession =
    sessionList.find(
      (s) => s.status === "à venir" && new Date(s.scheduled_at) > now
    ) ?? null;
  const lastSession =
    [...sessionList]
      .reverse()
      .find(
        (s) => s.status === "passée" && new Date(s.scheduled_at) <= now
      ) ?? null;

  return {
    // CohortMember fields
    id: m.id,
    cohort_id: m.cohort_id,
    user_id: m.user_id ?? "",
    first_name: m.first_name,
    last_name: m.last_name,
    email: m.email,
    avatar_url: m.avatar_url,
    project_name: m.project_name,
    project_description: m.project_description ?? "",
    sector: m.sector ?? "",
    stage: m.stage,
    initial_stage: m.initial_stage,
    team_size: m.team_size ?? 1,
    status: m.status,
    last_active_at: m.last_active_at ?? m.created_at,
    joined_at: m.joined_at,
    active_tool: m.active_tool,
    current_milestone: m.current_milestone,
    alert_reason: m.alert_reason,
    capital_raised: Number(m.capital_raised ?? 0),
    revenue_yearly: Number(m.revenue_yearly ?? 0),
    headcount: m.headcount ?? 1,
    is_growing: m.is_growing ?? false,
    // Detail fields
    milestones: (milestones ?? []).map(mapMilestone),
    tools: (tools ?? []).map(mapTool),
    notes: (notes ?? []).map(mapNote),
    weather: (weather ?? []).map(mapWeather),
    tensions: (tensions ?? []).map(mapTension),
    actions: (actions ?? []).map(mapAction),
    next_session: nextSession ? mapSession(nextSession) : null,
    last_session: lastSession ? mapSession(lastSession) : null,
  };
}

export async function getCohortMemberDetails(): Promise<CohortMemberDetail[]> {
  const members = await getCohortMembers();
  const details = await Promise.all(
    members.map((m) => getCohortMemberDetail(m.id))
  );
  return details.filter((d): d is CohortMemberDetail => d !== null);
}

// ============================================================
// Impact metrics (calculées à partir des membres)
// ============================================================

export async function getBaseImpactMetrics(): Promise<CohortImpactMetrics> {
  const members = await getCohortMembers();
  const details = await getCohortMemberDetails();

  const active = members.filter((m) => m.status === "actif").length;
  const inactive = members.filter((m) => m.status === "inactif").length;
  const alert = members.filter((m) => m.status === "alerte").length;

  const now = new Date();
  const oneMonthAgo = new Date(now.getTime() - 30 * 86400000);

  let milestonesReached = 0;
  let milestonesInProgress = 0;
  let totalToolsActivated = 0;

  for (const d of details) {
    for (const ms of d.milestones) {
      if (ms.status === "franchi" && ms.reached_at && new Date(ms.reached_at) > oneMonthAgo) {
        milestonesReached++;
      }
      if (ms.status === "en cours") {
        milestonesInProgress++;
      }
    }
    totalToolsActivated += d.tools.filter((t) => t.sessions_count > 0).length;
  }

  return {
    total_members: members.length,
    active_members: active,
    inactive_members: inactive,
    alert_members: alert,
    activation_rate: members.length > 0 ? Math.round((active / members.length) * 100) : 0,
    milestones_reached_this_month: milestonesReached,
    milestones_in_progress: milestonesInProgress,
    avg_tools_activated:
      details.length > 0
        ? Math.round((totalToolsActivated / details.length) * 10) / 10
        : 0,
    retention_rate: 100, // Placeholder — à calculer avec les données de connexion
  };
}

// ============================================================
// Astryd Sync Data (pour la vue détail d'un membre)
// ============================================================

export interface AstrydSyncData {
  scoreGlobal: number | null;
  scoreEnergie: number | null;
  scoreTemps: number | null;
  scoreFinances: number | null;
  scoreSoutien: number | null;
  scoreCompetences: number | null;
  scoreMotivation: number | null;
  decisionState: string | null;
  ideaTitle: string | null;
  maturityScore: number | null;
  maturityProgression: number | null;
  readyScore: number | null;
  attentionZones: { label: string; niveau: string; explication: string }[];
  activeMicroCommitments: { text: string; status: string; jauge_ciblee?: string; due_date?: string }[];
  checkinsCount: number;
  microActionsTotal: number;
  syncedAt: string | null;
}

export async function getAstrydSyncForMember(userId: string | null): Promise<AstrydSyncData | null> {
  if (!userId) return null;

  const supabase = await createClient();
  const { data: rawData } = await supabase
    .from("astryd_sync")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!rawData) return null;
  const d = rawData as Record<string, unknown>;

  return {
    scoreGlobal: typeof d.score_global === "number" ? d.score_global : null,
    scoreEnergie: typeof d.score_energie === "number" ? d.score_energie : null,
    scoreTemps: typeof d.score_temps === "number" ? d.score_temps : null,
    scoreFinances: typeof d.score_finances === "number" ? d.score_finances : null,
    scoreSoutien: typeof d.score_soutien === "number" ? d.score_soutien : null,
    scoreCompetences: typeof d.score_competences === "number" ? d.score_competences : null,
    scoreMotivation: typeof d.score_motivation === "number" ? d.score_motivation : null,
    decisionState: typeof d.decision_state === "string" ? d.decision_state : null,
    ideaTitle: typeof d.idea_title === "string" ? d.idea_title : null,
    maturityScore: typeof d.maturity_score === "number" ? d.maturity_score : null,
    maturityProgression: typeof d.maturity_progression === "number" ? d.maturity_progression : null,
    readyScore: typeof d.ready_score === "number" ? d.ready_score : null,
    attentionZones: Array.isArray(d.attention_zones)
      ? (d.attention_zones as { label: string; niveau: string; explication: string }[])
      : [],
    activeMicroCommitments: Array.isArray(d.active_micro_commitments)
      ? (d.active_micro_commitments as { text: string; status: string; jauge_ciblee?: string; due_date?: string }[])
      : [],
    checkinsCount: typeof d.checkins_count === "number" ? d.checkins_count : 0,
    microActionsTotal: typeof d.micro_actions_total === "number" ? d.micro_actions_total : 0,
    syncedAt: typeof d.synced_at === "string" ? d.synced_at : null,
  };
}

// ============================================================
// Mappers (DB row → TypeScript type)
// ============================================================

function mapMilestone(row: any): Milestone {
  return {
    id: row.id,
    cohort_member_id: row.cohort_member_id,
    category: row.category,
    title: row.title,
    description: row.description,
    status: row.status,
    reached_at: row.reached_at,
    created_at: row.created_at,
  };
}

function mapTool(row: any): ToolUsage {
  return {
    tool: row.tool,
    last_used_at: row.last_used_at,
    sessions_count: row.sessions_count ?? 0,
    key_insight: row.key_insight,
  };
}

function mapNote(row: any): AccompanistNote {
  return {
    id: row.id,
    cohort_member_id: row.cohort_member_id,
    author_id: row.author_id ?? "",
    author_name: row.author_name ?? "",
    content: row.content,
    created_at: row.created_at,
  };
}

function mapWeather(row: any): WeatherSignal {
  return {
    id: row.id,
    cohort_member_id: row.cohort_member_id,
    mood: row.mood,
    note: row.note,
    created_at: row.created_at,
  };
}

function mapTension(row: any): TensionSignal {
  return {
    id: row.id,
    cohort_member_id: row.cohort_member_id,
    kind: row.kind,
    description: row.description,
    resolved: row.resolved,
    created_at: row.created_at,
  };
}

function mapAction(row: any): ActionSignal {
  return {
    id: row.id,
    cohort_member_id: row.cohort_member_id,
    title: row.title,
    status: row.status,
    due_at: row.due_at,
    created_at: row.created_at,
  };
}

function mapSession(row: any): Session {
  return {
    id: row.id,
    cohort_member_id: row.cohort_member_id,
    scheduled_at: row.scheduled_at,
    duration_min: row.duration_min,
    kind: row.kind,
    status: row.status,
  };
}
