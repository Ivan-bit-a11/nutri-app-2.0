-- NutriFlow — Schema completo para Neon (PostgreSQL)
-- Sem dependências do Supabase Auth / auth.users / RLS
-- Corre no SQL Editor do Neon (ou via psql / neonctl)
-- Copyright © Ivan Mbalame

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── USERS (substitui auth.users do Supabase) ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name     TEXT,
  email_verified_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);

-- ─── PROFILES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  full_name       TEXT,
  email           TEXT,
  clinic_name     TEXT,
  crn             TEXT,
  phone           TEXT,
  avatar_url      TEXT,
  role            TEXT NOT NULL DEFAULT 'nutritionist'
                    CHECK (role IN ('super_admin', 'nutritionist', 'client')),
  payment_phone   TEXT,
  payment_instructions TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);

-- ─── PATIENTS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.patients (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutritionist_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  client_user_id          UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name                    TEXT NOT NULL,
  email                   TEXT,
  phone                   TEXT,
  dob                     DATE,
  sex                     TEXT CHECK (sex IN ('male', 'female')),
  height_cm               NUMERIC(5,1),
  goal                    TEXT,
  activity_level          TEXT,
  status                  TEXT NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'inactive', 'pending')),
  allergies               TEXT[],
  conditions              TEXT[],
  medications             TEXT,
  supplements             TEXT,
  dietary_preferences     TEXT,
  emergency_contact_name  TEXT,
  emergency_contact_phone TEXT,
  notes                   TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patients_nutritionist ON public.patients (nutritionist_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patients_client_user ON public.patients (client_user_id);

-- ─── ASSESSMENTS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.assessments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id        UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  nutritionist_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assessed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  weight_kg         NUMERIC(6,2),
  height_cm         NUMERIC(5,1),
  bmi               NUMERIC(5,2),
  body_fat_pct      NUMERIC(5,2),
  fat_mass_kg       NUMERIC(6,2),
  muscle_mass_kg    NUMERIC(6,2),
  waist_cm          NUMERIC(5,1),
  hip_cm            NUMERIC(5,1),
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assessments_nutritionist ON public.assessments (nutritionist_id, assessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_assessments_patient ON public.assessments (patient_id);

-- ─── DIET PLANS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.diet_plans (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id              UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  nutritionist_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title                   TEXT NOT NULL,
  description             TEXT,
  daily_kcal              INTEGER,
  protein_g               INTEGER,
  carbs_g                 INTEGER,
  fat_g                   INTEGER,
  notes                   TEXT,
  is_active               BOOLEAN NOT NULL DEFAULT true,
  share_token             UUID DEFAULT gen_random_uuid(),
  published_to_client_at  TIMESTAMPTZ,
  published_by            UUID REFERENCES public.users(id),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diet_plans_nutritionist ON public.diet_plans (nutritionist_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_diet_plans_patient_published ON public.diet_plans (patient_id, published_to_client_at)
  WHERE published_to_client_at IS NOT NULL;

-- ─── MEALS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.meals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diet_plan_id  UUID NOT NULL REFERENCES public.diet_plans(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  time_of_day   TEXT,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meals_plan ON public.meals (diet_plan_id, sort_order);

-- ─── MEAL ITEMS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.meal_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id     UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  food_name   TEXT NOT NULL,
  quantity    TEXT,
  unit        TEXT,
  kcal        NUMERIC(8,2),
  protein_g   NUMERIC(6,2),
  carbs_g     NUMERIC(6,2),
  fat_g       NUMERIC(6,2),
  notes       TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meal_items_meal ON public.meal_items (meal_id, sort_order);

-- ─── PATIENT NOTES ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.patient_notes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  nutritionist_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patient_notes_patient ON public.patient_notes (patient_id, created_at DESC);

-- ─── APPOINTMENTS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.appointments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  nutritionist_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  scheduled_at    TIMESTAMPTZ NOT NULL,
  duration_min    INTEGER NOT NULL DEFAULT 60,
  type            TEXT,
  status          TEXT NOT NULL DEFAULT 'scheduled'
                    CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_nutritionist ON public.appointments (nutritionist_id, scheduled_at ASC);

-- ─── AI DRAFTS (opcional / desactivado na UI) ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_drafts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutritionist_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  patient_id      UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  title           TEXT,
  content         JSONB NOT NULL DEFAULT '{}'::jsonb,
  status          TEXT NOT NULL DEFAULT 'draft',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_draft_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id        UUID NOT NULL REFERENCES public.ai_drafts(id) ON DELETE CASCADE,
  nutritionist_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content         JSONB NOT NULL DEFAULT '{}'::jsonb,
  version         INTEGER NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── DIET TEMPLATES ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.diet_templates (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutritionist_id         UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name                    TEXT NOT NULL,
  slug                    TEXT NOT NULL,
  description             TEXT,
  category                TEXT NOT NULL DEFAULT 'general',
  goal                    TEXT,
  tags                    TEXT[] NOT NULL DEFAULT '{}',
  status                  TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  is_system_template      BOOLEAN NOT NULL DEFAULT false,
  created_by              UUID REFERENCES public.users(id) ON DELETE SET NULL,
  version                 INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  dietary_pattern         TEXT,
  restrictions            TEXT[] NOT NULL DEFAULT '{}',
  allergens               TEXT[] NOT NULL DEFAULT '{}',
  foods_to_avoid          TEXT[] NOT NULL DEFAULT '{}',
  preferred_foods         TEXT[] NOT NULL DEFAULT '{}',
  professional_notes      TEXT,
  patient_friendly_notes  TEXT,
  daily_calories          INTEGER,
  protein_grams           NUMERIC(6,2),
  carb_grams              NUMERIC(6,2),
  fat_grams               NUMERIC(6,2),
  protein_percent         NUMERIC(5,2),
  carb_percent            NUMERIC(5,2),
  fat_percent             NUMERIC(5,2),
  fiber_target_grams      NUMERIC(6,2),
  water_target_ml         INTEGER,
  meal_count_per_day      INTEGER,
  duration_days           INTEGER NOT NULL DEFAULT 7,
  hydration_plan          TEXT,
  supplements             TEXT[] NOT NULL DEFAULT '{}',
  shopping_list           TEXT[] NOT NULL DEFAULT '{}',
  meal_prep_tips          TEXT[] NOT NULL DEFAULT '{}',
  adherence_tips          TEXT[] NOT NULL DEFAULT '{}',
  general_recommendations TEXT[] NOT NULL DEFAULT '{}',
  schedule                JSONB NOT NULL DEFAULT '{"days":[],"meals":[]}'::jsonb,
  usage_count             INTEGER NOT NULL DEFAULT 0,
  last_used_at            TIMESTAMPTZ,
  can_duplicate           BOOLEAN NOT NULL DEFAULT true,
  can_archive             BOOLEAN NOT NULL DEFAULT true,
  can_create_new_version  BOOLEAN NOT NULL DEFAULT true,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (is_system_template = true AND nutritionist_id IS NULL)
    OR (is_system_template = false AND nutritionist_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_diet_templates_owner ON public.diet_templates (nutritionist_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_diet_templates_system ON public.diet_templates (is_system_template, status);

CREATE TABLE IF NOT EXISTS public.diet_template_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id     UUID NOT NULL REFERENCES public.diet_templates(id) ON DELETE CASCADE,
  nutritionist_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_by      UUID REFERENCES public.users(id) ON DELETE SET NULL,
  version         INTEGER NOT NULL,
  snapshot        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── CONSULTATION REQUESTS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.consultation_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  nutritionist_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  preferred_date  DATE,
  preferred_time  TEXT,
  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'payment_pending', 'payment_confirmed', 'approved', 'rejected', 'cancelled')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consultation_requests_nutritionist ON public.consultation_requests (nutritionist_id, status);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_client ON public.consultation_requests (client_user_id);

-- ─── PAYMENTS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payments (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_request_id   UUID REFERENCES public.consultation_requests(id) ON DELETE SET NULL,
  client_user_id            UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  nutritionist_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount                    NUMERIC(12,2),
  currency                  TEXT NOT NULL DEFAULT 'MZN',
  payment_phone             TEXT,
  proof_text                TEXT NOT NULL,
  status                    TEXT NOT NULL DEFAULT 'submitted'
                              CHECK (status IN ('submitted', 'confirmed', 'rejected')),
  reviewed_at               TIMESTAMPTZ,
  reviewed_by               UUID REFERENCES public.users(id),
  notes                     TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_nutritionist ON public.payments (nutritionist_id);
CREATE INDEX IF NOT EXISTS idx_payments_client ON public.payments (client_user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments (status);

-- ─── UPDATED_AT HELPER ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS patients_updated_at ON public.patients;
CREATE TRIGGER patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS assessments_updated_at ON public.assessments;
CREATE TRIGGER assessments_updated_at
  BEFORE UPDATE ON public.assessments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS diet_plans_updated_at ON public.diet_plans;
CREATE TRIGGER diet_plans_updated_at
  BEFORE UPDATE ON public.diet_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS patient_notes_updated_at ON public.patient_notes;
CREATE TRIGGER patient_notes_updated_at
  BEFORE UPDATE ON public.patient_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS appointments_updated_at ON public.appointments;
CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS consultation_requests_updated_at ON public.consultation_requests;
CREATE TRIGGER consultation_requests_updated_at
  BEFORE UPDATE ON public.consultation_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS payments_updated_at ON public.payments;
CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── TENANT INTEGRITY (patient pertence ao nutricionista) ────────────────────
CREATE OR REPLACE FUNCTION public.ensure_patient_belongs_to_nutritionist()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.patient_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = NEW.patient_id AND p.nutritionist_id = NEW.nutritionist_id
  ) THEN
    RAISE EXCEPTION 'Patient does not belong to nutritionist';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assessments_validate_patient_tenant ON public.assessments;
CREATE TRIGGER assessments_validate_patient_tenant
  BEFORE INSERT OR UPDATE ON public.assessments
  FOR EACH ROW EXECUTE FUNCTION public.ensure_patient_belongs_to_nutritionist();

DROP TRIGGER IF EXISTS diet_plans_validate_patient_tenant ON public.diet_plans;
CREATE TRIGGER diet_plans_validate_patient_tenant
  BEFORE INSERT OR UPDATE ON public.diet_plans
  FOR EACH ROW EXECUTE FUNCTION public.ensure_patient_belongs_to_nutritionist();

DROP TRIGGER IF EXISTS appointments_validate_patient_tenant ON public.appointments;
CREATE TRIGGER appointments_validate_patient_tenant
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.ensure_patient_belongs_to_nutritionist();

-- ─── SEED: Super Admin de exemplo (muda email/password depois) ───────────────
-- Password: Admin123!  (bcrypt hash gerado offline)
-- Depois de correr, faz login e altera a password na UI ou via SQL.
-- INSERT INTO public.users (id, email, password_hash, full_name)
-- VALUES (
--   '00000000-0000-0000-0000-000000000001',
--   'admin@nutriflow.local',
--   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- placeholder
--   'Super Admin'
-- );
-- INSERT INTO public.profiles (id, full_name, email, role, is_active)
-- VALUES (
--   '00000000-0000-0000-0000-000000000001',
--   'Super Admin',
--   'admin@nutriflow.local',
--   'super_admin',
--   true
-- );

COMMENT ON TABLE public.users IS 'Contas de login (substitui Supabase Auth)';
COMMENT ON TABLE public.profiles IS 'Dados de perfil + role (super_admin | nutritionist | client)';
