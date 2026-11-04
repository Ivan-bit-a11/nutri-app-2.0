"use client"

import type React from "react"
import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createAppointment } from "@/lib/actions/clinical"

interface AppointmentPatientOption {
  id: string
  name: string
}

interface NewAppointmentFormProps {
  patients: AppointmentPatientOption[]
  loadError: string | null
}

function formatDatetimeLocal(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0")

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function defaultScheduledAt() {
  const date = new Date()
  date.setMinutes(0, 0, 0)
  date.setHours(date.getHours() + 1)
  return formatDatetimeLocal(date)
}

export function NewAppointmentForm({ patients, loadError }: NewAppointmentFormProps) {
  const router = useRouter()
  const query = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [patientId, setPatientId] = useState("")
  const [scheduledAt, setScheduledAt] = useState(defaultScheduledAt())

  useEffect(() => {
    const fromQuery = query.get("patientId")
    if (fromQuery) {
      setPatientId(fromQuery)
    }
  }, [query])

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!patientId) {
      setError("Selecione um paciente.")
      setSuccess("")
      return
    }

    setError("")
    setSuccess("")
    const formData = new FormData(event.currentTarget)
    formData.set("patientId", patientId)
    formData.set("scheduledAt", scheduledAt)

    startTransition(async () => {
      const result = await createAppointment(formData)
      if (!result.success) {
        setError(result.error.message)
        return
      }

      setSuccess("Consulta criada com sucesso. Redirecionando...")
      router.replace("/dashboard/appointments")
    })
  }

  return (
    <div className="page-shell page-stack max-w-3xl">
      <div className="flex items-start gap-3">
        <Link href="/dashboard/appointments">
          <Button variant="outline" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="page-title">Nova Consulta</h1>
          <p className="page-subtitle">Agendar consulta vinculada a um paciente</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {loadError && (
          <div className="rounded-lg border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-foreground">
            {loadError}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-success/25 bg-success/10 px-4 py-3 text-sm text-success">
            {success}
          </div>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Dados da consulta</CardTitle>
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
              <Label htmlFor="title">Titulo</Label>
              <Input id="title" name="title" required className="h-10" placeholder="Ex.: Retorno mensal" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="scheduledAt">Data e horario</Label>
              <Input
                id="scheduledAt"
                name="scheduledAt"
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
                required
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="durationMinutes">Duracao (minutos)</Label>
              <Input
                id="durationMinutes"
                name="durationMinutes"
                type="number"
                min={10}
                max={240}
                defaultValue={60}
                className="h-10"
                required
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" name="notes" className="min-h-[96px]" placeholder="Observacoes para a consulta" />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <Link href="/dashboard/appointments">
            <Button type="button" variant="outline" className="w-full sm:w-auto">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" className="w-full min-w-36 gap-2 sm:w-auto" disabled={isPending || patients.length === 0}>
            <Save className="h-4 w-4" /> {isPending ? "Salvando..." : "Salvar consulta"}
          </Button>
        </div>
      </form>
    </div>
  )
}
