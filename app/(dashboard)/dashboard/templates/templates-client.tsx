"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Archive, Copy, Eye, FilePlus2, PlusCircle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  createTemplateVersionMutation,
  duplicateTemplateMutation,
  getTemplateById,
  toggleArchiveTemplateMutation,
} from "@/lib/actions/templates"

interface TemplateSummary {
  id: string
  name: string
  slug: string
  description: string | null
  category: string
  goal: string | null
  tags: string[]
  status: "draft" | "active" | "archived"
  isSystemTemplate: boolean
  version: number
  dietaryPattern: string | null
  dailyCalories: number | null
  proteinGrams: number | null
  carbGrams: number | null
  fatGrams: number | null
  mealCountPerDay: number | null
  usageCount: number
  lastUsedAt: string | null
  updatedAt: string
  canDuplicate: boolean
  canArchive: boolean
  canCreateNewVersion: boolean
}

interface PreviewTemplate {
  id: string
  name: string
  description: string | null
  category: string
  goal: string | null
  tags: string[]
  status: "draft" | "active" | "archived"
  isSystemTemplate: boolean
  version: number
  dietaryPattern: string | null
  dailyCalories: number | null
  proteinGrams: number | null
  carbGrams: number | null
  fatGrams: number | null
  mealCountPerDay: number | null
  hydrationPlan: string | null
  professionalNotes: string | null
  meals: Array<{
    name: string
    timeLabel: string
    instructions: string
    items: Array<{
      foodName: string
      quantity: string
      unit: string
    }>
  }>
}

interface TemplatesClientProps {
  systemTemplates: TemplateSummary[]
  myTemplates: TemplateSummary[]
  loadError?: string | null
}

interface Filters {
  search: string
  category: string
  goal: string
  dietaryPattern: string
  status: string
}

const ALL_VALUE = "__all__"

