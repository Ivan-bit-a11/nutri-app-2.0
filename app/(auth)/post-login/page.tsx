import { redirect } from "next/navigation"
import { getSession, getProfile } from "@/lib/actions/auth"

export const dynamic = "force-dynamic"

export default async function PostLoginPage() {
  const session = await getSession()
  if (!session) {
    redirect("/login")
  }

  const profile = await getProfile()
  const role = profile?.role ?? "nutritionist"

  if (role === "super_admin") redirect("/admin")
  if (role === "client") redirect("/cliente")
  redirect("/dashboard")
}
