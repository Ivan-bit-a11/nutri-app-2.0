"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { linkPatientToClient } from "@/lib/actions/plan-delivery"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Link2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

type Props = {
  patientId: string
  client: { id: string; full_name: string | null; email: string | null } | null
  paymentConfirmed: boolean
}

export function PatientClientLink({ patientId, client, paymentConfirmed }: Props) {
  const router = useRouter()
  const [email, setEmail] = useState(client?.email || "")
  const [loading, setLoading] = useState(false)

  async function onLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData()
    fd.set("patient_id", patientId)
    fd.set("client_email", email.trim())
    const result = await linkPatientToClient(fd)
    setLoading(false)
    if (!result.success) {
      toast.error(result.error.message)
      return
    }
    toast.success(
      `Paciente ligado a ${result.data.client_name || result.data.client_email}. Os planos enviados chegarão só a esta conta.`,
    )
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="h-4 w-4" />
          Conta do cliente (planos individuais)
        </CardTitle>
        <CardDescription>
          Cada paciente liga-se a uma conta de cliente diferente. Só essa pessoa vê e descarrega os
          planos enviados para este registo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {client ? (
          <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="font-medium">{client.full_name || "Cliente"}</span>
              <Badge variant="secondary">Ligado</Badge>
              {paymentConfirmed ? (
                <Badge>Pagamento confirmado</Badge>
              ) : (
                <Badge variant="outline">Pagamento ainda não confirmado</Badge>
              )}
            </div>
            <p className="text-muted-foreground">{client.email}</p>
            <p className="text-xs text-muted-foreground pt-1">
              Depois de criar o plano, abra o plano e use &quot;Enviar ao cliente&quot; (só após
              confirmar o pagamento em Pagamentos).
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Ainda sem conta ligada. Indique o email com que o cliente se registou.
          </p>
        )}

        <form onSubmit={onLink} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="client_email">Email da conta do cliente</Label>
            <Input
              id="client_email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@email.com"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "A ligar..." : client ? "Actualizar ligação" : "Ligar à conta"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
