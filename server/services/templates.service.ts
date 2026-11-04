import { createClient } from "@/lib/supabase/server"
import { forbidden } from "@/server/core/errors"
import { requireRole, requireViewer } from "@/server/core/auth"
import { parseWithSchema } from "@/server/core/validation"
import {
  archiveTemplateSchema,
  createTemplateSchema,
  createTemplateVersionSchema,
  duplicateTemplateSchema,
  templateDaySchema,
  templateIdSchema,
  templateMealSchema,
  updateTemplateSchema,
  type TemplateEditorInput,
} from "@/server/schemas/template.schemas"
import {
  createTemplateRecord,
  createTemplateVersionRecord,
  getTemplateById,
  incrementTemplateUsage,
  listMyTemplates,
  listSystemTemplates,
  listTemplateVersions,
  updateTemplateRecord,
  type TemplateInsertPayload,
  type TemplateRecord,
} from "@/server/repositories/templates.repository"

export interface TemplateSummary {
  id: string
  name: string
  slug: string
  description: string | null
  category: string
  goal: string | null
  tags: string[]
  status: "draft" | "active" | "archived"
  isSystemTemplate: boolean
  version: number
  dietaryPattern: string | null
  dailyCalories: number | null
  proteinGrams: number | null
  carbGrams: number | null
  fatGrams: number | null
  mealCountPerDay: number | null
  usageCount: number
  lastUsedAt: string | null
  updatedAt: string
  createdAt: string
  canDuplicate: boolean
  canArchive: boolean
  canCreateNewVersion: boolean
}

export interface TemplateDetails extends TemplateSummary {
  createdBy: string | null
  nutritionistId: string | null
  restrictions: string[]
  allergens: string[]
  foodsToAvoid: string[]
  preferredFoods: string[]
  professionalNotes: string | null
  patientFriendlyNotes: string | null
  proteinPercent: number | null
  carbPercent: number | null
  fatPercent: number | null
  fiberTargetGrams: number | null
  waterTargetMl: number | null
  durationDays: number
  days: Array<{ label: string; meals: TemplateMeal[] }>
  meals: TemplateMeal[]
  hydrationPlan: string | null
  supplements: string[]
  shoppingList: string[]
  mealPrepTips: string[]
  adherenceTips: string[]
  generalRecommendations: string[]
}

export interface TemplateMeal {
  name: string
  timeLabel: string
  instructions: string
  items: Array<{
    foodName: string
    quantity: string
    unit: string
    householdMeasure: string
    preparationNotes: string
    estimatedNutrition: {
      kcal: number | null
      protein: number | null
      carbs: number | null
      fat: number | null
    }
    substitutions: string[]
  }>
}

export interface TemplateVersionSummary {
  id: string
  templateId: string
  version: number
  changeSummary: string | null
  createdAt: string
}

function slugify(input: string) {
  const base = input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")

  return base.slice(0, 80) || "template"
}

