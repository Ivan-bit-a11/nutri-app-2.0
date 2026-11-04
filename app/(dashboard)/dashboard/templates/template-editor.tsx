"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createTemplateMutation, updateTemplateMutation } from "@/lib/actions/templates"
import type { TemplateEditorInput } from "@/server/schemas/template.schemas"

interface TemplateVersionSummary {
  id: string
  version: number
  changeSummary: string | null
  createdAt: string
}

interface TemplateInitialData {
  id: string
  name: string
  slug: string
  description: string | null
  category: string
  goal: string | null
  tags: string[]
  status: "draft" | "active" | "archived"
  dietaryPattern: string | null
  restrictions: string[]
  allergens: string[]
  foodsToAvoid: string[]
  preferredFoods: string[]
  professionalNotes: string | null
  patientFriendlyNotes: string | null
  dailyCalories: number | null
  proteinGrams: number | null
  carbGrams: number | null
  fatGrams: number | null
  proteinPercent: number | null
  carbPercent: number | null
  fatPercent: number | null
  fiberTargetGrams: number | null
  waterTargetMl: number | null
  mealCountPerDay: number | null
  durationDays: number
  meals: Array<{
    name: string
    timeLabel: string
    instructions: string
    items: Array<{
      foodName: string
      quantity: string
      unit: string
      householdMeasure: string
      preparationNotes: string
      estimatedNutrition: {
        kcal: number | null
        protein: number | null
        carbs: number | null
        fat: number | null
      }
      substitutions: string[]
    }>
  }>
  hydrationPlan: string | null
  supplements: string[]
  shoppingList: string[]
  mealPrepTips: string[]
  adherenceTips: string[]
  generalRecommendations: string[]
}

interface MealItemForm {
  foodName: string
  quantity: string
  unit: string
  householdMeasure: string
  preparationNotes: string
  kcal: string
  protein: string
  carbs: string
  fat: string
  substitutions: string
}

interface MealForm {
  name: string
  timeLabel: string
  instructions: string
  items: MealItemForm[]
}

interface TemplateFormState {
  name: string
  slug: string
  description: string
  category: string
  goal: string
  tags: string
  status: "draft" | "active" | "archived"
  dietaryPattern: string
  restrictions: string
  allergens: string
  foodsToAvoid: string
  preferredFoods: string
  professionalNotes: string
  patientFriendlyNotes: string
  dailyCalories: string
  proteinGrams: string
  carbGrams: string
  fatGrams: string
  proteinPercent: string
  carbPercent: string
  fatPercent: string
  fiberTargetGrams: string
  waterTargetMl: string
  mealCountPerDay: string
  durationDays: string
  hydrationPlan: string
  supplements: string
  shoppingList: string
  mealPrepTips: string
  adherenceTips: string
  generalRecommendations: string
  meals: MealForm[]
}

interface TemplateEditorProps {
  mode: "create" | "edit"
  initialTemplate?: TemplateInitialData
  versions?: TemplateVersionSummary[]
}

function emptyMealItem(): MealItemForm {
  return {
    foodName: "",
    quantity: "",
    unit: "",
    householdMeasure: "",
    preparationNotes: "",
    kcal: "",
    protein: "",
    carbs: "",
    fat: "",
    substitutions: "",
  }
}

function emptyMeal(): MealForm {
  return {
    name: "",
    timeLabel: "",
    instructions: "",
    items: [emptyMealItem()],
  }
}

function splitList(value: string): string[] {
  return value
    .split(/[\n,;]/g)
    .map((item) => item.trim())
    .filter(Boolean)
}

function joinList(value: string[] | null | undefined): string {
  return (value ?? []).join("\n")
}

function toOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : undefined
}

function numberToString(value: number | null | undefined): string {
  if (value == null) return ""
  return String(value)
}

