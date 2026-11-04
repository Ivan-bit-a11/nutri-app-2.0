"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { publishDietPlanToClient, unpublishDietPlan } from "@/lib/actions/plan-delivery"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Send, Undo2 } from "lucide-react"
import { toast } from "sonner"

type Props = {
  dietPlanId: string
  publishedAt: string | null
  patientName?: string | null
}

export function PublishPlanButton({ dietPlanId, publishedAt, patientName }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function onPublish() {
    setLoading(true)
    const fd = new FormData()
    fd.set("diet_plan_id", dietPlanId)
    const result = await publishDietPlanToClient(fd)
    setLoading(false)
    if (!result.success) {
      toast.error(result.error.message)
      return
    }
    toast.success(
      `Plano enviado a ${result.data.patient_name || patientName || "cliente"}. Já aparece em Meus planos.`,
    )
    router.refresh()
  }

  async function onUnpublish() {
    setLoading(true)
    const fd = new FormData()
    fd.set("diet_plan_id", dietPlanId)
    const result = await unpublishDietPlan(fd)
    setLoading(false)
    if (!result.success) {
      toast.error(result.error.message)
      return
    }
    toast.success("Plano retirado da área do cliente.")
    router.refresh()
  }

  if (publishedAt) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-green-600 hover:bg-green-600">
          Enviado ao cliente · {new Date(publishedAt).toLocaleString("pt-PT")}
        </Badge>
        <Button variant="outline" size="sm" disabled={loading} onClick={onUnpublish} className="gap-1.5">
          <Undo2 className="h-3.5 w-3.5" />
          Retirar do cliente
        </Button>
      </div>
    )
  }

  return (
    <Button size="sm" disabled={loading} onClick={onPublish} className="gap-1.5">
      <Send className="h-3.5 w-3.5" />
      {loading ? "A enviar..." : "Enviar ao cliente"}
    </Button>
  )
}