function normalizeText(value: string | undefined | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeMeals(schedule: unknown): TemplateMeal[] {
  const rawMeals =
    typeof schedule === "object" && schedule !== null && Array.isArray((schedule as { meals?: unknown }).meals)
      ? (schedule as { meals: unknown[] }).meals
      : []

  return rawMeals
    .map((meal) => {
      const parsed = templateMealSchema.safeParse(meal)
      if (!parsed.success) return null
      return {
        name: parsed.data.name,
        timeLabel: parsed.data.timeLabel || "",
        instructions: parsed.data.instructions || "",
        items: parsed.data.items.map((item) => ({
          foodName: item.foodName,
          quantity: item.quantity || "",
          unit: item.unit || "",
          householdMeasure: item.householdMeasure || "",
          preparationNotes: item.preparationNotes || "",
          estimatedNutrition: {
            kcal: toNumber(item.estimatedNutrition?.kcal),
            protein: toNumber(item.estimatedNutrition?.protein),
            carbs: toNumber(item.estimatedNutrition?.carbs),
            fat: toNumber(item.estimatedNutrition?.fat),
          },
          substitutions: item.substitutions ?? [],
        })),
      } satisfies TemplateMeal
    })
    .filter((meal): meal is TemplateMeal => meal !== null)
}

function normalizeDays(schedule: unknown): Array<{ label: string; meals: TemplateMeal[] }> {
  const rawDays =
    typeof schedule === "object" && schedule !== null && Array.isArray((schedule as { days?: unknown }).days)
      ? (schedule as { days: unknown[] }).days
      : []

  return rawDays
    .map((day) => {
      const parsed = templateDaySchema.safeParse(day)
      if (!parsed.success) return null
      return {
        label: parsed.data.label,
        meals: parsed.data.meals.map((meal) => ({
          name: meal.name,
          timeLabel: meal.timeLabel || "",
          instructions: meal.instructions || "",
          items: meal.items.map((item) => ({
            foodName: item.foodName,
            quantity: item.quantity || "",
            unit: item.unit || "",
            householdMeasure: item.householdMeasure || "",
            preparationNotes: item.preparationNotes || "",
            estimatedNutrition: {
              kcal: toNumber(item.estimatedNutrition?.kcal),
              protein: toNumber(item.estimatedNutrition?.protein),
              carbs: toNumber(item.estimatedNutrition?.carbs),
              fat: toNumber(item.estimatedNutrition?.fat),
            },
            substitutions: item.substitutions ?? [],
          })),
        })),
      }
    })
    .filter((day): day is { label: string; meals: TemplateMeal[] } => day !== null)
}

function toSummary(record: TemplateRecord): TemplateSummary {
  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    description: record.description,
    category: record.category,
    goal: record.goal,
    tags: normalizeArray(record.tags),
    status: record.status,
    isSystemTemplate: record.is_system_template,
    version: record.version,
    dietaryPattern: record.dietary_pattern,
    dailyCalories: toNumber(record.daily_calories),
    proteinGrams: toNumber(record.protein_grams),
    carbGrams: toNumber(record.carb_grams),
    fatGrams: toNumber(record.fat_grams),
    mealCountPerDay: toNumber(record.meal_count_per_day),
    usageCount: Number(record.usage_count ?? 0),
    lastUsedAt: record.last_used_at,
    updatedAt: record.updated_at,
    createdAt: record.created_at,
    canDuplicate: record.can_duplicate,
    canArchive: record.can_archive,
    canCreateNewVersion: record.can_create_new_version,
  }
}

function toDetails(record: TemplateRecord): TemplateDetails {
  const summary = toSummary(record)
  return {
    ...summary,
    createdBy: record.created_by,
    nutritionistId: record.nutritionist_id,
    restrictions: normalizeArray(record.restrictions),
    allergens: normalizeArray(record.allergens),
    foodsToAvoid: normalizeArray(record.foods_to_avoid),
    preferredFoods: normalizeArray(record.preferred_foods),
    professionalNotes: record.professional_notes,
    patientFriendlyNotes: record.patient_friendly_notes,
    proteinPercent: toNumber(record.protein_percent),
    carbPercent: toNumber(record.carb_percent),
    fatPercent: toNumber(record.fat_percent),
    fiberTargetGrams: toNumber(record.fiber_target_grams),
    waterTargetMl: toNumber(record.water_target_ml),
    durationDays: Number(record.duration_days ?? 7),
    days: normalizeDays(record.schedule),
    meals: normalizeMeals(record.schedule),
    hydrationPlan: record.hydration_plan,
    supplements: normalizeArray(record.supplements),
    shoppingList: normalizeArray(record.shopping_list),
    mealPrepTips: normalizeArray(record.meal_prep_tips),
    adherenceTips: normalizeArray(record.adherence_tips),
    generalRecommendations: normalizeArray(record.general_recommendations),
  }
}

function snapshotFromRecord(record: TemplateRecord): Record<string, unknown> {
  const details = toDetails(record)
  return {
    id: details.id,
    name: details.name,
    slug: details.slug,
    description: details.description,
    category: details.category,
    goal: details.goal,
    tags: details.tags,
    status: details.status,
    isSystemTemplate: details.isSystemTemplate,
    version: details.version,
    dietaryPattern: details.dietaryPattern,
    restrictions: details.restrictions,
    allergens: details.allergens,
    foodsToAvoid: details.foodsToAvoid,
    preferredFoods: details.preferredFoods,
    professionalNotes: details.professionalNotes,
    patientFriendlyNotes: details.patientFriendlyNotes,
    dailyCalories: details.dailyCalories,
    proteinGrams: details.proteinGrams,
    carbGrams: details.carbGrams,
    fatGrams: details.fatGrams,
    proteinPercent: details.proteinPercent,
    carbPercent: details.carbPercent,
    fatPercent: details.fatPercent,
    fiberTargetGrams: details.fiberTargetGrams,
    waterTargetMl: details.waterTargetMl,
    mealCountPerDay: details.mealCountPerDay,
    durationDays: details.durationDays,
    days: details.days,
    meals: details.meals,
    hydrationPlan: details.hydrationPlan,
    supplements: details.supplements,
    shoppingList: details.shoppingList,
    mealPrepTips: details.mealPrepTips,
    adherenceTips: details.adherenceTips,
    generalRecommendations: details.generalRecommendations,
  }
}

