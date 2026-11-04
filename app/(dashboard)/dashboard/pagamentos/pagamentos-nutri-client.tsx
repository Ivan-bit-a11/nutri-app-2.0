"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { reviewPayment, updateConsultationStatus } from "@/lib/actions/consultations"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { User, Mail, Phone, MessageSquare, Calendar, CreditCard } from "lucide-react"

type ClientInfo = {
  full_name: string | null
  email: string | null
  phone: string | null
} | null

type Payment = {
  id: string
  status: string
  amount: number | null
  proof_text: string
  payment_phone: string | null
  created_at: string
  notes: string | null
  consultation_request_id: string | null
  client_user_id?: string
  client?: ClientInfo
}

type Request = {
  id: string
  status: string
  reason: string | null
  preferred_date: string | null
  created_at: string
  notes: string | null
  client_user_id?: string
  client?: ClientInfo
}

const PAY: Record<string, string> = {
  submitted: "Aguarda confirmação",
  confirmed: "Confirmado",
  rejected: "Rejeitado",
}

const REQ: Record<string, string> = {
  pending: "Pendente (ainda não pagou)",
  awaiting_payment: "Comprovativo enviado",
  paid: "Pago — em aprovação",
  approved: "Aprovado (em acompanhamento)",
  rejected: "Rejeitado",
  cancelled: "Cancelado",
}

function ClientBlock({ client, fallback }: { client?: ClientInfo; fallback?: string }) {
  const name = client?.full_name?.trim() || fallback || "Cliente (nome não disponível)"
  return (
    <div className="min-w-0 space-y-1.5">
      <p className="flex items-start gap-2 text-base font-semibold leading-snug break-words">
        <User className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <span className="min-w-0 break-words">{name}</span>
      </p>
      {client?.email && (
        <p className="flex items-start gap-2 text-xs text-muted-foreground break-all">
          <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0">{client.email}</span>
        </p>
      )}
      {client?.phone && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Phone className="h-3.5 w-3.5 shrink-0" />
          <span>{client.phone}</span>
        </p>
      )}
    </div>
  )
}

