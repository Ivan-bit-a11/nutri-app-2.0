"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, User, Activity, Heart, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createPatient } from "@/lib/actions/patients"

const GOAL_OPTIONS = [
  "Perda de peso",
  "Ganho muscular",
  "Gestão de diabetes",
  "Saúde cardiovascular",
  "Desempenho desportivo",
  "Alimentação equilibrada",
  "Controlo de colesterol",
  "Saúde intestinal",
  "Outro",
]

const ACTIVITY_OPTIONS = [
  { value: "sedentary", label: "Sedentário (pouco ou nenhum exercício)" },
  { value: "light", label: "Ligeiramente ativo (1–3 dias/semana)" },
  { value: "moderate", label: "Moderadamente ativo (3–5 dias/semana)" },
  { value: "very_active", label: "Muito ativo (6–7 dias/semana)" },
  { value: "extra_active", label: "Extra ativo (treino intenso diário)" },
]

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const initialFormState = {
  name: "",
  dob: "",
  sex: "",
  phone: "",
  email: "",
  emergencyContact: "",
  emergencyPhone: "",
  height: "",
  goal: "",
  activityLevel: "",
  dietaryPreferences: "",
  allergies: "",
  conditions: "",
  medications: "",
  supplements: "",
  notes: "",
}

function validatePatientForm(form: typeof initialFormState) {
  if (form.name.trim().length < 2) {
    return "O nome completo deve ter pelo menos 2 caracteres."
  }

  if (form.email.trim().length > 0 && !emailRegex.test(form.email.trim())) {
    return "Introduza um email válido."
  }

  if (form.height.trim().length > 0) {
    const heightValue = Number(form.height)
    if (!Number.isFinite(heightValue) || heightValue <= 0 || heightValue > 280) {
      return "A altura deve ser um valor entre 1 e 280 cm."
    }
  }

  return null
}

export default function NewPatientPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [form, setForm] = useState(initialFormState)

  const set = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const validationError = validatePatientForm(form)
    if (validationError) {
      setError(validationError)
      setSuccess("")
      return
    }

    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const result = await createPatient(new FormData(e.currentTarget))
      if (!result?.success) {
        setError(result?.error?.message ?? "Não foi possível guardar o paciente. Tente novamente.")
        return
      }

      const patientId = result.data?.id
      if (!patientId) {
        setError("Paciente guardado, mas o identificador não foi devolvido. Atualize a página e tente de novo.")
        return
      }

      setSuccess("Paciente guardado com sucesso. A redirecionar...")
      router.replace("/dashboard/patients/" + patientId)
    } catch {
      setError("Não foi possível guardar o paciente neste momento. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="page-shell page-stack max-w-4xl">
      <div className="flex items-start gap-3">
        <Link href="/dashboard/patients">
          <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 sm:h-10 sm:w-10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="page-title">Novo paciente</h1>
          <p className="page-subtitle">
            Registe um paciente manualmente. Os pacientes criados automaticamente após pagamento
            aparecem em branco para preencher a partir da ficha médica física.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {success && (
          <div
            className="rounded-lg border border-success/25 bg-success/10 px-4 py-3 text-sm text-success"
            aria-live="polite"
          >
            {success}
          </div>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> Dados pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">
                Nome completo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="Ex.: Maria Silva"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dob">Data de nascimento</Label>
              <Input
                id="dob"
                name="dob"
                type="date"
                value={form.dob}
                onChange={(e) => set("dob", e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sex">Sexo biológico</Label>
              <Select value={form.sex} onValueChange={(v) => set("sex", v)} name="sex">
                <SelectTrigger id="sex" className="h-10">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Feminino</SelectItem>
                  <SelectItem value="male">Masculino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                name="phone"
                placeholder="84XXXXXXX"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="cliente@email.com"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emergencyContact">Contacto de emergência (nome)</Label>
              <Input
                id="emergencyContact"
                name="emergencyContact"
                placeholder="Nome do contacto"
                value={form.emergencyContact}
                onChange={(e) => set("emergencyContact", e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emergencyPhone">Contacto de emergência (telefone)</Label>
              <Input
                id="emergencyPhone"
                name="emergencyPhone"
                placeholder="84XXXXXXX"
                value={form.emergencyPhone}
                onChange={(e) => set("emergencyPhone", e.target.value)}
                className="h-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Dados físicos e objectivo
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="height">Altura (cm)</Label>
              <Input
                id="height"
                name="height"
                type="number"
                placeholder="165"
                value={form.height}
                onChange={(e) => set("height", e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal">Objectivo principal</Label>
              <Select value={form.goal} onValueChange={(v) => set("goal", v)} name="goal">
                <SelectTrigger id="goal" className="h-10">
                  <SelectValue placeholder="Seleccionar objectivo..." />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_OPTIONS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="activity">Nível de actividade</Label>
              <Select
                value={form.activityLevel}
                onValueChange={(v) => set("activityLevel", v)}
                name="activityLevel"
              >
                <SelectTrigger id="activity" className="h-10">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" /> Saúde e preferências
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="dietaryPreferences">Preferências alimentares</Label>
              <Input
                id="dietaryPreferences"
                name="dietaryPreferences"
                placeholder="Ex.: vegetariano, sem glúten..."
                value={form.dietaryPreferences}
                onChange={(e) => set("dietaryPreferences", e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="allergies">Alergias / intolerâncias</Label>
              <Input
                id="allergies"
                name="allergies"
                placeholder="Ex.: lactose, amendoim..."
                value={form.allergies}
                onChange={(e) => set("allergies", e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="conditions">Condições de saúde</Label>
              <Input
                id="conditions"
                name="conditions"
                placeholder="Ex.: diabetes tipo 2, hipertensão..."
                value={form.conditions}
                onChange={(e) => set("conditions", e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="medications">Medicação</Label>
              <Input
                id="medications"
                name="medications"
                placeholder="Ex.: Metformina 500mg..."
                value={form.medications}
                onChange={(e) => set("medications", e.target.value)}
                className="h-10"
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="supplements">Suplementos actuais</Label>
              <Input
                id="supplements"
                name="supplements"
                placeholder="Ex.: Vitamina D, ómega-3..."
                value={form.supplements}
                onChange={(e) => set("supplements", e.target.value)}
                className="h-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Notas profissionais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Observações iniciais (não visíveis ao paciente)</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Anote observações clínicas, motivação, contexto da ficha física..."
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse gap-2 pb-6 sm:flex-row sm:justify-end sm:gap-3">
          <Link href="/dashboard/patients">
            <Button variant="outline" type="button" className="w-full sm:w-auto">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={isLoading} className="w-full min-w-32 gap-2 sm:w-auto">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                A guardar...
              </span>
            ) : (
              <>
                <Save className="h-4 w-4" /> Guardar paciente
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