function toSchedule(input: TemplateEditorInput) {
  return {
    durationDays: input.durationDays,
    days: input.days,
    meals: input.meals,
  }
}

function normalizeTemplateInput(input: {
  name: string
  category: string
  [key: string]: unknown
}): TemplateEditorInput {
  const meals = Array.isArray(input.meals)
    ? input.meals.map((meal) => {
        const typedMeal = meal as Record<string, unknown>
        const items = Array.isArray(typedMeal.items)
          ? typedMeal.items.map((item) => {
              const typedItem = item as Record<string, unknown>
              const estimated = (typedItem.estimatedNutrition ?? {}) as Record<string, unknown>

              return {
                foodName: String(typedItem.foodName ?? ""),
                quantity: String(typedItem.quantity ?? ""),
                unit: String(typedItem.unit ?? ""),
                householdMeasure: String(typedItem.householdMeasure ?? ""),
                preparationNotes: String(typedItem.preparationNotes ?? ""),
                estimatedNutrition: {
                  kcal: toNumber(estimated.kcal) ?? undefined,
                  protein: toNumber(estimated.protein) ?? undefined,
                  carbs: toNumber(estimated.carbs) ?? undefined,
                  fat: toNumber(estimated.fat) ?? undefined,
                },
                substitutions: normalizeArray(typedItem.substitutions),
              }
            })
          : []

        return {
          name: String(typedMeal.name ?? ""),
          timeLabel: String(typedMeal.timeLabel ?? ""),
          instructions: String(typedMeal.instructions ?? ""),
          items,
        }
      })
    : []

  const days = Array.isArray(input.days)
    ? input.days.map((day) => {
        const typedDay = day as Record<string, unknown>
        return {
          label: String(typedDay.label ?? ""),
          meals,
        }
      })
    : []

  return {
    name: input.name,
    slug: String(input.slug ?? ""),
    description: String(input.description ?? ""),
    category: input.category,
    goal: String(input.goal ?? ""),
    tags: normalizeArray(input.tags),
    status: (input.status as TemplateEditorInput["status"]) ?? "draft",
    dietaryPattern: String(input.dietaryPattern ?? ""),
    restrictions: normalizeArray(input.restrictions),
    allergens: normalizeArray(input.allergens),
    foodsToAvoid: normalizeArray(input.foodsToAvoid),
    preferredFoods: normalizeArray(input.preferredFoods),
    professionalNotes: String(input.professionalNotes ?? ""),
    patientFriendlyNotes: String(input.patientFriendlyNotes ?? ""),
    dailyCalories: toNumber(input.dailyCalories) ?? undefined,
    proteinGrams: toNumber(input.proteinGrams) ?? undefined,
    carbGrams: toNumber(input.carbGrams) ?? undefined,
    fatGrams: toNumber(input.fatGrams) ?? undefined,
    proteinPercent: toNumber(input.proteinPercent) ?? undefined,
    carbPercent: toNumber(input.carbPercent) ?? undefined,
    fatPercent: toNumber(input.fatPercent) ?? undefined,
    fiberTargetGrams: toNumber(input.fiberTargetGrams) ?? undefined,
    waterTargetMl: toNumber(input.waterTargetMl) ?? undefined,
    mealCountPerDay: toNumber(input.mealCountPerDay) ?? undefined,
    durationDays: toNumber(input.durationDays) ?? 7,
    days,
    meals,
    hydrationPlan: String(input.hydrationPlan ?? ""),
    supplements: normalizeArray(input.supplements),
    shoppingList: normalizeArray(input.shoppingList),
    mealPrepTips: normalizeArray(input.mealPrepTips),
    adherenceTips: normalizeArray(input.adherenceTips),
    generalRecommendations: normalizeArray(input.generalRecommendations),
  }
}

