-- NutriFlow — Entrega individual de planos ao cliente
-- Copyright © Ivan Mbalame
-- Executar após 004_multi_role_payments.sql

-- Quando o nutricionista "envia" o plano, fica visível só para aquele cliente
alter table public.diet_plans
  add column if not exists published_to_client_at timestamptz,
  add column if not exists published_by uuid references auth.users(id);

comment on column public.diet_plans.published_to_client_at is
  'Preenchido quando o nutricionista envia o plano ao cliente (após pagamento confirmado)';

-- Índice para listagens do portal do cliente
create index if not exists idx_diet_plans_published
  on public.diet_plans (patient_id, published_to_client_at)
  where published_to_client_at is not null;

-- Garantir coluna client_user_id (caso 004 não tenha corrido completo)
alter table public.patients
  add column if not exists client_user_id uuid references auth.users(id) on delete set null;

create index if not exists idx_patients_client_user on public.patients(client_user_id);
