import Link from "next/link"
import { Leaf, Home, CalendarPlus, CreditCard, FileText, LogOut } from "lucide-react"
import { signOut } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"

const NAV = [
  { href: "/cliente", label: "Início", icon: Home },
  { href: "/cliente/consultas", label: "Consultas", icon: CalendarPlus },
  { href: "/cliente/pagamentos", label: "Pagamentos", icon: CreditCard },
  { href: "/cliente/planos", label: "Planos", icon: FileText },
]

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 border-b border-primary/10 bg-gradient-to-r from-primary to-emerald-700 text-white shadow-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
              <Leaf className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-bold leading-none tracking-tight">NutriFlow</p>
              <p className="text-[11px] text-white/75 mt-0.5">Área do Cliente</p>
            </div>
          </div>
          <nav className="hidden items-center gap-1 sm:flex">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-white/90 hover:text-white hover:bg-white/15"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
            <form action={signOut}>
              <Button
                type="submit"
                size="sm"
                className="gap-1.5 ml-2 bg-white/15 hover:bg-white/25 text-white border-0"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </form>
          </nav>
        </div>
      </header>

      {/* Mobile nav */}
      <nav className="flex gap-1 overflow-x-auto border-b border-primary/10 bg-secondary/50 px-2 py-2 sm:hidden sticky top-16 z-30">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href}>
            <Button variant="ghost" size="sm" className="gap-1 shrink-0 text-primary hover:bg-primary/10">
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          </Link>
        ))}
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm" className="gap-1 shrink-0 text-muted-foreground">
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </form>
      </nav>

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-6 sm:py-8">{children}</main>

      <footer className="border-t border-primary/10 bg-secondary/30 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Ivan Mbalame — NutriFlow · Cuidado nutricional com confiança
      </footer>
    </div>
  )
}