function toPayload(input: TemplateEditorInput, viewerId: string, slug: string, version: number): TemplateInsertPayload {
  const mealCount = toNumber(input.mealCountPerDay)

  return {
    nutritionist_id: viewerId,
    name: input.name,
    slug,
    description: normalizeText(input.description),
    category: input.category,
    goal: normalizeText(input.goal),
    tags: input.tags,
    status: input.status,
    is_system_template: false,
    created_by: viewerId,
    version,
    dietary_pattern: normalizeText(input.dietaryPattern),
    restrictions: input.restrictions,
    allergens: input.allergens,
    foods_to_avoid: input.foodsToAvoid,
    preferred_foods: input.preferredFoods,
    professional_notes: normalizeText(input.professionalNotes),
    patient_friendly_notes: normalizeText(input.patientFriendlyNotes),
    daily_calories: toNumber(input.dailyCalories),
    protein_grams: toNumber(input.proteinGrams),
    carb_grams: toNumber(input.carbGrams),
    fat_grams: toNumber(input.fatGrams),
    protein_percent: toNumber(input.proteinPercent),
    carb_percent: toNumber(input.carbPercent),
    fat_percent: toNumber(input.fatPercent),
    fiber_target_grams: toNumber(input.fiberTargetGrams),
    water_target_ml: toNumber(input.waterTargetMl),
    meal_count_per_day: mealCount ?? (input.meals.length > 0 ? input.meals.length : null),
    duration_days: input.durationDays,
    hydration_plan: normalizeText(input.hydrationPlan),
    supplements: input.supplements,
    shopping_list: input.shoppingList,
    meal_prep_tips: input.mealPrepTips,
    adherence_tips: input.adherenceTips,
    general_recommendations: input.generalRecommendations,
    schedule: toSchedule(input),
    can_duplicate: true,
    can_archive: true,
    can_create_new_version: true,
  }
}

async function ensureEditableTemplate(record: TemplateRecord, viewerId: string) {
  if (record.is_system_template) {
    throw forbidden("System templates cannot be edited directly")
  }

  if (record.nutritionist_id !== viewerId) {
    throw forbidden("You do not have access to edit this template")
  }
}

async function nextSlug(base: string, viewerId: string) {
  const supabase = await createClient()
  const mine = await listMyTemplates(supabase, viewerId)
  const taken = new Set(mine.map((template) => template.slug.toLowerCase()))

  if (!taken.has(base.toLowerCase())) {
    return base
  }

  let index = 2
  while (index < 1000) {
    const candidate = `${base}-${index}`
    if (!taken.has(candidate.toLowerCase())) {
      return candidate
    }
    index += 1
  }

  return `${base}-${Date.now().toString().slice(-5)}`
}

function mapTemplateRowToRecord(r: {
  id: string
  name: string
  slug: string
  description: string | null
  category: string
  goal: string | null
  tags: string[] | null
  status: string
  isSystemTemplate: boolean
  version: number
  dietaryPattern: string | null
  dailyCalories: number | null
  proteinGrams: string | null
  carbGrams: string | null
  fatGrams: string | null
  mealCountPerDay: number | null
  usageCount: number
  lastUsedAt: Date | null
  updatedAt: Date
  createdAt: Date
  canDuplicate: boolean
  canArchive: boolean
  canCreateNewVersion: boolean
  nutritionistId?: string | null
  createdBy?: string | null
}): TemplateRecord {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description,
    category: r.category,
    goal: r.goal,
    tags: r.tags ?? [],
    status: r.status,
    is_system_template: r.isSystemTemplate,
    version: r.version,
    dietary_pattern: r.dietaryPattern,
    daily_calories: r.dailyCalories,
    protein_grams: r.proteinGrams,
    carb_grams: r.carbGrams,
    fat_grams: r.fatGrams,
    meal_count_per_day: r.mealCountPerDay,
    usage_count: r.usageCount,
    last_used_at: r.lastUsedAt?.toISOString?.() ?? (r.lastUsedAt as unknown as string),
    updated_at: r.updatedAt?.toISOString?.() ?? (r.updatedAt as unknown as string),
    created_at: r.createdAt?.toISOString?.() ?? (r.createdAt as unknown as string),
    can_duplicate: r.canDuplicate,
    can_archive: r.canArchive,
    can_create_new_version: r.canCreateNewVersion,
    nutritionist_id: r.nutritionistId ?? null,
    created_by: r.createdBy ?? null,
  } as TemplateRecord
}

