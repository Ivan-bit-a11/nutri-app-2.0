"use client"

import { useState } from "react"
import { FileDown, FileText, Leaf, Loader2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

type MealItem = {
  food_name: string
  quantity: string | null
  unit: string | null
  kcal: number | null
}

type Meal = {
  name: string
  time_of_day: string | null
  meal_items: MealItem[]
}

type Plan = {
  id: string
  title: string
  description: string | null
  daily_kcal: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  notes: string | null
  created_at: string
  meals: Meal[]
  nutritionist?: {
    full_name: string | null
    clinic_name: string | null
    phone?: string | null
    payment_phone?: string | null
  } | null
}

function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, "")
  if (d.length === 9) return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`
  if (d.length === 12) return `+${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8)}`
  return phone
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function buildPlanDocumentHtml(plan: Plan): string {
  const nutriName = plan.nutritionist?.full_name || "Nutricionista"
  const clinic = plan.nutritionist?.clinic_name || ""
  const phone = plan.nutritionist?.phone || plan.nutritionist?.payment_phone || ""
  const dateStr = new Date(plan.created_at).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

  const mealsHtml = (plan.meals || [])
    .map((meal) => {
      const items = (meal.meal_items || [])
        .map((item) => {
          const qty = [item.quantity, item.unit].filter(Boolean).join(" ")
          return `<tr>
            <td>${escapeHtml(item.food_name || "")}</td>
            <td class="c">${escapeHtml(qty || "—")}</td>
            <td class="r">${item.kcal != null ? `${item.kcal} kcal` : "—"}</td>
          </tr>`
        })
        .join("")
      return `
      <section class="meal">
        <h2>${escapeHtml(meal.name || "")}${
          meal.time_of_day
            ? ` <span class="time">· ${escapeHtml(String(meal.time_of_day))}</span>`
            : ""
        }</h2>
        <table>
          <thead>
            <tr><th>Alimento</th><th class="c">Quantidade</th><th class="r">Energia</th></tr>
          </thead>
          <tbody>
            ${items || `<tr><td colspan="3" class="muted">Sem itens nesta refeição</td></tr>`}
          </tbody>
        </table>
      </section>`
    })
    .join("")

  return `
  <div id="pdf-root" style="width:794px;background:#fff;color:#14261c;font-family:Segoe UI,system-ui,sans-serif;line-height:1.45;">
    <div style="background:linear-gradient(135deg,#1b7a4a 0%,#2d9b63 55%,#4ade80 140%);color:#fff;padding:28px 26px 24px;">
      <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-start;">
        <div>
          <h1 style="margin:0 0 6px;font-size:24px;letter-spacing:-0.02em;">${escapeHtml(plan.title || "Plano alimentar")}</h1>
          <div style="opacity:0.92;font-size:14px;">Plano alimentar personalizado</div>
          <div style="display:inline-block;margin-top:12px;background:rgba(255,255,255,.18);padding:4px 12px;border-radius:999px;font-size:12px;">NutriFlow · Documento oficial</div>
        </div>
        <div style="text-align:right;font-size:13px;opacity:0.95;">${dateStr}</div>
      </div>
    </div>
    <div style="padding:22px 26px 28px;">
      <div style="display:flex;flex-wrap:wrap;gap:16px;border:1px solid #cfe8da;background:#f3faf6;border-radius:14px;padding:14px 16px;margin-bottom:18px;">
        <div style="flex:1;min-width:180px;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#3d6b54;font-weight:700;">Nutricionista responsável</div>
          <div style="font-size:16px;font-weight:700;color:#14532d;">${escapeHtml(nutriName)}</div>
          ${clinic ? `<div style="font-size:13px;color:#4b6b5a;">${escapeHtml(clinic)}</div>` : ""}
        </div>
        <div style="flex:1;min-width:160px;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#3d6b54;font-weight:700;">Contacto</div>
          <div style="font-size:16px;font-weight:700;color:#14532d;font-family:ui-monospace,monospace;letter-spacing:0.03em;">
            ${phone ? escapeHtml(formatPhone(phone)) : "—"}
          </div>
        </div>
      </div>

      ${
        plan.description
          ? `<p style="margin:0 0 14px;color:#334;">${escapeHtml(String(plan.description))}</p>`
          : ""
      }

      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:8px 0 20px;">
        <div style="background:#e8f5ee;border:1px solid #cfe8da;border-radius:12px;padding:12px 8px;text-align:center;">
          <b style="display:block;font-size:17px;color:#166534;">${plan.daily_kcal ?? "—"}</b>
          <span style="font-size:11px;color:#3d6b54;text-transform:uppercase;">kcal/dia</span>
        </div>
        <div style="background:#e8f5ee;border:1px solid #cfe8da;border-radius:12px;padding:12px 8px;text-align:center;">
          <b style="display:block;font-size:17px;color:#166534;">${plan.protein_g ?? "—"}g</b>
          <span style="font-size:11px;color:#3d6b54;text-transform:uppercase;">Proteína</span>
        </div>
        <div style="background:#e8f5ee;border:1px solid #cfe8da;border-radius:12px;padding:12px 8px;text-align:center;">
          <b style="display:block;font-size:17px;color:#166534;">${plan.carbs_g ?? "—"}g</b>
          <span style="font-size:11px;color:#3d6b54;text-transform:uppercase;">Hidratos</span>
        </div>
        <div style="background:#e8f5ee;border:1px solid #cfe8da;border-radius:12px;padding:12px 8px;text-align:center;">
          <b style="display:block;font-size:17px;color:#166534;">${plan.fat_g ?? "—"}g</b>
          <span style="font-size:11px;color:#3d6b54;text-transform:uppercase;">Gordura</span>
        </div>
      </div>

      <style>
        #pdf-root .meal { margin: 18px 0; }
        #pdf-root .meal h2 { font-size: 16px; color: #166534; margin: 0 0 8px; padding-bottom: 6px; border-bottom: 2px solid #86efac; }
        #pdf-root .meal .time { font-weight: 500; color: #5a7a68; font-size: 13px; }
        #pdf-root table { width: 100%; border-collapse: collapse; font-size: 13px; }
        #pdf-root th { text-align: left; padding: 8px 10px; background: #e8f5ee; color: #1a5c3a; font-size: 11px; text-transform: uppercase; }
        #pdf-root td { padding: 8px 10px; border-bottom: 1px solid #e5efe8; }
        #pdf-root th.c, #pdf-root td.c { text-align: center; }
        #pdf-root th.r, #pdf-root td.r { text-align: right; }
        #pdf-root .muted { color: #666; }
      </style>

      ${mealsHtml}

      ${
        plan.notes
          ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:14px;margin-top:18px;">
              <strong style="color:#92400e;">Notas do profissional</strong>
              <p style="margin:6px 0 0;">${escapeHtml(String(plan.notes))}</p>
            </div>`
          : ""
      }

      <div style="margin-top:28px;padding-top:12px;border-top:1px solid #cfe8da;text-align:center;font-size:12px;color:#5a7a68;">
        Documento gerado por <strong>NutriFlow</strong> · © Ivan Mbalame<br/>
        Formato A4 · Plano personalizado
      </div>
    </div>
  </div>`
}

