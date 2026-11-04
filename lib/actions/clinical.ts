"use server"

import { revalidatePath } from "next/cache"
import { runMutation } from "@/server/core/action"
import {
  createAppointmentFromForm,
  createAssessmentFromForm,
  createDietPlanFromForm,
  getDashboardMetrics,
  listAppointments,
  listAssessments,
  listAssessmentsForPatient,
  listDietPlans,
  updateDietPlanFromForm,
  toggleDietPlan,
  removeDietPlan,
  getDietPlan,
} from "@/server/services/clinical.service"

export async function createAssessment(patientId: string, formData: FormData) {
  const result = await runMutation(async () => {
    await createAssessmentFromForm(patientId, formData)
    return { patientId }
  })

  if (result.success) {
    revalidatePath(`/dashboard/patients/${patientId}`)
    revalidatePath("/dashboard/assessments")
  }

  return result
}

export async function getAssessmentsForPatient(patientId: string) {
  return listAssessmentsForPatient(patientId)
}

export async function getAllAssessments() {
  return listAssessments()
}

export async function createDietPlan(patientId: string, formData: FormData) {
  const result = await runMutation(async () => createDietPlanFromForm(patientId, formData))

  if (result.success) {
    revalidatePath(`/dashboard/patients/${patientId}`)
    revalidatePath("/dashboard/diet-plans")
  }

  return result
}

export async function getDietPlansForPatient(patientId: string) {
  const plans = await listDietPlans()
  return plans.filter((plan: { patient_id: string | null }) => plan.patient_id === patientId)
}

export async function getAllDietPlans() {
  return listDietPlans()
}

export async function getDietPlanById(id: string) {
  return getDietPlan(id)
}

export async function updateDietPlan(id: string, formData: FormData) {
  const result = await runMutation(async () => {
    await updateDietPlanFromForm(id, formData)
    return { id }
  })

  if (result.success) {
    revalidatePath("/dashboard/diet-plans")
    revalidatePath(`/dashboard/diet-plans/${id}`)
  }

  return result
}

export async function toggleDietPlanActive(id: string, patientId: string, isActive: boolean) {
  const result = await runMutation(async () => {
    await toggleDietPlan(id, isActive)
    return { id, patientId, isActive }
  })

  if (result.success) {
    revalidatePath(`/dashboard/patients/${patientId}`)
    revalidatePath("/dashboard/diet-plans")
    revalidatePath(`/dashboard/diet-plans/${id}`)
  }

  return result
}

export async function deleteDietPlan(id: string, patientId: string) {
  const result = await runMutation(async () => {
    await removeDietPlan(id)
    return { id, patientId }
  })

  if (result.success) {
    revalidatePath(`/dashboard/patients/${patientId}`)
    revalidatePath("/dashboard/diet-plans")
  }

  return result
}

export async function getAllAppointments() {
  return listAppointments()
}

export async function createAppointment(formData: FormData) {
  const result = await runMutation(async () => createAppointmentFromForm(formData))

  if (result.success) {
    revalidatePath("/dashboard/appointments")
    if (result.data.patientId) {
      revalidatePath(`/dashboard/patients/${result.data.patientId}`)
    }
  }

  return result
}

export async function getDashboardStats() {
  return getDashboardMetrics()
}