export async function listTemplatesCatalog() {
  const viewer = await requireViewer()
  const { getDb } = await import("@/lib/db")
  const { dietTemplates } = await import("@/lib/db/schema")
  const { eq, desc, asc } = await import("drizzle-orm")

  const db = getDb()
  const [systemRows, myRows] = await Promise.all([
    db
      .select()
      .from(dietTemplates)
      .where(eq(dietTemplates.isSystemTemplate, true))
      .orderBy(asc(dietTemplates.name)),
    db
      .select()
      .from(dietTemplates)
      .where(eq(dietTemplates.nutritionistId, viewer.userId))
      .orderBy(desc(dietTemplates.updatedAt)),
  ])

  return {
    systemTemplates: systemRows.map((r) => toSummary(mapTemplateRowToRecord(r))),
    myTemplates: myRows.map((r) => toSummary(mapTemplateRowToRecord(r))),
  }
}

export async function listTemplatesForDietPlan() {
  const catalog = await listTemplatesCatalog()
  return [...catalog.systemTemplates, ...catalog.myTemplates].filter(
    (template) => template.status !== "archived",
  )
}

export async function getTemplate(templateId: string) {
  const parsedTemplateId = parseWithSchema(templateIdSchema, templateId)
  await requireViewer()

  const { getDb } = await import("@/lib/db")
  const { dietTemplates } = await import("@/lib/db/schema")
  const { eq } = await import("drizzle-orm")

  const db = getDb()
  const [row] = await db
    .select()
    .from(dietTemplates)
    .where(eq(dietTemplates.id, parsedTemplateId))
    .limit(1)

  if (!row) {
    throw new Error("Template não encontrado.")
  }

  const record = {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    category: row.category,
    goal: row.goal,
    tags: row.tags ?? [],
    status: row.status,
    is_system_template: row.isSystemTemplate,
    version: row.version,
    dietary_pattern: row.dietaryPattern,
    daily_calories: row.dailyCalories,
    protein_grams: row.proteinGrams,
    carb_grams: row.carbGrams,
    fat_grams: row.fatGrams,
    meal_count_per_day: row.mealCountPerDay,
    usage_count: row.usageCount,
    last_used_at: row.lastUsedAt?.toISOString?.() ?? null,
    updated_at: row.updatedAt?.toISOString?.() ?? row.updatedAt,
    created_at: row.createdAt?.toISOString?.() ?? row.createdAt,
    can_duplicate: row.canDuplicate,
    can_archive: row.canArchive,
    can_create_new_version: row.canCreateNewVersion,
    nutritionist_id: row.nutritionistId ?? null,
    created_by: row.createdBy ?? null,
    restrictions: row.restrictions ?? [],
    allergens: row.allergens ?? [],
    foods_to_avoid: row.foodsToAvoid ?? [],
    preferred_foods: row.preferredFoods ?? [],
    professional_notes: row.professionalNotes,
    patient_friendly_notes: row.patientFriendlyNotes,
    protein_percent: row.proteinPercent,
    carb_percent: row.carbPercent,
    fat_percent: row.fatPercent,
    fiber_target_grams: row.fiberTargetGrams,
    water_target_ml: row.waterTargetMl,
    duration_days: row.durationDays ?? 7,
    hydration_plan: row.hydrationPlan,
    supplements: row.supplements ?? [],
    shopping_list: row.shoppingList ?? [],
    meal_prep_tips: row.mealPrepTips ?? [],
    adherence_tips: row.adherenceTips ?? [],
    general_recommendations: row.generalRecommendations ?? [],
    schedule: row.schedule ?? { days: [], meals: [] },
  } as TemplateRecord

  return {
    template: toDetails(record),
    versions: [] as TemplateVersionSummary[],
  }
}

export async function createTemplate(input: TemplateEditorInput) {
  const viewer = await requireRole(["nutritionist", "admin"])
  const supabase = await createClient()
  const parsed = parseWithSchema(createTemplateSchema, input)
  const normalized = normalizeTemplateInput(parsed)

  const baseSlug = slugify(normalized.slug || normalized.name)
  const uniqueSlug = await nextSlug(baseSlug, viewer.userId)

  const created = await createTemplateRecord(supabase, toPayload(normalized, viewer.userId, uniqueSlug, 1))

  await createTemplateVersionRecord(supabase, {
    template_id: created.id,
    nutritionist_id: viewer.userId,
    version: 1,
    change_summary: "Initial version",
    snapshot: snapshotFromRecord(created),
    created_by: viewer.userId,
  })

  return toDetails(created)
}

