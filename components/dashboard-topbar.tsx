"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, Search, Moon, Sun, ChevronRight, Home } from "lucide-react"
import { useTheme } from "next-themes"
import { signOut } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useTranslation } from "react-i18next"

interface DashboardTopbarProps {
  profileName: string | null
  profileEmail: string | null
}

const breadcrumbMap: Record<string, string> = {
  dashboard: "Dashboard",
  patients: "Pacientes",
  assessments: "Avaliacoes",
  "diet-plans": "Planos",
  templates: "Modelos",
  "ai-copilot": "AI Copilot",
  messages: "Mensagens",
  documents: "Documentos",
  reports: "Relatorios",
  settings: "Configuracoes",
  appointments: "Consultas",
  new: "Novo",
}

function initials(name: string | null) {
  if (!name) return "NF"
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Link href="/dashboard" className="hover:text-foreground transition-colors">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {segments.slice(1).map((seg, idx) => {
        const href = "/" + segments.slice(0, idx + 2).join("/")
        const label = breadcrumbMap[seg] || decodeURIComponent(seg)
        const isLast = idx === segments.length - 2
        return (
          <span key={seg + idx} className="flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3" />
            {isLast ? (
              <span className="text-foreground font-medium">{label}</span>
            ) : (
              <Link href={href} className="hover:text-foreground transition-colors">
                {label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}

export function DashboardTopbar({ profileName, profileEmail }: DashboardTopbarProps) {
  const { t, ready } = useTranslation("common", { useSuspense: false })
  const tx = (key: string, defaultValue: string) =>
    (ready && typeof window !== "undefined" ? t(key, { defaultValue }) : defaultValue)
  const { theme, setTheme } = useTheme()
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-card/90 px-3 pl-14 backdrop-blur-sm sm:gap-3 sm:px-4 sm:pl-16 md:px-6 md:pl-6">
      <div className="hidden md:flex flex-1">
        <Breadcrumbs />
      </div>

      <div className={cn("flex items-center gap-1.5 transition-all sm:gap-2", searchOpen ? "flex-1" : "")}>
        {searchOpen ? (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              autoFocus
              placeholder={tx("search", "Buscar")}
              className="pl-8 h-8 text-sm bg-background"
              onBlur={() => setSearchOpen(false)}
            />
          </div>
        ) : (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setSearchOpen(true)}>
            <Search className="h-4 w-4" />
            <span className="sr-only">{tx("search", "Buscar")}</span>
          </Button>
        )}
      </div>

      <div className="flex items-center gap-0.5 sm:gap-1">
        <LanguageSwitcher />

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{tx("toggleTheme", "Alternar tema")}</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="hidden h-8 w-8 text-muted-foreground hover:text-foreground sm:inline-flex">
              <Bell className="h-4 w-4" />
              <span className="sr-only">{tx("notifications", "Notificacoes")}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>{tx("notifications", "Notificacoes")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs text-muted-foreground">{tx("emptyNotifications", "Sem notificacoes pendentes")}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-2 px-2 text-muted-foreground hover:text-foreground">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-semibold">
                {initials(profileName)}
              </div>
              <span className="hidden md:block text-xs font-medium text-foreground">{profileName ?? "Usuario"}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{profileName ?? "Usuario"}</span>
                <span className="text-xs font-normal text-muted-foreground">{profileEmail ?? "-"}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">{tx("settings", "Configuracoes")}</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={signOut}>
              <DropdownMenuItem asChild className="text-destructive focus:text-destructive">
                <button type="submit" className="w-full cursor-pointer text-left">
                  {tx("signOut", "Sair")}
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
