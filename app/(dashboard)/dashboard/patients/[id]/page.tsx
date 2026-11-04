import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, PlusCircle, Activity, Calendar, FileText, Utensils } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getPatientWithAssessments } from "@/lib/actions/patients"
import { getPatientClientLink } from "@/lib/actions/plan-delivery"
import { PatientClientLink } from "@/components/patient-client-link"
import { getRequestLocale } from "@/lib/locale"

type PatientDetails = Awaited<ReturnType<typeof getPatientWithAssessments>>

type AssessmentRow = {
  id: string
  assessed_at: string
  weight_kg: number | null
  bmi: number | null
  body_fat_pct: number | null
  waist_cm: number | null
}

type DietPlanRow = {
  id: string
  title: string
  description: string | null
  daily_kcal: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  is_active: boolean
  updated_at: string
}

type AppointmentRow = {
  id: string
  title: string
  scheduled_at: string
  status: string
  duration_minutes: number
}

type NoteRow = {
  id: string
  content: string
  created_at: string
}

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return "-"
  return new Date(value).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function formatDateTime(value: string | null | undefined, locale: string) {
  if (!value) return "-"
  return new Date(value).toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function statusBadge(status: string) {
  if (status === "active") return <Badge className="status-active">Ativo</Badge>
  if (status === "pending") return <Badge className="status-pending">Pendente</Badge>
  return <Badge className="status-inactive">Inativo</Badge>
}

function appointmentStatusBadge(status: string) {
  if (status === "scheduled") return <Badge className="status-pending">Agendada</Badge>
  if (status === "completed") return <Badge className="status-active">Concluida</Badge>
  return <Badge className="status-inactive">Cancelada</Badge>
}

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const locale = await getRequestLocale()
  const resolved = await params

  let patient: PatientDetails
  try {
    patient = await getPatientWithAssessments(resolved.id)
  } catch {
    notFound()
  }

  const assessments = (patient.assessments ?? []) as AssessmentRow[]
  const dietPlans = (patient.diet_plans ?? []) as DietPlanRow[]
  const linkRes = await getPatientClientLink(resolved.id)
  const clientLink = linkRes.success
    ? { client: linkRes.data.client, paymentConfirmed: linkRes.data.paymentConfirmed }
    : { client: null, paymentConfirmed: false }
  const appointments = (patient.appointments ?? []) as AppointmentRow[]
  const notes = (patient.patient_notes ?? []) as NoteRow[]

  const latestAssessment = assessments[0]

  return (
    <div className="page-shell page-stack max-w-[1200px]">
      <div className="page-header">
        <div className="flex items-start gap-3">
          <Link href="/dashboard/patients">
            <Button variant="outline" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="page-title">{patient.name}</h1>
              {statusBadge(patient.status)}
            </div>
            <p className="page-subtitle mt-0.5">
              {patient.goal || "Sem objetivo definido"}
            </p>
          </div>
        </div>

        <div className="page-actions">
          <Link href={"/dashboard/assessments/new?patientId=" + patient.id}>
            <Button size="sm" variant="outline" className="h-9 w-full gap-1.5 sm:w-auto">
              <Activity className="h-3.5 w-3.5" /> Nova Avaliacao
            </Button>
          </Link>
          <Link href={"/dashboard/diet-plans/new?patientId=" + patient.id}>
            <Button size="sm" className="h-9 w-full gap-1.5 sm:w-auto">
              <PlusCircle className="h-3.5 w-3.5" /> Novo Plano
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Peso</p>
            <p className="text-xl font-semibold">{latestAssessment?.weight_kg ?? "-"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">IMC</p>
            <p className="text-xl font-semibold">{latestAssessment?.bmi ?? "-"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Gordura Corporal</p>
            <p className="text-xl font-semibold">{latestAssessment?.body_fat_pct ?? "-"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Cintura</p>
            <p className="text-xl font-semibold">{latestAssessment?.waist_cm ?? "-"}</p>
          </CardContent>
        </Card>
      </div>

      <PatientClientLink
        patientId={patient.id}
        client={clientLink.client}
        paymentConfirmed={clientLink.paymentConfirmed}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex flex-wrap justify-between gap-2">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{patient.email || "-"}</span>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <span className="text-muted-foreground">Telefone</span>
              <span className="font-medium">{patient.phone || "-"}</span>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <span className="text-muted-foreground">Nascimento</span>
              <span className="font-medium">{formatDate(patient.dob, locale)}</span>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <span className="text-muted-foreground">Altura (cm)</span>
              <span className="font-medium">{patient.height_cm ?? "-"}</span>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <span className="text-muted-foreground">Atividade</span>
              <span className="font-medium">{patient.activity_level || "-"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Contato de Emergencia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex flex-wrap justify-between gap-2">
              <span className="text-muted-foreground">Nome</span>
              <span className="font-medium">{patient.emergency_contact_name || "-"}</span>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <span className="text-muted-foreground">Telefone</span>
              <span className="font-medium">{patient.emergency_contact_phone || "-"}</span>
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground">Notas clinicas</p>
            <p className="text-sm leading-relaxed">{patient.notes || "Sem anotacoes."}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Avaliacoes</CardTitle>
        </CardHeader>
        <CardContent>
          {assessments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma avaliacao registrada.</p>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {assessments.map((item) => (
                  <div key={item.id} className="rounded-lg border border-border p-3">
                    <p className="text-sm font-medium">{formatDate(item.assessed_at, locale)}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <p>Peso: <span className="text-foreground">{item.weight_kg ?? "-"}</span></p>
                      <p>IMC: <span className="text-foreground">{item.bmi ?? "-"}</span></p>
                      <p>Gordura: <span className="text-foreground">{item.body_fat_pct ?? "-"}</span></p>
                      <p>Cintura: <span className="text-foreground">{item.waist_cm ?? "-"}</span></p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-2 text-left text-xs">Data</th>
                      <th className="py-2 text-left text-xs">Peso</th>
                      <th className="py-2 text-left text-xs">IMC</th>
                      <th className="py-2 text-left text-xs">Gordura</th>
                      <th className="py-2 text-left text-xs">Cintura</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessments.map((item) => (
                      <tr key={item.id} className="border-b border-border/50 last:border-0">
                        <td className="py-2.5">{formatDate(item.assessed_at, locale)}</td>
                        <td className="py-2.5">{item.weight_kg ?? "-"}</td>
                        <td className="py-2.5">{item.bmi ?? "-"}</td>
                        <td className="py-2.5">{item.body_fat_pct ?? "-"}</td>
                        <td className="py-2.5">{item.waist_cm ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Utensils className="h-4 w-4" /> Planos Alimentares
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {dietPlans.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum plano criado.</p>
            ) : (
              dietPlans.map((plan) => (
                <Link key={plan.id} href={"/dashboard/diet-plans/" + plan.id} className="block rounded-lg border border-border p-3 hover:bg-muted/30">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{plan.title}</p>
                    <Badge className={plan.is_active ? "status-active" : "status-inactive"}>
                      {plan.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{plan.description || "Sem descricao"}</p>
                  <p className="text-xs text-muted-foreground mt-2">Atualizado em {formatDate(plan.updated_at, locale)}</p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Consultas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {appointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma consulta registrada.</p>
            ) : (
              appointments.map((item) => (
                <div key={item.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{item.title}</p>
                    {appointmentStatusBadge(item.status)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{formatDateTime(item.scheduled_at, locale)}</p>
                  <p className="text-xs text-muted-foreground">{item.duration_minutes} min</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" /> Notas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem notas para este paciente.</p>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="rounded-lg border border-border p-3">
                <p className="text-sm leading-relaxed">{note.content}</p>
                <p className="text-xs text-muted-foreground mt-2">{formatDateTime(note.created_at, locale)}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
