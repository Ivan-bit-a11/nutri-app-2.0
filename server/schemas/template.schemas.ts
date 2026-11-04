import { z } from "zod"

const optionalText = z.string().trim().optional().or(z.literal(""))

const optionalNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : value
}, z.number().optional())

const stringListSchema = z.array(z.string().trim().min(1).max(200)).default([])

const estimatedNutritionSchema = z.object({
  kcal: optionalNumber,
  protein: optionalNumber,
  carbs: optionalNumber,
  fat: optionalNumber,
})

export const templateMealItemSchema = z.object({
  foodName: z.string().trim().min(1).max(200),
  quantity: z.string().trim().max(40).optional().or(z.literal("")),
  unit: z.string().trim().max(40).optional().or(z.literal("")),
  householdMeasure: z.string().trim().max(80).optional().or(z.literal("")),
  preparationNotes: z.string().trim().max(500).optional().or(z.literal("")),
  estimatedNutrition: estimatedNutritionSchema.optional(),
  substitutions: stringListSchema.optional(),
})

export const templateMealSchema = z.object({
  name: z.string().trim().min(1).max(120),
  timeLabel: z.string().trim().max(30).optional().or(z.literal("")),
  instructions: z.string().trim().max(1000).optional().or(z.literal("")),
  items: z.array(templateMealItemSchema).default([]),
})

export const templateDaySchema = z.object({
  label: z.string().trim().min(1).max(80),
  meals: z.array(templateMealSchema).default([]),
})

export const templateEditorSchema = z.object({
  name: z.string().trim().min(2).max(140),
  slug: z.string().trim().max(180).optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  category: z.string().trim().min(2).max(80),
  goal: z.string().trim().max(120).optional().or(z.literal("")),
  tags: stringListSchema,
  status: z.enum(["draft", "active", "archived"]).default("draft"),

  dietaryPattern: z.string().trim().max(80).optional().or(z.literal("")),
  restrictions: stringListSchema,
  allergens: stringListSchema,
  foodsToAvoid: stringListSchema,
  preferredFoods: stringListSchema,
  professionalNotes: z.string().trim().max(5000).optional().or(z.literal("")),
  patientFriendlyNotes: z.string().trim().max(5000).optional().or(z.literal("")),

  dailyCalories: optionalNumber,
  proteinGrams: optionalNumber,
  carbGrams: optionalNumber,
  fatGrams: optionalNumber,
  proteinPercent: optionalNumber,
  carbPercent: optionalNumber,
  fatPercent: optionalNumber,
  fiberTargetGrams: optionalNumber,
  waterTargetMl: optionalNumber,
  mealCountPerDay: optionalNumber,

  durationDays: z.coerce.number().int().min(1).max(365).default(7),
  days: z.array(templateDaySchema).default([]),
  meals: z.array(templateMealSchema).default([]),

  hydrationPlan: z.string().trim().max(4000).optional().or(z.literal("")),
  supplements: stringListSchema,
  shoppingList: stringListSchema,
  mealPrepTips: stringListSchema,
  adherenceTips: stringListSchema,
  generalRecommendations: stringListSchema,
})

export const createTemplateSchema = templateEditorSchema

export const updateTemplateSchema = templateEditorSchema.extend({
  id: z.string().uuid(),
  createNewVersion: z.boolean().optional(),
  changeSummary: optionalText,
})

export const duplicateTemplateSchema = z.object({
  templateId: z.string().uuid(),
})

export const archiveTemplateSchema = z.object({
  templateId: z.string().uuid(),
  archived: z.boolean(),
})

export const createTemplateVersionSchema = z.object({
  templateId: z.string().uuid(),
  changeSummary: optionalText,
})

export const templateIdSchema = z.string().uuid()

export type TemplateEditorInput = z.infer<typeof templateEditorSchema>
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>
export type DuplicateTemplateInput = z.infer<typeof duplicateTemplateSchema>
export type ArchiveTemplateInput = z.infer<typeof archiveTemplateSchema>
export type CreateTemplateVersionInput = z.infer<typeof createTemplateVersionSchema>

export interface TemplateSchedule {
  durationDays: number
  days: Array<{ label: string; meals: z.infer<typeof templateMealSchema>[] }>
  meals: z.infer<typeof templateMealSchema>[]
}
