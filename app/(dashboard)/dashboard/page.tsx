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

  const paymentRows = payments.success ? payments.data : []
  const requestRows = requests.success ? requests.data : []

  return (
    <PagamentosNutriClient
      payments={paymentRows as never}
      requests={requestRows as never}
    />
  )
}
