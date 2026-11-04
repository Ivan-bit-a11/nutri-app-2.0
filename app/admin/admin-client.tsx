"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Users, UserPlus, Stethoscope, CreditCard, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { adminCreateUser, adminUpdateUser } from "@/lib/actions/admin"
import { toast } from "sonner"

type Profile = {
  id: string
  full_name: string | null
  email: string | null
  role: string
  phone: string | null
  clinic_name: string | null
  crn: string | null
  payment_phone: string | null
  is_active: boolean
  created_at: string
}

type Stats = {
  nutritionists: number
  clients: number
  pendingConsultations: number
  pendingPayments: number
}

export function AdminDashboardClient({
  stats,
  users,
}: {
  stats: Stats
  users: Profile[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState<"nutritionist" | "client">("nutritionist")

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // Guardar a referência ANTES de qualquer await
    const form = e.currentTarget

    setLoading(true)
    try {
      const fd = new FormData(form)
      fd.set("role", role)
      const result = await adminCreateUser(fd)

      if (!result.success) {
        toast.error(result.error.message)
        return
      }

      toast.success(
        role === "nutritionist"
          ? "Nutricionista cadastrado com sucesso."
          : "Cliente cadastrado com sucesso.",
      )

      form.reset()
      router.refresh()
    } catch {
      toast.error("Não foi possível criar a conta. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  async function toggleActive(user: Profile) {
    const fd = new FormData()
    fd.set("id", user.id)
    fd.set("is_active", user.is_active ? "false" : "true")
    const result = await adminUpdateUser(fd)
    if (!result.success) {
      toast.error(result.error.message)
      return
    }
    toast.success(user.is_active ? "Conta desativada." : "Conta activada.")
    router.refresh()
  }

  return (
    <div className="space-y-8">
      <div className="page-header-block">
        <h1 className="page-title">Super Admin</h1>
        <p className="page-subtitle">
          Cadastre nutricionistas e clientes. Os nutricionistas apenas fazem login; clientes podem
          registar-se sozinhos ou ser criados aqui.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Nutricionistas</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.nutritionists}</div>
          </CardContent>
        </Card>
        <Card className="border-primary/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clients}</div>
          </CardContent>
        </Card>
        <Card className="border-primary/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Consultas pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingConsultations}</div>
          </CardContent>
        </Card>
        <Card className="border-primary/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos a rever</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPayments}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="border-primary/10 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Cadastrar utilizador
            </CardTitle>
            <CardDescription>
              Nutricionistas só fazem login (não se registam sozinhos). Clientes também podem criar
              conta na página pública.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de conta</Label>
                <Select
                  value={role}
                  onValueChange={(v) => setRole(v as "nutritionist" | "client")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nutritionist">Nutricionista</SelectItem>
                    <SelectItem value="client">Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome completo</Label>
                <Input id="full_name" name="full_name" required minLength={2} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Palavra-passe</Label>
                <Input id="password" name="password" type="password" required minLength={8} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" name="phone" placeholder="+258 8X XXX XXXX" />
              </div>
              {role === "nutritionist" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="clinic_name">Clínica / consultório</Label>
                    <Input id="clinic_name" name="clinic_name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="crn">CRN / registo profissional</Label>
                    <Input id="crn" name="crn" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_phone">N.º para transferências (M-Pesa / banco)</Label>
                    <Input id="payment_phone" name="payment_phone" placeholder="84XXXXXXX" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_instructions">Instruções de pagamento</Label>
                    <Textarea
                      id="payment_instructions"
                      name="payment_instructions"
                      rows={3}
                      placeholder="Ex.: Transfira via M-Pesa para o número acima e cole o SMS de confirmação na app."
                    />
                  </div>
                </>
              )}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "A criar..." : "Criar conta"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-primary/10 shadow-sm">
          <CardHeader>
            <CardTitle>Utilizadores</CardTitle>
            <CardDescription>{users.length} contas no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[480px] space-y-3 overflow-y-auto">
              {users.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum utilizador ainda.</p>
              )}
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-start justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{u.full_name || "—"}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-[10px]">
                        {u.role === "super_admin"
                          ? "Super Admin"
                          : u.role === "nutritionist"
                            ? "Nutricionista"
                            : "Cliente"}
                      </Badge>
                      {!u.is_active && (
                        <Badge variant="destructive" className="text-[10px]">
                          Inactivo
                        </Badge>
                      )}
                    </div>
                  </div>
                  {u.role !== "super_admin" && (
                    <Button size="sm" variant="outline" onClick={() => toggleActive(u)}>
                      {u.is_active ? "Desactivar" : "Activar"}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}