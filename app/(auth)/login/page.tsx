"use client"

import { useActionState, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Leaf, Eye, EyeOff, AlertCircle, ArrowRight, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { loginWithState, type LoginFormState } from "@/lib/actions/auth"

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [state, formAction, isPending] = useActionState<LoginFormState, FormData>(loginWithState, {
    success: false,
    message: null,
  })

  useEffect(() => {
    if (state.success) {
      router.replace("/post-login")
    }
  }, [router, state.success])

  return (
    <div className="flex min-h-screen">
      {/* Painel esquerdo */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[45%] flex-col bg-sidebar text-sidebar-foreground p-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold text-sidebar-foreground leading-none">NutriFlow</p>
            <p className="text-[10px] text-sidebar-muted-foreground">Plataforma de nutrição</p>
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-center max-w-md">
          <h1 className="font-display text-4xl font-bold text-sidebar-foreground leading-tight text-balance mb-4">
            Nutrição clínica organizada num só lugar.
          </h1>
          <p className="text-base text-sidebar-muted-foreground leading-relaxed mb-10">
            Gira pacientes, acompanhe a evolução e crie planos alimentares personalizados.
          </p>
          <div className="space-y-4">
            {[
              { icon: Activity, label: "Avaliações e acompanhamento de composição corporal" },
              { icon: Leaf, label: "Planos alimentares e templates reutilizáveis" },
              { icon: ArrowRight, label: "Portal do cliente com planos em PDF e pagamentos" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                  <item.icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <p className="text-sm text-sidebar-muted-foreground leading-relaxed">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-sidebar-muted-foreground/50">
          &copy; {new Date().getFullYear()} Ivan Mbalame — NutriFlow. Todos os direitos reservados.
        </p>
      </div>

      {/* Painel direito */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-background">
        <div className="flex lg:hidden items-center gap-2 mb-8">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Leaf className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">NutriFlow</span>
        </div>
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Bem-vindo de volta</h2>
            <p className="mt-1 text-sm text-muted-foreground">Entre na sua área de trabalho</p>
          </div>

          <form action={formAction} className="space-y-4">
            {state.message && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{state.message}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                required
                className="h-10"
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Palavra-passe</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline underline-offset-4"
                >
                  Esqueceu a palavra-passe?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  className="h-10 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-10 font-medium" disabled={isPending}>
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  A entrar...
                </span>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <Separator className="my-6" />

          <div className="text-center text-sm text-muted-foreground">
            Ainda não tem conta?{" "}
            <Link
              href="/register"
              className="text-primary font-medium hover:underline underline-offset-4"
            >
              Criar conta de cliente
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}