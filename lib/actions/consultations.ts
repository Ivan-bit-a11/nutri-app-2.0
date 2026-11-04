"use server"

import { and, desc, eq, inArray, isNotNull } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getDb } from "@/lib/db"
import {
  profiles,
  consultationRequests,
  payments,
  patients,
  dietPlans,
  meals,
  mealItems,
} from "@/lib/db/schema"
import { toActionError } from "@/server/core/errors"
import { fail, ok } from "@/server/core/result"
import { formDataToObject, parseWithSchema } from "@/server/core/validation"
import { z } from "zod"
import { getProfile } from "@/lib/actions/auth"

const requestConsultationSchema = z.object({
  nutritionist_id: z.string().uuid(),
  reason: z.string().trim().max(500).optional().or(z.literal("")),
  preferred_date: z.string().optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
})

const submitPaymentSchema = z.object({
  consultation_request_id: z.string().uuid().optional().or(z.literal("")),
  nutritionist_id: z.string().uuid(),
  amount: z.string().optional().or(z.literal("")),
  proof_text: z.string().trim().min(10).max(4000),
  payment_phone: z.string().trim().max(40).optional().or(z.literal("")),
})

const reviewPaymentSchema = z.object({
  payment_id: z.string().uuid(),
  status: z.enum(["confirmed", "rejected"]),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
})

const updateConsultationSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "payment_pending", "payment_confirmed", "approved", "rejected", "cancelled"]),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
})

/** Lista nutricionistas activos para o cliente escolher */
export async function listActiveNutritionists() {
  try {
    const db = getDb()
    const rows = await db
      .select({
        id: profiles.id,
        fullName: profiles.fullName,
        email: profiles.email,
        clinicName: profiles.clinicName,
        phone: profiles.phone,
        paymentPhone: profiles.paymentPhone,
        paymentInstructions: profiles.paymentInstructions,
        avatarUrl: profiles.avatarUrl,
      })
      .from(profiles)
      .where(and(eq(profiles.role, "nutritionist"), eq(profiles.isActive, true)))
      .orderBy(profiles.fullName)

    const data = rows.map((r) => ({
      id: r.id,
      full_name: r.fullName,
      email: r.email,
      clinic_name: r.clinicName,
      phone: r.phone,
      payment_phone: r.paymentPhone,
      payment_instructions: r.paymentInstructions,
      avatar_url: r.avatarUrl,
    }))
    return ok(data)
  } catch (error) {
    return fail(toActionError(error))
  }
}

export async function requestConsultation(formData: FormData) {
  try {
    const profile = await getProfile()
    if (!profile || profile.role !== "client") {
      return fail({ code: "UNAUTHORIZED", message: "Apenas clientes podem solicitar consulta." })
    }

    const input = parseWithSchema(requestConsultationSchema, formDataToObject(formData))
    const db = getDb()

    const notesParts = [input.reason, input.notes].filter((x) => x && String(x).trim())
    const notes = notesParts.length ? notesParts.join(" | ") : null

    const [row] = await db
      .insert(consultationRequests)
      .values({
        clientUserId: profile.id,
        nutritionistId: input.nutritionist_id,
        preferredDate: input.preferred_date || null,
        notes,
        status: "pending",
      })
      .returning()

    revalidatePath("/cliente")
    revalidatePath("/cliente/consultas")
    revalidatePath("/dashboard/pagamentos")
    return ok({
      id: row.id,
      client_user_id: row.clientUserId,
      nutritionist_id: row.nutritionistId,
      preferred_date: row.preferredDate,
      notes: row.notes,
      status: row.status,
      created_at: row.createdAt,
    })
  } catch (error) {
    return fail(toActionError(error))
  }
}

