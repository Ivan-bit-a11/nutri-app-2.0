import type React from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardTopbar } from "@/components/dashboard-topbar"

export const dynamic = "force-dynamic"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh bg-background md:h-screen">
      <DashboardSidebar
        profileName={null}
        role="nutritionist"
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardTopbar
          profileName={null}
          profileEmail={null}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
