import Link from "next/link"
import type React from "react"
import { Users, CalendarDays, Utensils, ClipboardList, PlusCircle, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDashboardData } from "@/lib/actions/dashboard"
import { getRequestLocale } from "@/lib/locale"

function MetricCard({
  label,
  value,
  subtitle,
  icon: Icon,
}: {
  label: string
  value: number
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground">{label}</p>
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <p className="text-2xl font-bold leading-tight">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  )
}

function statusBadge(status: string) {
  if (status === "active") return <Badge className="status-active">Ativo</Badge>
  if (status === "pending") return <Badge className="status-pending">Pendente</Badge>
  return <Badge className="status-inactive">Inativo</Badge>
}

export default async function DashboardPage() {
  const locale = await getRequestLocale()
  const { stats, patients, profile } = await getDashboardData()
  const firstName = profile?.full_name?.split(" ")[0] || "Profissional"

  const followUps = patients.filter((patient) => patient.status === "inactive" || patient.status === "pending")
  const recentPatients = patients.slice(0, 6)

  return (
    <div className="page-shell page-stack">
      <div className="page-header">
        <div>
          <p className="page-subtitle">
            {new Date().toLocaleDateString(locale, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="page-title mt-0.5">Bom trabalho, {firstName}</h1>
          <p className="page-subtitle mt-0.5">
            {stats.upcomingAppointments} consultas agendadas e {stats.activePatients} pacientes ativos.
          </p>
        </div>
        <div className="page-actions">
          <Link href="/dashboard/patients/new">
            <Button size="sm" variant="outline" className="h-9 w-full gap-1.5 sm:w-auto">
              <PlusCircle className="h-3.5 w-3.5" /> Novo Paciente
            </Button>
          </Link>
          <Link href="/dashboard/diet-plans/new">
            <Button size="sm" className="h-9 w-full gap-1.5 sm:w-auto">
              <Utensils className="h-3.5 w-3.5" /> Novo Plano
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Pacientes ativos" value={stats.activePatients} subtitle={stats.totalPatients + " no total"} icon={Users} />
        <MetricCard label="Consultas futuras" value={stats.upcomingAppointments} subtitle="Status agendada" icon={CalendarDays} />
        <MetricCard label="Planos ativos" value={stats.activeDietPlans} subtitle="Com acompanhamento" icon={Utensils} />
        <MetricCard label="Avaliacoes" value={stats.totalAssessments} subtitle={stats.assessmentsThisMonth + " no ultimo mes"} icon={ClipboardList} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Pacientes recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentPatients.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum paciente cadastrado.</p>
            ) : (
              recentPatients.map((patient) => (
                <Link key={patient.id} href={"/dashboard/patients/" + patient.id} className="block rounded-lg border border-border p-3 hover:bg-muted/30">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{patient.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{patient.goal || "Sem objetivo"}</p>
                    </div>
                    {statusBadge(patient.status)}
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Follow-up</CardTitle>
              <Link href="/dashboard/patients">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                  Ver todos <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {followUps.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum follow-up pendente.</p>
            ) : (
              followUps.map((patient) => (
                <Link key={patient.id} href={"/dashboard/patients/" + patient.id} className="block rounded-lg border border-border p-3 hover:bg-muted/30">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{patient.name}</p>
                      <p className="text-xs text-muted-foreground">{patient.goal || "Sem objetivo"}</p>
                    </div>
                    {statusBadge(patient.status)}
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
