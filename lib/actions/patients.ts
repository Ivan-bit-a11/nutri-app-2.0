"use server"

import { revalidatePath } from "next/cache"
import { runMutation } from "@/server/core/action"
import {
  addPatientNote as addPatientNoteService,
  createPatientFromForm,
  deletePatient as deletePatientService,
  getPatient as getPatientService,
  getPatientDetails,
  listPatients,
  updatePatientFromForm,
  updatePatientStatus as updatePatientStatusService,
} from "@/server/services/patients.service"
import type { PatientRecord } from "@/server/repositories/patients.repository"

export type PatientRow = PatientRecord

export async function getPatients() {
  return listPatients()
}

export async function getPatient(id: string) {
  return getPatientService(id)
}

export async function getPatientWithAssessments(id: string) {
  return getPatientDetails(id)
}

export async function createPatient(formData: FormData) {
  const result = await runMutation(async () => createPatientFromForm(formData))

  if (result.success) {
    revalidatePath("/dashboard/patients")
    revalidatePath(`/dashboard/patients/${result.data.id}`)
  }

  return result
}

export async function updatePatient(id: string, formData: FormData) {
  const result = await runMutation(async () => {
    await updatePatientFromForm(id, formData)
    return { id }
  })

  if (result.success) {
    revalidatePath(`/dashboard/patients/${id}`)
    revalidatePath("/dashboard/patients")
  }

  return result
}

export async function updatePatientStatus(id: string, status: string) {
  const result = await runMutation(async () => {
    await updatePatientStatusService(id, status)
    return { id, status }
  })

  if (result.success) {
    revalidatePath(`/dashboard/patients/${id}`)
    revalidatePath("/dashboard/patients")
  }

  return result
}

export async function deletePatient(id: string) {
  const result = await runMutation(async () => {
    await deletePatientService(id)
    return { id }
  })

  if (result.success) {
    revalidatePath("/dashboard/patients")
  }

  return result
}

export async function addPatientNote(patientId: string, content: string) {
  const result = await runMutation(async () => {
    await addPatientNoteService(patientId, content)
    return { patientId }
  })

  if (result.success) {
    revalidatePath(`/dashboard/patients/${patientId}`)
  }

  return result
}