function safeFileName(title: string) {
  const base = (title || "plano-alimentar")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\- ]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60)
  return `${base || "plano-alimentar"}.pdf`
}

async function generateAndDownloadPdf(plan: Plan) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ])

  const host = document.createElement("div")
  host.style.position = "fixed"
  host.style.left = "-10000px"
  host.style.top = "0"
  host.style.width = "794px"
  host.style.background = "#ffffff"
  host.style.zIndex = "-1"
  host.innerHTML = buildPlanDocumentHtml(plan)
  document.body.appendChild(host)

  try {
    const target = host.querySelector("#pdf-root") as HTMLElement
    const canvas = await html2canvas(target, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      windowWidth: 794,
    })

    const imgData = canvas.toDataURL("image/jpeg", 0.95)
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = pageWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let heightLeft = imgHeight
    let position = 0

    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft > 1) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    pdf.save(safeFileName(plan.title))
  } finally {
    document.body.removeChild(host)
  }
}

function DownloadPdfButton({ plan }: { plan: Plan }) {
  const [loading, setLoading] = useState(false)

  async function onClick() {
    setLoading(true)
    try {
      await generateAndDownloadPdf(plan)
      toast.success("PDF descarregado com sucesso.")
    } catch (err) {
      console.error(err)
      toast.error("Não foi possível gerar o PDF. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={onClick} disabled={loading} className="gap-2">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
      {loading ? "A gerar PDF…" : "Descarregar PDF (A4)"}
    </Button>
  )
}

export function PlanosClient({ plans }: { plans: Plan[] }) {
  return (
    <div className="space-y-6">
      <div className="page-header-block">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="page-title">Planos alimentares</h1>
            <p className="page-subtitle">
              Planos publicados pelo nutricionista. Descarregue o documento em PDF A4.
            </p>
          </div>
        </div>
      </div>

      {plans.length === 0 ? (
        <Card className="soft-card border-primary/10">
          <CardContent className="py-12 text-center space-y-3">
            <Leaf className="h-10 w-10 text-primary/40 mx-auto" />
            <p className="text-muted-foreground text-sm">Ainda não tem planos publicados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {plans.map((plan) => (
            <Card key={plan.id} className="soft-card border-primary/10 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-primary to-emerald-400" />
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">{plan.title}</CardTitle>
                    <CardDescription className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {plan.nutritionist?.full_name || "Nutricionista"}
                      </span>
                    </CardDescription>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-0 hover:bg-primary/15">
                    {plan.daily_kcal != null ? `${plan.daily_kcal} kcal/dia` : "Plano activo"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {plan.description && (
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { l: "kcal", v: plan.daily_kcal },
                    { l: "Proteína", v: plan.protein_g != null ? `${plan.protein_g}g` : null },
                    { l: "Hidratos", v: plan.carbs_g != null ? `${plan.carbs_g}g` : null },
                    { l: "Gordura", v: plan.fat_g != null ? `${plan.fat_g}g` : null },
                  ].map((x) => (
                    <div
                      key={x.l}
                      className="rounded-xl bg-secondary/60 border border-primary/10 p-3 text-center"
                    >
                      <p className="text-sm font-bold text-primary">{x.v ?? "—"}</p>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {x.l}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(plan.meals || []).length} refeições ·{" "}
                  {new Date(plan.created_at).toLocaleDateString("pt-PT")}
                </p>
                <DownloadPdfButton plan={plan} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
