-- ─────────────────────────────────────────────────────────────────────────────
-- Business Plan — Full schema
-- Tables: projects, revenue_lines, growth_hypotheses, team_members,
--         fixed_costs, variable_costs, treasuries, bp_contexts,
--         business_plans, data_completion_logs
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─── Custom types ─────────────────────────────────────────────────────────────

do $$ begin
  create type data_source as enum (
    'user_input', 'inferred', 'benchmark', 'stripe', 'notion', 'drive', 'qonto'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type business_type as enum (
    'saas', 'service', 'marketplace', 'ecommerce', 'hardware', 'other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type project_stage as enum (
    'pre_revenue', 'early_revenue', 'scaling', 'post_funding'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type billing_cycle as enum (
    'monthly', 'yearly', 'per_project', 'per_unit'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type growth_model as enum ('linear', 'exponential', 'stepped');
exception when duplicate_object then null; end $$;

do $$ begin
  create type member_type as enum ('founder', 'employee', 'freelance');
exception when duplicate_object then null; end $$;

do $$ begin
  create type fixed_cost_category as enum (
    'rent', 'coworking', 'saas_tools', 'insurance', 'accounting',
    'legal', 'telecom', 'marketing', 'other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type variable_cost_category as enum (
    'ads', 'cogs', 'commission', 'hosting', 'payment_fees', 'logistics', 'other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type cost_model as enum ('fixed_monthly', 'per_unit', 'percentage_revenue');
exception when duplicate_object then null; end $$;

do $$ begin
  create type bp_scenario as enum ('conservative', 'moderate', 'aggressive');
exception when duplicate_object then null; end $$;

do $$ begin
  create type bp_status as enum ('draft', 'final', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type target_audience as enum ('bank', 'investor', 'bpi', 'partner', 'internal');
exception when duplicate_object then null; end $$;

-- ─── projects ─────────────────────────────────────────────────────────────────

create table if not exists public.projects (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  description   text,
  business_type business_type,
  stage         project_stage,
  country       text not null default 'FR',
  currency      text not null default 'EUR',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "projects: owner full access"
  on public.projects
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── revenue_lines ────────────────────────────────────────────────────────────

create table if not exists public.revenue_lines (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  name            text not null,
  type            text not null check (type in ('recurring', 'one_shot')),
  billing_cycle   billing_cycle,
  unit_price      numeric(12,2) not null default 0,
  current_volume  integer not null default 0,
  source          data_source not null default 'user_input',
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.revenue_lines enable row level security;

create policy "revenue_lines: project owner"
  on public.revenue_lines
  for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = revenue_lines.project_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = revenue_lines.project_id and p.user_id = auth.uid()
    )
  );

-- ─── growth_hypotheses ────────────────────────────────────────────────────────

create table if not exists public.growth_hypotheses (
  id                    uuid primary key default gen_random_uuid(),
  revenue_line_id       uuid not null references public.revenue_lines(id) on delete cascade,
  monthly_new_customers numeric(10,2) not null default 0,
  growth_model          growth_model not null default 'linear',
  churn_rate_monthly    numeric(6,4),
  target_revenue_12m    numeric(14,2),
  seasonality           jsonb,
  source                data_source not null default 'user_input',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.growth_hypotheses enable row level security;

create policy "growth_hypotheses: project owner"
  on public.growth_hypotheses
  for all
  using (
    exists (
      select 1
      from public.revenue_lines rl
      join public.projects p on p.id = rl.project_id
      where rl.id = growth_hypotheses.revenue_line_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.revenue_lines rl
      join public.projects p on p.id = rl.project_id
      where rl.id = growth_hypotheses.revenue_line_id and p.user_id = auth.uid()
    )
  );

-- ─── team_members ─────────────────────────────────────────────────────────────

create table if not exists public.team_members (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid not null references public.projects(id) on delete cascade,
  role                text not null,
  type                member_type not null default 'employee',
  count               integer not null default 1,
  net_salary_monthly  numeric(12,2),
  total_cost_monthly  numeric(12,2),
  start_date          date not null default current_date,
  is_current          boolean not null default true,
  is_paid             boolean not null default true,
  source              data_source not null default 'user_input',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.team_members enable row level security;

create policy "team_members: project owner"
  on public.team_members
  for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = team_members.project_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = team_members.project_id and p.user_id = auth.uid()
    )
  );

-- ─── fixed_costs ──────────────────────────────────────────────────────────────

create table if not exists public.fixed_costs (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  label           text not null,
  category        fixed_cost_category not null default 'other',
  amount_monthly  numeric(12,2) not null default 0,
  starts_at       date,
  ends_at         date,
  source          data_source not null default 'user_input',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.fixed_costs enable row level security;

create policy "fixed_costs: project owner"
  on public.fixed_costs
  for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = fixed_costs.project_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = fixed_costs.project_id and p.user_id = auth.uid()
    )
  );

-- ─── variable_costs ───────────────────────────────────────────────────────────

create table if not exists public.variable_costs (
  id                      uuid primary key default gen_random_uuid(),
  project_id              uuid not null references public.projects(id) on delete cascade,
  label                   text not null,
  category                variable_cost_category not null default 'other',
  cost_model              cost_model not null default 'fixed_monthly',
  current_amount_monthly  numeric(12,2),
  unit_cost               numeric(12,4),
  percentage              numeric(6,4),
  projected_amount_12m    numeric(14,2),
  source                  data_source not null default 'user_input',
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

alter table public.variable_costs enable row level security;

create policy "variable_costs: project owner"
  on public.variable_costs
  for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = variable_costs.project_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = variable_costs.project_id and p.user_id = auth.uid()
    )
  );

-- ─── treasuries ───────────────────────────────────────────────────────────────

create table if not exists public.treasuries (
  id                            uuid primary key default gen_random_uuid(),
  project_id                    uuid not null unique references public.projects(id) on delete cascade,
  cash_balance                  numeric(14,2) not null default 0,
  fundraising_amount            numeric(14,2),
  fundraising_date              date,
  outstanding_loans             jsonb,          -- [{type, amount, monthly_payment}]
  pending_grants                numeric(14,2),
  accounts_receivable           numeric(14,2),
  payment_delay_clients_days    integer not null default 30,
  payment_delay_suppliers_days  integer not null default 30,
  source                        data_source not null default 'user_input',
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now()
);

alter table public.treasuries enable row level security;

create policy "treasuries: project owner"
  on public.treasuries
  for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = treasuries.project_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = treasuries.project_id and p.user_id = auth.uid()
    )
  );

-- ─── bp_contexts ──────────────────────────────────────────────────────────────

create table if not exists public.bp_contexts (
  id                        uuid primary key default gen_random_uuid(),
  project_id                uuid not null unique references public.projects(id) on delete cascade,
  target_audience           target_audience,
  funding_amount_requested  numeric(14,2),
  funding_usage             text,
  deadline                  date,
  market_context            text,
  competitive_advantage     text,
  team_narrative            text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

alter table public.bp_contexts enable row level security;

create policy "bp_contexts: project owner"
  on public.bp_contexts
  for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = bp_contexts.project_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = bp_contexts.project_id and p.user_id = auth.uid()
    )
  );

