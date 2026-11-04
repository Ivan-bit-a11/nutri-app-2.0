import { and, desc, eq, sql } from "drizzle-orm"
import { getDb } from "@/lib/db"
import {
  assessments,
  appointments,
  dietPlans,
  meals,
  mealItems,
  patients,
} from "@/lib/db/schema"
import { databaseError, notFound } from "@/server/core/errors"

function num(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null
  const n = Number(v)
  return Number.isFinite(n) ? String(n) : null
}

function mapAssessment(row: typeof assessments.$inferSelect, patient?: { name: string; goal: string | null } | null) {
  return {
    id: row.id,
    patient_id: row.patientId,
    nutritionist_id: row.nutritionistId,
    assessed_at: row.assessedAt instanceof Date ? row.assessedAt.toISOString() : String(row.assessedAt),
    weight_kg: row.weightKg != null ? Number(row.weightKg) : null,
    height_cm: row.heightCm != null ? Number(row.heightCm) : null,
    bmi: row.bmi != null ? Number(row.bmi) : null,
    body_fat_pct: row.bodyFatPct != null ? Number(row.bodyFatPct) : null,
    fat_mass_kg: row.fatMassKg != null ? Number(row.fatMassKg) : null,
    lean_mass_kg: row.muscleMassKg != null ? Number(row.muscleMassKg) : null,
    waist_cm: row.waistCm != null ? Number(row.waistCm) : null,
    hip_cm: row.hipCm != null ? Number(row.hipCm) : null,
    notes: row.notes,
    created_at: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    patients: patient ? { name: patient.name, goal: patient.goal } : null,
  }
}

export async function createAssessmentRecord(payload: {
  patient_id: string
  nutritionist_id: string
  assessed_at?: string
  weight_kg?: number | null
  height_cm?: number | null
  bmi?: number | null
  body_fat_pct?: number | null
  fat_mass_kg?: number | null
  lean_mass_kg?: number | null
  waist_cm?: number | null
  hip_cm?: number | null
  notes?: string | null
  [key: string]: unknown
}): Promise<void> {
  try {
    const db = getDb()
    await db.insert(assessments).values({
      patientId: payload.patient_id,
      nutritionistId: payload.nutritionist_id,
      assessedAt: payload.assessed_at ? new Date(payload.assessed_at) : new Date(),
      weightKg: num(payload.weight_kg),
      heightCm: num(payload.height_cm),
      bmi: num(payload.bmi),
      bodyFatPct: num(payload.body_fat_pct),
      fatMassKg: num(payload.fat_mass_kg),
      muscleMassKg: num(payload.lean_mass_kg),
      waistCm: num(payload.waist_cm),
      hipCm: num(payload.hip_cm),
      notes: (payload.notes as string) || null,
    })
  } catch (error) {
    throw databaseError("Não foi possível criar a avaliação", error)
  }
}

export async function listAssessmentsByTenant(nutritionistId: string) {
  try {
    const db = getDb()
    const rows = await db
      .select({
        assessment: assessments,
        patientName: patients.name,
        patientGoal: patients.goal,
      })
      .from(assessments)
      .leftJoin(patients, eq(assessments.patientId, patients.id))
      .where(eq(assessments.nutritionistId, nutritionistId))
      .orderBy(desc(assessments.assessedAt))

    return rows.map((r) =>
      mapAssessment(
        r.assessment,
        r.patientName ? { name: r.patientName, goal: r.patientGoal } : null,
      ),
    )
  } catch (error) {
    throw databaseError("Não foi possível listar avaliações", error)
  }
}

export async function listAssessmentsByPatient(nutritionistId: string, patientId: string) {
  try {
    const db = getDb()
    const rows = await db
      .select()
      .from(assessments)
      .where(
        and(eq(assessments.nutritionistId, nutritionistId), eq(assessments.patientId, patientId)),
      )
      .orderBy(desc(assessments.assessedAt))

    return rows.map((r) => mapAssessment(r, null))
  } catch (error) {
    throw databaseError("Não foi possível listar avaliações do paciente", error)
  }
}

