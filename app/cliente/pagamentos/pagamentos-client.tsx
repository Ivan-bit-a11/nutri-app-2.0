"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { submitPaymentProof } from "@/lib/actions/consultations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { CreditCard, Phone, Copy, CheckCircle2, Clock, Shield } from "lucide-react"

type Nutritionist = {
  id: string
  full_name: string | null
  payment_phone: string | null
  payment_instructions: string | null
}

type RequestRow = {
  id: string
  status: string
  nutritionist_id: string
  reason: string | null
  created_at?: string
  nutritionist?: { full_name: string | null } | null
}

type PaymentRow = {
  id: string
  status: string
  amount: number | null
  proof_text: string
  created_at: string
  nutritionist?: { full_name: string | null } | null
}

const PAY_STATUS: Record<string, string> = {
  submitted: "Enviado — aguarda confirmação",
  confirmed: "Confirmado",
  rejected: "Rejeitado",
}

const REQ_STATUS: Record<string, string> = {
  pending: "Pendente",
  awaiting_payment: "Aguarda pagamento",
  paid: "Pago",
  approved: "Aprovado",
  rejected: "Rejeitado",
  cancelled: "Cancelado",
}

function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, "")
  if (d.length === 9) return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`
  if (d.length === 12) return `+${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8)}`
  return phone
}

export function PagamentosClient({
  nutritionists,
  requests,
  payments,
}: {
  nutritionists: Nutritionist[]
  requests: RequestRow[]
  payments: PaymentRow[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [nutritionistId, setNutritionistId] = useState("")
  const [consultId, setConsultId] = useState("")
  const [amount, setAmount] = useState("")
  const [paymentPhone, setPaymentPhone] = useState("")
  const [proofText, setProofText] = useState("")
  const [copied, setCopied] = useState(false)

  const selected = useMemo(
    () => nutritionists.find((n) => n.id === nutritionistId),
    [nutritionists, nutritionistId],
  )

  const linkedRequests = useMemo(
    () =>
      requests.filter(
        (r) =>
          r.nutritionist_id === nutritionistId &&
          ["pending", "awaiting_payment"].includes(r.status),
      ),
    [requests, nutritionistId],
  )

  async function copyPhone() {
    if (!selected?.payment_phone) return
    try {
      await navigator.clipboard.writeText(selected.payment_phone.replace(/\s/g, ""))
      setCopied(true)
      toast.success("Número copiado")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Não foi possível copiar")
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!nutritionistId) {
      toast.error("Seleccione o nutricionista.")
      return
    }
    if (!proofText.trim() || proofText.trim().length < 10) {
      toast.error("Cole o SMS / texto de confirmação (mínimo 10 caracteres).")
      return
    }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.set("nutritionist_id", nutritionistId)
      if (consultId) fd.set("consultation_request_id", consultId)
      if (amount) fd.set("amount", amount)
      if (paymentPhone) fd.set("payment_phone", paymentPhone)
      fd.set("proof_text", proofText.trim())
      const result = await submitPaymentProof(fd)
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      toast.success("Comprovativo enviado com sucesso.")
      setProofText("")
      setAmount("")
      setPaymentPhone("")
      router.refresh()
    } catch {
      toast.error("Erro ao enviar. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header-block">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="page-title">Pagamentos</h1>
            <p className="page-subtitle">
              Transfira para o número do nutricionista e envie o comprovativo (SMS). O profissional confirma e a consulta avança.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 soft-card border-primary/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Enviar comprovativo</CardTitle>
            <CardDescription>Preencha os dados da transferência e cole o SMS de confirmação.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nutricionista *</Label>
                <Select
                  value={nutritionistId}
                  onValueChange={(v) => {
                    setNutritionistId(v)
                    setConsultId("")
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione o profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {nutritionists.map((n) => (
                      <SelectItem key={n.id} value={n.id}>
                        {n.full_name || "Nutricionista"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selected && (
                <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/50 p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">Dados para transferência</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="phone-pill">
                      <Phone className="h-4 w-4" />
                      {selected.payment_phone
                        ? formatPhone(selected.payment_phone)
                        : "Número não configurado"}
                    </span>
                    {selected.payment_phone && (
                      <Button type="button" variant="outline" size="sm" className="gap-1.5 rounded-full" onClick={copyPhone}>
                        {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? "Copiado" : "Copiar"}
                      </Button>
                    )}
                  </div>
                  {selected.payment_instructions && (
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {selected.payment_instructions}
                    </p>
                  )}
                  {!selected.payment_phone && (
                    <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                      Este nutricionista ainda não indicou o número de pagamento. Contacte-o antes de transferir.
                    </p>
                  )}
                </div>
              )}

              {linkedRequests.length > 0 && (
                <div className="space-y-2">
                  <Label>Associar à consulta (opcional)</Label>
                  <Select value={consultId} onValueChange={setConsultId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhuma / seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {linkedRequests.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {(r.reason || "Consulta") + " · " + (REQ_STATUS[r.status] || r.status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor (MZN)</Label>
                  <Input id="amount" placeholder="Ex.: 1500" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_phone">O seu número (opcional)</Label>
                  <Input id="payment_phone" placeholder="84 XXX XXX" value={paymentPhone} onChange={(e) => setPaymentPhone(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="proof_text">SMS / confirmação *</Label>
                <Textarea
                  id="proof_text"
                  required
                  minLength={10}
                  rows={5}
                  placeholder="Cole aqui o SMS completo da transferência..."
                  value={proofText}
                  onChange={(e) => setProofText(e.target.value)}
                  className="resize-y"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full sm:w-auto gap-2">
                <Shield className="h-4 w-4" />
                {loading ? "A enviar..." : "Enviar comprovativo"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 soft-card border-primary/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Histórico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[28rem] overflow-y-auto">
            {payments.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum envio ainda.</p>
            )}
            {payments.map((p) => (
              <div key={p.id} className="rounded-xl border border-primary/10 bg-secondary/30 p-3 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-sm">{p.nutritionist?.full_name || "Nutricionista"}</p>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                    {PAY_STATUS[p.status] || p.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {p.amount != null ? `${p.amount} MZN · ` : ""}
                  {new Date(p.created_at).toLocaleString("pt-PT")}
                </p>
                <pre className="mt-1 max-h-20 overflow-auto rounded-lg bg-background/80 p-2 text-[11px] whitespace-pre-wrap border">
                  {p.proof_text}
                </pre>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
