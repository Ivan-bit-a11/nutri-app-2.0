import { notFound } from "next/navigation"
import { getTemplateById } from "@/lib/actions/templates"
import { TemplateEditor } from "../template-editor"

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const payload = await getTemplateById(id)

    return (
      <TemplateEditor
        mode="edit"
        initialTemplate={payload.template}
        versions={payload.versions}
      />
    )
  } catch {
    notFound()
  }
}
