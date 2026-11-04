"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { requestConsultation } from "@/lib/actions/consultations"
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
import { CalendarPlus, Phone, Building2, ArrowRight, Stethoscope } from "lucide-react"

type Nutritionist = {
  id: string
  full_name: string | null
  clinic_name: string | null
  payment_phone: string | null
  payment_instructions: string | null
  phone: string | null
}

type RequestRow = {
  id: string
  status: string
  reason: string | null
  preferred_date: string | null
  notes: string | null
  created_at: string
  nutritionist?: { full_name: string | null; clinic_name: string | null } | null
}

const STATUS: Record<string, string> = {
  pending: "Pendente (sem pagamento)",
  awaiting_payment: "Comprovativo enviado",
  paid: "Pagamento confirmado",
  approved: "Consulta aprovada",
  rejected: "Rejeitado",
  cancelled: "Cancelado",
}

function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, "")
  if (d.length === 9) return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`
  if (d.length === 12) return `+${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8)}`
  return phone
}

export function ConsultasClient({
  nutritionists,
  requests,
}: {
  nutritionists: Nutritionist[]
  requests: RequestRow[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [nutritionistId, setNutritionistId] = useState("")
  const [reason, setReason] = useState("")
  const [preferredDate, setPreferredDate] = useState("")
  const [notes, setNotes] = useState("")

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!nutritionistId) {
      toast.error("Seleccione um nutricionista.")
      return
    }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.set("nutritionist_id", nutritionistId)
      if (reason) fd.set("reason", reason)
      if (preferredDate) fd.set("preferred_date", preferredDate)
      if (notes) fd.set("notes", notes)
      const result = await requestConsultation(fd)
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      toast.success("Pedido enviado. Fica pendente até o pagamento ser confirmado.")
      setNutritionistId("")
      setReason("")
      setPreferredDate("")
      setNotes("")
      router.refresh()
    } catch {
      toast.error("Não foi possível enviar o pedido. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const selected = nutritionists.find((n) => n.id === nutritionistId)

  return (
    <div className="space-y-6">
      <div className="page-header-block">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <CalendarPlus className="h-5 w-5" />
          </div>
          <div>
            <h1 className="page-title">Solicitar consulta</h1>
            <p className="page-subtitle">
              Escolha o nutricionista e descreva o motivo. Pode pedir sem pagar; o pedido fica{" "}
              <strong>pendente</strong> até o pagamento ser confirmado.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 soft-card border-primary/10">
          <CardHeader>
            <CardTitle className="text-lg">Novo pedido</CardTitle>
            <CardDescription>
              Depois de enviar, use a área de Pagamentos para transferir e colar o SMS.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nutricionista *</Label>
                <Select value={nutritionistId} onValueChange={setNutritionistId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione o profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {nutritionists.map((n) => (
                      <SelectItem key={n.id} value={n.id}>
                        {n.full_name || "Nutricionista"}
                        {n.clinic_name ? ` · ${n.clinic_name}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selected && (
                <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-accent/40 to-background p-4 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                    <Stethoscope className="h-4 w-4" />
                    {selected.full_name || "Nutricionista"}
                  </div>
                  {selected.clinic_name && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" />
                      {selected.clinic_name}
                    </p>
                  )}
                  {(selected.payment_phone || selected.phone) && (
                    <div className="flex flex-wrap gap-2">
                      {selected.payment_phone && (
                        <span className="phone-pill">
                          <Phone className="h-3.5 w-3.5" />
                          Pagamento: {formatPhone(selected.payment_phone)}
                        </span>
                      )}
                      {selected.phone && (
                        <span className="phone-pill bg-secondary text-secondary-foreground border-secondary">
                          <Phone className="h-3.5 w-3.5" />
                          Contacto: {formatPhone(selected.phone)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="reason">Motivo da consulta</Label>
                <Input
                  id="reason"
                  placeholder="Ex.: Acompanhamento, emagrecimento, plano desportivo..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferred_date">Data preferida (opcional)</Label>
                <Input
                  id="preferred_date"
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas adicionais</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  placeholder="Horário preferido, restrições, objectivos..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={loading} className="gap-2">
                  {loading ? "A enviar..." : "Solicitar consulta"}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </Button>
                <Link href="/cliente/pagamentos">
                  <Button type="button" variant="outline" className="gap-2">
                    Ir a pagamentos
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 soft-card border-primary/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Os seus pedidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[28rem] overflow-y-auto">
            {requests.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Ainda não tem pedidos.</p>
            )}
            {requests.map((r) => (
              <div key={r.id} className="rounded-xl border border-primary/10 bg-secondary/30 p-3 space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-sm">{r.reason || "Consulta"}</p>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-0 text-[10px]">
                    {STATUS[r.status] || r.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {r.nutritionist?.full_name || "Nutricionista"}
                  {r.nutritionist?.clinic_name ? ` · ${r.nutritionist.clinic_name}` : ""}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(r.created_at).toLocaleString("pt-PT")}
                  {r.preferred_date ? ` · Prefere: ${r.preferred_date}` : ""}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
