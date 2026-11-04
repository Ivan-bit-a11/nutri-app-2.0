import { and, desc, eq } from "drizzle-orm"
import { getDb } from "@/lib/db"
import { patients, patientNotes, assessments, dietPlans } from "@/lib/db/schema"
import { databaseError, notFound } from "@/server/core/errors"

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function mapPatient(row: typeof patients.$inferSelect) {
  return {
    id: row.id,
    nutritionist_id: row.nutritionistId,
    client_user_id: row.clientUserId,
    name: row.name,
    email: row.email,
    phone: row.phone,
    dob: row.dob,
    sex: row.sex,
    height_cm: row.heightCm != null ? Number(row.heightCm) : null,
    goal: row.goal,
    activity_level: row.activityLevel,
    status: row.status,
    allergies: row.allergies,
    conditions: row.conditions,
    medications: row.medications,
    supplements: row.supplements,
    dietary_preferences: row.dietaryPreferences,
    emergency_contact_name: row.emergencyContactName,
    emergency_contact_phone: row.emergencyContactPhone,
    notes: row.notes,
    created_at: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    updated_at: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
  }
}

function mapAssessment(row: typeof assessments.$inferSelect) {
  return {
    id: row.id,
    patient_id: row.patientId,
    nutritionist_id: row.nutritionistId,
    assessed_at:
      row.assessedAt instanceof Date ? row.assessedAt.toISOString() : String(row.assessedAt),
    weight_kg: num(row.weightKg),
    height_cm: num(row.heightCm),
    bmi: num(row.bmi),
    body_fat_pct: num(row.bodyFatPct),
    fat_mass_kg: num(row.fatMassKg),
    lean_mass_kg: num(row.muscleMassKg),
    waist_cm: num(row.waistCm),
    hip_cm: num(row.hipCm),
    notes: row.notes,
    created_at: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    updated_at: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
  }
}

function mapDietPlan(row: typeof dietPlans.$inferSelect) {
  return {
    id: row.id,
    patient_id: row.patientId,
    nutritionist_id: row.nutritionistId,
    title: row.title,
    description: row.description,
    daily_kcal: row.dailyKcal,
    protein_g: row.proteinG,
    carbs_g: row.carbsG,
    fat_g: row.fatG,
    notes: row.notes,
    is_active: row.isActive,
    created_at: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    updated_at: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
  }
}

function mapNote(row: typeof patientNotes.$inferSelect) {
  return {
    id: row.id,
    patient_id: row.patientId,
    nutritionist_id: row.nutritionistId,
    content: row.content,
    created_at: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    updated_at: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
  }
}

export async function listPatientsByTenant(nutritionistId: string) {
  try {
    const db = getDb()
    const rows = await db
      .select()
      .from(patients)
      .where(eq(patients.nutritionistId, nutritionistId))
      .orderBy(desc(patients.createdAt))
    return rows.map(mapPatient)
  } catch (error) {
    throw databaseError("Não foi possível listar pacientes", error)
  }
}

export async function getPatientById(nutritionistId: string, patientId: string) {
  try {
    const db = getDb()
    const [row] = await db
      .select()
      .from(patients)
      .where(and(eq(patients.id, patientId), eq(patients.nutritionistId, nutritionistId)))
      .limit(1)
    if (!row) throw notFound("Paciente não encontrado")
    return mapPatient(row)
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) throw error
    throw databaseError("Não foi possível carregar o paciente", error)
  }
}

export async function getPatientWithDetails(nutritionistId: string, patientId: string) {
  const patient = await getPatientById(nutritionistId, patientId)
  const db = getDb()
  const [notes, asses, plans] = await Promise.all([
    db
      .select()
      .from(patientNotes)
      .where(eq(patientNotes.patientId, patientId))
      .orderBy(desc(patientNotes.createdAt)),
    db
      .select()
      .from(assessments)
      .where(eq(assessments.patientId, patientId))
      .orderBy(desc(assessments.assessedAt)),
    db
      .select()
      .from(dietPlans)
      .where(eq(dietPlans.patientId, patientId))
      .orderBy(desc(dietPlans.createdAt)),
  ])
  return {
    ...patient,
    patient_notes: notes.map(mapNote),
    assessments: asses.map(mapAssessment),
    diet_plans: plans.map(mapDietPlan),
    appointments: [] as Array<{
      id: string
      title: string
      scheduled_at: string
      status: string
      duration_minutes: number
    }>,
  }
}

export async function createPatientRecord(
  nutritionistId: string,
  payload: {
    name: string
    email?: string | null
    phone?: string | null
    dob?: string | null
    sex?: string | null
    height_cm?: number | null
    goal?: string | null
    activity_level?: string | null
    status?: string | null
    notes?: string | null
  },
) {
  try {
    const db = getDb()
    const [row] = await db
      .insert(patients)
      .values({
        nutritionistId,
        name: payload.name,
        email: payload.email ?? null,
        phone: payload.phone ?? null,
        dob: payload.dob ?? null,
        sex: payload.sex ?? null,
        heightCm: payload.height_cm != null ? String(payload.height_cm) : null,
        goal: payload.goal ?? null,
        activityLevel: payload.activity_level ?? null,
        status: payload.status ?? "active",
        notes: payload.notes ?? null,
      })
      .returning()
    return mapPatient(row)
  } catch (error) {
    throw databaseError("Não foi possível criar o paciente", error)
  }
}

export async function updatePatientRecord(
  nutritionistId: string,
  patientId: string,
  payload: Record<string, unknown>,
) {
  try {
    const db = getDb()
    await db
      .update(patients)
      .set({
        name: (payload.name as string) ?? undefined,
        email: (payload.email as string) ?? undefined,
        phone: (payload.phone as string) ?? undefined,
        goal: (payload.goal as string) ?? undefined,
        status: (payload.status as string) ?? undefined,
        notes: (payload.notes as string) ?? undefined,
        updatedAt: new Date(),
      })
      .where(and(eq(patients.id, patientId), eq(patients.nutritionistId, nutritionistId)))
  } catch (error) {
    throw databaseError("Não foi possível actualizar o paciente", error)
  }
}

export async function deletePatientRecord(nutritionistId: string, patientId: string) {
  try {
    const db = getDb()
    await db
      .delete(patients)
      .where(and(eq(patients.id, patientId), eq(patients.nutritionistId, nutritionistId)))
  } catch (error) {
    throw databaseError("Não foi possível eliminar o paciente", error)
  }
}

export async function insertPatientNote(
  nutritionistId: string,
  patientId: string,
  content: string,
) {
  try {
    const db = getDb()
    await db.insert(patientNotes).values({
      patientId,
      nutritionistId,
      content,
    })
  } catch (error) {
    throw databaseError("Não foi possível guardar a nota", error)
  }
}

export type PatientRecord = ReturnType<typeof mapPatient>