function toInitialState(initialTemplate?: TemplateInitialData): TemplateFormState {
  if (!initialTemplate) {
    return {
      name: "",
      slug: "",
      description: "",
      category: "general",
      goal: "",
      tags: "",
      status: "draft",
      dietaryPattern: "",
      restrictions: "",
      allergens: "",
      foodsToAvoid: "",
      preferredFoods: "",
      professionalNotes: "",
      patientFriendlyNotes: "",
      dailyCalories: "",
      proteinGrams: "",
      carbGrams: "",
      fatGrams: "",
      proteinPercent: "",
      carbPercent: "",
      fatPercent: "",
      fiberTargetGrams: "",
      waterTargetMl: "",
      mealCountPerDay: "",
      durationDays: "7",
      hydrationPlan: "",
      supplements: "",
      shoppingList: "",
      mealPrepTips: "",
      adherenceTips: "",
      generalRecommendations: "",
      meals: [],
    }
  }

  return {
    name: initialTemplate.name,
    slug: initialTemplate.slug,
    description: initialTemplate.description || "",
    category: initialTemplate.category,
    goal: initialTemplate.goal || "",
    tags: joinList(initialTemplate.tags),
    status: initialTemplate.status,
    dietaryPattern: initialTemplate.dietaryPattern || "",
    restrictions: joinList(initialTemplate.restrictions),
    allergens: joinList(initialTemplate.allergens),
    foodsToAvoid: joinList(initialTemplate.foodsToAvoid),
    preferredFoods: joinList(initialTemplate.preferredFoods),
    professionalNotes: initialTemplate.professionalNotes || "",
    patientFriendlyNotes: initialTemplate.patientFriendlyNotes || "",
    dailyCalories: numberToString(initialTemplate.dailyCalories),
    proteinGrams: numberToString(initialTemplate.proteinGrams),
    carbGrams: numberToString(initialTemplate.carbGrams),
    fatGrams: numberToString(initialTemplate.fatGrams),
    proteinPercent: numberToString(initialTemplate.proteinPercent),
    carbPercent: numberToString(initialTemplate.carbPercent),
    fatPercent: numberToString(initialTemplate.fatPercent),
    fiberTargetGrams: numberToString(initialTemplate.fiberTargetGrams),
    waterTargetMl: numberToString(initialTemplate.waterTargetMl),
    mealCountPerDay: numberToString(initialTemplate.mealCountPerDay),
    durationDays: numberToString(initialTemplate.durationDays || 7),
    hydrationPlan: initialTemplate.hydrationPlan || "",
    supplements: joinList(initialTemplate.supplements),
    shoppingList: joinList(initialTemplate.shoppingList),
    mealPrepTips: joinList(initialTemplate.mealPrepTips),
    adherenceTips: joinList(initialTemplate.adherenceTips),
    generalRecommendations: joinList(initialTemplate.generalRecommendations),
    meals: initialTemplate.meals.map((meal) => ({
      name: meal.name,
      timeLabel: meal.timeLabel,
      instructions: meal.instructions,
      items: meal.items.map((item) => ({
        foodName: item.foodName,
        quantity: item.quantity,
        unit: item.unit,
        householdMeasure: item.householdMeasure,
        preparationNotes: item.preparationNotes,
        kcal: numberToString(item.estimatedNutrition.kcal),
        protein: numberToString(item.estimatedNutrition.protein),
        carbs: numberToString(item.estimatedNutrition.carbs),
        fat: numberToString(item.estimatedNutrition.fat),
        substitutions: joinList(item.substitutions),
      })),
    })),
  }
}

