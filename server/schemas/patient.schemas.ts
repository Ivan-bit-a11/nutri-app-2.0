import { z } from "zod"

const optionalText = z.string().trim().optional().or(z.literal(""))
const optionalDate = z.string().trim().optional().or(z.literal(""))

const sexEnum = z.enum(["male", "female"])
const activityEnum = z.enum(["sedentary", "light", "moderate", "very_active", "extra_active"])
const statusEnum = z.enum(["active", "inactive", "pending"])

export const createPatientSchema = z.object({
  name: z.string().trim().min(2).max(140),
  email: optionalText,
  phone: optionalText,
  dob: optionalDate,
  sex: sexEnum.optional().or(z.literal("")),
  height: z.coerce.number().positive().max(280).optional(),
  goal: optionalText,
  activityLevel: activityEnum.optional().or(z.literal("")),
  dietaryPreferences: optionalText,
  allergies: optionalText,
  conditions: optionalText,
  medications: optionalText,
  supplements: optionalText,
  emergencyContact: optionalText,
  emergencyPhone: optionalText,
  notes: optionalText,
})

export const updatePatientSchema = createPatientSchema.extend({
  status: statusEnum.optional(),
})

export const updatePatientStatusSchema = z.object({
  status: statusEnum,
})

export const createPatientNoteSchema = z.object({
  content: z.string().trim().min(2).max(6000),
})

export type CreatePatientInput = z.infer<typeof createPatientSchema>
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>
export type UpdatePatientStatusInput = z.infer<typeof updatePatientStatusSchema>
export type CreatePatientNoteInput = z.infer<typeof createPatientNoteSchema>
