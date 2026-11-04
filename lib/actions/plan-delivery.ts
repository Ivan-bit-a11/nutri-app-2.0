"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getDb } from "@/lib/db"
import { profiles, patients, dietPlans, payments, consultationRequests } from "@/lib/db/schema"
import { toActionError } from "@/server/core/errors"
import { fail, ok } from "@/server/core/result"
import { formDataToObject, parseWithSchema } from "@/server/core/validation"
import { z } from "zod"
import { getProfile } from "@/lib/actions/auth"

const linkSchema = z.object({
  patient_id: z.string().uuid(),
  client_email: z.string().trim().email(),
})

const publishSchema = z.object({
  diet_plan_id: z.string().uuid(),
})

export async function linkPatientToClient(formData: FormData) {
  try {
    const profile = await getProfile()
    if (!profile || (profile.role !== "nutritionist" && profile.role !== "super_admin")) {
      return fail({ code: "UNAUTHORIZED", message: "Sem permissão." })
    }

    const input = parseWithSchema(linkSchema, formDataToObject(formData))
    const db = getDb()

    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.id, input.patient_id))
      .limit(1)

    if (!patient) {
      return fail({ code: "NOT_FOUND", message: "Paciente não encontrado." })
    }
    if (profile.role === "nutritionist" && patient.nutritionistId !== profile.id) {
      return fail({ code: "UNAUTHORIZED", message: "Este paciente não é seu." })
    }

    const [clientProfile] = await db
      .select()
      .from(profiles)
      .where(
        and(
          eq(profiles.email, input.client_email.toLowerCase()),
          eq(profiles.role, "client"),
        ),
      )
      .limit(1)

    if (!clientProfile) {
      return fail({
        code: "NOT_FOUND",
        message:
          "Não existe conta de cliente com este email. Peça ao cliente para se registar ou crie a conta no Super Admin.",
      })
    }

    await db
      .update(patients)
      .set({
        clientUserId: clientProfile.id,
        email: clientProfile.email || patient.email,
        updatedAt: new Date(),
      })
      .where(eq(patients.id, input.patient_id))

    revalidatePath(`/dashboard/patients/${input.patient_id}`)
    revalidatePath("/dashboard/patients")
    revalidatePath("/cliente/planos")

    return ok({
      patient_id: input.patient_id,
      client_user_id: clientProfile.id,
      client_name: clientProfile.fullName,
      client_email: clientProfile.email,
    })
  } catch (error) {
    return fail(toActionError(error))
  }
}

async function hasConfirmedPayment(clientUserId: string, nutritionistId: string) {
  const db = getDb()
  const [pay] = await db
    .select({ id: payments.id })
    .from(payments)
    .where(
      and(
        eq(payments.clientUserId, clientUserId),
        eq(payments.nutritionistId, nutritionistId),
        eq(payments.status, "confirmed"),
      ),
    )
    .limit(1)
  if (pay) return true

  const [req] = await db
    .select({ id: consultationRequests.id })
    .from(consultationRequests)
    .where(
      and(
        eq(consultationRequests.clientUserId, clientUserId),
        eq(consultationRequests.nutritionistId, nutritionistId),
        eq(consultationRequests.status, "approved"),
      ),
    )
    .limit(1)
  return !!req
}

export async function publishDietPlanToClient(formData: FormData) {
  try {
    const profile = await getProfile()
    if (!profile || (profile.role !== "nutritionist" && profile.role !== "super_admin")) {
      return fail({ code: "UNAUTHORIZED", message: "Sem permissão." })
    }

    const input = parseWithSchema(publishSchema, formDataToObject(formData))
    const db = getDb()

    const [plan] = await db.select().from(dietPlans).where(eq(dietPlans.id, input.diet_plan_id)).limit(1)
    if (!plan) return fail({ code: "NOT_FOUND", message: "Plano não encontrado." })
    if (profile.role === "nutritionist" && plan.nutritionistId !== profile.id) {
      return fail({ code: "UNAUTHORIZED", message: "Este plano não é seu." })
    }
    if (!plan.patientId) {
      return fail({ code: "VALIDATION", message: "O plano não tem paciente associado." })
    }

    const [patient] = await db.select().from(patients).where(eq(patients.id, plan.patientId)).limit(1)
    if (!patient?.clientUserId) {
      return fail({
        code: "VALIDATION",
        message: "Ligue primeiro o paciente a uma conta de cliente (email).",
      })
    }

    const paid = await hasConfirmedPayment(patient.clientUserId, plan.nutritionistId)
    if (!paid && profile.role !== "super_admin") {
      return fail({
        code: "FORBIDDEN",
        message: "Só pode publicar o plano após pagamento confirmado ou consulta aprovada.",
      })
    }

    await db
      .update(dietPlans)
      .set({
        publishedToClientAt: new Date(),
        publishedBy: profile.id,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(dietPlans.id, plan.id))

    revalidatePath("/dashboard/diet-plans")
    revalidatePath(`/dashboard/diet-plans/${plan.id}`)
    revalidatePath("/cliente/planos")
    return ok({ id: plan.id })
  } catch (error) {
    return fail(toActionError(error))
  }
}

export async function unpublishDietPlan(formData: FormData) {
  try {
    const profile = await getProfile()
    if (!profile || (profile.role !== "nutritionist" && profile.role !== "super_admin")) {
      return fail({ code: "UNAUTHORIZED", message: "Sem permissão." })
    }

    const input = parseWithSchema(publishSchema, formDataToObject(formData))
    const db = getDb()

    const [plan] = await db.select().from(dietPlans).where(eq(dietPlans.id, input.diet_plan_id)).limit(1)
    if (!plan) return fail({ code: "NOT_FOUND", message: "Plano não encontrado." })
    if (profile.role === "nutritionist" && plan.nutritionistId !== profile.id) {
      return fail({ code: "UNAUTHORIZED", message: "Este plano não é seu." })
    }

    await db
      .update(dietPlans)
      .set({ publishedToClientAt: null, updatedAt: new Date() })
      .where(eq(dietPlans.id, plan.id))

    revalidatePath("/dashboard/diet-plans")
    revalidatePath("/cliente/planos")
    return ok({ id: plan.id })
  } catch (error) {
    return fail(toActionError(error))
  }
}

export async function getPatientClientLink(patientId: string) {
  try {
    const profile = await getProfile()
    if (!profile) return fail({ code: "UNAUTHORIZED", message: "Não autenticado." })

    const db = getDb()
    const [patient] = await db.select().from(patients).where(eq(patients.id, patientId)).limit(1)
    if (!patient) return fail({ code: "NOT_FOUND", message: "Paciente não encontrado." })
    if (profile.role === "nutritionist" && patient.nutritionistId !== profile.id) {
      return fail({ code: "UNAUTHORIZED", message: "Este paciente não é seu." })
    }

    if (!patient.clientUserId) {
      return ok({ linked: false, client: null })
    }

    const [client] = await db
      .select({
        id: profiles.id,
        fullName: profiles.fullName,
        email: profiles.email,
      })
      .from(profiles)
      .where(eq(profiles.id, patient.clientUserId))
      .limit(1)

    return ok({
      linked: true,
      client: client
        ? { id: client.id, full_name: client.fullName, email: client.email }
        : null,
    })
  } catch (error) {
    return fail(toActionError(error))
  }
}
