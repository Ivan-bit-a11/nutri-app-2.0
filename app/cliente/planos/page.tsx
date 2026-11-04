import { requireRole } from "@/lib/actions/auth"
import { listClientDietPlans } from "@/lib/actions/consultations"
import { PlanosClient } from "./planos-client"

export const dynamic = "force-dynamic"

export default async function PlanosPage() {
  await requireRole(["client"])
  const plans = await listClientDietPlans()

  return <PlanosClient plans={plans.success ? plans.data : []} />
}
