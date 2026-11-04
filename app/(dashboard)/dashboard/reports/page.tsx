import { BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ReportsPage() {
  return (
    <div className="page-shell max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Relatórios</CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <BarChart3 className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium">Módulo removido</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            As métricas principais estão no painel inicial (Pacientes, Consultas, Planos). Pode
            remover o item &quot;Relatórios&quot; do menu lateral em{" "}
            <code className="text-[11px]">components/dashboard-sidebar</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
