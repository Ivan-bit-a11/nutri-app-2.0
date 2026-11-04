-- NutriFlow — Multi-role, consultations & manual payments
-- Run after 001, 002, 003 against your Supabase/PostgreSQL project
-- Copyright © Ivan Mbalame

-- ─── ROLES ON PROFILES ───────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists role text not null default 'nutritionist'
    check (role in ('super_admin', 'nutritionist', 'client'));

alter table public.profiles
  add column if not exists payment_phone text,
  add column if not exists payment_instructions text,
  add column if not exists is_active boolean not null default true;

-- Allow super_admin to manage all profiles (service role / policies below)
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_delete_own" on public.profiles;

create policy "profiles_select_own_or_admin" on public.profiles
  for select using (
    auth.uid() = id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin')
  );

create policy "profiles_insert_own_or_admin" on public.profiles
  for insert with check (
    auth.uid() = id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin')
  );

create policy "profiles_update_own_or_admin" on public.profiles
  for update using (
    auth.uid() = id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin')
  );

-- Public read of nutritionist payment info (phone / instructions) for clients
create policy "profiles_select_nutritionist_public" on public.profiles
  for select using (role = 'nutritionist' and is_active = true);

-- ─── LINK PATIENT RECORD TO CLIENT USER ──────────────────────────────────────
alter table public.patients
  add column if not exists client_user_id uuid references auth.users(id) on delete set null;

create index if not exists idx_patients_client_user on public.patients(client_user_id);

-- Clients can see their own patient record
create policy "patients_select_as_client" on public.patients
  for select using (auth.uid() = client_user_id);

-- ─── CONSULTATION REQUESTS ───────────────────────────────────────────────────
create table if not exists public.consultation_requests (
  id uuid primary key default gen_random_uuid(),
  client_user_id uuid not null references auth.users(id) on delete cascade,
  nutritionist_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'awaiting_payment', 'paid', 'approved', 'rejected', 'cancelled')),
  reason text,
  preferred_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_consult_client on public.consultation_requests(client_user_id);
create index if not exists idx_consult_nutritionist on public.consultation_requests(nutritionist_id);
create index if not exists idx_consult_status on public.consultation_requests(status);

alter table public.consultation_requests enable row level security;

create policy "consult_select_own" on public.consultation_requests
  for select using (
    auth.uid() = client_user_id
    or auth.uid() = nutritionist_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin')
  );

create policy "consult_insert_client" on public.consultation_requests
  for insert with check (auth.uid() = client_user_id);

create policy "consult_update_parties" on public.consultation_requests
  for update using (
    auth.uid() = client_user_id
    or auth.uid() = nutritionist_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin')
  );

create trigger consultation_requests_updated_at
  before update on public.consultation_requests
  for each row execute function public.set_updated_at();

-- ─── PAYMENTS (manual transfer + SMS/proof paste) ────────────────────────────
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  consultation_request_id uuid references public.consultation_requests(id) on delete set null,
  client_user_id uuid not null references auth.users(id) on delete cascade,
  nutritionist_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2),
  currency text not null default 'MZN',
  payment_phone text,
  proof_text text not null,           -- SMS / confirmation pasted by client
  status text not null default 'submitted'
    check (status in ('submitted', 'confirmed', 'rejected')),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payments_nutritionist on public.payments(nutritionist_id);
create index if not exists idx_payments_client on public.payments(client_user_id);
create index if not exists idx_payments_status on public.payments(status);

alter table public.payments enable row level security;

create policy "payments_select_parties" on public.payments
  for select using (
    auth.uid() = client_user_id
    or auth.uid() = nutritionist_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin')
  );

create policy "payments_insert_client" on public.payments
  for insert with check (auth.uid() = client_user_id);

create policy "payments_update_nutritionist_or_admin" on public.payments
  for update using (
    auth.uid() = nutritionist_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin')
  );

create trigger payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- ─── DIET PLANS: clients can read plans linked to their patient record ───────
create policy "diet_plans_select_as_client" on public.diet_plans
  for select using (
    exists (
      select 1 from public.patients pt
      where pt.id = diet_plans.patient_id and pt.client_user_id = auth.uid()
    )
  );

create policy "meals_select_as_client" on public.meals
  for select using (
    exists (
      select 1 from public.diet_plans dp
      join public.patients pt on pt.id = dp.patient_id
      where dp.id = meals.diet_plan_id and pt.client_user_id = auth.uid()
    )
  );

create policy "meal_items_select_as_client" on public.meal_items
  for select using (
    exists (
      select 1 from public.meals m
      join public.diet_plans dp on dp.id = m.diet_plan_id
      join public.patients pt on pt.id = dp.patient_id
      where m.id = meal_items.meal_id and pt.client_user_id = auth.uid()
    )
  );

-- ─── HELPER: is_super_admin ──────────────────────────────────────────────────
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'super_admin'
  );
$$;

comment on table public.consultation_requests is 'Client requests consultation; may be pending until payment confirmed';
comment on table public.payments is 'Manual transfer proofs (SMS paste) submitted by clients';

-- Update profile trigger to respect role from user metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r text;
begin
  r := coalesce(new.raw_user_meta_data ->> 'role', 'client');
  if r not in ('super_admin', 'nutritionist', 'client') then
    r := 'client';
  end if;

  insert into public.profiles (id, full_name, email, role, phone, clinic_name, crn)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', null),
    new.email,
    r,
    coalesce(new.raw_user_meta_data ->> 'phone', null),
    coalesce(new.raw_user_meta_data ->> 'clinic_name', null),
    coalesce(new.raw_user_meta_data ->> 'crn', null)
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, profiles.full_name),
    role = excluded.role,
    phone = coalesce(excluded.phone, profiles.phone),
    clinic_name = coalesce(excluded.clinic_name, profiles.clinic_name),
    crn = coalesce(excluded.crn, profiles.crn);

  return new;
end;
$$;
