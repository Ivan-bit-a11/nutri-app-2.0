import { requireRole, requireViewer } from "@/server/core/auth"
import { formDataToObject, parseWithSchema } from "@/server/core/validation"
import {
  aiDraftRequestSchema,
  createAppointmentSchema,
  createAssessmentSchema,
  createDietPlanSchema,
  updateDietPlanSchema,
  type AiDraftRequestInput,
} from "@/server/schemas/clinical.schemas"
import {
  createAppointmentRecord,
  createAiDraft,
  createAiDraftVersion,
  createAssessmentRecord,
  createDietPlanWithMeals,
  findAiDraft,
  getDashboardCounts,
  getDietPlanById,
  listAppointmentsByTenant,
  listAssessmentsByPatient,
  listAssessmentsByTenant,
  listDietPlansByTenant,
  replaceDietPlanWithMeals,
  toggleDietPlanActiveState,
  updateAiDraft,
  deleteDietPlan,
} from "@/server/repositories/clinical.repository"
import { getPatientById } from "@/server/repositories/patients.repository"
import { getTemplateForDietPlan, markTemplateAsUsed } from "@/server/services/templates.service"
import { z } from "zod"

const idSchema = z.string().uuid()

function parseIntOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.round(parsed) : null
}

function parseFloatOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function toIsoDateTime(value: string): string {
  return new Date(value).toISOString()
}

function parseTemplateQuantity(value: string): number {
  const parsed = Number(String(value ?? "").replace(",", "."))
  if (!Number.isFinite(parsed) || parsed <= 0) return 1
  return parsed
}

export async function createAssessmentFromForm(patientId: string, formData: FormData) {
  const parsedPatientId = parseWithSchema(idSchema, patientId)
  const viewer = await requireRole(["nutritionist", "admin"])

  await getPatientById(viewer.userId, parsedPatientId)

  const input = parseWithSchema(createAssessmentSchema, {
    ...formDataToObject(formData),
    patientId: parsedPatientId,
  })

  await createAssessmentRecord({
    patient_id: input.patientId,
    nutritionist_id: viewer.userId,
    assessed_at: input.assessedAt || new Date().toISOString().split("T")[0],
    weight_kg: parseFloatOrNull(input.weight),
    height_cm: parseFloatOrNull(input.height),
    bmi: parseFloatOrNull(input.bmi),
    body_fat_pct: parseFloatOrNull(input.bodyFat),
    fat_mass_kg: parseFloatOrNull(input.fatMass),
    lean_mass_kg: parseFloatOrNull(input.leanMass),
    waist_cm: parseFloatOrNull(input.waist),
    hip_cm: parseFloatOrNull(input.hip),
    neck_cm: parseFloatOrNull(input.neck),
    chest_cm: parseFloatOrNull(input.chest),
    abdomen_cm: parseFloatOrNull(input.abdomen),
    thigh_cm: parseFloatOrNull(input.thigh),
    triceps_mm: parseFloatOrNull(input.triceps),
    subscapular_mm: parseFloatOrNull(input.subscapular),
    suprailiac_mm: parseFloatOrNull(input.suprailiac),
    notes: normalizeText(input.notes),
  })
}

export async function listAssessments() {
  const viewer = await requireViewer()
  return listAssessmentsByTenant(viewer.userId)
}

export async function listAssessmentsForPatient(patientId: string) {
  const parsedPatientId = parseWithSchema(idSchema, patientId)
  const viewer = await requireViewer()
  await getPatientById(viewer.userId, parsedPatientId)
  return listAssessmentsByPatient(viewer.userId, parsedPatientId)
}

