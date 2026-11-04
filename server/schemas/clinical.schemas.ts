import { z } from "zod"

const optionalText = z.string().trim().optional().or(z.literal(""))

const maybeNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : value
}, z.number().optional())

export const createAssessmentSchema = z.object({
  patientId: z.string().uuid(),
  assessedAt: z.string().trim().optional().or(z.literal("")),
  weight: maybeNumber,
  height: maybeNumber,
  bmi: maybeNumber,
  bodyFat: maybeNumber,
  fatMass: maybeNumber,
  leanMass: maybeNumber,
  waist: maybeNumber,
  hip: maybeNumber,
  neck: maybeNumber,
  chest: maybeNumber,
  abdomen: maybeNumber,
  thigh: maybeNumber,
  triceps: maybeNumber,
  subscapular: maybeNumber,
  suprailiac: maybeNumber,
  notes: optionalText,
})

export const dietPlanItemSchema = z.object({
  food: z.string().trim().min(1).max(200),
  qty: z.number().nonnegative(),
  unit: z.string().trim().min(1).max(40),
  kcal: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  notes: z.string().trim().max(1000).optional(),
})

export const dietPlanMealSchema = z.object({
  name: z.string().trim().min(1).max(120),
  time: z.string().trim().max(20).optional(),
  notes: z.string().trim().max(2000).optional(),
  items: z.array(dietPlanItemSchema).min(1),
})

export const createDietPlanSchema = z.object({
  patientId: z.string().uuid(),
  title: z.string().trim().min(2).max(200),
  objective: z.string().trim().max(2000).optional(),
  supplements: z.string().trim().max(2000).optional(),
  hydration: z.number().int().positive().max(10000).optional(),
  notes: z.string().trim().max(5000).optional(),
  meals: z.array(dietPlanMealSchema).min(1),
  isActive: z.boolean().optional(),
})

export const updateDietPlanSchema = createDietPlanSchema.extend({
  id: z.string().uuid(),
})

export const toggleDietPlanSchema = z.object({
  id: z.string().uuid(),
  patientId: z.string().uuid(),
  isActive: z.boolean(),
})

export const createAppointmentSchema = z.object({
  patientId: z.string().uuid(),
  title: z.string().trim().min(2).max(200),
  scheduledAt: z
    .string()
    .trim()
    .min(1)
    .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid appointment date"),
  durationMinutes: z.coerce.number().int().min(10).max(240).default(60),
  notes: z.string().trim().max(5000).optional().or(z.literal("")),
})

export const aiDraftRequestSchema = z.object({
  tool: z.enum(["diet-plan", "grocery-list", "patient-summary", "meal-suggestion", "supplement-guide", "chat"]),
  context: z.string().trim().max(12000).optional().or(z.literal("")),
  patientId: z.string().uuid().optional(),
  messages: z.array(z.any()).optional(),
})

export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>
export type CreateDietPlanInput = z.infer<typeof createDietPlanSchema>
export type UpdateDietPlanInput = z.infer<typeof updateDietPlanSchema>
export type ToggleDietPlanInput = z.infer<typeof toggleDietPlanSchema>
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>
export type AiDraftRequestInput = z.infer<typeof aiDraftRequestSchema>
