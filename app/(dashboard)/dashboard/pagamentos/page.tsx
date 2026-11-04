import { requireRole } from "@/lib/actions/auth"
import { listMyConsultationRequests, listMyPayments } from "@/lib/actions/consultations"
import { PagamentosNutriClient } from "./pagamentos-nutri-client"

export const dynamic = "force-dynamic"

export default async function DashboardPagamentosPage() {
  await requireRole(["nutritionist", "super_admin"])

  const [payments, requests] = await Promise.all([
    listMyPayments(),
    listMyConsultationRequests(),
  ])

  return (
    <PagamentosNutriClient
      payments={payments.success ? payments.data : []}
      requests={requests.success ? requests.data : []}
    />
  )
}
