"use server"

import { revalidatePath } from "next/cache"
import { runMutation } from "@/server/core/action"
import {
  createNewTemplateVersion,
  createTemplate,
  duplicateTemplate,
  getTemplate,
  listTemplatesCatalog,
  listTemplatesForDietPlan,
  markTemplateAsUsed,
  setTemplateArchived,
  updateTemplate,
  type TemplateDetails,
} from "@/server/services/templates.service"
import type { TemplateEditorInput } from "@/server/schemas/template.schemas"

export async function getTemplatesCatalog() {
  return listTemplatesCatalog()
}

export async function getTemplatesForDietPlanCreation() {
  return listTemplatesForDietPlan()
}

export async function getTemplateById(id: string) {
  return getTemplate(id)
}

export async function createTemplateMutation(input: TemplateEditorInput) {
  const result = await runMutation(async () => createTemplate(input))

  if (result.success) {
    revalidatePath("/dashboard/templates")
  }

  return result
}

export async function updateTemplateMutation(
  id: string,
  input: TemplateEditorInput,
  options?: { createNewVersion?: boolean; changeSummary?: string },
) {
  const result = await runMutation(async () =>
    updateTemplate({
      ...input,
      id,
      createNewVersion: options?.createNewVersion,
      changeSummary: options?.changeSummary,
    }),
  )

  if (result.success) {
    revalidatePath("/dashboard/templates")
    revalidatePath(`/dashboard/templates/${id}`)
  }

  return result
}

export async function duplicateTemplateMutation(id: string) {
  const result = await runMutation(async () => duplicateTemplate(id))

  if (result.success) {
    revalidatePath("/dashboard/templates")
  }

  return result
}

export async function toggleArchiveTemplateMutation(id: string, archived: boolean) {
  const result = await runMutation(async () => setTemplateArchived(id, archived))

  if (result.success) {
    revalidatePath("/dashboard/templates")
    revalidatePath(`/dashboard/templates/${id}`)
  }

  return result
}

export async function createTemplateVersionMutation(id: string, changeSummary?: string) {
  const result = await runMutation(async () => createNewTemplateVersion(id, changeSummary))

  if (result.success) {
    revalidatePath("/dashboard/templates")
    revalidatePath(`/dashboard/templates/${id}`)
  }

  return result
}

export async function markTemplateUsedMutation(id: string) {
  const result = await runMutation(async () => {
    await markTemplateAsUsed(id)
    return { id }
  })

  if (result.success) {
    revalidatePath("/dashboard/templates")
  }

  return result
}

export type TemplateEditorValue = Omit<TemplateDetails, "id" | "createdAt" | "updatedAt" | "usageCount" | "lastUsedAt" | "canDuplicate" | "canArchive" | "canCreateNewVersion" | "version" | "isSystemTemplate" | "createdBy" | "nutritionistId"> & {
  status: "draft" | "active" | "archived"
}
