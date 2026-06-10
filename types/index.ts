export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  project_name: string | null;
  project_description: string | null;
  stage: "démarrage" | "early-stage" | "post-levée" | null;
  sector: string | null;
  team_size: number | null;
  founded_at: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  tool: "astryd" | "elyse" | "gyna";
  type: "warning" | "critique" | "rappel";
  title: string;
  message: string | null;
  link: string | null;
  is_read: boolean;
  email_sent: boolean;
  created_at: string;
}

export interface ActivityFeedItem {
  id: string;
  user_id: string;
  tool: "astryd" | "elyse" | "gyna" | "hub";
  action_type: "decision" | "alert" | "milestone" | "action";
  title: string;
  description: string | null;
  link: string | null;
  created_at: string;
}

export interface CopilotMessage {
  id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  page_context: string | null;
  created_at: string;
}

export interface Integration {
  id: string;
  user_id: string;
  provider: "pennylane" | "qonto" | "stripe" | "notion" | "google" | "hubspot" | "slack";
  status: "connected" | "disconnected" | "error";
  access_token: string | null;
  refresh_token: string | null;
  connected_at: string | null;
  last_sync_at: string | null;
}

// ============================================================
// Vue structure (B2B) — organisations, cohortes, entrepreneurs
// ============================================================

export type OrgType = "incubateur" | "accélérateur" | "pépinière" | "réseau";

export interface Organization {
  id: string;
  name: string;
  type: OrgType;
  logo_url: string | null;
  city: string | null;
  created_at: string;
}

export type OrgMemberRole = "owner" | "accompagnateur" | "viewer";

export interface OrgMembership {
  id: string;
  org_id: string;
  user_id: string;
  role: OrgMemberRole;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Cohort {
  id: string;
  org_id: string;
  name: string;
  start_date: string;
  end_date: string | null;
  status: "active" | "archived";
}

export type EntrepreneurStatus = "actif" | "inactif" | "alerte";
export type EntrepreneurStage = "idéation" | "POC" | "early-stage" | "traction" | "scaling";

export interface CohortMember {
  id: string;
  cohort_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
  project_name: string;
  project_description: string;
  sector: string;
  stage: EntrepreneurStage;
  initial_stage: EntrepreneurStage | null;
  team_size: number;
  status: EntrepreneurStatus;
  last_active_at: string;
  joined_at: string;
  active_tool: "astryd" | "elyse" | "gyna" | null;
  current_milestone: string | null;
  alert_reason: string | null;
  // Performance économique
  capital_raised: number;       // € levés depuis création
  revenue_yearly: number;       // CA annuel estimé (€)
  headcount: number;            // ETP soutenus (salariés + co-fondateurs)
  is_growing: boolean;          // CA en croissance vs trimestre précédent
}

export type MilestoneCategory = "produit" | "commercial" | "financement" | "équipe" | "posture";
export type MilestoneStatus = "à venir" | "en cours" | "franchi" | "bloqué";

export interface Milestone {
  id: string;
  cohort_member_id: string;
  category: MilestoneCategory;
  title: string;
  description: string | null;
  status: MilestoneStatus;
  reached_at: string | null;
  created_at: string;
}

export interface ToolUsage {
  tool: "astryd" | "elyse" | "gyna";
  last_used_at: string | null;
  sessions_count: number;
  key_insight: string | null;
}

export interface AccompanistNote {
  id: string;
  cohort_member_id: string;
  author_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

// Signaux faibles entre les séances — cœur du JTBD #3 (posture)
export type WeatherMood = "ensoleillé" | "nuageux" | "orageux" | "brumeux";

export interface WeatherSignal {
  id: string;
  cohort_member_id: string;
  mood: WeatherMood;
  note: string | null;
  created_at: string;
}

export type TensionKind = "co-fondateur" | "financière" | "client" | "produit" | "personnelle" | "équipe";

export interface TensionSignal {
  id: string;
  cohort_member_id: string;
  kind: TensionKind;
  description: string;
  resolved: boolean;
  created_at: string;
}

export type ActionStatus = "à faire" | "en cours" | "fait" | "abandonné";

export interface ActionSignal {
  id: string;
  cohort_member_id: string;
  title: string;
  status: ActionStatus;
  due_at: string | null;
  created_at: string;
}

export interface Session {
  id: string;
  cohort_member_id: string;
  scheduled_at: string;
  duration_min: number;
  kind: "check-up" | "deep-dive" | "kickoff" | "closing";
  status: "à venir" | "passée" | "annulée";
}

export interface CohortMemberDetail extends CohortMember {
  milestones: Milestone[];
  tools: ToolUsage[];
  notes: AccompanistNote[];
  weather: WeatherSignal[];
  tensions: TensionSignal[];
  actions: ActionSignal[];
  next_session: Session | null;
  last_session: Session | null;
}

export interface CohortImpactMetrics {
  total_members: number;
  active_members: number;
  inactive_members: number;
  alert_members: number;
  activation_rate: number;
  milestones_reached_this_month: number;
  milestones_in_progress: number;
  avg_tools_activated: number;
  retention_rate: number;
}

// === Analytics impact (calculées dans impactAnalytics.ts) ===

export interface EconomicPerformance {
  total_capital_raised: number;
  total_revenue: number;
  total_headcount: number;
  growing_members_count: number;
  growing_members_pct: number;
  avg_capital_per_member: number;
}

export interface StageEvolutionRow {
  stage: EntrepreneurStage;
  label: string;
  initial_count: number;
  current_count: number;
  delta: number;
}

export interface StageEvolution {
  rows: StageEvolutionRow[];
  members_progressed: number;
  members_progressed_pct: number;
}

export interface MilestonesCategoryRow {
  category: MilestoneCategory;
  label: string;
  reached: number;
  in_progress: number;
  blocked: number;
  upcoming: number;
  total: number;
}

export interface HighlightedJourney {
  member_id: string;
  first_name: string;
  last_name: string;
  project_name: string;
  headline: string;          // phrase synthèse auto-générée
  initial_stage: EntrepreneurStage | null;
  current_stage: EntrepreneurStage;
  key_milestones: { title: string; reached_at: string }[];
  verbatim: string | null;   // citation issue des notes
  verbatim_author: string | null;
}

export interface CohortTrend {
  kind: "tension" | "milestone_stuck";
  label: string;
  detail: string;
  members_affected: number;
  members_total: number;
  suggested_action: string | null;
}
