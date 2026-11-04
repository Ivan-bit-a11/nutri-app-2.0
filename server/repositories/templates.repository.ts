import { databaseError, notFound } from "@/server/core/errors"
import type { SupabaseClient } from "@supabase/supabase-js"

type SupabaseLike = Pick<SupabaseClient, "from">

export interface TemplateRecord {
  id: string
  nutritionist_id: string | null
  name: string
  slug: string
  description: string | null
  category: string
  goal: string | null
  tags: string[]
  status: "draft" | "active" | "archived"
  is_system_template: boolean
  created_by: string | null
  version: number
  dietary_pattern: string | null
  restrictions: string[]
  allergens: string[]
  foods_to_avoid: string[]
  preferred_foods: string[]
  professional_notes: string | null
  patient_friendly_notes: string | null
  daily_calories: number | null
  protein_grams: number | null
  carb_grams: number | null
  fat_grams: number | null
  protein_percent: number | null
  carb_percent: number | null
  fat_percent: number | null
  fiber_target_grams: number | null
  water_target_ml: number | null
  meal_count_per_day: number | null
  duration_days: number
  hydration_plan: string | null
  supplements: string[]
  shopping_list: string[]
  meal_prep_tips: string[]
  adherence_tips: string[]
  general_recommendations: string[]
  schedule: Record<string, unknown>
  usage_count: number
  last_used_at: string | null
  can_duplicate: boolean
  can_archive: boolean
  can_create_new_version: boolean
  created_at: string
  updated_at: string
}

export interface TemplateVersionRecord {
  id: string
  template_id: string
  nutritionist_id: string | null
  version: number
  change_summary: string | null
  snapshot: Record<string, unknown>
  created_by: string | null
  created_at: string
}

export type TemplateInsertPayload = Omit<
  TemplateRecord,
  "id" | "created_at" | "updated_at" | "usage_count" | "last_used_at"
> & {
  usage_count?: number
  last_used_at?: string | null
}

export async function listSystemTemplates(supabase: SupabaseLike): Promise<TemplateRecord[]> {
  const { data, error } = await supabase
    .from("diet_templates")
    .select("*")
    .eq("is_system_template", true)
    .order("name", { ascending: true })

  if (error) {
    throw databaseError("Unable to list system templates", error)
  }

  return (data ?? []) as TemplateRecord[]
}

export async function listMyTemplates(supabase: SupabaseLike, nutritionistId: string): Promise<TemplateRecord[]> {
  const { data, error } = await supabase
    .from("diet_templates")
    .select("*")
    .eq("nutritionist_id", nutritionistId)
    .order("updated_at", { ascending: false })

  if (error) {
    throw databaseError("Unable to list custom templates", error)
  }

  return (data ?? []) as TemplateRecord[]
}

export async function listTemplateVersions(
  supabase: SupabaseLike,
  templateId: string,
): Promise<TemplateVersionRecord[]> {
  const { data, error } = await supabase
    .from("diet_template_versions")
    .select("*")
    .eq("template_id", templateId)
    .order("version", { ascending: false })

  if (error) {
    throw databaseError("Unable to list template versions", error)
  }

  return (data ?? []) as TemplateVersionRecord[]
}

export async function getTemplateById(
  supabase: SupabaseLike,
  templateId: string,
): Promise<TemplateRecord> {
  const { data, error } = await supabase
    .from("diet_templates")
    .select("*")
    .eq("id", templateId)
    .maybeSingle()

  if (error) {
    throw databaseError("Unable to load template", error)
  }

  if (!data) {
    throw notFound("Template not found")
  }

  return data as TemplateRecord
}

export async function createTemplateRecord(
  supabase: SupabaseLike,
  payload: TemplateInsertPayload,
): Promise<TemplateRecord> {
  const { data, error } = await supabase
    .from("diet_templates")
    .insert(payload)
    .select("*")
    .single()

  if (error || !data) {
    throw databaseError("Unable to create template", error)
  }

  return data as TemplateRecord
}

export async function updateTemplateRecord(
  supabase: SupabaseLike,
  nutritionistId: string,
  templateId: string,
  payload: Partial<TemplateInsertPayload>,
): Promise<TemplateRecord> {
  const { data, error } = await supabase
    .from("diet_templates")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", templateId)
    .eq("nutritionist_id", nutritionistId)
    .eq("is_system_template", false)
    .select("*")
    .maybeSingle()

  if (error) {
    throw databaseError("Unable to update template", error)
  }

  if (!data) {
    throw notFound("Template not found or not editable")
  }

  return data as TemplateRecord
}

export async function deleteTemplateRecord(
  supabase: SupabaseLike,
  nutritionistId: string,
  templateId: string,
): Promise<void> {
  const { error } = await supabase
    .from("diet_templates")
    .delete()
    .eq("id", templateId)
    .eq("nutritionist_id", nutritionistId)
    .eq("is_system_template", false)

  if (error) {
    throw databaseError("Unable to delete template", error)
  }
}

export async function createTemplateVersionRecord(
  supabase: SupabaseLike,
  payload: {
    template_id: string
    nutritionist_id: string | null
    version: number
    change_summary?: string | null
    snapshot: Record<string, unknown>
    created_by: string | null
  },
): Promise<void> {
  const { error } = await supabase.from("diet_template_versions").insert(payload)

  if (error) {
    throw databaseError("Unable to create template version", error)
  }
}

export async function incrementTemplateUsage(
  supabase: SupabaseLike,
  templateId: string,
): Promise<void> {
  const { data: template, error: fetchError } = await supabase
    .from("diet_templates")
    .select("usage_count")
    .eq("id", templateId)
    .maybeSingle()

  if (fetchError) {
    throw databaseError("Unable to update template usage", fetchError)
  }

  const current = Number((template as { usage_count?: number } | null)?.usage_count ?? 0)
  const { error: updateError } = await supabase
    .from("diet_templates")
    .update({ usage_count: current + 1, last_used_at: new Date().toISOString() })
    .eq("id", templateId)

  if (updateError) {
    throw databaseError("Unable to update template usage", updateError)
  }
}
