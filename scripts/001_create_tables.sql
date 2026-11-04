-- NutriFlow AI - Full Database Migration
-- Run this once against your Supabase project

-- ─── EXTENSIONS ──────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── NUTRITIONIST PROFILES ───────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  clinic_name text,
  crn text,  -- professional registration number
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles for delete using (auth.uid() = id);

-- ─── AUTO-CREATE PROFILE ON SIGNUP ───────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', null),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── PATIENTS ────────────────────────────────────────────────────────────────
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  nutritionist_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  dob date,
  sex text check (sex in ('male', 'female')),
  height_cm numeric(5,1),
  goal text,
  activity_level text check (activity_level in ('sedentary','light','moderate','very_active','extra_active')),
  status text not null default 'active' check (status in ('active','inactive','pending')),
  emergency_contact_name text,
  emergency_contact_phone text,
  dietary_preferences text,
  allergies text[],
  conditions text[],
  medications text,
  supplements text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.patients enable row level security;
create policy "patients_select_own" on public.patients for select using (auth.uid() = nutritionist_id);
create policy "patients_insert_own" on public.patients for insert with check (auth.uid() = nutritionist_id);
create policy "patients_update_own" on public.patients for update using (auth.uid() = nutritionist_id);
create policy "patients_delete_own" on public.patients for delete using (auth.uid() = nutritionist_id);

-- ─── ASSESSMENTS ─────────────────────────────────────────────────────────────
create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  nutritionist_id uuid not null references auth.users(id) on delete cascade,
  assessed_at date not null default current_date,
  weight_kg numeric(5,1),
  height_cm numeric(5,1),
  bmi numeric(4,1),
  waist_cm numeric(5,1),
  hip_cm numeric(5,1),
  neck_cm numeric(5,1),
  chest_cm numeric(5,1),
  abdomen_cm numeric(5,1),
  thigh_cm numeric(5,1),
  triceps_mm numeric(4,1),
  subscapular_mm numeric(4,1),
  suprailiac_mm numeric(4,1),
  body_fat_pct numeric(4,1),
  lean_mass_kg numeric(5,1),
  fat_mass_kg numeric(5,1),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.assessments enable row level security;
create policy "assessments_select_own" on public.assessments for select using (auth.uid() = nutritionist_id);
create policy "assessments_insert_own" on public.assessments for insert with check (auth.uid() = nutritionist_id);
create policy "assessments_update_own" on public.assessments for update using (auth.uid() = nutritionist_id);
create policy "assessments_delete_own" on public.assessments for delete using (auth.uid() = nutritionist_id);

-- ─── DIET PLANS ──────────────────────────────────────────────────────────────
create table if not exists public.diet_plans (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id) on delete set null,
  nutritionist_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  daily_kcal integer,
  protein_g integer,
  carbs_g integer,
  fat_g integer,
  notes text,
  is_active boolean not null default true,
  share_token uuid default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.diet_plans enable row level security;
create policy "diet_plans_select_own" on public.diet_plans for select using (auth.uid() = nutritionist_id);
create policy "diet_plans_insert_own" on public.diet_plans for insert with check (auth.uid() = nutritionist_id);
create policy "diet_plans_update_own" on public.diet_plans for update using (auth.uid() = nutritionist_id);
create policy "diet_plans_delete_own" on public.diet_plans for delete using (auth.uid() = nutritionist_id);
-- Public share: anyone with the token can read
create policy "diet_plans_select_shared" on public.diet_plans for select using (share_token is not null);

-- ─── MEALS ───────────────────────────────────────────────────────────────────
create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  diet_plan_id uuid not null references public.diet_plans(id) on delete cascade,
  name text not null,
  time_of_day text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.meals enable row level security;
create policy "meals_select" on public.meals for select using (
  exists (
    select 1 from public.diet_plans dp
    where dp.id = meals.diet_plan_id
    and (dp.nutritionist_id = auth.uid() or dp.share_token is not null)
  )
);
create policy "meals_insert" on public.meals for insert with check (
  exists (select 1 from public.diet_plans dp where dp.id = meals.diet_plan_id and dp.nutritionist_id = auth.uid())
);
create policy "meals_update" on public.meals for update using (
  exists (select 1 from public.diet_plans dp where dp.id = meals.diet_plan_id and dp.nutritionist_id = auth.uid())
);
create policy "meals_delete" on public.meals for delete using (
  exists (select 1 from public.diet_plans dp where dp.id = meals.diet_plan_id and dp.nutritionist_id = auth.uid())
);

-- ─── MEAL ITEMS ──────────────────────────────────────────────────────────────
create table if not exists public.meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals(id) on delete cascade,
  food_name text not null,
  quantity text,
  unit text,
  kcal integer,
  protein_g numeric(5,1),
  carbs_g numeric(5,1),
  fat_g numeric(5,1),
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.meal_items enable row level security;
create policy "meal_items_select" on public.meal_items for select using (
  exists (
    select 1 from public.meals m
    join public.diet_plans dp on dp.id = m.diet_plan_id
    where m.id = meal_items.meal_id
    and (dp.nutritionist_id = auth.uid() or dp.share_token is not null)
  )
);
create policy "meal_items_insert" on public.meal_items for insert with check (
  exists (
    select 1 from public.meals m
    join public.diet_plans dp on dp.id = m.diet_plan_id
    where m.id = meal_items.meal_id and dp.nutritionist_id = auth.uid()
  )
);
create policy "meal_items_update" on public.meal_items for update using (
  exists (
    select 1 from public.meals m
    join public.diet_plans dp on dp.id = m.diet_plan_id
    where m.id = meal_items.meal_id and dp.nutritionist_id = auth.uid()
  )
);
create policy "meal_items_delete" on public.meal_items for delete using (
  exists (
    select 1 from public.meals m
    join public.diet_plans dp on dp.id = m.diet_plan_id
    where m.id = meal_items.meal_id and dp.nutritionist_id = auth.uid()
  )
);

-- ─── PATIENT NOTES ───────────────────────────────────────────────────────────
create table if not exists public.patient_notes (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  nutritionist_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.patient_notes enable row level security;
create policy "notes_select_own" on public.patient_notes for select using (auth.uid() = nutritionist_id);
create policy "notes_insert_own" on public.patient_notes for insert with check (auth.uid() = nutritionist_id);
create policy "notes_update_own" on public.patient_notes for update using (auth.uid() = nutritionist_id);
create policy "notes_delete_own" on public.patient_notes for delete using (auth.uid() = nutritionist_id);

-- ─── APPOINTMENTS ────────────────────────────────────────────────────────────
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id) on delete set null,
  nutritionist_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 60,
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled','no_show')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.appointments enable row level security;
create policy "appointments_select_own" on public.appointments for select using (auth.uid() = nutritionist_id);
create policy "appointments_insert_own" on public.appointments for insert with check (auth.uid() = nutritionist_id);
create policy "appointments_update_own" on public.appointments for update using (auth.uid() = nutritionist_id);
create policy "appointments_delete_own" on public.appointments for delete using (auth.uid() = nutritionist_id);

-- ─── UPDATED_AT TRIGGERS ─────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger patients_updated_at before update on public.patients
  for each row execute function public.set_updated_at();

create trigger diet_plans_updated_at before update on public.diet_plans
  for each row execute function public.set_updated_at();

create trigger patient_notes_updated_at before update on public.patient_notes
  for each row execute function public.set_updated_at();

create trigger appointments_updated_at before update on public.appointments
  for each row execute function public.set_updated_at();
