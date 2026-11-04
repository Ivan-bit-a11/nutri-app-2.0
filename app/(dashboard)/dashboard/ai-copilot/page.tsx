import Link from "next/link"
import { BotOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function CopilotPage() {
  return (
    <div className="page-shell max-w-lg mx-auto py-16">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <BotOff className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>Assistente de IA desactivado</CardTitle>
          <CardDescription>
            Esta versão do NutriFlow não usa inteligência artificial, para funcionar sem chaves
            pagas. Pode criar planos alimentares e modelos manualmente.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/dashboard/diet-plans">
            <Button>Planos alimentares</Button>
          </Link>
          <Link href="/dashboard/templates">
            <Button variant="outline">Modelos</Button>
          </Link>
        </CardContent>
      </Card>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Ivan Mbalame — NutriFlow
      </p>
    </div>
  )
}
