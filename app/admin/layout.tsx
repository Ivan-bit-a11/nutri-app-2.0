import Link from "next/link"
import { Leaf, LayoutDashboard, LogOut, Shield } from "lucide-react"
import { signOut } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 border-b border-primary/10 bg-gradient-to-r from-primary to-emerald-800 text-white shadow-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-bold leading-none tracking-tight">NutriFlow</p>
              <p className="text-[11px] text-white/75 mt-0.5">Painel Super Admin</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="gap-1.5 text-white/90 hover:text-white hover:bg-white/15">
                <LayoutDashboard className="h-4 w-4" />
                Início
              </Button>
            </Link>
            <form action={signOut}>
              <Button type="submit" size="sm" className="gap-1.5 bg-white/15 hover:bg-white/25 text-white border-0">
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">{children}</main>
      <footer className="border-t border-primary/10 bg-secondary/30 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Ivan Mbalame — NutriFlow · Administração
      </footer>
    </div>
  )
}
