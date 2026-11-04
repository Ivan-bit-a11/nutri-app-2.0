import { MessageSquare } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function MessagesPage() {
  return (
    <div className="page-shell max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Mensagens</CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <MessageSquare className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium">Módulo removido</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Esta secção não faz parte do fluxo actual. Use Pagamentos e consultas para comunicar
            sobre comprovativos e pedidos. Pode remover o item &quot;Mensagens&quot; do menu lateral
            em <code className="text-[11px]">components/dashboard-sidebar</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
