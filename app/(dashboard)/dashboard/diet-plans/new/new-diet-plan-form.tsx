"use client"

import type React from "react"
import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createDietPlan } from "@/lib/actions/clinical"
import { getTemplateById } from "@/lib/actions/templates"
import type { PatientRow } from "@/lib/actions/patients"

interface TemplateOption {
  id: string
  name: string
  category: string
  goal: string | null
  tags: string[]
  status: "draft" | "active" | "archived"
  isSystemTemplate: boolean
  dailyCalories: number | null
  proteinGrams: number | null
  carbGrams: number | null
  fatGrams: number | null
  mealCountPerDay: number | null
}

interface NewDietPlanFormProps {
  patients: PatientRow[]
  templates: TemplateOption[]
}

const NO_TEMPLATE_VALUE = "__none__"

function toInputNumber(value: number | null) {
  return value == null ? "" : String(Math.round(value))
}

export function NewDietPlanForm({ patients, templates }: NewDietPlanFormProps) {
  const router = useRouter()
  const query = useSearchParams()

  const [isPending, startTransition] = useTransition()
  const [isTemplatePending, startTemplateTransition] = useTransition()

  const [error, setError] = useState("")
  const [templateError, setTemplateError] = useState("")
  const [templateMessage, setTemplateMessage] = useState("")

  const [patientId, setPatientId] = useState("")
  const [templateId, setTemplateId] = useState("")

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dailyKcal, setDailyKcal] = useState("")
  const [protein, setProtein] = useState("")
  const [carbs, setCarbs] = useState("")
  const [fat, setFat] = useState("")
  const [notes, setNotes] = useState("")

  const systemTemplates = useMemo(() => templates.filter((template) => template.isSystemTemplate), [templates])
  const personalTemplates = useMemo(() => templates.filter((template) => !template.isSystemTemplate), [templates])

  const selectedTemplate = useMemo(() => templates.find((template) => template.id === templateId) ?? null, [templates, templateId])

  const applyTemplate = useCallback(
    (nextTemplateId: string) => {
      setTemplateId(nextTemplateId)
      setTemplateError("")
      setTemplateMessage("")

      if (!nextTemplateId) {
        return
      }

      startTemplateTransition(async () => {
        try {
          const { template } = await getTemplateById(nextTemplateId)

          setTitle(template.name)
          setDescription(template.goal || template.description || "")
          setDailyKcal(toInputNumber(template.dailyCalories))
          setProtein(toInputNumber(template.proteinGrams))
          setCarbs(toInputNumber(template.carbGrams))
          setFat(toInputNumber(template.fatGrams))
          setNotes(template.professionalNotes || template.patientFriendlyNotes || "")

          setTemplateMessage(`Template \"${template.name}\" aplicado. Voce pode personalizar antes de salvar.`)
        } catch {
          setTemplateError("Nao foi possivel carregar os dados do template selecionado.")
        }
      })
    },
    [startTemplateTransition],
  )

  useEffect(() => {
    const patientFromQuery = query.get("patientId")
    const templateFromQuery = query.get("templateId")

    if (patientFromQuery) {
      setPatientId(patientFromQuery)
    }

    if (templateFromQuery) {
      applyTemplate(templateFromQuery)
    }
  }, [query, applyTemplate])

  const canSubmit = useMemo(() => patientId.length > 0 && title.trim().length >= 2, [patientId, title])

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!patientId) {
      setError("Selecione um paciente.")
      return
    }

    if (title.trim().length < 2) {
      setError("Informe um titulo com pelo menos 2 caracteres.")
      return
    }

    setError("")
    const formData = new FormData(event.currentTarget)

    formData.set("title", title)
    formData.set("description", description)
    formData.set("dailyKcal", dailyKcal)
    formData.set("protein", protein)
    formData.set("carbs", carbs)
    formData.set("fat", fat)
    formData.set("notes", notes)

    if (templateId) {
      formData.set("templateId", templateId)
    }

    startTransition(async () => {
      const result = await createDietPlan(patientId, formData)
      if (!result.success) {
        setError(result.error.message)
        return
      }

      router.push("/dashboard/diet-plans")
    })
  }

  return (
    <div className="page-shell page-stack max-w-3xl">
      <div className="flex items-start gap-3">
        <Link href="/dashboard/diet-plans">
          <Button variant="outline" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="page-title">Novo Plano Alimentar</h1>
          <p className="page-subtitle">Criar plano com persistencia em banco</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {templateError && (
          <div className="rounded-lg border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-foreground">
            {templateError}
          </div>
        )}

        {templateMessage && (
          <div className="rounded-lg border border-success/25 bg-success/10 px-4 py-3 text-sm text-success">{templateMessage}</div>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Dados principais</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Template (opcional)</Label>
              <Select
                value={templateId || NO_TEMPLATE_VALUE}
                onValueChange={(value) => applyTemplate(value === NO_TEMPLATE_VALUE ? "" : value)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_TEMPLATE_VALUE}>Sem template</SelectItem>
                  {systemTemplates.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>Sistema</SelectLabel>
                      {systemTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                  {personalTemplates.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>Meus templates</SelectLabel>
                      {personalTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>
              {isTemplatePending && <p className="text-xs text-muted-foreground">Aplicando template...</p>}
              {selectedTemplate && !isTemplatePending && (
                <p className="text-xs text-muted-foreground">
                  {selectedTemplate.category} - {selectedTemplate.mealCountPerDay ?? "-"} refeicoes - Kcal {selectedTemplate.dailyCalories ?? "-"}
                </p>
              )}
              {templateId && <input type="hidden" name="templateId" value={templateId} />}
            </div>

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
              <Input id="title" name="title" className="h-10" required value={title} onChange={(event) => setTitle(event.target.value)} />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="description">Objetivo</Label>
              <Input
                id="description"
                name="description"
                className="h-10"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Macros diarias</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="dailyKcal">Kcal</Label>
              <Input id="dailyKcal" name="dailyKcal" type="number" className="h-10" value={dailyKcal} onChange={(event) => setDailyKcal(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="protein">Proteina (g)</Label>
              <Input id="protein" name="protein" type="number" className="h-10" value={protein} onChange={(event) => setProtein(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="carbs">Carbo (g)</Label>
              <Input id="carbs" name="carbs" type="number" className="h-10" value={carbs} onChange={(event) => setCarbs(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fat">Gordura (g)</Label>
              <Input id="fat" name="fat" type="number" className="h-10" value={fat} onChange={(event) => setFat(event.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              id="notes"
              name="notes"
              className="min-h-[96px]"
              placeholder="Regras e orientacoes gerais"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <Link href="/dashboard/diet-plans">
            <Button type="button" variant="outline" className="w-full sm:w-auto">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" className="w-full min-w-36 gap-2 sm:w-auto" disabled={isPending || !canSubmit}>
            <Save className="h-4 w-4" /> {isPending ? "Salvando..." : "Salvar plano"}
          </Button>
        </div>
      </form>
    </div>
  )
}