export async function createDietPlanWithMeals(
  payload: {
    patient_id: string
    nutritionist_id: string
    title: string
    description?: string | null
    daily_kcal?: number | null
    protein_g?: number | null
    carbs_g?: number | null
    fat_g?: number | null
    notes?: string | null
  },
  mealList: Array<{
    name: string
    time_of_day?: string | null
    sort_order?: number
    items?: Array<{ food_name: string; quantity?: string | null; unit?: string | null; kcal?: number | null }>
  }>,
): Promise<{ id: string }> {
  try {
    const db = getDb()
    const [plan] = await db
      .insert(dietPlans)
      .values({
        patientId: payload.patient_id,
        nutritionistId: payload.nutritionist_id,
        title: payload.title,
        description: payload.description ?? null,
        dailyKcal: payload.daily_kcal ?? null,
        proteinG: payload.protein_g ?? null,
        carbsG: payload.carbs_g ?? null,
        fatG: payload.fat_g ?? null,
        notes: payload.notes ?? null,
      })
      .returning({ id: dietPlans.id })

    for (let i = 0; i < mealList.length; i++) {
      const m = mealList[i]
      const [meal] = await db
        .insert(meals)
        .values({
          dietPlanId: plan.id,
          name: m.name,
          timeOfDay: m.time_of_day ?? null,
          sortOrder: m.sort_order ?? i,
        })
        .returning({ id: meals.id })

      for (const item of m.items || []) {
        await db.insert(mealItems).values({
          mealId: meal.id,
          foodName: item.food_name,
          quantity: item.quantity ?? null,
          unit: item.unit ?? null,
          kcal: item.kcal != null ? String(item.kcal) : null,
        })
      }
    }

    return { id: plan.id }
  } catch (error) {
    throw databaseError("Não foi possível criar o plano alimentar", error)
  }
}

export async function listDietPlansByTenant(nutritionistId: string) {
  try {
    const db = getDb()
    const rows = await db
      .select({
        plan: dietPlans,
        patientName: patients.name,
      })
      .from(dietPlans)
      .leftJoin(patients, eq(dietPlans.patientId, patients.id))
      .where(eq(dietPlans.nutritionistId, nutritionistId))
      .orderBy(desc(dietPlans.createdAt))

    return rows.map((r) => ({
      id: r.plan.id,
      patient_id: r.plan.patientId,
      nutritionist_id: r.plan.nutritionistId,
      title: r.plan.title,
      description: r.plan.description,
      daily_kcal: r.plan.dailyKcal,
      protein_g: r.plan.proteinG,
      carbs_g: r.plan.carbsG,
      fat_g: r.plan.fatG,
      notes: r.plan.notes,
      is_active: r.plan.isActive,
      created_at: r.plan.createdAt,
      patients: r.patientName
        ? { id: r.plan.patientId ?? undefined, name: r.patientName }
        : r.plan.patientId
          ? { id: r.plan.patientId, name: "Paciente" }
          : null,
      updated_at: r.plan.updatedAt,
    }))
  } catch (error) {
    throw databaseError("Não foi possível listar planos", error)
  }
}

export async function getDietPlanById(nutritionistId: string, planId: string) {
  try {
    const db = getDb()
    const [plan] = await db
      .select()
      .from(dietPlans)
      .where(and(eq(dietPlans.id, planId), eq(dietPlans.nutritionistId, nutritionistId)))
      .limit(1)

    if (!plan) throw notFound("Plano alimentar não encontrado")

    const mealRows = await db
      .select()
      .from(meals)
      .where(eq(meals.dietPlanId, plan.id))
      .orderBy(meals.sortOrder)

    const withItems = []
    for (const meal of mealRows) {
      const items = await db.select().from(mealItems).where(eq(mealItems.mealId, meal.id))
      withItems.push({
        id: meal.id,
        name: meal.name,
        time_of_day: meal.timeOfDay,
        sort_order: meal.sortOrder,
        meal_items: items.map((it) => ({
          id: it.id,
          food_name: it.foodName,
          quantity: it.quantity,
          unit: it.unit,
          kcal: it.kcal,
        })),
      })
    }

    return {
      id: plan.id,
      patient_id: plan.patientId,
      nutritionist_id: plan.nutritionistId,
      title: plan.title,
      description: plan.description,
      daily_kcal: plan.dailyKcal,
      protein_g: plan.proteinG,
      carbs_g: plan.carbsG,
      fat_g: plan.fatG,
      notes: plan.notes,
      is_active: plan.isActive,
      meals: withItems,
    }
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) throw error
    throw databaseError("Não foi possível carregar o plano", error)
  }
}

export async function toggleDietPlanActiveState(
  nutritionistId: string,
  planId: string,
  isActive: boolean,
) {
  try {
    const db = getDb()
    await db
      .update(dietPlans)
      .set({ isActive, updatedAt: new Date() })
      .where(and(eq(dietPlans.id, planId), eq(dietPlans.nutritionistId, nutritionistId)))
  } catch (error) {
    throw databaseError("Não foi possível actualizar o plano", error)
  }
}

export async function deleteDietPlan(nutritionistId: string, planId: string) {
  try {
    const db = getDb()
    await db
      .delete(dietPlans)
      .where(and(eq(dietPlans.id, planId), eq(dietPlans.nutritionistId, nutritionistId)))
  } catch (error) {
    throw databaseError("Não foi possível eliminar o plano", error)
  }
}

