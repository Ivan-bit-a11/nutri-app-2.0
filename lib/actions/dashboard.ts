"use server"

import { desc, eq } from "drizzle-orm"
import { getDb } from "@/lib/db"
import { appointments, assessments, dietPlans, patients, profiles } from "@/lib/db/schema"
import { requireViewer } from "@/server/core/auth"
import { databaseError } from "@/server/core/errors"

export type DashboardStats = {
  totalPatients: number
  activePatients: number
  newPatientsThisMonth: number
  totalAssessments: number
  assessmentsThisMonth: number
  activeDietPlans: number
  upcomingAppointments: number
}

export type DashboardPatient = {
  id: string
  nutritionist_id: string
  client_user_id: string | null
  name: string
  email: string | null
  phone: string | null
  dob: string | null
  sex: string | null
  height_cm: string | null
  goal: string | null
  activity_level: string | null
  status: string
  allergies: string[] | null
  conditions: string[] | null
  notes: string | null
  created_at: string | null
  updated_at: string | null
}

export type DashboardData = {
  profile: {
    id?: string
    full_name: string | null
    email: string | null
    clinic_name?: string | null
    crn?: string | null
    phone?: string | null
    role: string
    payment_phone?: string | null
    payment_instructions?: string | null
    is_active?: boolean
  }
  patients: DashboardPatient[]
  stats: DashboardStats
}

export async function getDashboardData(): Promise<DashboardData> {
  const viewer = await requireViewer()
  const userId = viewer.userId
  const db = getDb()

  try {
    const [profileRows, patientRows, assessmentRows, planRows, appointmentRows] = await Promise.all([
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

    const profileRow = profileRows[0]
    const role = viewer.role

    const profile: DashboardData["profile"] = profileRow
      ? {
          id: profileRow.id,
          full_name: profileRow.fullName,
          email: profileRow.email ?? viewer.email,
          clinic_name: profileRow.clinicName,
          crn: profileRow.crn,
          phone: profileRow.phone,
          role,
          payment_phone: profileRow.paymentPhone,
          payment_instructions: profileRow.paymentInstructions,
          is_active: profileRow.isActive,
        }
      : {
          full_name: viewer.fullName,
          email: viewer.email,
          role,
        }

    const toIso = (v: Date | string | null | undefined): string | null => {
      if (!v) return null
      if (v instanceof Date) return v.toISOString()
      return String(v)
    }

    const patientsMapped: DashboardPatient[] = patientRows.map((p) => ({
      id: p.id,
      nutritionist_id: p.nutritionistId,
      client_user_id: p.clientUserId,
      name: p.name,
      email: p.email,
      phone: p.phone,
      dob: p.dob,
      sex: p.sex,
      height_cm: p.heightCm,
      goal: p.goal,
      activity_level: p.activityLevel,
      status: p.status,
      allergies: p.allergies,
      conditions: p.conditions,
      notes: p.notes,
      created_at: toIso(p.createdAt),
      updated_at: toIso(p.updatedAt),
    }))

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const assessmentsMapped = assessmentRows.map((a) => ({
      id: a.id,
      assessed_at: toIso(a.assessedAt),
    }))

    const plansMapped = planRows.map((p) => ({
      id: p.id,
      is_active: p.isActive,
      created_at: toIso(p.createdAt),
    }))

    const appointmentsMapped = appointmentRows.map((a) => ({
      id: a.id,
      scheduled_at: toIso(a.scheduledAt),
      status: a.status,
    }))

    const stats: DashboardStats = {
      totalPatients: patientsMapped.length,
      activePatients: patientsMapped.filter((p) => p.status === "active").length,
      newPatientsThisMonth: patientsMapped.filter(
        (p) => p.created_at && new Date(p.created_at) > thirtyDaysAgo,
      ).length,
      totalAssessments: assessmentsMapped.length,
      assessmentsThisMonth: assessmentsMapped.filter(
        (a) => a.assessed_at && new Date(a.assessed_at) > thirtyDaysAgo,
      ).length,
      activeDietPlans: plansMapped.filter((p) => p.is_active).length,
      upcomingAppointments: appointmentsMapped.filter(
        (a) => a.status === "scheduled" && a.scheduled_at && new Date(a.scheduled_at) > now,
      ).length,
    }

    return {
      profile,
      patients: patientsMapped,
      stats,
    }
  } catch (error) {
    throw databaseError("Unable to load dashboard data", error)
  }
}
