"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
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
  status: z.enum(["pending", "awaiting_payment", "paid", "approved", "rejected", "cancelled"]),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
})

export async function listActiveNutritionists() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, full_name, email, clinic_name, phone, payment_phone, payment_instructions, avatar_url",
      )
      .eq("role", "nutritionist")
      .eq("is_active", true)
      .order("full_name")

    if (error) return fail({ code: "DATABASE_ERROR", message: error.message })
    return ok(data ?? [])
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

    const supabase = await createClient()
    const input = parseWithSchema(requestConsultationSchema, formDataToObject(formData))

    const { data, error } = await supabase
      .from("consultation_requests")
      .insert({
        client_user_id: profile.id,
        nutritionist_id: input.nutritionist_id,
        reason: input.reason || null,
        preferred_date: input.preferred_date || null,
        notes: input.notes || null,
        status: "pending",
      })
      .select()
      .single()

    if (error) return fail({ code: "DATABASE_ERROR", message: error.message })

    revalidatePath("/cliente")
    revalidatePath("/cliente/consultas")
    revalidatePath("/dashboard/pagamentos")
    return ok(data)
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

    const supabase = await createClient()
    const input = parseWithSchema(submitPaymentSchema, formDataToObject(formData))

    const amountNum =
      input.amount && input.amount.trim() !== ""
        ? Number.parseFloat(input.amount.replace(",", "."))
        : null

    const { data: payment, error } = await supabase
      .from("payments")
      .insert({
        consultation_request_id: input.consultation_request_id || null,
        client_user_id: profile.id,
        nutritionist_id: input.nutritionist_id,
        amount: amountNum,
        proof_text: input.proof_text,
        payment_phone: input.payment_phone || null,
        status: "submitted",
      })
      .select()
      .single()

    if (error) return fail({ code: "DATABASE_ERROR", message: error.message })

    if (input.consultation_request_id) {
      await supabase
        .from("consultation_requests")
        .update({ status: "awaiting_payment" })
        .eq("id", input.consultation_request_id)
        .eq("client_user_id", profile.id)
    }

    revalidatePath("/cliente")
    revalidatePath("/cliente/pagamentos")
    revalidatePath("/dashboard/pagamentos")
    return ok(payment)
  } catch (error) {
    return fail(toActionError(error))
  }
}

async function attachProfiles<T extends Record<string, unknown>>(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: T[],
  clientKey: string,
  nutritionistKey: string,
) {
  const ids = new Set<string>()
  for (const row of rows) {
    const c = row[clientKey]
    const n = row[nutritionistKey]
    if (typeof c === "string") ids.add(c)
    if (typeof n === "string") ids.add(n)
  }
  if (ids.size === 0) {
    return rows.map((r) => ({ ...r, client: null, nutritionist: null }))
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, clinic_name, payment_phone, payment_instructions")
    .in("id", [...ids])

  const map = new Map((profiles ?? []).map((p) => [p.id, p]))

  return rows.map((row) => {
    const cid = row[clientKey]
    const nid = row[nutritionistKey]
    return {
      ...row,
      client: typeof cid === "string" ? map.get(cid) ?? null : null,
      nutritionist: typeof nid === "string" ? map.get(nid) ?? null : null,
    }
  })
}

/**
 * Cria ou reutiliza paciente para este cliente + nutricionista (sem duplicar).
 */
async function ensurePatientForClient(
  supabase: Awaited<ReturnType<typeof createClient>>,
  nutritionistId: string,
  clientUserId: string,
  consultationId?: string | null,
) {
  const { data: existingByClient } = await supabase
    .from("patients")
    .select("id")
    .eq("nutritionist_id", nutritionistId)
    .eq("client_user_id", clientUserId)
    .maybeSingle()

  if (existingByClient?.id) {
    if (consultationId) {
      await supabase
        .from("consultation_requests")
        .update({ patient_id: existingByClient.id, status: "approved" })
        .eq("id", consultationId)
    }
    return existingByClient.id as string
  }

  const { data: clientProfile } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone")
    .eq("id", clientUserId)
    .maybeSingle()

  const name =
    clientProfile?.full_name?.trim() || clientProfile?.email?.split("@")[0] || "Cliente"
  const email = clientProfile?.email || null

  if (email) {
    const { data: byEmail } = await supabase
      .from("patients")
      .select("id")
      .eq("nutritionist_id", nutritionistId)
      .eq("email", email)
      .maybeSingle()

    if (byEmail?.id) {
      await supabase
        .from("patients")
        .update({
          client_user_id: clientUserId,
          name,
          phone: clientProfile?.phone || null,
        })
        .eq("id", byEmail.id)

      if (consultationId) {
        await supabase
          .from("consultation_requests")
          .update({ patient_id: byEmail.id, status: "approved" })
          .eq("id", consultationId)
      }
      return byEmail.id as string
    }
  }

  const { data: created, error } = await supabase
    .from("patients")
    .insert({
      nutritionist_id: nutritionistId,
      client_user_id: clientUserId,
      name,
      email,
      phone: clientProfile?.phone || null,
      status: "active",
      notes: "Criado automaticamente após confirmação de pagamento.",
    })
    .select("id")
    .single()

  if (error) {
    console.error("ensurePatientForClient:", error.message)
    throw error
  }

  if (consultationId && created?.id) {
    await supabase
      .from("consultation_requests")
      .update({ patient_id: created.id, status: "approved" })
      .eq("id", consultationId)
  }

  return created.id as string
}

export async function listMyConsultationRequests() {
  try {
    const profile = await getProfile()
    if (!profile) return fail({ code: "UNAUTHORIZED", message: "Não autenticado." })

    const { getDb } = await import("@/lib/db")
    const { consultationRequests, profiles } = await import("@/lib/db/schema")
    const { desc, eq } = await import("drizzle-orm")
    const db = getDb()

    let rows
    if (profile.role === "client") {
      rows = await db
        .select()
        .from(consultationRequests)
        .where(eq(consultationRequests.clientUserId, profile.id))
        .orderBy(desc(consultationRequests.createdAt))
    } else if (profile.role === "nutritionist") {
      rows = await db
        .select()
        .from(consultationRequests)
        .where(eq(consultationRequests.nutritionistId, profile.id))
        .orderBy(desc(consultationRequests.createdAt))
    } else {
      rows = await db
        .select()
        .from(consultationRequests)
        .orderBy(desc(consultationRequests.createdAt))
    }

    const profileRows = await db.select().from(profiles)
    const byId = new Map(profileRows.map((p) => [p.id, p]))

    const enriched = rows.map((r) => {
      const client = byId.get(r.clientUserId)
      const nutritionist = byId.get(r.nutritionistId)
      return {
        id: r.id,
        status: r.status,
        reason: r.notes,
        preferred_date: r.preferredDate,
        preferred_time: r.preferredTime,
        notes: r.notes,
        created_at:
          r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt ?? ""),
        client_user_id: r.clientUserId,
        nutritionist_id: r.nutritionistId,
        client: client
          ? { full_name: client.fullName, email: client.email, phone: client.phone }
          : null,
        nutritionist: nutritionist
          ? { full_name: nutritionist.fullName, email: nutritionist.email, phone: nutritionist.phone }
          : null,
      }
    })

    return ok(enriched)
  } catch (error) {
    return fail(toActionError(error))
  }
}