export async function submitPaymentProof(formData: FormData) {
  try {
    const profile = await getProfile()
    if (!profile || profile.role !== "client") {
      return fail({ code: "UNAUTHORIZED", message: "Apenas clientes podem enviar comprovativo." })
    }

    const input = parseWithSchema(submitPaymentSchema, formDataToObject(formData))
    const db = getDb()

    const amountNum =
      input.amount && String(input.amount).trim() !== ""
        ? Number.parseFloat(String(input.amount).replace(",", "."))
        : null

    const [payment] = await db
      .insert(payments)
      .values({
        consultationRequestId: input.consultation_request_id || null,
        clientUserId: profile.id,
        nutritionistId: input.nutritionist_id,
        amount: amountNum != null && Number.isFinite(amountNum) ? String(amountNum) : null,
        proofText: input.proof_text,
        paymentPhone: input.payment_phone || null,
        status: "submitted",
      })
      .returning()

    if (input.consultation_request_id) {
      await db
        .update(consultationRequests)
        .set({ status: "payment_pending", updatedAt: new Date() })
        .where(eq(consultationRequests.id, input.consultation_request_id))
    }

    revalidatePath("/cliente")
    revalidatePath("/cliente/pagamentos")
    revalidatePath("/dashboard/pagamentos")
    return ok({
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      proof_text: payment.proofText,
      created_at: payment.createdAt,
    })
  } catch (error) {
    return fail(toActionError(error))
  }
}

export async function listMyConsultationRequests() {
  try {
    const profile = await getProfile()
    if (!profile) {
      return fail({ code: "UNAUTHORIZED", message: "Não autenticado." })
    }

    const db = getDb()
    const base = db
      .select({
        req: consultationRequests,
        nutriName: profiles.fullName,
        nutriClinic: profiles.clinicName,
      })
      .from(consultationRequests)
      .leftJoin(profiles, eq(consultationRequests.nutritionistId, profiles.id))
      .orderBy(desc(consultationRequests.createdAt))

    let rows
    if (profile.role === "client") {
      rows = await base.where(eq(consultationRequests.clientUserId, profile.id))
    } else if (profile.role === "nutritionist") {
      rows = await base.where(eq(consultationRequests.nutritionistId, profile.id))
    } else {
      rows = await base
    }

    const data = rows.map((r) => ({
      id: r.req.id,
      status: r.req.status,
      reason: r.req.notes,
      preferred_date: r.req.preferredDate,
      notes: r.req.notes,
      created_at: r.req.createdAt,
      nutritionist_id: r.req.nutritionistId,
      client_user_id: r.req.clientUserId,
      nutritionist: r.nutriName
        ? { full_name: r.nutriName, clinic_name: r.nutriClinic }
        : null,
    }))
    return ok(data)
  } catch (error) {
    return fail(toActionError(error))
  }
}

export async function listMyPayments() {
  try {
    const profile = await getProfile()
    if (!profile) {
      return fail({ code: "UNAUTHORIZED", message: "Não autenticado." })
    }

    const db = getDb()
    const base = db
      .select({
        pay: payments,
        nutriName: profiles.fullName,
      })
      .from(payments)
      .leftJoin(profiles, eq(payments.nutritionistId, profiles.id))
      .orderBy(desc(payments.createdAt))

    let rows
    if (profile.role === "client") {
      rows = await base.where(eq(payments.clientUserId, profile.id))
    } else if (profile.role === "nutritionist") {
      rows = await base.where(eq(payments.nutritionistId, profile.id))
    } else {
      rows = await base
    }

    const data = rows.map((r) => ({
      id: r.pay.id,
      status: r.pay.status,
      amount: r.pay.amount != null ? Number(r.pay.amount) : null,
      proof_text: r.pay.proofText,
      created_at: r.pay.createdAt,
      nutritionist_id: r.pay.nutritionistId,
      nutritionist: r.nutriName ? { full_name: r.nutriName } : null,
    }))
    return ok(data)
  } catch (error) {
    return fail(toActionError(error))
  }
}

