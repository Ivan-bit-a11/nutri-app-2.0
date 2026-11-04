import { getTemplatesCatalog } from "@/lib/actions/templates"
import { AppError } from "@/server/core/errors"
import { inspect } from "node:util"
import { TemplatesClient } from "./templates-client"

export default async function TemplatesPage() {
  let systemTemplates: Awaited<ReturnType<typeof getTemplatesCatalog>>["systemTemplates"] = []
  let myTemplates: Awaited<ReturnType<typeof getTemplatesCatalog>>["myTemplates"] = []
  let loadError: string | null = null

  try {
    const catalog = await getTemplatesCatalog()
    systemTemplates = catalog.systemTemplates
    myTemplates = catalog.myTemplates
  } catch (error) {
    if (error instanceof AppError) {
      console.error(
        "[TemplatesPage] Failed to load templates catalog",
        inspect(
          {
            code: error.code,
            message: error.message,
            status: error.status,
            details: error.details,
          },
          { depth: 8, colors: false, compact: false },
        ),
      )
    } else {
      console.error(
        "[TemplatesPage] Failed to load templates catalog",
        inspect(error, { depth: 8, colors: false, compact: false }),
      )
    }
    loadError = "Nao foi possivel carregar templates agora. Tente novamente em instantes."
  }

  return (
    <TemplatesClient
      systemTemplates={systemTemplates}
      myTemplates={myTemplates}
      loadError={loadError}
    />
  )
}
