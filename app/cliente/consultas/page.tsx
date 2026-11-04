import { requireRole } from "@/lib/actions/auth"
import {
  listActiveNutritionists,
  listMyConsultationRequests,
} from "@/lib/actions/consultations"
import { ConsultasClient } from "./consultas-client"

export const dynamic = "force-dynamic"

export default async function ConsultasPage() {
  await requireRole(["client"])

  const [nutritionists, requests] = await Promise.all([
    listActiveNutritionists(),
    listMyConsultationRequests(),
  ])

  return (
    <ConsultasClient
      nutritionists={nutritionists.success ? nutritionists.data : []}
      requests={requests.success ? requests.data : []}
    />
  )
}