/** Garante paciente ligado ao cliente para este nutricionista */
async function ensurePatientForClient(
  nutritionistId: string,
  clientUserId: string,
  consultationId?: string | null,
) {
  const db = getDb()

  // Já existe ligação cliente ↔ nutricionista?
  const [existing] = await db
    .select({ id: patients.id })
    .from(patients)
    .where(and(eq(patients.nutritionistId, nutritionistId), eq(patients.clientUserId, clientUserId)))
    .limit(1)

  if (existing) {
    if (consultationId) {
      await db
        .update(consultationRequests)
        .set({ status: "approved", updatedAt: new Date() })
        .where(eq(consultationRequests.id, consultationId))
    }
    // garantir activo
    await db
      .update(patients)
      .set({ status: "active", updatedAt: new Date() })
      .where(eq(patients.id, existing.id))
    return existing.id
  }

  const [clientProfile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, clientUserId))
    .limit(1)

  const name =
    clientProfile?.fullName?.trim() ||
    clientProfile?.email?.split("@")[0] ||
    "Cliente"

  const [created] = await db
    .insert(patients)
    .values({
      nutritionistId,
      clientUserId,
      name,
      email: clientProfile?.email ?? null,
      phone: clientProfile?.phone ?? null,
      status: "active",
      allergies: [],
      conditions: [],
      notes: consultationId
        ? `Criado automaticamente após pagamento/consulta (${consultationId})`
        : "Criado automaticamente após confirmação de pagamento",
    })
    .returning({ id: patients.id })

  if (!created?.id) {
    throw new Error("Falha ao inserir paciente na base de dados.")
  }

  if (consultationId) {
    await db
      .update(consultationRequests)
      .set({ status: "approved", updatedAt: new Date() })
      .where(eq(consultationRequests.id, consultationId))
  }

  return created.id
}

export async function reviewPayment(formData: FormData) {
  try {
    const profile = await getProfile()
    if (!profile || (profile.role !== "nutritionist" && profile.role !== "super_admin")) {
      return fail({ code: "UNAUTHORIZED", message: "Sem permissão." })
    }

    const input = parseWithSchema(reviewPaymentSchema, formDataToObject(formData))
    const db = getDb()

    const [payment] = await db.select().from(payments).where(eq(payments.id, input.payment_id)).limit(1)
    if (!payment) return fail({ code: "NOT_FOUND", message: "Pagamento não encontrado." })

    if (profile.role === "nutritionist" && payment.nutritionistId !== profile.id) {
      return fail({ code: "FORBIDDEN", message: "Este pagamento não é seu." })
    }

    await db
      .update(payments)
      .set({
        status: input.status,
        notes: input.notes || payment.notes,
        reviewedAt: new Date(),
        reviewedBy: profile.id,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, input.payment_id))

    if (input.status === "confirmed") {
      if (payment.consultationRequestId) {
        await db
          .update(consultationRequests)
          .set({ status: "payment_confirmed", updatedAt: new Date() })
          .where(eq(consultationRequests.id, payment.consultationRequestId))
      }

      // Obrigatório: criar / activar paciente no dashboard do nutricionista
      const patientId = await ensurePatientForClient(
        payment.nutritionistId,
        payment.clientUserId,
        payment.consultationRequestId,
      )

      // Após pagamento confirmado, a consulta fica aprovada
      if (payment.consultationRequestId) {
        await db
          .update(consultationRequests)
          .set({ status: "approved", updatedAt: new Date() })
          .where(eq(consultationRequests.id, payment.consultationRequestId))
      }

      revalidatePath("/dashboard/pagamentos")
      revalidatePath("/dashboard/patients")
      revalidatePath(`/dashboard/patients/${patientId}`)
      revalidatePath("/cliente")
      revalidatePath("/cliente/consultas")
      return ok({ id: input.payment_id, status: input.status, patient_id: patientId })
    }

    revalidatePath("/dashboard/pagamentos")
    revalidatePath("/dashboard/patients")
    revalidatePath("/cliente")
    return ok({ id: input.payment_id, status: input.status })
  } catch (error) {
    return fail(toActionError(error))
  }
}