export async function listMyPayments() {
  try {
    const profile = await getProfile()
    if (!profile) return fail({ code: "UNAUTHORIZED", message: "Não autenticado." })

    const { getDb } = await import("@/lib/db")
    const { payments, profiles } = await import("@/lib/db/schema")
    const { desc, eq } = await import("drizzle-orm")
    const db = getDb()

    let rows
    if (profile.role === "client") {
      rows = await db
        .select()
        .from(payments)
        .where(eq(payments.clientUserId, profile.id))
        .orderBy(desc(payments.createdAt))
    } else if (profile.role === "nutritionist") {
      rows = await db
        .select()
        .from(payments)
        .where(eq(payments.nutritionistId, profile.id))
        .orderBy(desc(payments.createdAt))
    } else {
      rows = await db.select().from(payments).orderBy(desc(payments.createdAt))
    }

    const profileRows = await db.select().from(profiles)
    const byId = new Map(profileRows.map((p) => [p.id, p]))

    const enriched = rows.map((r) => {
      const client = byId.get(r.clientUserId)
      const nutritionist = byId.get(r.nutritionistId)
      return {
        id: r.id,
        status: r.status,
        amount: r.amount != null ? Number(r.amount) : null,
        proof_text: r.proofText,
        payment_phone: r.paymentPhone,
        notes: r.notes,
        consultation_request_id: r.consultationRequestId,
        created_at:
          r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt ?? ""),
        client_user_id: r.clientUserId,
        nutritionist_id: r.nutritionistId,
        client: client
          ? { full_name: client.fullName, email: client.email, phone: client.phone }
          : null,
        nutritionist: nutritionist
          ? { full_name: nutritionist.fullName, email: nutritionist.email, phone: nutritionist.phone }
          : null,
      }
    })

    return ok(enriched)
  } catch (error) {
    return fail(toActionError(error))
  }
}

