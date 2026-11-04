import { User, Building2, Shield } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getProfile } from "@/lib/actions/auth"

export default async function SettingsPage() {
  const profile = await getProfile()

  return (
    <div className="page-shell page-stack max-w-4xl">
      <div>
        <h1 className="page-title">Configurações</h1>
        <p className="page-subtitle mt-0.5">Dados do seu perfil profissional</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4" /> Conta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex flex-wrap justify-between gap-3">
              <span className="text-muted-foreground">Nome</span>
              <span className="font-medium">{profile?.full_name || "—"}</span>
            </div>
            <div className="flex flex-wrap justify-between gap-3">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{profile?.email || "—"}</span>
            </div>
            <div className="flex flex-wrap justify-between gap-3">
              <span className="text-muted-foreground">CRN</span>
              <span className="font-medium">{profile?.crn || "—"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Clínica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex flex-wrap justify-between gap-3">
              <span className="text-muted-foreground">Nome</span>
              <span className="font-medium">{profile?.clinic_name || "—"}</span>
            </div>
            <div className="flex flex-wrap justify-between gap-3">
              <span className="text-muted-foreground">Telefone</span>
              <span className="font-medium">{profile?.phone || "—"}</span>
            </div>
            <div className="flex flex-wrap justify-between gap-3">
              <span className="text-muted-foreground">N.º pagamento (M-Pesa)</span>
              <span className="font-medium">{profile?.payment_phone || "—"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4" /> Segurança e permissões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            As permissões de alteração são validadas pelo papel do utilizador (nutricionista /
            administrador). Certifique-se de que o número de pagamento e as instruções estão
            preenchidos no perfil para os clientes poderem transferir e enviar o comprovativo.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