export async function updateConsultationStatus(formData: FormData) {
  try {
    const profile = await getProfile()
    if (!profile || (profile.role !== "nutritionist" && profile.role !== "super_admin")) {
      return fail({ code: "UNAUTHORIZED", message: "Sem permissão." })
    }

    const input = parseWithSchema(updateConsultationSchema, formDataToObject(formData))
    const db = getDb()

    const [row] = await db
      .select()
      .from(consultationRequests)
      .where(eq(consultationRequests.id, input.id))
      .limit(1)

    if (!row) return fail({ code: "NOT_FOUND", message: "Pedido não encontrado." })

    if (profile.role === "nutritionist" && row.nutritionistId !== profile.id) {
      return fail({ code: "FORBIDDEN", message: "Este pedido não é seu." })
    }

    await db
      .update(consultationRequests)
      .set({
        status: input.status,
        notes: input.notes || row.notes,
        updatedAt: new Date(),
      })
      .where(eq(consultationRequests.id, input.id))

    if (input.status === "approved") {
      try {
        await ensurePatientForClient(row.nutritionistId, row.clientUserId, row.id)
      } catch (e) {
        console.error("Falha ao criar paciente na aprovação:", e)
      }
    }

    revalidatePath("/dashboard/pagamentos")
    revalidatePath("/dashboard/patients")
    revalidatePath("/cliente")
    revalidatePath("/cliente/consultas")
    return ok({ id: input.id, status: input.status })
  } catch (error) {
    return fail(toActionError(error))
  }
}

export async function listClientDietPlans() {
  try {
    const profile = await getProfile()
    if (!profile || profile.role !== "client") {
      return fail({ code: "UNAUTHORIZED", message: "Apenas clientes." })
    }

    const db = getDb()

    const patientRows = await db
      .select({ id: patients.id })
      .from(patients)
      .where(eq(patients.clientUserId, profile.id))

    const patientIds = patientRows.map((p) => p.id)
    if (patientIds.length === 0) return ok([])

    const plans = await db
      .select()
      .from(dietPlans)
      .where(
        and(
          inArray(dietPlans.patientId, patientIds),
          eq(dietPlans.isActive, true),
          isNotNull(dietPlans.publishedToClientAt),
        ),
      )
      .orderBy(desc(dietPlans.publishedToClientAt))

    if (plans.length === 0) return ok([])

    const nutriIds = [...new Set(plans.map((p) => p.nutritionistId).filter(Boolean))]
    const nutris =
      nutriIds.length > 0
        ? await db
            .select({
              id: profiles.id,
              fullName: profiles.fullName,
              clinicName: profiles.clinicName,
              phone: profiles.phone,
              paymentPhone: profiles.paymentPhone,
            })
            .from(profiles)
            .where(inArray(profiles.id, nutriIds))
        : []

    const nutriMap = new Map(
      nutris.map((n) => [
        n.id,
        {
          full_name: n.fullName,
          clinic_name: n.clinicName,
          phone: n.phone,
          payment_phone: n.paymentPhone,
        },
      ]),
    )

    const withMeals = []
    for (const plan of plans) {
      const mealRows = await db
        .select()
        .from(meals)
        .where(eq(meals.dietPlanId, plan.id))
        .orderBy(meals.sortOrder)

      const mealsOut = []
      for (const meal of mealRows) {
        const items = await db.select().from(mealItems).where(eq(mealItems.mealId, meal.id))
        mealsOut.push({
          id: meal.id,
          name: meal.name,
          time_of_day: meal.timeOfDay,
          sort_order: meal.sortOrder,
          meal_items: items.map((it) => ({
            id: it.id,
            food_name: it.foodName,
            quantity: it.quantity,
            unit: it.unit,
            kcal: it.kcal != null ? Number(it.kcal) : null,
          })),
        })
      }

      withMeals.push({
        id: plan.id,
        title: plan.title,
        description: plan.description,
        daily_kcal: plan.dailyKcal,
        protein_g: plan.proteinG,
        carbs_g: plan.carbsG,
        fat_g: plan.fatG,
        notes: plan.notes,
        created_at: plan.createdAt,
        meals: mealsOut,
        nutritionist: nutriMap.get(plan.nutritionistId) ?? null,
      })
    }

    return ok(withMeals)
  } catch (error) {
    return fail(toActionError(error))
  }
}