export async function reviewPayment(formData: FormData) {
  try {
    const profile = await getProfile()
    if (!profile || (profile.role !== "nutritionist" && profile.role !== "super_admin")) {
      return fail({ code: "UNAUTHORIZED", message: "Sem permissão." })
    }

    const supabase = await createClient()
    const input = parseWithSchema(reviewPaymentSchema, formDataToObject(formData))

    const { data: payment, error: fetchErr } = await supabase
      .from("payments")
      .select("*")
      .eq("id", input.payment_id)
      .maybeSingle()

    if (fetchErr || !payment) {
      return fail({ code: "NOT_FOUND", message: "Pagamento não encontrado." })
    }

    if (profile.role === "nutritionist" && payment.nutritionist_id !== profile.id) {
      return fail({ code: "UNAUTHORIZED", message: "Este pagamento não é seu." })
    }

    const { data, error } = await supabase
      .from("payments")
      .update({
        status: input.status,
        notes: input.notes || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: profile.id,
      })
      .eq("id", input.payment_id)
      .select()
      .single()

    if (error) return fail({ code: "DATABASE_ERROR", message: error.message })

    if (input.status === "confirmed") {
      let consultId = payment.consultation_request_id as string | null

      if (consultId) {
        await supabase
          .from("consultation_requests")
          .update({ status: "paid" })
          .eq("id", consultId)
      } else {
        const { data: openReq } = await supabase
          .from("consultation_requests")
          .select("id")
          .eq("client_user_id", payment.client_user_id)
          .eq("nutritionist_id", payment.nutritionist_id)
          .in("status", ["pending", "awaiting_payment"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()

        if (openReq?.id) {
          consultId = openReq.id
          await supabase
            .from("consultation_requests")
            .update({ status: "paid" })
            .eq("id", consultId)
          await supabase
            .from("payments")
            .update({ consultation_request_id: consultId })
            .eq("id", payment.id)
        }
      }

      try {
        await ensurePatientForClient(
          supabase,
          payment.nutritionist_id,
          payment.client_user_id,
          consultId,
        )
      } catch (e) {
        console.error("Falha ao criar paciente após pagamento:", e)
      }
    }

    revalidatePath("/dashboard/pagamentos")
    revalidatePath("/dashboard/patients")
    revalidatePath("/cliente")
    revalidatePath("/cliente/consultas")
    revalidatePath("/cliente/pagamentos")
    return ok(data)
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

    const supabase = await createClient()
    const input = parseWithSchema(updateConsultationSchema, formDataToObject(formData))

    const { data: row, error: fetchErr } = await supabase
      .from("consultation_requests")
      .select("*")
      .eq("id", input.id)
      .maybeSingle()

    if (fetchErr || !row) {
      return fail({ code: "NOT_FOUND", message: "Pedido não encontrado." })
    }

    if (profile.role === "nutritionist" && row.nutritionist_id !== profile.id) {
      return fail({ code: "UNAUTHORIZED", message: "Este pedido não é seu." })
    }

    if (input.status === "approved" && row.status !== "paid" && profile.role !== "super_admin") {
      return fail({
        code: "VALIDATION_ERROR",
        message: "Só pode aprovar a consulta depois de confirmar o pagamento.",
      })
    }

    const { data, error } = await supabase
      .from("consultation_requests")
      .update({
        status: input.status,
        notes: input.notes || row.notes,
      })
      .eq("id", input.id)
      .select()
      .single()

    if (error) return fail({ code: "DATABASE_ERROR", message: error.message })

    if (input.status === "approved") {
      try {
        await ensurePatientForClient(
          supabase,
          row.nutritionist_id,
          row.client_user_id,
          row.id,
        )
      } catch (e) {
        console.error("Falha ao criar paciente na aprovação:", e)
      }
    }

    revalidatePath("/dashboard/pagamentos")
    revalidatePath("/dashboard/patients")
    revalidatePath("/cliente")
    revalidatePath("/cliente/consultas")
    return ok(data)
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

    const supabase = await createClient()

    const { data: patients } = await supabase
      .from("patients")
      .select("id")
      .eq("client_user_id", profile.id)

    const patientIds = (patients ?? []).map((p) => p.id)
    if (patientIds.length === 0) return ok([])

    const { data, error } = await supabase
      .from("diet_plans")
      .select("*")
      .in("patient_id", patientIds)
      .eq("is_active", true)
      .not("published_to_client_at", "is", null)
      .order("published_to_client_at", { ascending: false })

    if (error) return fail({ code: "DATABASE_ERROR", message: error.message })

    const plans = data ?? []
    if (plans.length === 0) return ok([])

    const nutriIds = [...new Set(plans.map((p) => p.nutritionist_id).filter(Boolean))]
    const { data: nutris } = await supabase
      .from("profiles")
      .select("id, full_name, clinic_name, phone, payment_phone")
      .in("id", nutriIds)

    const nutriMap = new Map((nutris ?? []).map((n) => [n.id, n]))

    const withMeals = []
    for (const plan of plans) {
      const { data: meals } = await supabase
        .from("meals")
        .select("*, meal_items(*)")
        .eq("diet_plan_id", plan.id)
        .order("sort_order")

      withMeals.push({
        ...plan,
        meals: meals ?? [],
        nutritionist: nutriMap.get(plan.nutritionist_id) ?? null,
      })
    }

    return ok(withMeals)
  } catch (error) {
    return fail(toActionError(error))
  }
}