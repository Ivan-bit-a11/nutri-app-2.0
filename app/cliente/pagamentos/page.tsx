import { requireRole } from "@/lib/actions/auth"
import {
  listActiveNutritionists,
  listMyConsultationRequests,
  listMyPayments,
} from "@/lib/actions/consultations"
import { PagamentosClient } from "./pagamentos-client"

export const dynamic = "force-dynamic"

export default async function PagamentosPage() {
  await requireRole(["client"])

  const [nutritionists, requests, payments] = await Promise.all([
    listActiveNutritionists(),
    listMyConsultationRequests(),
    listMyPayments(),
  ])

  return (
    <PagamentosClient
      nutritionists={nutritionists.success ? nutritionists.data : []}
      requests={requests.success ? requests.data : []}
      payments={payments.success ? payments.data : []}
    />
  )
}
