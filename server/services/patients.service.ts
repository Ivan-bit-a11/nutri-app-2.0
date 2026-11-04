import { requireRole, requireViewer } from "@/server/core/auth"
import { formDataToObject, parseWithSchema } from "@/server/core/validation"
import { withTimeout } from "@/lib/utils/with-timeout"
import {
  createPatientNoteSchema,
  createPatientSchema,
  type CreatePatientInput,
  updatePatientSchema,
  updatePatientStatusSchema,
  type UpdatePatientInput,
} from "@/server/schemas/patient.schemas"
import {
  createPatientRecord,
  deletePatientRecord,
  getPatientById,
  getPatientWithDetails,
  insertPatientNote,
  listPatientsByTenant,
  updatePatientRecord,
  type PatientRecord,
} from "@/server/repositories/patients.repository"
import { z } from "zod"

const idSchema = z.string().uuid()
const PATIENTS_QUERY_TIMEOUT_MS = 8000

function toArray(value: string | undefined): string[] | null {
  if (!value) return null
  const parsed = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
  return parsed.length > 0 ? parsed : null
}

function normalizeText(value: string | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function toPatientInsertPayload(input: CreatePatientInput, nutritionistId: string): Omit<PatientRecord, "id" | "created_at" | "updated_at"> {
  return {
    nutritionist_id: nutritionistId,
    name: input.name,
    email: normalizeText(input.email),
    phone: normalizeText(input.phone),
    dob: normalizeText(input.dob),
    sex: input.sex || null,
    height_cm: input.height ?? null,
    goal: normalizeText(input.goal),
    activity_level: input.activityLevel || null,
    status: "active",
    allergies: toArray(input.allergies),
    conditions: toArray(input.conditions),
    medications: normalizeText(input.medications),
    supplements: normalizeText(input.supplements),
    dietary_preferences: normalizeText(input.dietaryPreferences),
    emergency_contact_name: normalizeText(input.emergencyContact),
    emergency_contact_phone: normalizeText(input.emergencyPhone),
    notes: normalizeText(input.notes),
  }
}

function toPatientUpdatePayload(input: UpdatePatientInput): Partial<Omit<PatientRecord, "id" | "nutritionist_id" | "created_at">> {
  return {
    name: input.name,
    email: normalizeText(input.email),
    phone: normalizeText(input.phone),
    dob: normalizeText(input.dob),
    sex: input.sex || null,
    height_cm: input.height ?? null,
    goal: normalizeText(input.goal),
    activity_level: input.activityLevel || null,
    status: input.status,
    allergies: toArray(input.allergies),
    conditions: toArray(input.conditions),
    medications: normalizeText(input.medications),
    supplements: normalizeText(input.supplements),
    dietary_preferences: normalizeText(input.dietaryPreferences),
    emergency_contact_name: normalizeText(input.emergencyContact),
    emergency_contact_phone: normalizeText(input.emergencyPhone),
    notes: normalizeText(input.notes),
    updated_at: new Date().toISOString(),
  }
}

export async function listPatients() {
  const viewer = await requireViewer()
  return withTimeout(
    listPatientsByTenant(viewer.userId),
    PATIENTS_QUERY_TIMEOUT_MS,
    "Patients list query",
  )
}

export async function getPatient(patientId: string) {
  const parsedPatientId = parseWithSchema(idSchema, patientId)
  const viewer = await requireViewer()
  return getPatientById(viewer.userId, parsedPatientId)
}

export async function getPatientDetails(patientId: string) {
  const parsedPatientId = parseWithSchema(idSchema, patientId)
  const viewer = await requireViewer()
  return getPatientWithDetails(viewer.userId, parsedPatientId)
}

export async function createPatientFromForm(formData: FormData) {
  const viewer = await requireRole(["nutritionist", "admin"])
  const input = parseWithSchema(createPatientSchema, formDataToObject(formData))
  const payload = toPatientInsertPayload(input, viewer.userId)
  return createPatientRecord(viewer.userId, payload)
}

export async function updatePatientFromForm(patientId: string, formData: FormData) {
  const parsedPatientId = parseWithSchema(idSchema, patientId)
  const viewer = await requireRole(["nutritionist", "admin"])
  await getPatientById(viewer.userId, parsedPatientId)

  const input = parseWithSchema(updatePatientSchema, formDataToObject(formData))
  const payload = toPatientUpdatePayload(input)
  await updatePatientRecord(viewer.userId, parsedPatientId, payload)
}

export async function updatePatientStatus(patientId: string, status: string) {
  const parsedPatientId = parseWithSchema(idSchema, patientId)
  const viewer = await requireRole(["nutritionist", "admin"])
  await getPatientById(viewer.userId, parsedPatientId)

  const input = parseWithSchema(updatePatientStatusSchema, { status })
  await updatePatientRecord(viewer.userId, parsedPatientId, {
    status: input.status,
    updated_at: new Date().toISOString(),
  })
}

export async function deletePatient(patientId: string) {
  const parsedPatientId = parseWithSchema(idSchema, patientId)
  const viewer = await requireRole(["nutritionist", "admin"])
  await getPatientById(viewer.userId, parsedPatientId)
  await deletePatientRecord(viewer.userId, parsedPatientId)
}

export async function addPatientNote(patientId: string, content: string) {
  const parsedPatientId = parseWithSchema(idSchema, patientId)
  const viewer = await requireRole(["nutritionist", "admin"])
  await getPatientById(viewer.userId, parsedPatientId)

  const input = parseWithSchema(createPatientNoteSchema, { content })
  await insertPatientNote(viewer.userId, parsedPatientId, content)
}