export function PagamentosNutriClient({
  payments,
  requests,
}: {
  payments: Payment[]
  requests: Request[]
}) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function onReview(paymentId: string, status: "confirmed" | "rejected") {
    setLoadingId(paymentId)
    try {
      const fd = new FormData()
      fd.set("payment_id", paymentId)
      fd.set("status", status)
      const result = await reviewPayment(fd)
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      if (status === "confirmed") {
        toast.success(
          "Pagamento confirmado. Cliente aprovado e adicionado à lista de Pacientes.",
        )
      } else {
        toast.success("Pagamento rejeitado.")
      }
      router.refresh()
    } catch {
      toast.error("Erro ao processar. Tente novamente.")
    } finally {
      setLoadingId(null)
    }
  }

  async function onApproveConsult(id: string) {
    setLoadingId(id)
    try {
      const fd = new FormData()
      fd.set("id", id)
      fd.set("status", "approved")
      const result = await updateConsultationStatus(fd)
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      toast.success("Consulta aprovada. Cliente na lista de Pacientes.")
      router.refresh()
    } catch {
      toast.error("Erro ao aprovar.")
    } finally {
      setLoadingId(null)
    }
  }

  async function onRejectConsult(id: string) {
    setLoadingId(id)
    try {
      const fd = new FormData()
      fd.set("id", id)
      fd.set("status", "rejected")
      const result = await updateConsultationStatus(fd)
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      toast.success("Pedido rejeitado.")
      router.refresh()
    } catch {
      toast.error("Erro ao rejeitar.")
    } finally {
      setLoadingId(null)
    }
  }

  const pendingPay = payments.filter((p) => p.status === "submitted")
  const pendingReq = requests.filter((r) =>
    ["pending", "awaiting_payment", "paid"].includes(r.status),
  )

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      {/* Cabeçalho */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Pagamentos e consultas</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Cada pedido mostra o <strong className="text-foreground">nome do cliente</strong>, a
          mensagem e o estado. Ao confirmar o pagamento, o cliente entra automaticamente em{" "}
          <Link
            href="/dashboard/patients"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Pacientes
          </Link>
          .
        </p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Comprovativos a rever
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums text-orange-600">{pendingPay.length}</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pedidos em aberto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">{pendingReq.length}</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total pagamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">{payments.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="consultas" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 sm:inline-flex sm:w-auto">
          <TabsTrigger value="consultas" className="text-sm">
            Pedidos de consulta
            {pendingReq.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-primary">
                {pendingReq.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="pagamentos" className="text-sm">
            Pagamentos
            {pendingPay.length > 0 && (
              <span className="ml-1.5 rounded-full bg-orange-500/15 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-orange-700">
                {pendingPay.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ========== CONSULTAS ========== */}
        <TabsContent value="consultas" className="mt-4 space-y-4 focus-visible:outline-none">
          {requests.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Ainda não há pedidos. Quando um cliente solicitar consulta, aparece aqui com o
                nome.
              </CardContent>
            </Card>
          )}

          {requests.map((r) => (
            <Card key={r.id} className="overflow-hidden">
              <CardHeader className="space-y-3 pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <ClientBlock client={r.client} />
                  <Badge
                    className="w-fit shrink-0"
                    variant={
                      r.status === "approved"
                        ? "default"
                        : r.status === "pending"
                          ? "outline"
                          : "secondary"
                    }
                  >
                    {REQ[r.status] || r.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {(r.reason || r.notes) && (
                  <div className="rounded-lg border bg-muted/40 p-3 sm:p-4">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                      Mensagem / motivo do cliente
                    </p>
                    <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                      {r.reason || r.notes}
                    </p>
                    {r.reason && r.notes && r.notes !== r.reason && (
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground break-words whitespace-pre-wrap">
                        {r.notes}
                      </p>
                    )}
                  </div>
                )}

                <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  <span>Solicitado em {new Date(r.created_at).toLocaleString("pt-PT")}</span>
                  {r.preferred_date && (
                    <span className="text-foreground">· Data preferida: {r.preferred_date}</span>
                  )}
                </p>

                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  {r.status === "paid" && (
                    <Button
                      size="sm"
                      className="w-full sm:w-auto"
                      disabled={loadingId === r.id}
                      onClick={() => onApproveConsult(r.id)}
                    >
                      {loadingId === r.id ? "A processar..." : "Aprovar e abrir acompanhamento"}
                    </Button>
                  )}

                  {r.status === "pending" && (
                    <p className="text-sm text-muted-foreground">
                      Aguarda o cliente enviar o comprovativo em Pagamentos.
                    </p>
                  )}

                  {r.status === "awaiting_payment" && (
                    <p className="text-sm text-orange-700">
                      Comprovativo enviado — confirme na aba Pagamentos.
                    </p>
                  )}

                  {!["approved", "rejected", "cancelled"].includes(r.status) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto"
                      disabled={loadingId === r.id}
                      onClick={() => onRejectConsult(r.id)}
                    >
                      Rejeitar pedido
                    </Button>
                  )}

                  {r.status === "approved" && (
                    <Link href="/dashboard/patients" className="w-full sm:w-auto">
                      <Button size="sm" variant="secondary" className="w-full sm:w-auto">
                        Ver em Pacientes
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ========== PAGAMENTOS ========== */}
        <TabsContent value="pagamentos" className="mt-4 space-y-4 focus-visible:outline-none">
          {payments.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Nenhum comprovativo ainda.
              </CardContent>
            </Card>
          )}

          {payments.map((p) => (
            <Card
              key={p.id}
              className={
                p.status === "submitted"
                  ? "overflow-hidden border-orange-300/80 shadow-sm"
                  : "overflow-hidden"
              }
            >
              <CardHeader className="space-y-3 pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-2">
                    <ClientBlock client={p.client} />
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <CreditCard className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        {p.amount != null ? `${p.amount} MZN` : "Valor não indicado"}
                      </span>
                      {p.payment_phone && (
                        <span className="text-muted-foreground">· Nº usado: {p.payment_phone}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(p.created_at).toLocaleString("pt-PT")}
                    </p>
                  </div>
                  <Badge
                    className="w-fit shrink-0"
                    variant={p.status === "confirmed" ? "default" : "secondary"}
                  >
                    {PAY[p.status] || p.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    Comprovativo (SMS)
                  </p>
                  <pre className="max-h-40 overflow-auto rounded-lg bg-muted p-3 text-xs leading-relaxed break-words whitespace-pre-wrap">
                    {p.proof_text}
                  </pre>
                </div>

                {p.status === "submitted" && (
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Button
                      size="sm"
                      className="w-full bg-green-600 hover:bg-green-700 sm:w-auto"
                      disabled={loadingId === p.id}
                      onClick={() => onReview(p.id, "confirmed")}
                    >
                      {loadingId === p.id ? "A processar..." : "✓ Confirmar pagamento"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto"
                      disabled={loadingId === p.id}
                      onClick={() => onReview(p.id, "rejected")}
                    >
                      Rejeitar
                    </Button>
                  </div>
                )}

                {p.status === "confirmed" && (
                  <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-950/40 dark:text-green-200">
                    Confirmado. O cliente deve aparecer em{" "}
                    <Link href="/dashboard/patients" className="font-medium underline-offset-4 hover:underline">
                      Pacientes
                    </Link>{" "}
                    para preencher peso, altura, etc. e enviar o plano.
                  </p>
                )}

                {p.status === "rejected" && (
                  <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
                    Pagamento rejeitado.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}