import { z } from "zod"

const emailSchema = z.string().trim().email()

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
})

/** Public self-registration is only for clients */
export const registerClientSchema = z.object({
  email: emailSchema,
  password: z.string().min(8),
  full_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
})

/** Legacy / nutritionist fields kept for admin-created accounts */
export const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(8),
  full_name: z.string().trim().min(2).max(120),
  clinic_name: z.string().trim().max(160).optional().or(z.literal("")),
  crn: z.string().trim().max(60).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  payment_phone: z.string().trim().max(40).optional().or(z.literal("")),
  role: z.enum(["super_admin", "nutritionist", "client"]).optional(),
})

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type RegisterClientInput = z.infer<typeof registerClientSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
