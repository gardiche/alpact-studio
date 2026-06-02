-- ============================================================
-- Enrichissement astryd_sync — v2 : profil complet + assessments
-- ============================================================
-- Ajoute toutes les données Astryd utiles pour le copilot,
-- le brief pré-séance et les insights structure.

-- ── Profil Astryd ──
ALTER TABLE public.astryd_sync
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS ready_score integer;

-- ── Personnalité : Schwartz (10 valeurs) ──
ALTER TABLE public.astryd_sync
  ADD COLUMN IF NOT EXISTS schwartz_values jsonb;
  -- Format: { pouvoir, accomplissement, hedonisme, stimulation, autonomie,
  --           universalisme, bienveillance, tradition, conformite, securite }

-- ── Personnalité : Big Five (5 traits) ──
ALTER TABLE public.astryd_sync
  ADD COLUMN IF NOT EXISTS big_five_traits jsonb;
  -- Format: { ouverture, conscienciosite, extraversion, agreabilite, nevrosisme }

-- ── Personnalité : RIASEC (6 scores) ──
ALTER TABLE public.astryd_sync
  ADD COLUMN IF NOT EXISTS riasec_scores jsonb;
  -- Format: { realiste, investigateur, artistique, social, entreprenant, conventionnel }

-- ── Sphères de vie (6 domaines) ──
ALTER TABLE public.astryd_sync
  ADD COLUMN IF NOT EXISTS life_spheres jsonb;
  -- Format: { soi, couple, famille, amis, loisirs, pro }

-- ── Contexte entrepreneurial ──
ALTER TABLE public.astryd_sync
  ADD COLUMN IF NOT EXISTS user_context jsonb;
  -- Format: { temps_disponible, situation_pro, situation_financiere,
  --           reseau_professionnel, experience_entrepreneuriat,
  --           energie_sociale, budget_test_30j, soutien_entourage,
  --           tolerance_risque, charge_mentale }

-- ── Idée principale ──
ALTER TABLE public.astryd_sync
  ADD COLUMN IF NOT EXISTS idea_title text,
  ADD COLUMN IF NOT EXISTS idea_description text,
  ADD COLUMN IF NOT EXISTS idea_id text;

-- ── Décision sur l'idée ──
ALTER TABLE public.astryd_sync
  ADD COLUMN IF NOT EXISTS decision_state text,        -- GO / KEEP / PIVOT / STOP
  ADD COLUMN IF NOT EXISTS decision_rationale text;

-- ── Score de maturité ──
ALTER TABLE public.astryd_sync
  ADD COLUMN IF NOT EXISTS maturity_score integer,
  ADD COLUMN IF NOT EXISTS maturity_progression integer;

-- ── Historique alignement (évolution) ──
ALTER TABLE public.astryd_sync
  ADD COLUMN IF NOT EXISTS alignment_history jsonb default '[]'::jsonb;
  -- Format: [{ score, details, created_at }]

-- ── Check-ins récents (7 derniers jours) ──
ALTER TABLE public.astryd_sync
  ADD COLUMN IF NOT EXISTS recent_checkins jsonb default '[]'::jsonb;
  -- Format: [{ energy_level, clarity_level, mood_level, created_at }]

-- ── Micro-actions en cours ──
ALTER TABLE public.astryd_sync
  ADD COLUMN IF NOT EXISTS active_micro_commitments jsonb default '[]'::jsonb;
  -- Format: [{ text, objectif, status, jauge_ciblee, due_date }]

-- ── Dernière session Astryd (résumé) ──
ALTER TABLE public.astryd_sync
  ADD COLUMN IF NOT EXISTS last_session_summary jsonb;
  -- Format: { idea_title, alignment_scores, maturity_score, attention_zones,
  --           decision, journal_message_count, created_at }

-- ── Posture assessment ──
ALTER TABLE public.astryd_sync
  ADD COLUMN IF NOT EXISTS posture_assessment jsonb;
  -- Format: { life_spheres: {...}, environment: {...}, motivation, aversion_risque }

-- ── Compteurs d'activité enrichis ──
ALTER TABLE public.astryd_sync
  ADD COLUMN IF NOT EXISTS checkins_count integer default 0,
  ADD COLUMN IF NOT EXISTS micro_actions_total integer default 0;