function toPayload(state: TemplateFormState, status: "draft" | "active" | "archived"): TemplateEditorInput {
  return {
    name: state.name,
    slug: state.slug,
    description: state.description,
    category: state.category,
    goal: state.goal,
    tags: splitList(state.tags),
    status,
    dietaryPattern: state.dietaryPattern,
    restrictions: splitList(state.restrictions),
    allergens: splitList(state.allergens),
    foodsToAvoid: splitList(state.foodsToAvoid),
    preferredFoods: splitList(state.preferredFoods),
    professionalNotes: state.professionalNotes,
    patientFriendlyNotes: state.patientFriendlyNotes,
    dailyCalories: toOptionalNumber(state.dailyCalories),
    proteinGrams: toOptionalNumber(state.proteinGrams),
    carbGrams: toOptionalNumber(state.carbGrams),
    fatGrams: toOptionalNumber(state.fatGrams),
    proteinPercent: toOptionalNumber(state.proteinPercent),
    carbPercent: toOptionalNumber(state.carbPercent),
    fatPercent: toOptionalNumber(state.fatPercent),
    fiberTargetGrams: toOptionalNumber(state.fiberTargetGrams),
    waterTargetMl: toOptionalNumber(state.waterTargetMl),
    mealCountPerDay: toOptionalNumber(state.mealCountPerDay),
    durationDays: Number(state.durationDays || 7),
    days: [],
    meals: state.meals.map((meal) => ({
      name: meal.name,
      timeLabel: meal.timeLabel,
      instructions: meal.instructions,
      items: meal.items.map((item) => ({
        foodName: item.foodName,
        quantity: item.quantity,
        unit: item.unit,
        householdMeasure: item.householdMeasure,
        preparationNotes: item.preparationNotes,
        estimatedNutrition: {
          kcal: toOptionalNumber(item.kcal),
          protein: toOptionalNumber(item.protein),
          carbs: toOptionalNumber(item.carbs),
          fat: toOptionalNumber(item.fat),
        },
        substitutions: splitList(item.substitutions),
      })),
    })),
    hydrationPlan: state.hydrationPlan,
    supplements: splitList(state.supplements),
    shoppingList: splitList(state.shoppingList),
    mealPrepTips: splitList(state.mealPrepTips),
    adherenceTips: splitList(state.adherenceTips),
    generalRecommendations: splitList(state.generalRecommendations),
  }
}

