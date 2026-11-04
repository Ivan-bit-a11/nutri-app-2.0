-- NutriFlow AI - Templates Module Migration
-- Apply after 001_create_tables.sql and 002_backend_hardening.sql

-- ─── DIET TEMPLATES ─────────────────────────────────────────────────────────
create table if not exists public.diet_templates (
  id uuid primary key default gen_random_uuid(),
  nutritionist_id uuid references auth.users(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  category text not null default 'general',
  goal text,
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  is_system_template boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  version integer not null default 1 check (version > 0),
  dietary_pattern text,
  restrictions text[] not null default '{}',
  allergens text[] not null default '{}',
  foods_to_avoid text[] not null default '{}',
  preferred_foods text[] not null default '{}',
  professional_notes text,
  patient_friendly_notes text,
  daily_calories integer,
  protein_grams numeric(6,2),
  carb_grams numeric(6,2),
  fat_grams numeric(6,2),
  protein_percent numeric(5,2),
  carb_percent numeric(5,2),
  fat_percent numeric(5,2),
  fiber_target_grams numeric(6,2),
  water_target_ml integer,
  meal_count_per_day integer,
  duration_days integer not null default 7,
  hydration_plan text,
  supplements text[] not null default '{}',
  shopping_list text[] not null default '{}',
  meal_prep_tips text[] not null default '{}',
  adherence_tips text[] not null default '{}',
  general_recommendations text[] not null default '{}',
  schedule jsonb not null default '{"days":[],"meals":[]}'::jsonb,
  usage_count integer not null default 0,
  last_used_at timestamptz,
  can_duplicate boolean not null default true,
  can_archive boolean not null default true,
  can_create_new_version boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((is_system_template = true and nutritionist_id is null) or (is_system_template = false and nutritionist_id is not null))
);

create index if not exists idx_diet_templates_owner_updated_at on public.diet_templates (nutritionist_id, updated_at desc);
create index if not exists idx_diet_templates_system_status on public.diet_templates (is_system_template, status);
create index if not exists idx_diet_templates_goal on public.diet_templates (goal);
create index if not exists idx_diet_templates_dietary_pattern on public.diet_templates (dietary_pattern);
create unique index if not exists idx_diet_templates_system_slug on public.diet_templates (lower(slug)) where is_system_template = true;
create unique index if not exists idx_diet_templates_owner_slug on public.diet_templates (nutritionist_id, lower(slug)) where nutritionist_id is not null;

alter table public.diet_templates enable row level security;

drop policy if exists "diet_templates_select" on public.diet_templates;
create policy "diet_templates_select" on public.diet_templates
  for select using (is_system_template = true or nutritionist_id = auth.uid());

drop policy if exists "diet_templates_insert_own" on public.diet_templates;
create policy "diet_templates_insert_own" on public.diet_templates
  for insert with check (
    nutritionist_id = auth.uid()
    and is_system_template = false
  );

drop policy if exists "diet_templates_update_own" on public.diet_templates;
create policy "diet_templates_update_own" on public.diet_templates
  for update using (
    nutritionist_id = auth.uid()
    and is_system_template = false
  );

drop policy if exists "diet_templates_delete_own" on public.diet_templates;
create policy "diet_templates_delete_own" on public.diet_templates
  for delete using (
    nutritionist_id = auth.uid()
    and is_system_template = false
  );

drop trigger if exists diet_templates_updated_at on public.diet_templates;
create trigger diet_templates_updated_at before update on public.diet_templates
  for each row execute function public.set_updated_at();

-- ─── DIET TEMPLATE VERSIONS ──────────────────────────────────────────────────
create table if not exists public.diet_template_versions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.diet_templates(id) on delete cascade,
  nutritionist_id uuid references auth.users(id) on delete cascade,
  version integer not null check (version > 0),
  change_summary text,
  snapshot jsonb not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (template_id, version)
);

create index if not exists idx_diet_template_versions_template_created_at
  on public.diet_template_versions (template_id, created_at desc);
create index if not exists idx_diet_template_versions_owner_created_at
  on public.diet_template_versions (nutritionist_id, created_at desc);

alter table public.diet_template_versions enable row level security;

drop policy if exists "diet_template_versions_select" on public.diet_template_versions;
create policy "diet_template_versions_select"
  on public.diet_template_versions
  for select using (
    exists (
      select 1
      from public.diet_templates t
      where t.id = diet_template_versions.template_id
        and (t.is_system_template = true or t.nutritionist_id = auth.uid())
    )
  );

