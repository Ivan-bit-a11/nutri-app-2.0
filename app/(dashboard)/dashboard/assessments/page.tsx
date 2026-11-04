import Link from "next/link"
import { PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAllAssessments } from "@/lib/actions/clinical"
import { getRequestLocale } from "@/lib/locale"

type AssessmentItem = {
  id: string
  assessed_at: string
  weight_kg: number | null
  bmi: number | null
  body_fat_pct: number | null
  waist_cm: number | null
  patients?: { name?: string | null; goal?: string | null } | null
}

function formatDate(value: string, locale: string) {
  return new Date(value).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export default async function AssessmentsPage() {
  const locale = await getRequestLocale()
  const rows = (await getAllAssessments()) as AssessmentItem[]

  return (
    <div className="page-shell page-stack max-w-[1200px]">
      <div className="page-header">
        <div>
          <h1 className="page-title">Avaliacoes</h1>
          <p className="page-subtitle mt-0.5">
            {rows.length} registros de avaliacao fisica
          </p>
        </div>
        <Link href="/dashboard/assessments/new">
          <Button size="sm" className="h-9 w-full gap-1.5 sm:w-auto">
            <PlusCircle className="h-3.5 w-3.5" /> Nova Avaliacao
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Historico</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma avaliacao registrada.</p>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {rows.map((item) => (
                  <div key={item.id} className="rounded-lg border border-border p-3">
                    <p className="text-sm font-medium">{item.patients?.name || "Paciente"}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(item.assessed_at, locale)}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <p>Peso: <span className="text-foreground">{item.weight_kg ?? "-"}</span></p>
                      <p>IMC: <span className="text-foreground">{item.bmi ?? "-"}</span></p>
                      <p>Gordura: <span className="text-foreground">{item.body_fat_pct ?? "-"}</span></p>
                      <p>Cintura: <span className="text-foreground">{item.waist_cm ?? "-"}</span></p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-2 text-left text-xs">Paciente</th>
                      <th className="py-2 text-left text-xs">Data</th>
                      <th className="py-2 text-left text-xs">Peso</th>
                      <th className="py-2 text-left text-xs">IMC</th>
                      <th className="py-2 text-left text-xs">Gordura</th>
                      <th className="py-2 text-left text-xs">Cintura</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((item) => (
                      <tr key={item.id} className="border-b border-border/50 last:border-0">
                        <td className="py-2.5">{item.patients?.name || "Paciente"}</td>
                        <td className="py-2.5">{formatDate(item.assessed_at, locale)}</td>
                        <td className="py-2.5">{item.weight_kg ?? "-"}</td>
                        <td className="py-2.5">{item.bmi ?? "-"}</td>
                        <td className="py-2.5">{item.body_fat_pct ?? "-"}</td>
                        <td className="py-2.5">{item.waist_cm ?? "-"}</td>
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