-- ─── business_plans ───────────────────────────────────────────────────────────

create table if not exists public.business_plans (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid not null references public.projects(id) on delete cascade,
  version             integer not null default 1,
  scenario            bp_scenario not null default 'moderate',
  generated_content   jsonb,   -- {executive_summary, project, market, ...}
  financial_tables    jsonb,   -- {pnl, cashflow, bfr, indicators}
  data_snapshot       jsonb,   -- full ProjectData at generation time
  completeness_score  integer not null default 0 check (completeness_score between 0 and 100),
  status              bp_status not null default 'draft',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (project_id, version)
);

alter table public.business_plans enable row level security;

create policy "business_plans: project owner"
  on public.business_plans
  for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = business_plans.project_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = business_plans.project_id and p.user_id = auth.uid()
    )
  );

-- Auto-increment version per project
create or replace function public.set_bp_version()
returns trigger language plpgsql as $$
begin
  if new.version = 1 then
    select coalesce(max(version), 0) + 1
    into new.version
    from public.business_plans
    where project_id = new.project_id;
  end if;
  return new;
end;
$$;

create trigger bp_auto_version
  before insert on public.business_plans
  for each row execute function public.set_bp_version();

-- ─── data_completion_logs ─────────────────────────────────────────────────────

create table if not exists public.data_completion_logs (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  field       text not null,
  source      data_source not null,
  confidence  numeric(4,3) not null default 1.0 check (confidence between 0 and 1),
  raw_value   jsonb,
  created_at  timestamptz not null default now()
);

alter table public.data_completion_logs enable row level security;

create policy "data_completion_logs: project owner"
  on public.data_completion_logs
  for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = data_completion_logs.project_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = data_completion_logs.project_id and p.user_id = auth.uid()
    )
  );

-- ─── updated_at triggers ──────────────────────────────────────────────────────

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$ declare
  t text;
begin
  foreach t in array array[
    'projects', 'revenue_lines', 'growth_hypotheses', 'team_members',
    'fixed_costs', 'variable_costs', 'treasuries', 'bp_contexts', 'business_plans'
  ] loop
    execute format(
      'create trigger handle_updated_at before update on public.%I
       for each row execute function public.handle_updated_at()',
      t
    );
  end loop;
end $$;

-- ─── Indexes ──────────────────────────────────────────────────────────────────

create index if not exists idx_projects_user_id          on public.projects(user_id);
create index if not exists idx_revenue_lines_project_id  on public.revenue_lines(project_id);
create index if not exists idx_growth_hyp_line_id        on public.growth_hypotheses(revenue_line_id);
create index if not exists idx_team_members_project_id   on public.team_members(project_id);
create index if not exists idx_fixed_costs_project_id    on public.fixed_costs(project_id);
create index if not exists idx_variable_costs_project_id on public.variable_costs(project_id);
create index if not exists idx_business_plans_project_id on public.business_plans(project_id);
create index if not exists idx_dcl_project_id            on public.data_completion_logs(project_id);
