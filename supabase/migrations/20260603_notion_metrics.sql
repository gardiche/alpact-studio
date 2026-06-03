-- ============================================================
-- Notion Metrics Extraction — données chiffrées auto-extraites
-- ============================================================
-- Table d'historique des métriques extraites par Claude depuis Notion.
-- Chaque sync Notion peut produire une nouvelle extraction.
-- Les métriques alimentent hub_metrics, ToolCards, Impact, etc.

-- ── Table d'extraction brute (historique) ──
CREATE TABLE public.extracted_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  snapshot_id uuid,  -- référence vers notion_snapshots.id

  -- ── Finance ──
  mrr numeric,                    -- Monthly Recurring Revenue (€)
  mrr_previous numeric,           -- MRR du mois précédent (pour trend)
  arr numeric,                    -- Annual Recurring Revenue (€)
  ca_mensuel numeric,             -- Chiffre d'affaires mensuel total
  ca_annuel numeric,              -- CA annuel
  burn_rate numeric,              -- Dépenses mensuelles (€)
  runway_months numeric,          -- Nombre de mois de trésorerie restants
  tresorerie numeric,             -- Solde de trésorerie actuel (€)
  capital_raised numeric,         -- Total levé (€)

  -- ── Clients & Produit ──
  nb_clients integer,             -- Nombre de clients actifs
  nb_clients_previous integer,    -- Mois précédent
  nb_prospects integer,           -- Prospects dans le pipeline
  nb_users integer,               -- Utilisateurs (si différent de clients)
  churn_rate numeric,             -- Taux de churn mensuel (%)
  cac numeric,                    -- Coût d'acquisition client (€)
  ltv numeric,                    -- Lifetime Value (€)
  nps numeric,                    -- Net Promoter Score

  -- ── Équipe ──
  headcount integer,              -- Taille de l'équipe
  nb_recrutements_en_cours integer,

  -- ── Go-to-Market ──
  nb_leads_mois integer,          -- Leads générés ce mois
  taux_conversion numeric,        -- Taux de conversion leads → clients (%)
  nb_rdv_mois integer,            -- RDV commerciaux ce mois

  -- ── Jalons & Priorités ──
  priorite_active text,           -- Priorité n°1 identifiée
  prochaine_echeance text,        -- Prochaine échéance importante
  jalons_recents jsonb DEFAULT '[]'::jsonb,  -- [{ titre, date, statut }]

  -- ── Signaux ──
  signaux_positifs jsonb DEFAULT '[]'::jsonb,  -- [{ texte, source }]
  signaux_negatifs jsonb DEFAULT '[]'::jsonb,  -- [{ texte, source }]
  alertes jsonb DEFAULT '[]'::jsonb,           -- [{ type, message, severite }]

  -- ── Meta ──
  confidence numeric DEFAULT 0.5,  -- 0-1 : confiance de l'extraction
  model text DEFAULT 'claude-sonnet-4-20250514',
  input_tokens integer,
  output_tokens integer,
  extracted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX extracted_metrics_user_idx ON public.extracted_metrics(user_id, extracted_at DESC);

-- ── Enrichir hub_metrics avec des colonnes numériques ──
ALTER TABLE public.hub_metrics
  ADD COLUMN IF NOT EXISTS mrr_numeric numeric,
  ADD COLUMN IF NOT EXISTS mrr_previous numeric,
  ADD COLUMN IF NOT EXISTS arr numeric,
  ADD COLUMN IF NOT EXISTS ca_mensuel numeric,
  ADD COLUMN IF NOT EXISTS burn_rate numeric,
  ADD COLUMN IF NOT EXISTS runway_months numeric,
  ADD COLUMN IF NOT EXISTS tresorerie numeric,
  ADD COLUMN IF NOT EXISTS capital_raised numeric,
  ADD COLUMN IF NOT EXISTS nb_clients integer,
  ADD COLUMN IF NOT EXISTS nb_prospects integer,
  ADD COLUMN IF NOT EXISTS headcount integer,
  ADD COLUMN IF NOT EXISTS churn_rate numeric,
  ADD COLUMN IF NOT EXISTS nb_leads_mois integer,
  ADD COLUMN IF NOT EXISTS taux_conversion numeric,
  ADD COLUMN IF NOT EXISTS prochaine_echeance text,
  ADD COLUMN IF NOT EXISTS signaux_positifs jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS signaux_negatifs jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tool_signals jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_extraction_at timestamptz,
  ADD COLUMN IF NOT EXISTS extraction_confidence numeric;

-- ── RLS extracted_metrics ──
ALTER TABLE public.extracted_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "extracted_metrics_select_own" ON public.extracted_metrics
  FOR SELECT USING (auth.uid() = user_id);

-- La structure peut voir les métriques extraites de ses entrepreneurs
CREATE POLICY "extracted_metrics_select_org" ON public.extracted_metrics
  FOR SELECT USING (
    EXISTS(
      SELECT 1
      FROM public.cohort_members cm
      JOIN public.cohorts c ON c.id = cm.cohort_id
      JOIN public.org_memberships m ON m.org_id = c.org_id
      WHERE cm.user_id = extracted_metrics.user_id
        AND m.user_id = auth.uid()
    )
  );
