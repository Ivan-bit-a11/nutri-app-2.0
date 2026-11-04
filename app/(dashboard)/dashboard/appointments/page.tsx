import Link from "next/link"
import { CalendarDays, PlusCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAllAppointments } from "@/lib/actions/clinical"
import { getRequestLocale } from "@/lib/locale"

type AppointmentItem = {
  id: string
  title: string
  scheduled_at: string
  status: "scheduled" | "completed" | "cancelled" | "no_show"
  duration_minutes: number
  patients?: { id?: string; name?: string | null } | null
}

function formatDate(value: string, locale: string) {
  return new Date(value).toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function statusBadge(status: AppointmentItem["status"]) {
  if (status === "scheduled") return <Badge className="status-pending">Agendada</Badge>
  if (status === "completed") return <Badge className="status-active">Concluida</Badge>
  if (status === "no_show") return <Badge className="status-inactive">Faltou</Badge>
  return <Badge className="status-inactive">Cancelada</Badge>
}

export default async function AppointmentsPage() {
  const locale = await getRequestLocale()
  const appointments = (await getAllAppointments()) as AppointmentItem[]
  const upcoming = appointments.filter((item) => item.status === "scheduled").length

  return (
    <div className="page-shell page-stack max-w-[1200px]">
      <div className="page-header">
        <div>
          <h1 className="page-title">Consultas</h1>
          <p className="page-subtitle mt-0.5">{upcoming} consultas agendadas</p>
        </div>
        <div className="page-actions">
          <Link href="/dashboard/appointments/new">
            <Button size="sm" className="h-9 w-full gap-1.5 sm:w-auto">
              <PlusCircle className="h-3.5 w-3.5" /> Nova consulta
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Agenda</CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Nenhuma consulta registrada.</p>
              <Link href="/dashboard/appointments/new" className="inline-flex">
                <Button size="sm" variant="outline" className="h-8 gap-1.5">
                  <PlusCircle className="h-3.5 w-3.5" /> Agendar primeira consulta
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {appointments.map((item) => (
                <div key={item.id} className="rounded-lg border border-border p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(item.scheduled_at, locale)}</p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span>{item.duration_minutes} min</span>
                      </div>
                    </div>
                    <div className="sm:text-right">
                      {statusBadge(item.status)}
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.patients?.id ? (
                          <Link href={"/dashboard/patients/" + item.patients.id} className="hover:text-primary">
                            {item.patients.name || "Paciente"}
                          </Link>
                        ) : (
                          "Sem paciente"
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
