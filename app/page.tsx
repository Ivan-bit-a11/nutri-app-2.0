import Link from "next/link"
import { ArrowRight, Leaf, Users, Utensils, Activity, CreditCard, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const FEATURES = [
  {
    icon: Users,
    title: "Gestão de pacientes",
    description: "Registos clínicos completos, anamnese, avaliações e acompanhamento de evolução.",
  },
  {
    icon: Utensils,
    title: "Planos alimentares",
    description: "Construa planos personalizados com modelos reutilizáveis e partilha com o cliente.",
  },
  {
    icon: CreditCard,
    title: "Pagamentos manuais",
    description: "Cliente vê o número do nutricionista, transfere fora da app e cola o SMS de confirmação.",
  },
  {
    icon: Activity,
    title: "Consultas com aprovação",
    description: "Cliente pode solicitar sem pagar; o nutricionista só aprova após confirmar o pagamento.",
  },
  {
    icon: FileText,
    title: "Planos em PDF",
    description: "O cliente recebe os planos na área dele e descarrega em PDF para imprimir ou guardar.",
  },
]

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <Leaf className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold">NutriFlow</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Entrar
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="gap-1.5">
                Criar conta (cliente) <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-6 py-20 text-center">
          <Badge variant="secondary" className="mb-4 gap-1.5">
            <span className="text-xs">Plataforma de nutrição clínica</span>
          </Badge>
          <h1 className="font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            O espaço de trabalho completo
            <br className="hidden sm:block" /> para profissionais de nutrição
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground leading-relaxed text-balance">
            Nutricionistas gerem pacientes e planos. Clientes solicitam consultas, pagam por
            transferência e recebem planos em PDF. Super Admin cadastra as contas.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/register">
              <Button size="lg" className="gap-2 min-w-44">
                Registar como cliente <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="min-w-44">
                Já tenho conta
              </Button>
            </Link>
          </div>
        </section>

        <section className="border-t bg-muted/30 py-16">
          <div className="mx-auto grid max-w-6xl gap-6 px-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border bg-background p-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Ivan Mbalame — NutriFlow. Todos os direitos reservados.
      </footer>
    </div>
  )
}
