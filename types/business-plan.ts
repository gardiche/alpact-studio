// ─── Source provenance ────────────────────────────────────────────────────────

export type DataSource =
  | "user_input"
  | "inferred"
  | "benchmark"
  | "stripe"
  | "notion"
  | "drive"
  | "qonto";

// ─── Supabase DB types ─────────────────────────────────────────────────────────

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  business_type?: "saas" | "service" | "marketplace" | "ecommerce" | "hardware" | "other";
  stage?: "pre_revenue" | "early_revenue" | "scaling" | "post_funding";
  country: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface RevenueLine {
  id: string;
  project_id: string;
  name: string;
  type: "recurring" | "one_shot";
  billing_cycle?: "monthly" | "yearly" | "per_project" | "per_unit";
  unit_price: number;
  current_volume: number;
  source: DataSource;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface GrowthHypothesis {
  id: string;
  revenue_line_id: string;
  monthly_new_customers: number;
  growth_model: "linear" | "exponential" | "stepped";
  churn_rate_monthly?: number;
  target_revenue_12m?: number;
  seasonality?: Record<string, number>; // { jan: 0.8, feb: 0.9, ... }
  source: DataSource;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  project_id: string;
  role: string;
  type: "founder" | "employee" | "freelance";
  count: number;
  net_salary_monthly?: number;
  total_cost_monthly?: number;
  start_date: string;
  is_current: boolean;
  is_paid: boolean;
  source: DataSource;
  created_at: string;
  updated_at: string;
}

export interface FixedCost {
  id: string;
  project_id: string;
  category:
    | "rent"
    | "coworking"
    | "saas_tools"
    | "insurance"
    | "accounting"
    | "legal"
    | "telecom"
    | "travel"
    | "other";
  label: string;
  amount_monthly: number;
  starts_at?: string;
  ends_at?: string;
  source: DataSource;
  created_at: string;
  updated_at: string;
}

export interface VariableCost {
  id: string;
  project_id: string;
  category:
    | "paid_ads"
    | "hosting_infra"
    | "support"
    | "commissions"
    | "production"
    | "delivery"
    | "other";
  label: string;
  cost_model: "fixed_monthly" | "per_unit" | "percentage_revenue";
  current_amount_monthly?: number;
  unit_cost?: number;
  percentage?: number;
  projected_amount_12m?: number;
  source: DataSource;
  created_at: string;
  updated_at: string;
}

export interface Treasury {
  id: string;
  project_id: string;
  cash_balance: number;
  fundraising_amount?: number;
  fundraising_date?: string;
  outstanding_loans?: Array<{
    type: string;
    amount: number;
    monthly_payment: number;
    remaining_months: number;
  }>;
  pending_grants?: number;
  accounts_receivable?: number;
  payment_delay_clients_days: number;
  payment_delay_suppliers_days: number;
  source: DataSource;
  created_at: string;
  updated_at: string;
}

export interface BpContext {
  id: string;
  project_id: string;
  target_audience?: "bank" | "investor" | "bpi" | "partner" | "internal";
  funding_amount_requested?: number;
  funding_usage?: string;
  deadline?: string;
  market_context?: string;
  competitive_advantage?: string;
  team_narrative?: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessPlan {
  id: string;
  project_id: string;
  version: number;
  scenario: Scenario;
  generated_content?: GeneratedBPContent;
  financial_tables?: FinancialTables;
  data_snapshot?: ProjectData;
  completeness_score?: number;
  status: "draft" | "reviewed" | "exported";
  exported_format?: "pdf" | "docx" | "xlsx";
  file_url?: string;
  created_at: string;
}

export interface DataCompletionLog {
  id: string;
  project_id: string;
  block: "activity" | "growth" | "team" | "fixed_costs" | "variable_costs" | "treasury" | "context";
  status: "not_started" | "in_progress" | "complete";
  missing_fields?: string[];
  last_touched_at: string;
}

// ─── Engine types ──────────────────────────────────────────────────────────────

export type Scenario = "conservative" | "moderate" | "aggressive";

export interface ProjectData {
  project: Project;
  revenueLines: RevenueLine[];
  growthHypotheses: GrowthHypothesis[];
  teamMembers: TeamMember[];
  fixedCosts: FixedCost[];
  variableCosts: VariableCost[];
  treasury: Treasury;
  bpContext: BpContext;
}

export interface MonthlyRevenue {
  month: number;
  clients: number;
  newClients: number;
  churnedClients: number;
  revenue: number;
}

export interface MonthlyPnL {
  month: number;
  revenue: number;
  variableCosts: number;
  grossMargin: number;
  grossMarginRate: number;
  fixedCosts: number;
  payroll: number;
  ebitda: number;
  tax: number;
  netResult: number;
}

export interface MonthlyCashflow {
  month: number;
  clientReceipts: number;
  exceptionalInflows: number;
  totalInflows: number;
  supplierPayments: number;
  salaryPayments: number;
  loanRepayments: number;
  taxPayments: number;
  totalOutflows: number;
  netCashflow: number;
  bfrVariation: number;
  adjustedCashflow: number;
  endingBalance: number;
}

export interface MonthlyBFR {
  month: number;
  accountsReceivable: number;
  accountsPayable: number;
  bfr: number;
  bfrVariation: number;
}

export interface Indicators {
  runway: number | null;
  breakEvenMonth: number | null;
  breakEvenClients: number;
  burnRate: number;
  cac: number | null;
  ltv: number | null;
  ltvCacRatio: number | null;
  mrr: number;
  arr: number;
}

export interface FinancialTables {
  pnl: MonthlyPnL[];
  cashflow: MonthlyCashflow[];
  bfr: MonthlyBFR[];
  indicators: Indicators;
}

export interface ProjectionResult {
  scenario: Scenario;
  pnl: MonthlyPnL[];
  cashflow: MonthlyCashflow[];
  bfr: MonthlyBFR[];
  indicators: Indicators;
}

// ─── Generated BP content ─────────────────────────────────────────────────────

export interface GeneratedBPContent {
  executive_summary: string;
  project: string;
  market: string;
  business_model: string;
  team: string;
  commercial_strategy: string;
  financial_projections: string;
  funding_plan: string;
  appendix: string;
}

// ─── Wizard form state ────────────────────────────────────────────────────────

export interface WizardState {
  projectId: string | null;
  currentBlock: number; // 0-6
  completedBlocks: number[];

  // Block 1 - Activity
  projectName: string;
  projectDescription: string;
  businessType: Project["business_type"];
  stage: Project["stage"];
  revenueLines: RevenueLineForm[];

  // Block 2 - Growth
  growthHypotheses: GrowthHypothesisForm[];

  // Block 3 - Team
  teamMembers: TeamMemberForm[];

  // Block 4 - Fixed costs
  fixedCosts: FixedCostForm[];

  // Block 5 - Variable costs
  variableCosts: VariableCostForm[];

  // Block 6 - Treasury
  treasury: TreasuryForm;

  // Block 7 - Context
  bpContext: BpContextForm;
}

export interface RevenueLineForm {
  id: string;
  name: string;
  type: "recurring" | "one_shot";
  billing_cycle?: RevenueLine["billing_cycle"];
  unit_price: number | null;
  current_volume: number | null;
  source: DataSource;
}

export interface GrowthHypothesisForm {
  id: string;
  revenue_line_id: string;
  monthly_new_customers: number | null;
  growth_model: GrowthHypothesis["growth_model"];
  churn_rate_monthly: number | null;
  target_revenue_12m: number | null;
  has_seasonality: boolean;
  source: DataSource;
}

export interface TeamMemberForm {
  id: string;
  role: string;
  type: "founder" | "employee" | "freelance";
  count: number;
  net_salary_monthly: number | null;
  is_current: boolean;
  is_paid: boolean;
  start_date: string;
  source: DataSource;
}

export interface FixedCostForm {
  id: string;
  category: FixedCost["category"];
  label: string;
  amount_monthly: number | null;
  source: DataSource;
}

export interface VariableCostForm {
  id: string;
  category: VariableCost["category"];
  label: string;
  cost_model: VariableCost["cost_model"];
  current_amount_monthly: number | null;
  unit_cost: number | null;
  percentage: number | null;
  projected_amount_12m: number | null;
  source: DataSource;
}

export interface TreasuryForm {
  cash_balance: number | null;
  fundraising_amount: number | null;
  fundraising_date: string | null;
  has_loans: boolean;
  outstanding_loans: Array<{
    type: string;
    amount: number;
    monthly_payment: number;
    remaining_months: number;
  }>;
  pending_grants: number | null;
  accounts_receivable: number | null;
  payment_delay_clients_days: number;
  payment_delay_suppliers_days: number;
  source: DataSource;
}

export interface BpContextForm {
  target_audience: BpContext["target_audience"];
  funding_amount_requested: number | null;
  funding_usage: string;
  deadline: string | null;
  market_context: string;
  competitive_advantage: string;
  team_narrative: string;
}
