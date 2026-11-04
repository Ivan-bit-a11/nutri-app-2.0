import { getSession } from "@/lib/auth/session"
import { getDb } from "@/lib/db"
import { profiles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { forbidden, unauthorized } from "@/server/core/errors"

export type AppRole = "super_admin" | "nutritionist" | "client"

export interface ViewerContext {
  userId: string
  role: AppRole
  email: string | null
  fullName: string | null
}

const DEFAULT_ROLE: AppRole = "nutritionist"

function normalizeRole(value: unknown): AppRole {
  if (value === "super_admin" || value === "nutritionist" || value === "client") {
    return value
  }
  // legacy aliases
  if (value === "admin") return "super_admin"
  if (value === "assistant") return "nutritionist"
  return DEFAULT_ROLE
}

export async function requireViewer(): Promise<ViewerContext> {
  const session = await getSession()
  if (!session) {
    throw unauthorized()
  }

  // Confirma que a conta ainda existe e está activa
  try {
    const db = getDb()
    const [profile] = await db
      .select({
        role: profiles.role,
        isActive: profiles.isActive,
        fullName: profiles.fullName,
        email: profiles.email,
      })
      .from(profiles)
      .where(eq(profiles.id, session.userId))
      .limit(1)

    if (!profile || profile.isActive === false) {
      throw unauthorized("Conta desativada ou inexistente.")
    }

    return {
      userId: session.userId,
      role: normalizeRole(profile.role ?? session.role),
      email: profile.email ?? session.email,
      fullName: profile.fullName ?? session.fullName,
    }
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      throw error
    }
    // Se a BD falhar, confia na sessão JWT (evita lockout em outage curto)
    return {
      userId: session.userId,
      role: normalizeRole(session.role),
      email: session.email,
      fullName: session.fullName,
    }
  }
}

export async function requireRole(allowedRoles: AppRole[]): Promise<ViewerContext> {
  const viewer = await requireViewer()

  if (!allowedRoles.includes(viewer.role)) {
    throw forbidden("You do not have permission to perform this operation")
  }

  return viewer
}

export async function getOptionalViewer(): Promise<ViewerContext | null> {
  try {
    return await requireViewer()
  } catch {
    return null
  }
}
