"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "@/lib/actions/auth"
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  ClipboardList,
  Utensils,
  BookTemplate,
  MessageSquare,
  FolderOpen,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  Leaf,
  Menu,
  CreditCard,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useTranslation } from "react-i18next"

interface DashboardSidebarProps {
  profileName: string | null
  role: string | null
}

interface NavItem {
  label: string
  icon: React.ElementType
  href: string
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

function NavItemComponent({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname()
  const isActive =
    item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === item.href || pathname.startsWith(item.href + "/")

  const content = (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150",
        collapsed ? "justify-center px-2" : "",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
      )}
    >
      <item.icon className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-4 w-4")} />
      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    )
  }

  return content
}

function SidebarContent({
  collapsed,
  profileName,
  role,
}: {
  collapsed: boolean
  profileName: string | null
  role: string | null
}) {
  const { t, ready } = useTranslation(["dashboard", "common"], { useSuspense: false })
  const tx = (key: string, defaultValue: string) =>
    (ready && typeof window !== "undefined" ? t(key, { defaultValue }) : defaultValue)
  const navGroups: { label: string; items: NavItem[] }[] = [
    {
      label: tx("dashboard:nav.overview", "Visao Geral"),
      items: [{ label: tx("dashboard:nav.dashboard", "Dashboard"), icon: LayoutDashboard, href: "/dashboard" }],
    },
    {
      label: tx("dashboard:nav.clinical", "Clinico"),
      items: [
        { label: tx("dashboard:nav.patients", "Pacientes"), icon: Users, href: "/dashboard/patients" },
        { label: tx("dashboard:nav.appointments", "Consultas"), icon: CalendarDays, href: "/dashboard/appointments" },
        { label: tx("dashboard:nav.assessments", "Avaliacoes"), icon: ClipboardList, href: "/dashboard/assessments" },
      ],
    },
    {
      label: tx("dashboard:nav.nutrition", "Nutricao"),
      items: [
        { label: tx("dashboard:nav.plans", "Planos"), icon: Utensils, href: "/dashboard/diet-plans" },
        { label: tx("dashboard:nav.templates", "Modelos"), icon: BookTemplate, href: "/dashboard/templates" },
      ],
    },
    {
      label: tx("dashboard:nav.management", "Gestão"),
      items: [
        { label: "Pagamentos", icon: CreditCard, href: "/dashboard/pagamentos" },
        { label: tx("dashboard:nav.messages", "Mensagens"), icon: MessageSquare, href: "/dashboard/messages" },
        { label: tx("dashboard:nav.documents", "Documentos"), icon: FolderOpen, href: "/dashboard/documents" },
        { label: tx("dashboard:nav.reports", "Relatórios"), icon: BarChart3, href: "/dashboard/reports" },
      ],
    },
  ]

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className={cn("flex h-14 shrink-0 items-center border-b border-sidebar-border", collapsed ? "justify-center px-2" : "gap-2.5 px-4")}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Leaf className="h-4 w-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground leading-none">NutriFlow</span>
            <span className="text-[10px] text-sidebar-muted-foreground leading-none mt-0.5">Ivan Mbalame</span>
          </div>
        )}
      </div>

      <TooltipProvider delayDuration={0}>
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted-foreground/60">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavItemComponent key={item.href} item={item} collapsed={collapsed} />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </TooltipProvider>

      <TooltipProvider delayDuration={0}>
      <div className="shrink-0 border-t border-sidebar-border p-2 space-y-0.5">
        <NavItemComponent item={{ label: tx("common:settings", "Configuracoes"), icon: Settings, href: "/dashboard/settings" }} collapsed={collapsed} />
        <form action={signOut}>
          <button
            type="submit"
            className={cn(
              "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              collapsed ? "justify-center px-2" : "",
              "text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
            )}
          >
            <LogOut className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-4 w-4")} />
            {!collapsed && <span>{tx("common:signOut", "Sair")}</span>}
          </button>
        </form>

        {!collapsed && (
          <div className="mt-2 pt-2 border-t border-sidebar-border/50">
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-semibold">
                {initials(profileName)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-sidebar-foreground truncate">{profileName ?? tx("common:user", "Usuario")}</p>
                <p className="text-[10px] text-sidebar-muted-foreground truncate">{role ?? "nutritionist"}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      </TooltipProvider>
    </div>
  )
}

export function DashboardSidebar({ profileName, role }: DashboardSidebarProps) {
  const { t, ready } = useTranslation("common", { useSuspense: false })
  const tx = (key: string, defaultValue: string) =>
    (ready && typeof window !== "undefined" ? t(key, { defaultValue }) : defaultValue)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="fixed left-2.5 top-2.5 z-40 h-10 w-10 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">{tx("common:openMenu", "Abrir menu")}</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[85vw] max-w-xs border-r border-sidebar-border p-0" onClick={() => setMobileOpen(false)}>
          <SidebarContent collapsed={false} profileName={profileName} role={role} />
        </SheetContent>
      </Sheet>

      <aside
        className={cn(
          "hidden md:flex h-screen flex-col shrink-0 sticky top-0 transition-all duration-300 border-r border-sidebar-border",
          collapsed ? "w-14" : "w-60",
        )}
      >
        <SidebarContent collapsed={collapsed} profileName={profileName} role={role} />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-16 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card shadow-sm text-muted-foreground hover:text-foreground transition-colors"
          aria-label={collapsed ? tx("common:expandSidebar", "Expandir sidebar") : tx("common:collapseSidebar", "Recolher sidebar")}
        >
          <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", collapsed ? "-rotate-90" : "rotate-90")} />
        </button>
      </aside>
    </>
  )
}