export async function updateTemplate(input: TemplateEditorInput & { id: string; createNewVersion?: boolean; changeSummary?: string }) {
  const viewer = await requireRole(["nutritionist", "admin"])
  const supabase = await createClient()
  const parsed = parseWithSchema(updateTemplateSchema, input)
  const normalized = normalizeTemplateInput(parsed)

  const existing = await getTemplateById(supabase, parsed.id)
  await ensureEditableTemplate(existing, viewer.userId)

  const selectedSlug = normalized.slug || existing.slug
  const baseSlug = slugify(selectedSlug)
  const finalSlug =
    selectedSlug === existing.slug
      ? existing.slug
      : await nextSlug(baseSlug, viewer.userId)

  const targetVersion = parsed.createNewVersion ? existing.version + 1 : existing.version

  const updated = await updateTemplateRecord(
    supabase,
    viewer.userId,
    parsed.id,
    toPayload(normalized, viewer.userId, finalSlug, targetVersion),
  )

  if (parsed.createNewVersion) {
    await createTemplateVersionRecord(supabase, {
      template_id: updated.id,
      nutritionist_id: viewer.userId,
      version: updated.version,
      change_summary: normalizeText(parsed.changeSummary) || "New template version",
      snapshot: snapshotFromRecord(updated),
      created_by: viewer.userId,
    })
  }

  return toDetails(updated)
}

export async function duplicateTemplate(templateId: string) {
  const viewer = await requireRole(["nutritionist", "admin"])
  const supabase = await createClient()
  const parsed = parseWithSchema(duplicateTemplateSchema, { templateId })

  const source = await getTemplateById(supabase, parsed.templateId)

  if (!source.can_duplicate) {
    throw forbidden("This template cannot be duplicated")
  }

  const sourceDetails = toDetails(source)
  const parsedInput = parseWithSchema(createTemplateSchema, {
    ...sourceDetails,
    name: `${source.name} (Copy)`,
    slug: `${source.slug}-copy`,
    status: "draft",
  })
  const normalized = normalizeTemplateInput(parsedInput)

  const uniqueSlug = await nextSlug(slugify(normalized.slug || normalized.name), viewer.userId)
  const created = await createTemplateRecord(
    supabase,
    toPayload(normalized, viewer.userId, uniqueSlug, 1),
  )

  await createTemplateVersionRecord(supabase, {
    template_id: created.id,
    nutritionist_id: viewer.userId,
    version: 1,
    change_summary: `Duplicated from ${source.name}`,
    snapshot: snapshotFromRecord(created),
    created_by: viewer.userId,
  })

  return toDetails(created)
}

export async function setTemplateArchived(templateId: string, archived: boolean) {
  const viewer = await requireRole(["nutritionist", "admin"])
  const supabase = await createClient()
  const parsed = parseWithSchema(archiveTemplateSchema, { templateId, archived })

  const existing = await getTemplateById(supabase, parsed.templateId)
  await ensureEditableTemplate(existing, viewer.userId)

  if (!existing.can_archive) {
    throw forbidden("This template cannot be archived")
  }

  const updated = await updateTemplateRecord(supabase, viewer.userId, existing.id, {
    status: archived ? "archived" : "draft",
  })

  return toDetails(updated)
}

export async function createNewTemplateVersion(templateId: string, changeSummary?: string) {
  const viewer = await requireRole(["nutritionist", "admin"])
  const supabase = await createClient()
  const parsed = parseWithSchema(createTemplateVersionSchema, { templateId, changeSummary })

  const existing = await getTemplateById(supabase, parsed.templateId)
  await ensureEditableTemplate(existing, viewer.userId)

  if (!existing.can_create_new_version) {
    throw forbidden("This template cannot create a new version")
  }

  const updated = await updateTemplateRecord(supabase, viewer.userId, existing.id, {
    version: existing.version + 1,
  })

  await createTemplateVersionRecord(supabase, {
    template_id: updated.id,
    nutritionist_id: viewer.userId,
    version: updated.version,
    change_summary: normalizeText(parsed.changeSummary) || "New version checkpoint",
    snapshot: snapshotFromRecord(updated),
    created_by: viewer.userId,
  })

  return toDetails(updated)
}

export async function markTemplateAsUsed(templateId: string) {
  const parsedTemplateId = parseWithSchema(templateIdSchema, templateId)
  const viewer = await requireViewer()
  const supabase = await createClient()
  const existing = await getTemplateById(supabase, parsedTemplateId)

  if (existing.nutritionist_id !== viewer.userId) {
    return
  }

  await incrementTemplateUsage(supabase, parsedTemplateId)
}

export async function getTemplateForDietPlan(templateId: string) {
  const { template } = await getTemplate(templateId)
  return template
}
