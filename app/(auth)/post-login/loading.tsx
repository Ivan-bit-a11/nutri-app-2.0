import { Leaf } from "lucide-react"

export default function PostLoginLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold leading-none">NutriFlow AI</p>
            <p className="text-[10px] text-muted-foreground">Preparando seu dashboard</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full w-2/5 animate-pulse rounded-full bg-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Carregando sessao, perfil e metricas em tempo real...</p>
        </div>
      </div>
    </div>
  )
}
