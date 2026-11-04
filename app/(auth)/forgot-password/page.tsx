"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Leaf, AlertCircle, ArrowLeft, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { forgotPassword } from "@/lib/actions/auth"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    const result = await forgotPassword(new FormData(e.currentTarget))
    if (result && "success" in result && !result.success) {
      setError(result.error.message)
    } else {
      setSent(true)
    }
    setIsLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-10">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Leaf className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold">NutriFlow AI</span>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "hsl(var(--success) / 0.1)" }}>
              <Mail className="h-7 w-7" style={{ color: "hsl(var(--success))" }} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Check your inbox</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                We sent a reset link to{" "}
                <span className="font-medium text-foreground">{email}</span>.
                Check your spam folder if you don&apos;t see it.
              </p>
            </div>
            <Link href="/login">
              <Button variant="outline" className="w-full gap-2 mt-2">
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight">Reset your password</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your work email and we&apos;ll send you a reset link.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Work email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@clinic.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10"
                />
              </div>
              <Button type="submit" className="w-full h-10 font-medium" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Sending link...
                  </span>
                ) : "Send reset link"}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
