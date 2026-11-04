import { requireRole } from "@/lib/actions/auth"
import { adminStats, listAllUsers } from "@/lib/actions/admin"
import { AdminDashboardClient } from "./admin-client"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  await requireRole(["super_admin"])

  const [statsRes, usersRes] = await Promise.all([adminStats(), listAllUsers()])

  return (
    <AdminDashboardClient
      stats={statsRes.success ? statsRes.data : { nutritionists: 0, clients: 0, pendingConsultations: 0, pendingPayments: 0 }}
      users={usersRes.success ? usersRes.data : []}
    />
  )
}
