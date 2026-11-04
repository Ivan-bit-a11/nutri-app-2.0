import Link from "next/link"
import { PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAllDietPlans } from "@/lib/actions/clinical"
import { getRequestLocale } from "@/lib/locale"

type DietPlanItem = {
  id: string
  title: string
  description: string | null
  daily_kcal: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  is_active: boolean
  updated_at: string
  patients?: { id?: string; name?: string | null } | null
}

function formatDate(value: string, locale: string) {
  return new Date(value).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export default async function DietPlansPage() {
  const locale = await getRequestLocale()
  const plans = (await getAllDietPlans()) as DietPlanItem[]
  const activeCount = plans.filter((plan) => plan.is_active).length

  return (
    <div className="page-shell page-stack max-w-[1200px]">
      <div className="page-header">
        <div>
          <h1 className="page-title">Planos Alimentares</h1>
          <p className="page-subtitle mt-0.5">
            {plans.length} planos cadastrados - {activeCount} ativos
          </p>
        </div>
        <Link href="/dashboard/diet-plans/new">
          <Button size="sm" className="h-9 w-full gap-1.5 sm:w-auto">
            <PlusCircle className="h-3.5 w-3.5" /> Novo Plano
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Historico de planos</CardTitle>
        </CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum plano criado.</p>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {plans.map((plan) => (
                  <Link key={plan.id} href={"/dashboard/diet-plans/" + plan.id} className="block rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{plan.title}</p>
                      <Badge className={plan.is_active ? "status-active" : "status-inactive"}>
                        {plan.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{plan.description || "Sem descricao"}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <p>Kcal: <span className="text-foreground">{plan.daily_kcal ?? "-"}</span></p>
                      <p>Atualizado: <span className="text-foreground">{formatDate(plan.updated_at, locale)}</span></p>
                      <p className="col-span-2">
                        Macros: <span className="text-foreground">P {plan.protein_g ?? "-"} / C {plan.carbs_g ?? "-"} / G {plan.fat_g ?? "-"}</span>
                      </p>
                      <p className="col-span-2">
                        Paciente:{" "}
                        <span className="text-foreground">{plan.patients?.name || "Sem paciente"}</span>
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-2 text-left text-xs">Plano</th>
                      <th className="py-2 text-left text-xs">Paciente</th>
                      <th className="py-2 text-left text-xs">Kcal</th>
                      <th className="py-2 text-left text-xs">Macros</th>
                      <th className="py-2 text-left text-xs">Atualizado</th>
                      <th className="py-2 text-left text-xs">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map((plan) => (
                      <tr key={plan.id} className="border-b border-border/50 last:border-0">
                        <td className="py-2.5">
                          <Link href={"/dashboard/diet-plans/" + plan.id} className="font-medium hover:text-primary">
                            {plan.title}
                          </Link>
                          <p className="mt-0.5 text-xs text-muted-foreground">{plan.description || "Sem descricao"}</p>
                        </td>
                        <td className="py-2.5">
                          {plan.patients?.id ? (
                            <Link href={"/dashboard/patients/" + plan.patients.id} className="hover:text-primary">
                              {plan.patients.name || "Paciente"}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">Sem paciente</span>
                          )}
                        </td>
                        <td className="py-2.5">{plan.daily_kcal ?? "-"}</td>
                        <td className="py-2.5 text-xs text-muted-foreground">
                          P {plan.protein_g ?? "-"} / C {plan.carbs_g ?? "-"} / G {plan.fat_g ?? "-"}
                        </td>
                        <td className="py-2.5">{formatDate(plan.updated_at, locale)}</td>
                        <td className="py-2.5">
                          <Badge className={plan.is_active ? "status-active" : "status-inactive"}>
                            {plan.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
