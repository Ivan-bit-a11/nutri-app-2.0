"use server"

import { revalidatePath } from "next/cache"
import { eq, desc, sql, count } from "drizzle-orm"
import { getDb } from "@/lib/db"
import { profiles, users, consultationRequests, payments } from "@/lib/db/schema"
import { hashPassword } from "@/lib/auth/password"
import { getProfile } from "@/lib/actions/auth"
import { toActionError } from "@/server/core/errors"
import { fail, ok } from "@/server/core/result"
import { formDataToObject, parseWithSchema } from "@/server/core/validation"
import { z } from "zod"

const createUserSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
  full_name: z.string().trim().min(2).max(120),
  role: z.enum(["nutritionist", "client"]),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  clinic_name: z.string().trim().max(160).optional().or(z.literal("")),
  crn: z.string().trim().max(60).optional().or(z.literal("")),
  payment_phone: z.string().trim().max(40).optional().or(z.literal("")),
  payment_instructions: z.string().trim().max(1000).optional().or(z.literal("")),
})

const updateUserSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  clinic_name: z.string().trim().max(160).optional().or(z.literal("")),
  crn: z.string().trim().max(60).optional().or(z.literal("")),
  payment_phone: z.string().trim().max(40).optional().or(z.literal("")),
  payment_instructions: z.string().trim().max(1000).optional().or(z.literal("")),
  is_active: z.enum(["true", "false"]).optional(),
})

async function assertSuperAdmin() {
  const profile = await getProfile()
  if (!profile || profile.role !== "super_admin") {
    throw new Error("Acesso restrito ao Super Admin.")
  }
  return profile
}

function mapProfile(p: typeof profiles.$inferSelect) {
  return {
    id: p.id,
    full_name: p.fullName,
    email: p.email,
    role: p.role,
    phone: p.phone,
    clinic_name: p.clinicName,
    crn: p.crn,
    payment_phone: p.paymentPhone,
    payment_instructions: p.paymentInstructions,
    is_active: p.isActive,
    created_at: p.createdAt,
  }
}

export async function listAllUsers() {
  try {
    await assertSuperAdmin()
    const db = getDb()
    const rows = await db.select().from(profiles).orderBy(desc(profiles.createdAt))
    return ok(rows.map(mapProfile))
  } catch (error) {
    return fail(toActionError(error))
  }
}

export async function adminCreateUser(formData: FormData) {
  try {
    await assertSuperAdmin()
    const input = parseWithSchema(createUserSchema, formDataToObject(formData))
    const db = getDb()
    const email = input.email.toLowerCase().trim()

    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
    if (existing) {
      return fail({ code: "CONFLICT", message: "Já existe um utilizador com este email." })
    }

    const passwordHash = await hashPassword(input.password)

    const [user] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        fullName: input.full_name,
      })
      .returning({ id: users.id })

    await db.insert(profiles).values({
      id: user.id,
      fullName: input.full_name,
      email,
      role: input.role,
      phone: input.phone || null,
      clinicName: input.clinic_name || null,
      crn: input.crn || null,
      paymentPhone: input.payment_phone || null,
      paymentInstructions: input.payment_instructions || null,
      isActive: true,
    })

    revalidatePath("/admin")
    revalidatePath("/cliente/consultas")
    revalidatePath("/cliente/pagamentos")
    return ok({ id: user.id, email, role: input.role })
  } catch (error) {
    return fail(toActionError(error))
  }
}

export async function adminUpdateUser(formData: FormData) {
  try {
    await assertSuperAdmin()
    const input = parseWithSchema(updateUserSchema, formDataToObject(formData))
    const db = getDb()

    const patch: Partial<typeof profiles.$inferInsert> = {
      updatedAt: new Date(),
    }
    if (input.full_name !== undefined) patch.fullName = input.full_name
    if (input.phone !== undefined) patch.phone = input.phone || null
    if (input.clinic_name !== undefined) patch.clinicName = input.clinic_name || null
    if (input.crn !== undefined) patch.crn = input.crn || null
    if (input.payment_phone !== undefined) patch.paymentPhone = input.payment_phone || null
    if (input.payment_instructions !== undefined)
      patch.paymentInstructions = input.payment_instructions || null
    if (input.is_active !== undefined) patch.isActive = input.is_active === "true"

    await db.update(profiles).set(patch).where(eq(profiles.id, input.id))

    revalidatePath("/admin")
    revalidatePath("/cliente/consultas")
    return ok({ id: input.id })
  } catch (error) {
    return fail(toActionError(error))
  }
}

export async function adminStats() {
  try {
    await assertSuperAdmin()
    const db = getDb()

    const [nutritionists] = await db
      .select({ c: count() })
      .from(profiles)
      .where(eq(profiles.role, "nutritionist"))

    const [clients] = await db
      .select({ c: count() })
      .from(profiles)
      .where(eq(profiles.role, "client"))

    const [pendingConsultations] = await db
      .select({ c: count() })
      .from(consultationRequests)
      .where(eq(consultationRequests.status, "pending"))

    const [pendingPayments] = await db
      .select({ c: count() })
      .from(payments)
      .where(eq(payments.status, "submitted"))

    return ok({
      nutritionists: Number(nutritionists?.c ?? 0),
      clients: Number(clients?.c ?? 0),
      pendingConsultations: Number(pendingConsultations?.c ?? 0),
      pendingPayments: Number(pendingPayments?.c ?? 0),
    })
  } catch (error) {
    return fail(toActionError(error))
  }
}