drop policy if exists "diet_template_versions_insert_own" on public.diet_template_versions;
create policy "diet_template_versions_insert_own"
  on public.diet_template_versions
  for insert with check (
    exists (
      select 1
      from public.diet_templates t
      where t.id = diet_template_versions.template_id
        and t.is_system_template = false
        and t.nutritionist_id = auth.uid()
    )
  );

drop policy if exists "diet_template_versions_delete_own" on public.diet_template_versions;
create policy "diet_template_versions_delete_own"
  on public.diet_template_versions
  for delete using (
    exists (
      select 1
      from public.diet_templates t
      where t.id = diet_template_versions.template_id
        and t.is_system_template = false
        and t.nutritionist_id = auth.uid()
    )
  );

-- ─── SYSTEM TEMPLATE SEED ────────────────────────────────────────────────────
insert into public.diet_templates (
  id,
  nutritionist_id,
  name,
  slug,
  description,
  category,
  goal,
  tags,
  status,
  is_system_template,
  created_by,
  version,
  dietary_pattern,
  restrictions,
  allergens,
  foods_to_avoid,
  preferred_foods,
  professional_notes,
  patient_friendly_notes,
  daily_calories,
  protein_grams,
  carb_grams,
  fat_grams,
  protein_percent,
  carb_percent,
  fat_percent,
  fiber_target_grams,
  water_target_ml,
  meal_count_per_day,
  duration_days,
  hydration_plan,
  supplements,
  shopping_list,
  meal_prep_tips,
  adherence_tips,
  general_recommendations,
  schedule,
  usage_count,
  can_duplicate,
  can_archive,
  can_create_new_version
) values
(
  '6c3327cf-0322-4e1c-8dbf-195df11af6ec',
  null,
  'Balanced Weight Loss',
  'balanced-weight-loss',
  'Plano com deficit calorico moderado, cinco refeicoes e foco em aderencia sustentavel.',
  'weight-management',
  'weight_loss',
  array['weight-loss', 'balanced', 'high-adherence'],
  'active',
  true,
  null,
  1,
  'omnivore',
  array['low-added-sugar'],
  array['none'],
  array['ultra-processed snacks', 'sugary drinks'],
  array['leafy greens', 'lean proteins', 'whole grains'],
  'Ajustar deficit entre 10% e 18% conforme resposta semanal e sinais de fome.',
  'Priorize consistencia: siga o horario das refeicoes e use substituicoes planejadas.',
  1750,
  125,
  185,
  58,
  29,
  42,
  29,
  28,
  2600,
  5,
  28,
  'Meta diaria de 2.6L. Dividir em 6 blocos ao longo do dia.',
  array['Omega-3 1g com almoco', 'Vitamina D conforme avaliacao laboratorial'],
  array['Aveia', 'Iogurte natural', 'Frango desfiado', 'Arroz integral', 'Legumes congelados', 'Frutas da estacao'],
  array['Cozinhar proteinas para 3 dias', 'Fracionar lanches em porcoes individuais'],
  array['Planejar refeicoes da semana no domingo', 'Registrar saciedade apos refeicoes principais'],
  array['Dormir 7-8h para reduzir compulsao', 'Manter passos diarios acima de 7.000'],
  '{
    "durationDays": 28,
    "days": [],
    "meals": [
      {
        "name": "Cafe da manha",
        "timeLabel": "07:30",
        "instructions": "Priorizar proteina + carboidrato de baixo indice glicemico.",
        "items": [
          {
            "foodName": "Iogurte natural",
            "quantity": "170",
            "unit": "g",
            "householdMeasure": "1 pote",
            "preparationNotes": "Adicionar canela e chia.",
            "estimatedNutrition": { "kcal": 130, "protein": 12, "carbs": 9, "fat": 5 },
            "substitutions": ["Kefir natural 200ml", "Leite fermentado proteico 1 unidade"]
          },
          {
            "foodName": "Aveia em flocos",
            "quantity": "30",
            "unit": "g",
            "householdMeasure": "3 colheres de sopa",
            "preparationNotes": "Hidratar por 5 minutos.",
            "estimatedNutrition": { "kcal": 114, "protein": 4, "carbs": 19, "fat": 2 },
            "substitutions": ["Granola sem acucar 25g", "Farelo de aveia 25g"]
          }
        ]
      },
      {
        "name": "Almoco",
        "timeLabel": "12:30",
        "instructions": "Montar prato: 1/2 vegetais, 1/4 proteina, 1/4 carboidrato.",
        "items": [
          {
            "foodName": "Frango grelhado",
            "quantity": "140",
            "unit": "g",
            "householdMeasure": "1 filé medio",
            "preparationNotes": "Temperar com ervas e limao.",
            "estimatedNutrition": { "kcal": 231, "protein": 43, "carbs": 0, "fat": 5 },
            "substitutions": ["Peixe magro 160g", "Patinho moido 120g"]
          },
          {
            "foodName": "Arroz integral",
            "quantity": "120",
            "unit": "g",
            "householdMeasure": "4 colheres de sopa",
            "preparationNotes": "Cozido sem excesso de oleo.",
            "estimatedNutrition": { "kcal": 148, "protein": 3, "carbs": 31, "fat": 1 },
            "substitutions": ["Batata-doce cozida 160g", "Quinoa cozida 100g"]
          }
        ]
      },
      {
        "name": "Jantar",
        "timeLabel": "19:30",
        "instructions": "Repetir estrutura do almoco com porcao ligeiramente menor de carboidrato.",
        "items": [
          {
            "foodName": "Peixe assado",
            "quantity": "150",
            "unit": "g",
            "householdMeasure": "1 posta media",
            "preparationNotes": "Assar com legumes.",
            "estimatedNutrition": { "kcal": 210, "protein": 34, "carbs": 0, "fat": 8 },
            "substitutions": ["Frango grelhado 140g", "Tofu firme 200g"]
          }
        ]
      }
    ]
  }'::jsonb,
  0,
  true,
  false,
  false
),
(
  '32474517-0053-4f52-8a02-3c7f38df3d10',
  null,
  'High Protein Muscle Gain',
  'high-protein-muscle-gain',
  'Plano para hipertrofia com maior ingestao proteica e blocos pre e pos treino.',
  'performance',
  'muscle_gain',
  array['muscle-gain', 'high-protein', 'training'],
  'active',
  true,
  null,
  1,
  'omnivore',
  array['limited-alcohol'],
  array['none'],
  array['fried foods'],
  array['lean red meat', 'eggs', 'rice', 'banana'],
  'Reavaliar ganho de peso e circunferencias quinzenalmente para ajuste de carboidrato.',
  'Priorize refeicao pos treino nas duas horas seguintes ao exercicio.',
  2850,
  210,
  320,
  78,
  30,
  45,
  25,
  35,
  3500,
  6,
  35,
  'Meta diaria de 3.5L. Acrescentar 600ml durante treino.',
  array['Creatina 3-5g diaria', 'Whey protein quando necessario para bater meta'],
  array['Ovos', 'Frango', 'Patinho', 'Arroz branco', 'Batata inglesa', 'Banana', 'Iogurte'],
  array['Preparar carboidratos e proteinas em marmitas para 2 dias', 'Deixar lanches pre-treino porcionados'],
  array['Registrar desempenho no treino 3x por semana', 'Nao pular refeicao pos-treino'],
  array['Dormir 7h30+ para otimizar sintese proteica', 'Manter consumo de frutas e verduras diariamente'],
  '{
    "durationDays": 35,
    "days": [],
    "meals": [
      {
        "name": "Cafe da manha",
        "timeLabel": "07:00",
        "instructions": "Alta densidade nutricional e proteica.",
        "items": [
          {
            "foodName": "Ovos mexidos",
            "quantity": "3",
            "unit": "un",
            "householdMeasure": "3 ovos",
            "preparationNotes": "Preparar com pouco oleo.",
            "estimatedNutrition": { "kcal": 210, "protein": 18, "carbs": 1, "fat": 15 },
            "substitutions": ["Claras pasteurizadas 200ml + 1 ovo inteiro"]
          },
          {
            "foodName": "Pao integral",
            "quantity": "2",
            "unit": "fatias",
            "householdMeasure": "2 fatias",
            "preparationNotes": "Consumir com queijo branco.",
            "estimatedNutrition": { "kcal": 140, "protein": 6, "carbs": 24, "fat": 2 },
            "substitutions": ["Tapioca 80g", "Cuscuz 120g"]
          }
        ]
      },
      {
        "name": "Pre-treino",
        "timeLabel": "16:30",
        "instructions": "Combinar carboidrato de facil digestao e proteina leve.",
        "items": [
          {
            "foodName": "Banana",
            "quantity": "1",
            "unit": "un",
            "householdMeasure": "1 unidade media",
            "preparationNotes": "Opcional canela.",
            "estimatedNutrition": { "kcal": 90, "protein": 1, "carbs": 23, "fat": 0 },
            "substitutions": ["Maca 1 unidade", "Pao branco 1 fatia"]
          },
          {
            "foodName": "Iogurte grego light",
            "quantity": "170",
            "unit": "g",
            "householdMeasure": "1 pote",
            "preparationNotes": "Consumir 45 min antes do treino.",
            "estimatedNutrition": { "kcal": 110, "protein": 14, "carbs": 8, "fat": 2 },
            "substitutions": ["Whey protein 30g com agua"]
          }
        ]
      },
      {
        "name": "Pos-treino",
        "timeLabel": "19:30",
        "instructions": "Priorizar proteina de alto valor biologico + carboidrato.",
        "items": [
          {
            "foodName": "Frango desfiado",
            "quantity": "180",
            "unit": "g",
            "householdMeasure": "1 prato de sobremesa",
            "preparationNotes": "Temperar com sal moderado.",
            "estimatedNutrition": { "kcal": 297, "protein": 54, "carbs": 0, "fat": 7 },
            "substitutions": ["Patinho moido 160g", "Tilapia 220g"]
          },
          {
            "foodName": "Arroz branco",
            "quantity": "180",
            "unit": "g",
            "householdMeasure": "6 colheres de sopa",
            "preparationNotes": "Consumir junto da proteina.",
            "estimatedNutrition": { "kcal": 234, "protein": 4, "carbs": 50, "fat": 0 },
            "substitutions": ["Macarrao sem molho gorduroso 180g", "Batata inglesa cozida 240g"]
          }
        ]
      }
    ]
  }'::jsonb,
  0,
  true,
  false,
  false
),
(
  '11d97e2f-689f-4885-b8c3-fd95487ca8af',
  null,
  'Vegetarian Balanced Plan',
  'vegetarian-balanced-plan',
  'Plano vegetariano com macro distribuido e foco em fibras, saciedade e variedade.',
  'special-diet',
  'balanced_health',
  array['vegetarian', 'fiber-friendly', 'balanced'],
  'active',
  true,
  null,
  1,
  'vegetarian',
  array['ovo-lacto'],
  array['none'],
  array['processed vegetarian products'],
  array['legumes', 'tofu', 'lentils', 'whole grains'],
  'Garantir combinacao de leguminosas + cereais para perfil aminoacidico adequado.',
  'Inclua variedade de vegetais coloridos e mantenha hidratacao regular.',
  2100,
  105,
  275,
  65,
  20,
  52,
  28,
  36,
  2800,
  5,
  28,
  'Meta diaria de 2.8L com reforco entre refeicoes.',
  array['B12 conforme orientacao profissional', 'Omega-3 de algas quando indicado'],
  array['Lentilha', 'Grao-de-bico', 'Tofu', 'Iogurte natural', 'Arroz integral', 'Frutas', 'Sementes'],
  array['Deixar leguminosas de molho para melhorar digestao', 'Preparar pastas e pate vegetarianos para lanches'],
  array['Rotacionar fontes proteicas ao longo da semana', 'Montar prato com metade de vegetais'],
  array['Monitorar sinais gastrointestinais e ajustar fibra gradualmente', 'Combinar vitamina C com fontes de ferro vegetal'],
  '{
    "durationDays": 28,
    "days": [],
    "meals": [
      {
        "name": "Cafe da manha",
        "timeLabel": "08:00",
        "instructions": "Combinar proteina vegetal e carboidrato integral.",
        "items": [
          {
            "foodName": "Overnight oats",
            "quantity": "1",
            "unit": "pote",
            "householdMeasure": "1 pote medio",
            "preparationNotes": "Aveia + iogurte + frutas + chia.",
            "estimatedNutrition": { "kcal": 330, "protein": 17, "carbs": 48, "fat": 9 },
            "substitutions": ["Pao integral com pasta de grao-de-bico"]
          }
        ]
      },
      {
        "name": "Almoco",
        "timeLabel": "12:30",
        "instructions": "Base com grao integral, leguminosa e vegetais diversos.",
        "items": [
          {
            "foodName": "Lentilha cozida",
            "quantity": "160",
            "unit": "g",
            "householdMeasure": "1 concha cheia",
            "preparationNotes": "Temperar com alho e louro.",
            "estimatedNutrition": { "kcal": 185, "protein": 13, "carbs": 32, "fat": 1 },
            "substitutions": ["Feijao carioca 170g", "Grao-de-bico 150g"]
          },
          {
            "foodName": "Tofu grelhado",
            "quantity": "180",
            "unit": "g",
            "householdMeasure": "1 bloco pequeno",
            "preparationNotes": "Marinar com limao e ervas.",
            "estimatedNutrition": { "kcal": 216, "protein": 24, "carbs": 6, "fat": 12 },
            "substitutions": ["Omelete de 3 ovos", "Tempeh 150g"]
          }
        ]
      },
      {
        "name": "Jantar",
        "timeLabel": "19:00",
        "instructions": "Refeicao leve com boa quantidade de fibras.",
        "items": [
          {
            "foodName": "Sopa de legumes com quinoa",
            "quantity": "450",
            "unit": "ml",
            "householdMeasure": "1 prato fundo",
            "preparationNotes": "Adicionar azeite apenas ao final.",
            "estimatedNutrition": { "kcal": 280, "protein": 12, "carbs": 40, "fat": 8 },
            "substitutions": ["Bowl de salada + grao-de-bico + batata-doce"]
          }
        ]
      }
    ]
  }'::jsonb,
  0,
  true,
  false,
  false
)
on conflict (id) do update
set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  category = excluded.category,
  goal = excluded.goal,
  tags = excluded.tags,
  status = excluded.status,
  is_system_template = true,
  version = excluded.version,
  dietary_pattern = excluded.dietary_pattern,
  restrictions = excluded.restrictions,
  allergens = excluded.allergens,
  foods_to_avoid = excluded.foods_to_avoid,
  preferred_foods = excluded.preferred_foods,
  professional_notes = excluded.professional_notes,
  patient_friendly_notes = excluded.patient_friendly_notes,
  daily_calories = excluded.daily_calories,
  protein_grams = excluded.protein_grams,
  carb_grams = excluded.carb_grams,
  fat_grams = excluded.fat_grams,
  protein_percent = excluded.protein_percent,
  carb_percent = excluded.carb_percent,
  fat_percent = excluded.fat_percent,
  fiber_target_grams = excluded.fiber_target_grams,
  water_target_ml = excluded.water_target_ml,
  meal_count_per_day = excluded.meal_count_per_day,
  duration_days = excluded.duration_days,
  hydration_plan = excluded.hydration_plan,
  supplements = excluded.supplements,
  shopping_list = excluded.shopping_list,
  meal_prep_tips = excluded.meal_prep_tips,
  adherence_tips = excluded.adherence_tips,
  general_recommendations = excluded.general_recommendations,
  schedule = excluded.schedule,
  can_duplicate = excluded.can_duplicate,
  can_archive = excluded.can_archive,
  can_create_new_version = excluded.can_create_new_version,
  updated_at = now();

