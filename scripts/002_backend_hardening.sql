-- NutriFlow AI - Backend Hardening Migration
-- Apply after 001_create_tables.sql

-- ─── PROFILE ROLES ──────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists role text not null default 'nutritionist'
  check (role in ('nutritionist', 'assistant', 'admin'));

-- ─── PERFORMANCE INDEXES ─────────────────────────────────────────────────────
create index if not exists idx_patients_nutritionist_created_at on public.patients (nutritionist_id, created_at desc);
create index if not exists idx_assessments_nutritionist_assessed_at on public.assessments (nutritionist_id, assessed_at desc);
create index if not exists idx_diet_plans_nutritionist_updated_at on public.diet_plans (nutritionist_id, updated_at desc);
create index if not exists idx_appointments_nutritionist_scheduled_at on public.appointments (nutritionist_id, scheduled_at asc);

-- ─── TENANT INTEGRITY TRIGGER (patient_id + nutritionist_id) ───────────────
create or replace function public.ensure_patient_belongs_to_nutritionist()
returns trigger
language plpgsql
as $$
begin
  if new.patient_id is null then
    return new;
  end if;

  if not exists (
    select 1
    from public.patients p
    where p.id = new.patient_id
      and p.nutritionist_id = new.nutritionist_id
  ) then
    raise exception 'Patient does not belong to nutritionist';
  end if;

  return new;
end;
$$;

drop trigger if exists assessments_validate_patient_tenant on public.assessments;
create trigger assessments_validate_patient_tenant
  before insert or update on public.assessments
  for each row execute function public.ensure_patient_belongs_to_nutritionist();

drop trigger if exists diet_plans_validate_patient_tenant on public.diet_plans;
create trigger diet_plans_validate_patient_tenant
  before insert or update on public.diet_plans
  for each row execute function public.ensure_patient_belongs_to_nutritionist();

drop trigger if exists appointments_validate_patient_tenant on public.appointments;
create trigger appointments_validate_patient_tenant
  before insert or update on public.appointments
  for each row execute function public.ensure_patient_belongs_to_nutritionist();

drop trigger if exists notes_validate_patient_tenant on public.patient_notes;
create trigger notes_validate_patient_tenant
  before insert or update on public.patient_notes
  for each row execute function public.ensure_patient_belongs_to_nutritionist();

-- ─── AI DRAFTS ───────────────────────────────────────────────────────────────
create table if not exists public.ai_drafts (
  id uuid primary key default gen_random_uuid(),
  nutritionist_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete set null,
  tool text not null,
  title text not null,
  latest_content text not null,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ai_drafts_nutritionist_updated_at on public.ai_drafts (nutritionist_id, updated_at desc);
create index if not exists idx_ai_drafts_patient on public.ai_drafts (patient_id);
create unique index if not exists idx_ai_drafts_unique_with_patient
  on public.ai_drafts (nutritionist_id, patient_id, tool)
  where patient_id is not null;
create unique index if not exists idx_ai_drafts_unique_without_patient
  on public.ai_drafts (nutritionist_id, tool)
  where patient_id is null;

alter table public.ai_drafts enable row level security;
create policy "ai_drafts_select_own" on public.ai_drafts for select using (auth.uid() = nutritionist_id);
create policy "ai_drafts_insert_own" on public.ai_drafts for insert with check (auth.uid() = nutritionist_id);
create policy "ai_drafts_update_own" on public.ai_drafts for update using (auth.uid() = nutritionist_id);
create policy "ai_drafts_delete_own" on public.ai_drafts for delete using (auth.uid() = nutritionist_id);

create trigger ai_drafts_updated_at before update on public.ai_drafts
  for each row execute function public.set_updated_at();

drop trigger if exists ai_drafts_validate_patient_tenant on public.ai_drafts;
create trigger ai_drafts_validate_patient_tenant
  before insert or update on public.ai_drafts
  for each row execute function public.ensure_patient_belongs_to_nutritionist();

-- ─── AI DRAFT VERSIONS ───────────────────────────────────────────────────────
create table if not exists public.ai_draft_versions (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references public.ai_drafts(id) on delete cascade,
  nutritionist_id uuid not null references auth.users(id) on delete cascade,
  tool text not null,
  prompt_context text not null,
  generated_content text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_draft_versions_draft_created_at on public.ai_draft_versions (draft_id, created_at desc);
create index if not exists idx_ai_draft_versions_nutritionist_created_at on public.ai_draft_versions (nutritionist_id, created_at desc);

alter table public.ai_draft_versions enable row level security;
create policy "ai_draft_versions_select_own" on public.ai_draft_versions for select using (auth.uid() = nutritionist_id);
create policy "ai_draft_versions_insert_own" on public.ai_draft_versions for insert with check (auth.uid() = nutritionist_id);
create policy "ai_draft_versions_delete_own" on public.ai_draft_versions for delete using (auth.uid() = nutritionist_id);
