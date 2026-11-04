import Link from "next/link"
import { requireRole } from "@/lib/actions/auth"
import { listMyConsultationRequests, listMyPayments, listClientDietPlans } from "@/lib/actions/consultations"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarPlus, CreditCard, FileText } from "lucide-react"

export const dynamic = "force-dynamic"

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  awaiting_payment: "Aguarda pagamento",
  paid: "Pago",
  approved: "Aprovado",
  rejected: "Rejeitado",
  cancelled: "Cancelado",
  submitted: "Enviado",
  confirmed: "Confirmado",
}

export default async function ClienteHomePage() {
  const profile = await requireRole(["client"])

  const [consults, payments, plans] = await Promise.all([
    listMyConsultationRequests(),
    listMyPayments(),
    listClientDietPlans(),
  ])

  const recentConsults = consults.success ? consults.data.slice(0, 3) : []
  const recentPayments = payments.success ? payments.data.slice(0, 3) : []
  const planCount = plans.success ? plans.data.length : 0

  return (
    <div className="space-y-8">
      <div className="page-header-block">
        <h1 className="page-title">
          Olá, {profile.full_name || "Cliente"} 👋
        </h1>
        <p className="page-subtitle">
          Solicite consultas, envie comprovativos de pagamento e descarregue os seus planos
          alimentares.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Consultas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{consults.success ? consults.data.length : 0}</p>
            <Link href="/cliente/consultas">
              <Button variant="link" className="px-0 h-auto mt-1">
                Ver / solicitar
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{payments.success ? payments.data.length : 0}</p>
            <Link href="/cliente/pagamentos">
              <Button variant="link" className="px-0 h-auto mt-1">
                Enviar comprovativo
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Planos activos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{planCount}</p>
            <Link href="/cliente/planos">
              <Button variant="link" className="px-0 h-auto mt-1">
                Ver e descarregar PDF
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarPlus className="h-4 w-4" />
              Consultas recentes
            </CardTitle>
            <CardDescription>Pode solicitar mesmo sem pagar; fica pendente até confirmação.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentConsults.length === 0 && (
              <p className="text-sm text-muted-foreground">Ainda sem pedidos.</p>
            )}
            {recentConsults.map((c: { id: string; status: string; reason: string | null; created_at: string }) => (
              <div key={c.id} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">{c.reason || "Consulta"}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString("pt-PT")}
                  </p>
                </div>
                <Badge variant="secondary">{STATUS_LABEL[c.status] || c.status}</Badge>
              </div>
            ))}
            <Link href="/cliente/consultas">
              <Button className="w-full mt-2" variant="outline">
                Nova solicitação
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4" />
              Últimos comprovativos
            </CardTitle>
            <CardDescription>
              Transfira fora da app (M-Pesa/banco), cole o SMS e envie ao nutricionista.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentPayments.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum comprovativo enviado.</p>
            )}
            {recentPayments.map((p: { id: string; status: string; amount: number | null; created_at: string }) => (
              <div key={p.id} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">
                    {p.amount != null ? `${p.amount} MZN` : "Valor não indicado"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString("pt-PT")}
                  </p>
                </div>
                <Badge variant="secondary">{STATUS_LABEL[p.status] || p.status}</Badge>
              </div>
            ))}
            <Link href="/cliente/pagamentos">
              <Button className="w-full mt-2" variant="outline">
                Enviar comprovativo
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Planos alimentares
          </CardTitle>
          <CardDescription>
            Quando o nutricionista atribuir um plano ao seu registo, aparece aqui para descarregar em PDF.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/cliente/planos">
            <Button>Ver planos e PDF</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
