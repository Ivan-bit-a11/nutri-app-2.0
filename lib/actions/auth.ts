"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import { getDb } from "@/lib/db"
import { profiles, users } from "@/lib/db/schema"
import { hashPassword, verifyPassword } from "@/lib/auth/password"
import {
  clearSessionCookie,
  createSessionToken,
  getSession as getJwtSession,
  setSessionCookie,
} from "@/lib/auth/session"
import { toActionError } from "@/server/core/errors"
import { fail, ok } from "@/server/core/result"
import { formDataToObject, parseWithSchema } from "@/server/core/validation"
import {
  forgotPasswordSchema,
  loginSchema,
  registerClientSchema,
  registerSchema,
} from "@/server/schemas/auth.schemas"

export type AppRole = "super_admin" | "nutritionist" | "client"

export interface LoginFormState {
  success: boolean
  message: string | null
}

function roleRedirect(role: string | null | undefined): string {
  switch (role) {
    case "super_admin":
      return "/admin"
    case "client":
      return "/cliente"
    case "nutritionist":
    default:
      return "/dashboard"
  }
}

export async function login(formData: FormData) {
  try {
    const input = parseWithSchema(loginSchema, formDataToObject(formData))
    const db = getDb()

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email.toLowerCase().trim()))
      .limit(1)

    if (!user) {
      return fail({ code: "UNAUTHORIZED", message: "Email ou password incorrectos." })
    }

    const valid = await verifyPassword(input.password, user.passwordHash)
    if (!valid) {
      return fail({ code: "UNAUTHORIZED", message: "Email ou password incorrectos." })
    }

    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1)

    if (profile && profile.isActive === false) {
      return fail({
        code: "UNAUTHORIZED",
        message: "Conta desativada. Contacte o administrador.",
      })
    }

    const role = (profile?.role as AppRole) ?? "nutritionist"

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role,
      fullName: profile?.fullName ?? user.fullName ?? null,
    })
    await setSessionCookie(token)

    revalidatePath("/", "layout")
    return ok({
      redirectTo: roleRedirect(role) as "/admin" | "/cliente" | "/dashboard",
    })
  } catch (error) {
    return fail(toActionError(error))
  }
}

export async function loginWithState(
  _: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const result = await login(formData)

  if (!result.success) {
    return {
      success: false,
      message: result.error.message,
    }
  }

  return {
    success: true,
    message: null,
  }
}

/** Self-service registration for clients only */
export async function registerClient(formData: FormData) {
  try {
    const input = parseWithSchema(registerClientSchema, formDataToObject(formData))
    const db = getDb()
    const email = input.email.toLowerCase().trim()

    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
    if (existing) {
      return fail({ code: "CONFLICT", message: "Já existe uma conta com este email." })
    }

    const passwordHash = await hashPassword(input.password)
    const [created] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        fullName: input.full_name,
      })
      .returning({ id: users.id })

    await db.insert(profiles).values({
      id: created.id,
      fullName: input.full_name,
      email,
      phone: input.phone || null,
      role: "client",
      isActive: true,
    })

    return ok({ redirectTo: "/register/success" as const })
  } catch (error) {
    return fail(toActionError(error))
  }
}

/** Kept for backwards compatibility; prefer registerClient or adminCreateUser */
export async function register(formData: FormData) {
  try {
    const input = parseWithSchema(registerSchema, formDataToObject(formData))
    const role = input.role === "client" ? "client" : "nutritionist"
    const db = getDb()
    const email = input.email.toLowerCase().trim()

    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
    if (existing) {
      return fail({ code: "CONFLICT", message: "Já existe uma conta com este email." })
    }

    const passwordHash = await hashPassword(input.password)
    const [created] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        fullName: input.full_name,
      })
      .returning({ id: users.id })

    await db.insert(profiles).values({
      id: created.id,
      fullName: input.full_name,
      email,
      clinicName: input.clinic_name || null,
      crn: input.crn || null,
      phone: input.phone || null,
      role,
      isActive: true,
    })

    return ok({ redirectTo: "/register/success" as const })
  } catch (error) {
    return fail(toActionError(error))
  }
}

export async function forgotPassword(formData: FormData) {
  try {
    // Com Neon não há email de reset automático.
    // Mostramos mensagem genérica (não revelar se o email existe).
    parseWithSchema(forgotPasswordSchema, formDataToObject(formData))
    return ok({
      email: "ok",
      message:
        "Se existir uma conta com este email, contacte o administrador para redefinir a password (ou implemente email reset no próximo passo).",
    })
  } catch (error) {
    return fail(toActionError(error))
  }
}

export async function signOut() {
  try {
    await clearSessionCookie()
  } catch (error) {
    console.error("Sign-out failed:", error)
  }
  revalidatePath("/", "layout")
  redirect("/login")
}

export async function getSession() {
  try {
    return await getJwtSession()
  } catch (error) {
    console.error("getSession failed:", error)
    return null
  }
}

export async function getProfile() {
  try {
    const session = await getJwtSession()
    if (!session) return null

    const db = getDb()
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, session.userId))
      .limit(1)

    return profile ?? null
  } catch (error) {
    console.error("getProfile failed:", error)
    return null
  }
}

export async function requireRole(allowed: AppRole[]) {
  const profile = await getProfile()
  if (!profile || !allowed.includes(profile.role as AppRole)) {
    redirect("/login")
  }
  return profile
}
