"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Leaf, Eye, EyeOff, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { registerClient } from "@/lib/actions/auth"

const initialFormState = {
  full_name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
}

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState(initialFormState)

  const resetForm = () => {
    setForm(initialFormState)
    setShowPassword(false)
  }

  useEffect(() => {
    resetForm()
    setError("")
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      setError("As palavras-passe não coincidem.")
      return
    }
    if (form.password.length < 8) {
      setError("A palavra-passe deve ter pelo menos 8 caracteres.")
      return
    }
    setIsLoading(true)
    setError("")
    try {
      const result = await registerClient(new FormData(e.currentTarget))
      if (result && "success" in result && !result.success) {
        setError(result.error.message)
        return
      }
      if (result && "success" in result && result.success) {
        resetForm()
        router.replace(result.data.redirectTo)
      }
    } catch {
      setError("Não foi possível criar a conta. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Leaf className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold">NutriFlow</span>
      </div>

      <div className="w-full max-w-md space-y-6 rounded-xl border bg-card p-6 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold">Criar conta de cliente</h1>
          <p className="text-sm text-muted-foreground">
            Após o registo pode solicitar consultas e enviar comprovativos de pagamento. Contas de
            nutricionista são criadas apenas pelo Super Admin.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome completo</Label>
            <Input
              id="full_name"
              name="full_name"
              required
              minLength={2}
              value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone (opcional)</Label>
            <Input
              id="phone"
              name="phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+258 8X XXX XXXX"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Palavra-passe</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar palavra-passe</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={form.confirmPassword}
              onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "A criar..." : "Criar conta"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Entrar
          </Link>
        </p>
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Ivan Mbalame
      </p>
    </div>
  )
}