function includesSearch(template: TemplateSummary, search: string) {
  if (!search) return true
  const needle = search.toLowerCase()
  return [template.name, template.description, template.category, template.goal, ...(template.tags ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(needle)
}

function applyFilters(templates: TemplateSummary[], filters: Filters) {
  return templates.filter((template) => {
    if (!includesSearch(template, filters.search)) return false
    if (filters.category !== ALL_VALUE && template.category !== filters.category) return false
    if (filters.goal !== ALL_VALUE && (template.goal || "") !== filters.goal) return false
    if (filters.dietaryPattern !== ALL_VALUE && (template.dietaryPattern || "") !== filters.dietaryPattern) return false
    if (filters.status !== ALL_VALUE && template.status !== filters.status) return false
    return true
  })
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  )
}

function TemplateBadges({
  template,
}: {
  template: Pick<TemplateSummary, "isSystemTemplate" | "status" | "version">
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {template.isSystemTemplate ? <Badge variant="secondary">Sistema</Badge> : <Badge variant="outline">Meu template</Badge>}
      <Badge className={template.status === "active" ? "status-active" : template.status === "archived" ? "status-inactive" : "status-pending"}>
        {template.status === "active" ? "Ativo" : template.status === "archived" ? "Arquivado" : "Rascunho"}
      </Badge>
      <Badge variant="outline">v{template.version}</Badge>
    </div>
  )
}

function FilterBar({
  templates,
  filters,
  setFilters,
}: {
  templates: TemplateSummary[]
  filters: Filters
  setFilters: (filters: Filters) => void
}) {
  const categories = useMemo(() => Array.from(new Set(templates.map((template) => template.category))).sort(), [templates])
  const goals = useMemo(
    () => Array.from(new Set(templates.map((template) => template.goal || "").filter(Boolean))).sort(),
    [templates],
  )
  const patterns = useMemo(
    () => Array.from(new Set(templates.map((template) => template.dietaryPattern || "").filter(Boolean))).sort(),
    [templates],
  )

  return (
    <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-card p-3 sm:grid-cols-2 lg:grid-cols-5">
      <div className="space-y-1.5 lg:col-span-2">
        <Label>Busca</Label>
        <Input
          placeholder="Buscar por nome, objetivo ou tag"
          value={filters.search}
          onChange={(event) => setFilters({ ...filters, search: event.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Categoria</Label>
        <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Todas</SelectItem>
            {categories.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Objetivo</Label>
        <Select value={filters.goal} onValueChange={(value) => setFilters({ ...filters, goal: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Todos</SelectItem>
            {goals.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Padrão / Status</Label>
        <div className="grid grid-cols-2 gap-2">
          <Select value={filters.dietaryPattern} onValueChange={(value) => setFilters({ ...filters, dietaryPattern: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Padrao" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Todos</SelectItem>
              {patterns.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Todos</SelectItem>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="archived">Arquivado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

export function TemplatesClient({ systemTemplates, myTemplates, loadError }: TemplatesClientProps) {
  const router = useRouter()
  const [filters, setFilters] = useState<Filters>({
    search: "",
    category: ALL_VALUE,
    goal: ALL_VALUE,
    dietaryPattern: ALL_VALUE,
    status: ALL_VALUE,
  })

  const [feedback, setFeedback] = useState("")
  const [error, setError] = useState("")
  const [pendingAction, setPendingAction] = useState("")

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<PreviewTemplate | null>(null)
  const [previewError, setPreviewError] = useState("")
  const [isPreviewPending, startPreviewTransition] = useTransition()

  const systemFiltered = useMemo(() => applyFilters(systemTemplates, filters), [systemTemplates, filters])
  const mineFiltered = useMemo(() => applyFilters(myTemplates, filters), [myTemplates, filters])

  const runAction = async (key: string, runner: () => Promise<void>) => {
    setPendingAction(key)
    setError("")
    setFeedback("")

    try {
      await runner()
      router.refresh()
    } catch {
      setError("Nao foi possivel concluir a acao. Tente novamente.")
    } finally {
      setPendingAction("")
    }
  }

  const openPreview = (templateId: string) => {
    setPreviewOpen(true)
    setPreviewError("")
    setPreviewTemplate(null)

    startPreviewTransition(async () => {
      try {
        const payload = await getTemplateById(templateId)
        setPreviewTemplate(payload.template as PreviewTemplate)
      } catch {
        setPreviewError("Nao foi possivel carregar a visualizacao deste template.")
      }
    })
  }

  return (
    <div className="page-shell page-stack max-w-[1200px]">
      <div className="page-header">
        <div>
          <h1 className="page-title">Templates</h1>
          <p className="page-subtitle">Modelos reutilizaveis com versoes, arquivamento e importacao para pacientes.</p>
        </div>
        <Link href="/dashboard/templates/new">
          <Button className="h-9 w-full gap-1.5 sm:w-auto">
            <PlusCircle className="h-4 w-4" /> Novo template
          </Button>
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      )}
      {loadError && (
        <div className="rounded-lg border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-foreground">{loadError}</div>
      )}
      {feedback && <div className="rounded-lg border border-success/25 bg-success/10 px-4 py-3 text-sm text-success">{feedback}</div>}

      <FilterBar templates={[...systemTemplates, ...myTemplates]} filters={filters} setFilters={setFilters} />

      <Tabs defaultValue="system" className="space-y-4">
        <TabsList>
          <TabsTrigger value="system">System Templates ({systemFiltered.length})</TabsTrigger>
          <TabsTrigger value="mine">My Templates ({mineFiltered.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="system">
          {systemFiltered.length === 0 ? (
            <EmptyState
              title="Nenhum template de sistema encontrado"
              description="Ajuste os filtros para visualizar os templates padrao disponiveis."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {systemFiltered.map((template) => (
                <Card key={template.id}>
                  <CardHeader className="space-y-2 pb-3">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <TemplateBadges template={template} />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{template.description || "Template sem descricao."}</p>

                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <p>Categoria: <span className="text-foreground">{template.category}</span></p>
                      <p>Objetivo: <span className="text-foreground">{template.goal || "-"}</span></p>
                      <p>Refeicoes: <span className="text-foreground">{template.mealCountPerDay ?? "-"}</span></p>
                      <p>
                        Macros: <span className="text-foreground">P {template.proteinGrams ?? "-"} / C {template.carbGrams ?? "-"}</span>
                      </p>
                    </div>

                    {template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {template.tags.slice(0, 4).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openPreview(template.id)}>
                        <Eye className="h-3.5 w-3.5" /> Preview
                      </Button>
                      <Link href={`/dashboard/diet-plans/new?templateId=${template.id}`}>
                        <Button variant="outline" size="sm" className="w-full gap-1.5">
                          <Sparkles className="h-3.5 w-3.5" /> Use
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        className="gap-1.5"
                        disabled={pendingAction === `dup-${template.id}`}
                        onClick={() =>
                          void runAction(`dup-${template.id}`, async () => {
                            const result = await duplicateTemplateMutation(template.id)
                            if (!result.success) {
                              throw new Error(result.error.message)
                            }
                            setFeedback("Template duplicado para My Templates.")
                          })
                        }
                      >
                        <Copy className="h-3.5 w-3.5" /> Duplicate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="mine">
          {mineFiltered.length === 0 ? (
            <EmptyState
              title="Nenhum template personalizado"
              description="Crie um template em branco ou duplique um template de sistema para comecar."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {mineFiltered.map((template) => (
                <Card key={template.id}>
                  <CardHeader className="space-y-2 pb-3">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <TemplateBadges template={template} />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{template.description || "Template sem descricao."}</p>

                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <p>Categoria: <span className="text-foreground">{template.category}</span></p>
                      <p>Objetivo: <span className="text-foreground">{template.goal || "-"}</span></p>
                      <p>Refeicoes: <span className="text-foreground">{template.mealCountPerDay ?? "-"}</span></p>
                      <p>Uso: <span className="text-foreground">{template.usageCount}</span></p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Link href={`/dashboard/templates/${template.id}`}>
                        <Button variant="outline" size="sm" className="w-full gap-1.5">
                          <FilePlus2 className="h-3.5 w-3.5" /> Edit
                        </Button>
                      </Link>

                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => openPreview(template.id)}
                      >
                        <Eye className="h-3.5 w-3.5" /> Preview
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        disabled={pendingAction === `dup-${template.id}`}
                        onClick={() =>
                          void runAction(`dup-${template.id}`, async () => {
                            const result = await duplicateTemplateMutation(template.id)
                            if (!result.success) {
                              throw new Error(result.error.message)
                            }
                            setFeedback("Template duplicado com sucesso.")
                          })
                        }
                      >
                        <Copy className="h-3.5 w-3.5" /> Duplicate
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        disabled={pendingAction === `ver-${template.id}`}
                        onClick={() =>
                          void runAction(`ver-${template.id}`, async () => {
                            const result = await createTemplateVersionMutation(template.id)
                            if (!result.success) {
                              throw new Error(result.error.message)
                            }
                            setFeedback("Nova versao criada para o template.")
                          })
                        }
                      >
                        <FilePlus2 className="h-3.5 w-3.5" /> Version
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        disabled={pendingAction === `archive-${template.id}`}
                        onClick={() =>
                          void runAction(`archive-${template.id}`, async () => {
                            const shouldArchive = template.status !== "archived"
                            const result = await toggleArchiveTemplateMutation(template.id, shouldArchive)
                            if (!result.success) {
                              throw new Error(result.error.message)
                            }
                            setFeedback(shouldArchive ? "Template arquivado." : "Template reativado como rascunho.")
                          })
                        }
                      >
                        <Archive className="h-3.5 w-3.5" /> {template.status === "archived" ? "Unarchive" : "Archive"}
                      </Button>

                      <Link href={`/dashboard/diet-plans/new?templateId=${template.id}`}>
                        <Button size="sm" className="w-full gap-1.5">
                          <Sparkles className="h-3.5 w-3.5" /> Use for Patient
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name || "Template"}</DialogTitle>
            <DialogDescription>{previewTemplate?.description || "Visualizacao rapida do template selecionado."}</DialogDescription>
          </DialogHeader>

          {isPreviewPending && <p className="text-sm text-muted-foreground">Carregando preview...</p>}
          {previewError && <p className="text-sm text-destructive">{previewError}</p>}

          {previewTemplate && !isPreviewPending && !previewError && (
            <div className="space-y-4 text-sm">
              <TemplateBadges template={previewTemplate} />

              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                <p>Kcal: <span className="text-foreground">{previewTemplate.dailyCalories ?? "-"}</span></p>
                <p>P: <span className="text-foreground">{previewTemplate.proteinGrams ?? "-"} g</span></p>
                <p>C: <span className="text-foreground">{previewTemplate.carbGrams ?? "-"} g</span></p>
                <p>G: <span className="text-foreground">{previewTemplate.fatGrams ?? "-"} g</span></p>
              </div>

              {previewTemplate.meals.length > 0 ? (
                <div className="space-y-2">
                  {previewTemplate.meals.slice(0, 6).map((meal, index) => (
                    <div key={`${meal.name}-${index}`} className="rounded-lg border border-border px-3 py-2">
                      <p className="text-sm font-medium">{meal.name}</p>
                      <p className="text-xs text-muted-foreground">{meal.timeLabel || "Sem horario"}</p>
                      {meal.items.length > 0 && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {meal.items.slice(0, 3).map((item) => `${item.foodName} (${item.quantity || "-"} ${item.unit || ""})`).join(" • ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Este template ainda nao possui refeicoes definidas.</p>
              )}

              {previewTemplate.hydrationPlan && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Hidratacao</p>
                  <p className="text-sm text-muted-foreground">{previewTemplate.hydrationPlan}</p>
                </div>
              )}

              {previewTemplate.professionalNotes && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notas profissionais</p>
                  <p className="text-sm text-muted-foreground">{previewTemplate.professionalNotes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