export async function createDietPlanFromForm(patientId: string, formData: FormData) {
  const parsedPatientId = parseWithSchema(idSchema, patientId)
  const viewer = await requireRole(["nutritionist", "admin"])
  await getPatientById(viewer.userId, parsedPatientId)

  const templateIdRaw = formData.get("templateId")
  const templateId = typeof templateIdRaw === "string" && templateIdRaw.trim().length > 0 ? templateIdRaw : null
  const selectedTemplate = templateId ? await getTemplateForDietPlan(templateId) : null

  const titleValue = String(formData.get("title") ?? "").trim() || selectedTemplate?.name || ""
  const objectiveValue =
    normalizeText(String(formData.get("description") ?? formData.get("objective") ?? "")) ||
    normalizeText(selectedTemplate?.goal) ||
    normalizeText(selectedTemplate?.description)
  const notesValue =
    normalizeText(String(formData.get("notes") ?? "")) ||
    normalizeText(selectedTemplate?.professionalNotes) ||
    normalizeText(selectedTemplate?.patientFriendlyNotes)

  const dailyKcalValue =
    parseIntOrNull(formData.get("dailyKcal")) ??
    (selectedTemplate?.dailyCalories != null ? Math.round(selectedTemplate.dailyCalories) : null)
  const proteinValue =
    parseIntOrNull(formData.get("protein")) ??
    (selectedTemplate?.proteinGrams != null ? Math.round(selectedTemplate.proteinGrams) : null)
  const carbsValue =
    parseIntOrNull(formData.get("carbs")) ??
    (selectedTemplate?.carbGrams != null ? Math.round(selectedTemplate.carbGrams) : null)
  const fatValue =
    parseIntOrNull(formData.get("fat")) ??
    (selectedTemplate?.fatGrams != null ? Math.round(selectedTemplate.fatGrams) : null)

  const mealsFromTemplate = (selectedTemplate?.meals ?? []).map((meal) => ({
    name: meal.name || "Meal",
    time: meal.timeLabel || "",
    notes: meal.instructions || "",
    items:
      meal.items.length > 0
        ? meal.items.map((item) => ({
            food: item.foodName || "Item",
            qty: parseTemplateQuantity(item.quantity),
            unit: item.unit || "portion",
            kcal: item.estimatedNutrition.kcal ?? 0,
            protein: item.estimatedNutrition.protein ?? 0,
            carbs: item.estimatedNutrition.carbs ?? 0,
            fat: item.estimatedNutrition.fat ?? 0,
            notes: normalizeText([item.preparationNotes, ...item.substitutions].filter(Boolean).join(" | ")) || undefined,
          }))
        : [
            {
              food: meal.name || "Meal guidance",
              qty: 1,
              unit: "portion",
              kcal: 0,
              protein: 0,
              carbs: 0,
              fat: 0,
              notes: normalizeText(meal.instructions) || undefined,
            },
          ],
  }))

  const input = parseWithSchema(createDietPlanSchema, {
    patientId: parsedPatientId,
    title: titleValue,
    objective: objectiveValue ?? undefined,
    notes: notesValue ?? undefined,
    meals:
      mealsFromTemplate.length > 0
        ? mealsFromTemplate
        : [
            {
              name: "General",
              time: "",
              items: [
                {
                  food: "Plan Summary",
                  qty: 1,
                  unit: "unit",
                  kcal: dailyKcalValue ?? 0,
                  protein: proteinValue ?? 0,
                  carbs: carbsValue ?? 0,
                  fat: fatValue ?? 0,
                },
              ],
            },
          ],
  })

  const created = await createDietPlanWithMeals(
    {
      patient_id: input.patientId,
      nutritionist_id: viewer.userId,
      title: input.title,
      description: normalizeText(input.objective) ?? objectiveValue,
      notes: normalizeText(input.notes) ?? notesValue,
      daily_kcal: dailyKcalValue,
      protein_g: proteinValue,
      carbs_g: carbsValue,
      fat_g: fatValue,
      is_active: true,
    },
    input.meals.map((meal, mealIndex) => ({
      name: meal.name,
      time_of_day: meal.time || null,
      sort_order: mealIndex,
      items: meal.items.map((item, itemIndex) => ({
        food_name: item.food,
        quantity: `${item.qty}`,
        unit: item.unit,
        kcal: Math.round(item.kcal),
        protein_g: item.protein,
        carbs_g: item.carbs,
        fat_g: item.fat,
        notes: normalizeText(item.notes),
        sort_order: itemIndex,
      })),
    })),
  )

  if (templateId) {
    try {
      await markTemplateAsUsed(templateId)
    } catch {
      // Usage counters should not block persisted diet plan creation.
    }
  }

  return created
}

export async function updateDietPlanFromForm(planId: string, formData: FormData) {
  const parsedPlanId = parseWithSchema(idSchema, planId)
  const viewer = await requireRole(["nutritionist", "admin"])

  const existing = await getDietPlanById(viewer.userId, parsedPlanId)
  const patientId = existing.patient_id as string | null
  if (!patientId) {
    throw new Error("Diet plan is not linked to a patient")
  }

  const input = parseWithSchema(updateDietPlanSchema, {
    id: parsedPlanId,
    patientId,
    title: formData.get("title"),
    objective: formData.get("description") ?? formData.get("objective"),
    notes: formData.get("notes"),
    meals: [
      {
        name: "General",
        time: "",
        items: [
          {
            food: "Plan Summary",
            qty: 1,
            unit: "unit",
            kcal: parseIntOrNull(formData.get("dailyKcal")) ?? 0,
            protein: parseFloatOrNull(formData.get("protein")) ?? 0,
            carbs: parseFloatOrNull(formData.get("carbs")) ?? 0,
            fat: parseFloatOrNull(formData.get("fat")) ?? 0,
          },
        ],
      },
    ],
  })

  await replaceDietPlanWithMeals(
    viewer.userId,
    input.id,
    {
      title: input.title,
      description: normalizeText(input.objective),
      notes: normalizeText(input.notes),
      daily_kcal: parseIntOrNull(formData.get("dailyKcal")),
      protein_g: parseIntOrNull(formData.get("protein")),
      carbs_g: parseIntOrNull(formData.get("carbs")),
      fat_g: parseIntOrNull(formData.get("fat")),
    },
    input.meals.map((meal, mealIndex) => ({
      name: meal.name,
      time_of_day: meal.time || null,
      sort_order: mealIndex,
      items: meal.items.map((item, itemIndex) => ({
        food_name: item.food,
        quantity: `${item.qty}`,
        unit: item.unit,
        kcal: Math.round(item.kcal),
        protein_g: item.protein,
        carbs_g: item.carbs,
        fat_g: item.fat,
        notes: normalizeText(item.notes),
        sort_order: itemIndex,
      })),
    })),
  )
}

