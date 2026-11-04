import Link from "next/link"
import { Leaf, MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function RegisterSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center space-y-5">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Leaf className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold">NutriFlow AI</span>
        </div>

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "hsl(var(--success) / 0.1)" }}>
          <MailCheck className="h-8 w-8" style={{ color: "hsl(var(--success))" }} />
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight">Confirm your email</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            We sent a confirmation link to your email address. Click the link to activate your account and access your workspace.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted/40 p-4 text-left space-y-1.5">
          <p className="text-xs font-medium text-foreground">Didn&apos;t receive the email?</p>
          <p className="text-xs text-muted-foreground">Check your spam folder or wait a few minutes. The link expires in 24 hours.</p>
        </div>

        <Link href="/login">
          <Button variant="outline" className="w-full">Back to sign in</Button>
        </Link>
      </div>
    </div>
  )
}
