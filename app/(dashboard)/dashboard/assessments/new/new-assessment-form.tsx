"use client"

import type React from "react"
import { useEffect, useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createAssessment } from "@/lib/actions/clinical"
import type { PatientRow } from "@/lib/actions/patients"

interface NewAssessmentFormProps {
  patients: PatientRow[]
}

export function NewAssessmentForm({ patients }: NewAssessmentFormProps) {
  const router = useRouter()
  const query = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [patientId, setPatientId] = useState("")
  const [assessedAt, setAssessedAt] = useState(new Date().toISOString().split("T")[0])

  useEffect(() => {
    const fromQuery = query.get("patientId")
    if (fromQuery) {
      setPatientId(fromQuery)
    }
  }, [query])

  const canSubmit = useMemo(() => patientId.length > 0, [patientId])

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!patientId) {
      setError("Selecione um paciente.")
      return
    }

    setError("")
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await createAssessment(patientId, formData)
      if (!result.success) {
        setError(result.error.message)
        return
      }
      router.push("/dashboard/patients/" + patientId)
    })
  }

  return (
    <div className="page-shell page-stack max-w-3xl">
      <div className="flex items-start gap-3">
        <Link href="/dashboard/assessments">
          <Button variant="outline" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="page-title">Nova Avaliacao</h1>
          <p className="page-subtitle">Registrar dados antropometricos reais</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Informacoes basicas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Paciente</Label>
              <Select value={patientId} onValueChange={setPatientId}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="assessedAt">Data</Label>
              <Input
                id="assessedAt"
                name="assessedAt"
                type="date"
                value={assessedAt}
                onChange={(event) => setAssessedAt(event.target.value)}
                className="h-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Medidas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input id="weight" name="weight" type="number" step="0.1" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="height">Altura (cm)</Label>
              <Input id="height" name="height" type="number" step="0.1" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="waist">Cintura (cm)</Label>
              <Input id="waist" name="waist" type="number" step="0.1" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hip">Quadril (cm)</Label>
              <Input id="hip" name="hip" type="number" step="0.1" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bmi">IMC</Label>
              <Input id="bmi" name="bmi" type="number" step="0.1" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bodyFat">Gordura corporal (%)</Label>
              <Input id="bodyFat" name="bodyFat" type="number" step="0.1" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="leanMass">Massa magra (kg)</Label>
              <Input id="leanMass" name="leanMass" type="number" step="0.1" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fatMass">Massa gorda (kg)</Label>
              <Input id="fatMass" name="fatMass" type="number" step="0.1" className="h-10" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea id="notes" name="notes" className="min-h-[96px]" placeholder="Observacoes clinicas" />
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <Link href="/dashboard/assessments">
            <Button type="button" variant="outline" className="w-full sm:w-auto">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" className="w-full min-w-36 gap-2 sm:w-auto" disabled={!canSubmit || isPending}>
            <Save className="h-4 w-4" /> {isPending ? "Salvando..." : "Salvar avaliacao"}
          </Button>
        </div>
      </form>
    </div>
  )
}
