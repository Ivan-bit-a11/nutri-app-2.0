import { FolderOpen } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DocumentsPage() {
  return (
    <div className="page-shell max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Documentos</CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <FolderOpen className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium">Módulo em preparação</p>
          <p className="text-xs text-muted-foreground mt-1">
            Em breve poderá anexar a ficha médica física e outros documentos ao paciente. Por agora,
            preencha os dados na ficha do paciente e publique o plano alimentar para o cliente
            descarregar em PDF.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