insert into public.diet_template_versions (
  template_id,
  nutritionist_id,
  version,
  change_summary,
  snapshot,
  created_by
)
select
  t.id,
  t.nutritionist_id,
  t.version,
  'Initial system version',
  jsonb_build_object(
    'id', t.id,
    'name', t.name,
    'slug', t.slug,
    'description', t.description,
    'category', t.category,
    'goal', t.goal,
    'tags', t.tags,
    'status', t.status,
    'isSystemTemplate', t.is_system_template,
    'version', t.version,
    'dietaryPattern', t.dietary_pattern,
    'restrictions', t.restrictions,
    'allergens', t.allergens,
    'foodsToAvoid', t.foods_to_avoid,
    'preferredFoods', t.preferred_foods,
    'professionalNotes', t.professional_notes,
    'patientFriendlyNotes', t.patient_friendly_notes,
    'dailyCalories', t.daily_calories,
    'proteinGrams', t.protein_grams,
    'carbGrams', t.carb_grams,
    'fatGrams', t.fat_grams,
    'proteinPercent', t.protein_percent,
    'carbPercent', t.carb_percent,
    'fatPercent', t.fat_percent,
    'fiberTargetGrams', t.fiber_target_grams,
    'waterTargetMl', t.water_target_ml,
    'mealCountPerDay', t.meal_count_per_day,
    'durationDays', t.duration_days,
    'hydrationPlan', t.hydration_plan,
    'supplements', t.supplements,
    'shoppingList', t.shopping_list,
    'mealPrepTips', t.meal_prep_tips,
    'adherenceTips', t.adherence_tips,
    'generalRecommendations', t.general_recommendations,
    'schedule', t.schedule
  ),
  null
from public.diet_templates t
where t.id in (
  '6c3327cf-0322-4e1c-8dbf-195df11af6ec',
  '32474517-0053-4f52-8a02-3c7f38df3d10',
  '11d97e2f-689f-4885-b8c3-fd95487ca8af'
)
on conflict (template_id, version) do nothing;
