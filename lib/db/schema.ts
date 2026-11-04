import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  date,
  jsonb,
} from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const profiles = pgTable("profiles", {
  id: uuid("id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  fullName: text("full_name"),
  email: text("email"),
  clinicName: text("clinic_name"),
  crn: text("crn"),
  phone: text("phone"),
  avatarUrl: text("avatar_url"),
  role: text("role").notNull().default("nutritionist"),
  paymentPhone: text("payment_phone"),
  paymentInstructions: text("payment_instructions"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const patients = pgTable("patients", {
  id: uuid("id").primaryKey().defaultRandom(),
  nutritionistId: uuid("nutritionist_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  clientUserId: uuid("client_user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  dob: date("dob"),
  sex: text("sex"),
  heightCm: numeric("height_cm", { precision: 5, scale: 1 }),
  goal: text("goal"),
  activityLevel: text("activity_level"),
  status: text("status").notNull().default("active"),
  allergies: text("allergies").array(),
  conditions: text("conditions").array(),
  medications: text("medications"),
  supplements: text("supplements"),
  dietaryPreferences: text("dietary_preferences"),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const assessments = pgTable("assessments", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id").references(() => patients.id, { onDelete: "set null" }),
  nutritionistId: uuid("nutritionist_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  assessedAt: timestamp("assessed_at", { withTimezone: true }).notNull().defaultNow(),
  weightKg: numeric("weight_kg", { precision: 6, scale: 2 }),
  heightCm: numeric("height_cm", { precision: 5, scale: 1 }),
  bmi: numeric("bmi", { precision: 5, scale: 2 }),
  bodyFatPct: numeric("body_fat_pct", { precision: 5, scale: 2 }),
  fatMassKg: numeric("fat_mass_kg", { precision: 6, scale: 2 }),
  muscleMassKg: numeric("muscle_mass_kg", { precision: 6, scale: 2 }),
  waistCm: numeric("waist_cm", { precision: 5, scale: 1 }),
  hipCm: numeric("hip_cm", { precision: 5, scale: 1 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const dietPlans = pgTable("diet_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id").references(() => patients.id, { onDelete: "set null" }),
  nutritionistId: uuid("nutritionist_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  dailyKcal: integer("daily_kcal"),
  proteinG: integer("protein_g"),
  carbsG: integer("carbs_g"),
  fatG: integer("fat_g"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  shareToken: uuid("share_token").defaultRandom(),
  publishedToClientAt: timestamp("published_to_client_at", { withTimezone: true }),
  publishedBy: uuid("published_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const meals = pgTable("meals", {
  id: uuid("id").primaryKey().defaultRandom(),
  dietPlanId: uuid("diet_plan_id")
    .notNull()
    .references(() => dietPlans.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  timeOfDay: text("time_of_day"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const mealItems = pgTable("meal_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  mealId: uuid("meal_id")
    .notNull()
    .references(() => meals.id, { onDelete: "cascade" }),
  foodName: text("food_name").notNull(),
  quantity: text("quantity"),
  unit: text("unit"),
  kcal: numeric("kcal", { precision: 8, scale: 2 }),
  proteinG: numeric("protein_g", { precision: 6, scale: 2 }),
  carbsG: numeric("carbs_g", { precision: 6, scale: 2 }),
  fatG: numeric("fat_g", { precision: 6, scale: 2 }),
  notes: text("notes"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const patientNotes = pgTable("patient_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  nutritionistId: uuid("nutritionist_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id").references(() => patients.id, { onDelete: "set null" }),
  nutritionistId: uuid("nutritionist_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  durationMin: integer("duration_min").notNull().default(60),
  type: text("type"),
  status: text("status").notNull().default("scheduled"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const consultationRequests = pgTable("consultation_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientUserId: uuid("client_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  nutritionistId: uuid("nutritionist_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  preferredDate: date("preferred_date"),
  preferredTime: text("preferred_time"),
  notes: text("notes"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  consultationRequestId: uuid("consultation_request_id").references(
    () => consultationRequests.id,
    { onDelete: "set null" },
  ),
  clientUserId: uuid("client_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  nutritionistId: uuid("nutritionist_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 2 }),
  currency: text("currency").notNull().default("MZN"),
  paymentPhone: text("payment_phone"),
  proofText: text("proof_text").notNull(),
  status: text("status").notNull().default("submitted"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const dietTemplates = pgTable("diet_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  nutritionistId: uuid("nutritionist_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  category: text("category").notNull().default("general"),
  goal: text("goal"),
  tags: text("tags").array(),
  status: text("status").notNull().default("draft"),
  isSystemTemplate: boolean("is_system_template").notNull().default(false),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  version: integer("version").notNull().default(1),
  dietaryPattern: text("dietary_pattern"),
  restrictions: text("restrictions").array(),
  allergens: text("allergens").array(),
  foodsToAvoid: text("foods_to_avoid").array(),
  preferredFoods: text("preferred_foods").array(),
  professionalNotes: text("professional_notes"),
  patientFriendlyNotes: text("patient_friendly_notes"),
  dailyCalories: integer("daily_calories"),
  proteinGrams: numeric("protein_grams", { precision: 6, scale: 2 }),
  carbGrams: numeric("carb_grams", { precision: 6, scale: 2 }),
  fatGrams: numeric("fat_grams", { precision: 6, scale: 2 }),
  proteinPercent: numeric("protein_percent", { precision: 5, scale: 2 }),
  carbPercent: numeric("carb_percent", { precision: 5, scale: 2 }),
  fatPercent: numeric("fat_percent", { precision: 5, scale: 2 }),
  fiberTargetGrams: numeric("fiber_target_grams", { precision: 6, scale: 2 }),
  waterTargetMl: integer("water_target_ml"),
  mealCountPerDay: integer("meal_count_per_day"),
  durationDays: integer("duration_days").notNull().default(7),
  hydrationPlan: text("hydration_plan"),
  supplements: text("supplements").array(),
  shoppingList: text("shopping_list").array(),
  mealPrepTips: text("meal_prep_tips").array(),
  adherenceTips: text("adherence_tips").array(),
  generalRecommendations: text("general_recommendations").array(),
  schedule: jsonb("schedule"),
  usageCount: integer("usage_count").notNull().default(0),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  canDuplicate: boolean("can_duplicate").notNull().default(true),
  canArchive: boolean("can_archive").notNull().default(true),
  canCreateNewVersion: boolean("can_create_new_version").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export type User = typeof users.$inferSelect
export type Profile = typeof profiles.$inferSelect
export type Patient = typeof patients.$inferSelect
export type AppRole = "super_admin" | "nutritionist" | "client"
