import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Utensils } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDietPlanById } from "@/lib/actions/clinical"
import { PublishPlanButton } from "@/components/publish-plan-button"
import { getRequestLocale } from "@/lib/locale"

type MealItem = {
  id: string
  food_name: string
  quantity: string
  unit: string | null
  kcal: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
}

type Meal = {
  id: string
  name: string
  time_of_day: string | null
  meal_items: MealItem[]
}

type PlanDetails = {
  id: string
  title: string
  description: string | null
  daily_kcal: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  notes: string | null
  is_active: boolean
  published_to_client_at: string | null
  updated_at: string
  patients?: { id?: string; name?: string | null; email?: string | null } | null
  meals: Meal[]
}

function formatDate(value: string, locale: string) {
  return new Date(value).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export default async function DietPlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const locale = await getRequestLocale()
  const resolved = await params

  let plan: PlanDetails
  try {
    plan = (await getDietPlanById(resolved.id)) as PlanDetails
  } catch {
    notFound()
  }

  return (
    <div className="page-shell page-stack max-w-4xl">
      <div className="page-header">
        <div className="flex items-start gap-3">
          <Link href="/dashboard/diet-plans">
            <Button variant="outline" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="page-title">{plan.title}</h1>
            <p className="page-subtitle">{plan.description || "Sem descricao"}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge className={plan.is_active ? "status-active" : "status-inactive"}>
            {plan.is_active ? "Ativo" : "Inativo"}
          </Badge>
          <PublishPlanButton
            dietPlanId={plan.id}
            publishedAt={plan.published_to_client_at ?? null}
            patientName={plan.patients?.name}
          />
        </div>
      </div>

      <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Envio individual ao cliente</p>
        <p className="mt-1">
          1) Na ficha do paciente, ligue a conta do cliente (email). 2) Confirme o pagamento em Pagamentos.
          3) Clique em &quot;Enviar ao cliente&quot;. Só essa conta vê este plano em Meus planos e pode descarregar o PDF.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Resumo</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <p className="text-xs text-muted-foreground">Paciente</p>
            {plan.patients?.id ? (
              <Link href={"/dashboard/patients/" + plan.patients.id} className="font-medium hover:text-primary">
                {plan.patients.name || "Paciente"}
              </Link>
            ) : (
              <p className="font-medium">Sem paciente</p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Kcal</p>
            <p className="font-medium">{plan.daily_kcal ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Proteina</p>
            <p className="font-medium">{plan.protein_g ?? "-"} g</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Carbo</p>
            <p className="font-medium">{plan.carbs_g ?? "-"} g</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Gordura</p>
            <p className="font-medium">{plan.fat_g ?? "-"} g</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Utensils className="h-4 w-4" /> Refeicoes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {plan.meals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma refeicao cadastrada.</p>
          ) : (
            plan.meals.map((meal) => (
              <div key={meal.id} className="rounded-lg border border-border overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/30 px-4 py-2">
                  <p className="text-sm font-medium">{meal.name}</p>
                  <p className="text-xs text-muted-foreground">{meal.time_of_day || "-"}</p>
                </div>
                <div className="px-4 py-2">
                  {meal.meal_items.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Sem itens.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {meal.meal_items.map((item) => (
                        <div key={item.id} className="flex flex-wrap items-center justify-between gap-1 text-xs">
                          <span>{item.food_name}</span>
                          <span className="text-muted-foreground">
                            {item.quantity} {item.unit || ""} - {item.kcal ?? 0} kcal
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Observacoes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {plan.notes || "Sem observacoes adicionais."}
          </p>
          <p className="text-xs text-muted-foreground mt-3">Atualizado em {formatDate(plan.updated_at, locale)}</p>
        </CardContent>
      </Card>
    </div>
  )
}