export function TemplateEditor({ mode, initialTemplate, versions = [] }: TemplateEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [form, setForm] = useState<TemplateFormState>(() => toInitialState(initialTemplate))
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const pageTitle = mode === "create" ? "Novo Template" : `Editar Template: ${initialTemplate?.name || ""}`
  const canSubmit = useMemo(() => form.name.trim().length >= 2 && form.category.trim().length >= 2, [form.name, form.category])

  const setField = <K extends keyof TemplateFormState>(key: K, value: TemplateFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const updateMeal = (mealIndex: number, updater: (meal: MealForm) => MealForm) => {
    setForm((current) => ({
      ...current,
      meals: current.meals.map((meal, index) => (index === mealIndex ? updater(meal) : meal)),
    }))
  }

  const addMeal = () => {
    setForm((current) => ({ ...current, meals: [...current.meals, emptyMeal()] }))
  }

  const removeMeal = (mealIndex: number) => {
    setForm((current) => ({ ...current, meals: current.meals.filter((_, index) => index !== mealIndex) }))
  }

  const moveMeal = (mealIndex: number, direction: "up" | "down") => {
    setForm((current) => {
      const targetIndex = direction === "up" ? mealIndex - 1 : mealIndex + 1
      if (targetIndex < 0 || targetIndex >= current.meals.length) return current

      const nextMeals = [...current.meals]
      const [moved] = nextMeals.splice(mealIndex, 1)
      nextMeals.splice(targetIndex, 0, moved)
      return { ...current, meals: nextMeals }
    })
  }

  const addMealItem = (mealIndex: number) => {
    updateMeal(mealIndex, (meal) => ({ ...meal, items: [...meal.items, emptyMealItem()] }))
  }

  const removeMealItem = (mealIndex: number, itemIndex: number) => {
    updateMeal(mealIndex, (meal) => ({
      ...meal,
      items: meal.items.filter((_, index) => index !== itemIndex),
    }))
  }

  const updateMealItem = (mealIndex: number, itemIndex: number, updater: (item: MealItemForm) => MealItemForm) => {
    updateMeal(mealIndex, (meal) => ({
      ...meal,
      items: meal.items.map((item, index) => (index === itemIndex ? updater(item) : item)),
    }))
  }

  const handleSubmit = (status: "draft" | "active", createNewVersion = false) => {
    setError("")
    setSuccess("")

    if (!canSubmit) {
      setError("Preencha nome e categoria para salvar o template.")
      return
    }

    const payload = toPayload(form, status)

    startTransition(async () => {
      if (mode === "create") {
        const result = await createTemplateMutation(payload)
        if (!result.success) {
          setError(result.error.message)
          return
        }

        setSuccess("Template criado com sucesso.")
        router.push(`/dashboard/templates/${result.data.id}`)
        return
      }

      if (!initialTemplate) {
        setError("Template invalido para edicao.")
        return
      }

      const result = await updateTemplateMutation(initialTemplate.id, payload, {
        createNewVersion,
      })

      if (!result.success) {
        setError(result.error.message)
        return
      }

      setSuccess(createNewVersion ? "Template salvo e nova versao criada." : "Template atualizado com sucesso.")
      router.refresh()
    })
  }

  return (
    <div className="page-shell page-stack max-w-5xl">
      <div className="flex items-start gap-3">
        <Link href="/dashboard/templates">
          <Button variant="outline" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>

        <div>
          <h1 className="page-title">{pageTitle}</h1>
          <p className="page-subtitle">Edite metadata, metas nutricionais, agenda de refeicoes e recomendacoes.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-success/25 bg-success/10 px-4 py-3 text-sm text-success">{success}</div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Metadata</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={form.name} onChange={(event) => setField("name", event.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" value={form.slug} onChange={(event) => setField("slug", event.target.value)} placeholder="gerado automaticamente se vazio" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category">Categoria</Label>
            <Input id="category" value={form.category} onChange={(event) => setField("category", event.target.value)} placeholder="weight-management, performance..." />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="goal">Objetivo</Label>
            <Input id="goal" value={form.goal} onChange={(event) => setField("goal", event.target.value)} placeholder="weight_loss, muscle_gain..." />
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="description">Descricao</Label>
            <Textarea id="description" value={form.description} onChange={(event) => setField("description", event.target.value)} />
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="tags">Tags (uma por linha)</Label>
            <Textarea id="tags" value={form.tags} onChange={(event) => setField("tags", event.target.value)} className="min-h-[80px]" />
          </div>

          <div className="space-y-1.5">
            <Label>Status atual</Label>
            <Select value={form.status} onValueChange={(value) => setField("status", value as TemplateFormState["status"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="archived">Arquivado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dietaryPattern">Padrao alimentar</Label>
            <Input id="dietaryPattern" value={form.dietaryPattern} onChange={(event) => setField("dietaryPattern", event.target.value)} placeholder="omnivore, vegetarian..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Regras e filtros alimentares</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="restrictions">Restricoes (uma por linha)</Label>
            <Textarea id="restrictions" value={form.restrictions} onChange={(event) => setField("restrictions", event.target.value)} className="min-h-[96px]" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="allergens">Alergenos (uma por linha)</Label>
            <Textarea id="allergens" value={form.allergens} onChange={(event) => setField("allergens", event.target.value)} className="min-h-[96px]" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="foodsToAvoid">Alimentos a evitar</Label>
            <Textarea id="foodsToAvoid" value={form.foodsToAvoid} onChange={(event) => setField("foodsToAvoid", event.target.value)} className="min-h-[96px]" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="preferredFoods">Alimentos preferidos</Label>
            <Textarea id="preferredFoods" value={form.preferredFoods} onChange={(event) => setField("preferredFoods", event.target.value)} className="min-h-[96px]" />
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="professionalNotes">Notas profissionais</Label>
            <Textarea id="professionalNotes" value={form.professionalNotes} onChange={(event) => setField("professionalNotes", event.target.value)} className="min-h-[96px]" />
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="patientFriendlyNotes">Notas para paciente</Label>
            <Textarea id="patientFriendlyNotes" value={form.patientFriendlyNotes} onChange={(event) => setField("patientFriendlyNotes", event.target.value)} className="min-h-[96px]" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Metas nutricionais</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5"><Label>Kcal/dia</Label><Input type="number" value={form.dailyCalories} onChange={(event) => setField("dailyCalories", event.target.value)} /></div>
          <div className="space-y-1.5"><Label>Proteina (g)</Label><Input type="number" value={form.proteinGrams} onChange={(event) => setField("proteinGrams", event.target.value)} /></div>
          <div className="space-y-1.5"><Label>Carbo (g)</Label><Input type="number" value={form.carbGrams} onChange={(event) => setField("carbGrams", event.target.value)} /></div>
          <div className="space-y-1.5"><Label>Gordura (g)</Label><Input type="number" value={form.fatGrams} onChange={(event) => setField("fatGrams", event.target.value)} /></div>

          <div className="space-y-1.5"><Label>Proteina (%)</Label><Input type="number" value={form.proteinPercent} onChange={(event) => setField("proteinPercent", event.target.value)} /></div>
          <div className="space-y-1.5"><Label>Carbo (%)</Label><Input type="number" value={form.carbPercent} onChange={(event) => setField("carbPercent", event.target.value)} /></div>
          <div className="space-y-1.5"><Label>Gordura (%)</Label><Input type="number" value={form.fatPercent} onChange={(event) => setField("fatPercent", event.target.value)} /></div>
          <div className="space-y-1.5"><Label>Fibra (g)</Label><Input type="number" value={form.fiberTargetGrams} onChange={(event) => setField("fiberTargetGrams", event.target.value)} /></div>

          <div className="space-y-1.5"><Label>Agua (ml)</Label><Input type="number" value={form.waterTargetMl} onChange={(event) => setField("waterTargetMl", event.target.value)} /></div>
          <div className="space-y-1.5"><Label>Refeicoes/dia</Label><Input type="number" value={form.mealCountPerDay} onChange={(event) => setField("mealCountPerDay", event.target.value)} /></div>
          <div className="space-y-1.5"><Label>Duracao (dias)</Label><Input type="number" value={form.durationDays} onChange={(event) => setField("durationDays", event.target.value)} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-sm font-semibold">Agenda de refeicoes</CardTitle>
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addMeal}>
            <Plus className="h-3.5 w-3.5" /> Adicionar refeicao
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {form.meals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma refeicao adicionada.</p>
          ) : (
            form.meals.map((meal, mealIndex) => (
              <div key={`meal-${mealIndex}`} className="rounded-lg border border-border p-3 space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label>Nome da refeicao</Label>
                    <Input value={meal.name} onChange={(event) => updateMeal(mealIndex, (current) => ({ ...current, name: event.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Horario</Label>
                    <Input value={meal.timeLabel} onChange={(event) => updateMeal(mealIndex, (current) => ({ ...current, timeLabel: event.target.value }))} placeholder="08:00" />
                  </div>
                  <div className="flex items-end gap-2">
                    <Button type="button" variant="outline" size="icon" onClick={() => moveMeal(mealIndex, "up")}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="outline" size="icon" onClick={() => moveMeal(mealIndex, "down")}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="outline" size="icon" onClick={() => removeMeal(mealIndex)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Instrucoes</Label>
                  <Textarea value={meal.instructions} onChange={(event) => updateMeal(mealIndex, (current) => ({ ...current, instructions: event.target.value }))} className="min-h-[72px]" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Itens da refeicao</p>
                    <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => addMealItem(mealIndex)}>
                      <Plus className="h-3.5 w-3.5" /> Item
                    </Button>
                  </div>

                  {meal.items.map((item, itemIndex) => (
                    <div key={`meal-${mealIndex}-item-${itemIndex}`} className="rounded-lg border border-border/70 p-3 space-y-3">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-1.5 lg:col-span-2">
                          <Label>Alimento</Label>
                          <Input value={item.foodName} onChange={(event) => updateMealItem(mealIndex, itemIndex, (current) => ({ ...current, foodName: event.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Quantidade</Label>
                          <Input value={item.quantity} onChange={(event) => updateMealItem(mealIndex, itemIndex, (current) => ({ ...current, quantity: event.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Unidade</Label>
                          <Input value={item.unit} onChange={(event) => updateMealItem(mealIndex, itemIndex, (current) => ({ ...current, unit: event.target.value }))} />
                        </div>

                        <div className="space-y-1.5">
                          <Label>Medida caseira</Label>
                          <Input value={item.householdMeasure} onChange={(event) => updateMealItem(mealIndex, itemIndex, (current) => ({ ...current, householdMeasure: event.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Kcal</Label>
                          <Input type="number" value={item.kcal} onChange={(event) => updateMealItem(mealIndex, itemIndex, (current) => ({ ...current, kcal: event.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>P (g)</Label>
                          <Input type="number" value={item.protein} onChange={(event) => updateMealItem(mealIndex, itemIndex, (current) => ({ ...current, protein: event.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>C (g)</Label>
                          <Input type="number" value={item.carbs} onChange={(event) => updateMealItem(mealIndex, itemIndex, (current) => ({ ...current, carbs: event.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>G (g)</Label>
                          <Input type="number" value={item.fat} onChange={(event) => updateMealItem(mealIndex, itemIndex, (current) => ({ ...current, fat: event.target.value }))} />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label>Notas de preparo</Label>
                        <Textarea value={item.preparationNotes} onChange={(event) => updateMealItem(mealIndex, itemIndex, (current) => ({ ...current, preparationNotes: event.target.value }))} className="min-h-[72px]" />
                      </div>

                      <div className="space-y-1.5">
                        <Label>Substituicoes (uma por linha)</Label>
                        <Textarea value={item.substitutions} onChange={(event) => updateMealItem(mealIndex, itemIndex, (current) => ({ ...current, substitutions: event.target.value }))} className="min-h-[72px]" />
                      </div>

                      <div className="flex justify-end">
                        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => removeMealItem(mealIndex, itemIndex)}>
                          <Trash2 className="h-3.5 w-3.5" /> Remover item
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Secoes complementares</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Plano de hidratacao</Label>
            <Textarea value={form.hydrationPlan} onChange={(event) => setField("hydrationPlan", event.target.value)} className="min-h-[72px]" />
          </div>
          <div className="space-y-1.5"><Label>Suplementos (uma por linha)</Label><Textarea value={form.supplements} onChange={(event) => setField("supplements", event.target.value)} className="min-h-[96px]" /></div>
          <div className="space-y-1.5"><Label>Lista de compras</Label><Textarea value={form.shoppingList} onChange={(event) => setField("shoppingList", event.target.value)} className="min-h-[96px]" /></div>
          <div className="space-y-1.5"><Label>Dicas de meal prep</Label><Textarea value={form.mealPrepTips} onChange={(event) => setField("mealPrepTips", event.target.value)} className="min-h-[96px]" /></div>
          <div className="space-y-1.5"><Label>Dicas de aderencia</Label><Textarea value={form.adherenceTips} onChange={(event) => setField("adherenceTips", event.target.value)} className="min-h-[96px]" /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Recomendacoes gerais</Label><Textarea value={form.generalRecommendations} onChange={(event) => setField("generalRecommendations", event.target.value)} className="min-h-[96px]" /></div>
        </CardContent>
      </Card>

      {mode === "edit" && versions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Historico de versoes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {versions.map((version) => (
              <div key={version.id} className="rounded-lg border border-border px-3 py-2 text-sm">
                <p className="font-medium">Versao {version.version}</p>
                <p className="text-xs text-muted-foreground">{version.changeSummary || "Sem observacao"}</p>
                <p className="text-xs text-muted-foreground">{new Date(version.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
        <Link href="/dashboard/templates">
          <Button variant="outline" className="w-full sm:w-auto">Cancelar</Button>
        </Link>

        {mode === "edit" && (
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2 sm:w-auto"
            disabled={isPending || !canSubmit}
            onClick={() => handleSubmit("draft", true)}
          >
            <Save className="h-4 w-4" /> Salvar + Nova Versao
          </Button>
        )}

        <Button
          type="button"
          variant="outline"
          className="w-full gap-2 sm:w-auto"
          disabled={isPending || !canSubmit}
          onClick={() => handleSubmit("draft", false)}
        >
          <Save className="h-4 w-4" /> Salvar Rascunho
        </Button>

        <Button
          type="button"
          className="w-full gap-2 sm:w-auto"
          disabled={isPending || !canSubmit}
          onClick={() => handleSubmit("active", false)}
        >
          <Save className="h-4 w-4" /> Publicar Template
        </Button>
      </div>
    </div>
  )
}