export async function replaceDietPlanWithMeals(
  nutritionistId: string,
  planId: string,
  payload: {
    title: string
    description?: string | null
    daily_kcal?: number | null
    protein_g?: number | null
    carbs_g?: number | null
    fat_g?: number | null
    notes?: string | null
  },
  mealList: Array<{
    name: string
    time_of_day?: string | null
    sort_order?: number
    items?: Array<{ food_name: string; quantity?: string | null; unit?: string | null; kcal?: number | null }>
  }>,
) {
  try {
    const db = getDb()
    await db
      .update(dietPlans)
      .set({
        title: payload.title,
        description: payload.description ?? null,
        dailyKcal: payload.daily_kcal ?? null,
        proteinG: payload.protein_g ?? null,
        carbsG: payload.carbs_g ?? null,
        fatG: payload.fat_g ?? null,
        notes: payload.notes ?? null,
        updatedAt: new Date(),
      })
      .where(and(eq(dietPlans.id, planId), eq(dietPlans.nutritionistId, nutritionistId)))

    // remove old meals (cascade items if FK set; else delete items first)
    const oldMeals = await db.select({ id: meals.id }).from(meals).where(eq(meals.dietPlanId, planId))
    for (const m of oldMeals) {
      await db.delete(mealItems).where(eq(mealItems.mealId, m.id))
    }
    await db.delete(meals).where(eq(meals.dietPlanId, planId))

    for (let i = 0; i < mealList.length; i++) {
      const m = mealList[i]
      const [meal] = await db
        .insert(meals)
        .values({
          dietPlanId: planId,
          name: m.name,
          timeOfDay: m.time_of_day ?? null,
          sortOrder: m.sort_order ?? i,
        })
        .returning({ id: meals.id })
      for (const item of m.items || []) {
        await db.insert(mealItems).values({
          mealId: meal.id,
          foodName: item.food_name,
          quantity: item.quantity ?? null,
          unit: item.unit ?? null,
          kcal: item.kcal != null ? String(item.kcal) : null,
        })
      }
    }
  } catch (error) {
    throw databaseError("Não foi possível actualizar o plano com refeições", error)
  }
}

export async function createAppointmentRecord(payload: {
  patient_id: string
  nutritionist_id: string
  scheduled_at: string
  duration_minutes?: number | null
  type?: string | null
  status?: string | null
  notes?: string | null
}) {
  try {
    const db = getDb()
    await db.insert(appointments).values({
      patientId: payload.patient_id,
      nutritionistId: payload.nutritionist_id,
      scheduledAt: new Date(payload.scheduled_at),
      durationMin: payload.duration_minutes ?? 60,
      type: payload.type ?? "consulta",
      status: payload.status ?? "scheduled",
      notes: payload.notes ?? null,
    })
  } catch (error) {
    throw databaseError("Não foi possível criar a consulta", error)
  }
}

export async function listAppointmentsByTenant(nutritionistId: string) {
  try {
    const db = getDb()
    const rows = await db
      .select({
        appointment: appointments,
        patientName: patients.name,
      })
      .from(appointments)
      .leftJoin(patients, eq(appointments.patientId, patients.id))
      .where(eq(appointments.nutritionistId, nutritionistId))
      .orderBy(desc(appointments.scheduledAt))

    return rows.map((r) => ({
      id: r.appointment.id,
      patient_id: r.appointment.patientId,
      nutritionist_id: r.appointment.nutritionistId,
      scheduled_at: r.appointment.scheduledAt,
      duration_minutes: r.appointment.durationMin,
      type: r.appointment.type,
      status: r.appointment.status,
      notes: r.appointment.notes,
      patients: r.patientName ? { name: r.patientName } : null,
    }))
  } catch (error) {
    throw databaseError("Não foi possível listar consultas", error)
  }
}

// AI stubs — tabelas podem não existir no schema Neon mínimo
export async function createAiDraft(..._args: unknown[]) {
  return { id: crypto.randomUUID() }
}
export async function updateAiDraft(..._args: unknown[]) {}
export async function findAiDraft(..._args: unknown[]) {
  return null
}
export async function createAiDraftVersion(..._args: unknown[]) {}

export async function getDashboardCounts(nutritionistId: string) {
  try {
    const db = getDb()
    const [p, a, d, ap] = await Promise.all([
      db.select().from(patients).where(eq(patients.nutritionistId, nutritionistId)),
      db.select().from(assessments).where(eq(assessments.nutritionistId, nutritionistId)),
      db.select().from(dietPlans).where(eq(dietPlans.nutritionistId, nutritionistId)),
      db.select().from(appointments).where(eq(appointments.nutritionistId, nutritionistId)),
    ])
    return {
      patients: p.map((x) => ({ id: x.id, status: x.status, created_at: x.createdAt })),
      assessments: a.map((x) => ({ id: x.id, assessed_at: x.assessedAt })),
      plans: d.map((x) => ({ id: x.id, is_active: x.isActive, created_at: x.createdAt })),
      appointments: ap.map((x) => ({
        id: x.id,
        scheduled_at: x.scheduledAt,
        status: x.status,
      })),
    }
  } catch (error) {
    throw databaseError("Não foi possível carregar métricas do dashboard", error)
  }
}