export async function listDietPlans() {
  const viewer = await requireViewer()
  return listDietPlansByTenant(viewer.userId)
}

export async function getDietPlan(planId: string) {
  const parsedPlanId = parseWithSchema(idSchema, planId)
  const viewer = await requireViewer()
  return getDietPlanById(viewer.userId, parsedPlanId)
}

export async function toggleDietPlan(planId: string, isActive: boolean) {
  const parsedPlanId = parseWithSchema(idSchema, planId)
  const parsedIsActive = parseWithSchema(z.boolean(), isActive)
  const viewer = await requireRole(["nutritionist", "admin"])
  await toggleDietPlanActiveState( viewer.userId, parsedPlanId, parsedIsActive)
}

export async function removeDietPlan(planId: string) {
  const parsedPlanId = parseWithSchema(idSchema, planId)
  const viewer = await requireRole(["nutritionist", "admin"])
  await deleteDietPlan( viewer.userId, parsedPlanId)
}

export async function listAppointments() {
  const viewer = await requireViewer()
  return listAppointmentsByTenant(viewer.userId)
}

export async function createAppointmentFromForm(formData: FormData) {
  const viewer = await requireRole(["nutritionist", "admin"])

  const input = parseWithSchema(createAppointmentSchema, formDataToObject(formData))
  await getPatientById(viewer.userId, input.patientId)

  const created = await createAppointmentRecord({
    patient_id: input.patientId,
    nutritionist_id: viewer.userId,
    title: input.title,
    scheduled_at: toIsoDateTime(input.scheduledAt),
    duration_minutes: input.durationMinutes ?? 60,
    status: "scheduled",
    notes: normalizeText(input.notes),
  })

  return {
    id: created.id,
    patientId: input.patientId,
  }
}

export async function getDashboardMetrics() {
  const viewer = await requireViewer()
  const counts = await getDashboardCounts(viewer.userId)

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  return {
    totalPatients: counts.patients.length,
    activePatients: counts.patients.filter((p: { status: string }) => p.status === "active").length,
    newPatientsThisMonth: counts.patients.filter((p: { created_at: string }) => new Date(p.created_at) > thirtyDaysAgo).length,
    totalAssessments: counts.assessments.length,
    assessmentsThisMonth: counts.assessments.filter((a: { assessed_at: string }) => new Date(a.assessed_at) > thirtyDaysAgo).length,
    activeDietPlans: counts.plans.filter((p: { is_active: boolean }) => p.is_active).length,
    upcomingAppointments: counts.appointments.filter(
      (a: { status: string; scheduled_at: string }) => a.status === "scheduled" && new Date(a.scheduled_at) > now,
    ).length,
  }
}

export async function persistAiDraft(input: AiDraftRequestInput & { generatedContent: string }) {
  const viewer = await requireRole(["nutritionist", "admin", "assistant"])

  if (input.patientId) {
    await getPatientById(viewer.userId, input.patientId)
  }

  const parsed = parseWithSchema(aiDraftRequestSchema, {
    tool: input.tool,
    context: input.context,
    patientId: input.patientId,
    messages: input.messages,
  })

  const draftMatch = await findAiDraft( viewer.userId, parsed.patientId ?? null, parsed.tool)

  const metadata = {
    messages: parsed.messages ?? [],
    saved_at: new Date().toISOString(),
  } as Record<string, unknown>

  let draftId: string
  if (draftMatch) {
    draftId = draftMatch.id
    await updateAiDraft( viewer.userId, draftId, {
      latest_content: input.generatedContent,
      metadata,
    })
  } else {
    const created = await createAiDraft( {
      nutritionist_id: viewer.userId,
      patient_id: parsed.patientId ?? null,
      tool: parsed.tool,
      title: `${parsed.tool} draft`,
      latest_content: input.generatedContent,
      metadata,
    })
    draftId = created.id
  }

  await createAiDraftVersion( {
    draft_id: draftId,
    nutritionist_id: viewer.userId,
    tool: parsed.tool,
    prompt_context: parsed.context || "",
    generated_content: input.generatedContent,
    metadata,
  })

  return { draftId }
}
