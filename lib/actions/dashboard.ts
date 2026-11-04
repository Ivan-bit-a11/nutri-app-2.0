"use server"

import { desc, eq } from "drizzle-orm"
import { getDb } from "@/lib/db"
import {
  profiles,
  patients,
  assessments,
  dietPlans,
  appointments,
} from "@/lib/db/schema"
import { getSession } from "@/lib/auth/session"
import { databaseError, unauthorized } from "@/server/core/errors"
import type { AppRole } from "@/server/core/auth"

function normalizeRole(value: unknown): AppRole {
  if (value === "super_admin" || value === "nutritionist" || value === "client") return value
  if (value === "admin") return "super_admin"
  if (value === "assistant") return "nutritionist"
  return "nutritionist"
}

export async function getDashboardData() {
  const session = await getSession()
  if (!session) throw unauthorized()

  const userId = session.userId
  const db = getDb()

  try {
    const [profileRows, patientRows, assessmentRows, planRows, appointmentRows] =
      await Promise.all([
        db.select().from(profiles).where(eq(profiles.id, userId)).limit(1),
        db
          .select()
          .from(patients)
          .where(eq(patients.nutritionistId, userId))
          .orderBy(desc(patients.createdAt)),
        db
          .select({ id: assessments.id, assessedAt: assessments.assessedAt })
          .from(assessments)
          .where(eq(assessments.nutritionistId, userId)),
        db
          .select({
            id: dietPlans.id,
            isActive: dietPlans.isActive,
            createdAt: dietPlans.createdAt,
          })
          .from(dietPlans)
          .where(eq(dietPlans.nutritionistId, userId)),
        db
          .select({
            id: appointments.id,
            scheduledAt: appointments.scheduledAt,
            status: appointments.status,
          })
          .from(appointments)
          .where(eq(appointments.nutritionistId, userId)),
      ])

    const profile = profileRows[0] ?? null
    const patientsList = patientRows.map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      phone: p.phone,
      status: p.status,
      goal: p.goal,
      created_at: p.createdAt,
      client_user_id: p.clientUserId,
    }))

    const role = normalizeRole(profile?.role ?? session.role)
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    return {
      profile: {
        full_name: profile?.fullName ?? session.fullName,
        email: profile?.email ?? session.email,
        role,
        clinic_name: profile?.clinicName ?? null,
        phone: profile?.phone ?? null,
      },
      patients: patientsList,
      stats: {
        totalPatients: patientsList.length,
        activePatients: patientsList.filter((p) => p.status === "active").length,
        assessments: assessmentRows.length,
        plans: planRows.length,
        activePlans: planRows.filter((p) => p.isActive).length,
        appointments: appointmentRows.length,
        recentPatients: patientsList.filter(
          (p) => p.created_at && new Date(p.created_at) >= thirtyDaysAgo,
        ).length,
      },
      assessments: assessmentRows.map((a) => ({
        id: a.id,
        assessed_at: a.assessedAt,
      })),
      plans: planRows.map((p) => ({
        id: p.id,
        is_active: p.isActive,
        created_at: p.createdAt,
      })),
      appointments: appointmentRows.map((a) => ({
        id: a.id,
        scheduled_at: a.scheduledAt,
        status: a.status,
      })),
    }
  } catch (error) {
    throw databaseError("Não foi possível carregar o dashboard", error)
  }
}
