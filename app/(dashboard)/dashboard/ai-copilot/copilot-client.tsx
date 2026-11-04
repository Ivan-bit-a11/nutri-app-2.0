"use client"

import { useEffect, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Bot, Sparkles, Send, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

interface CopilotClientProps {
  patients: Array<{ id: string; name: string; goal: string | null }>
  loadError: string | null
}

const TOOLS = [
  { id: "diet-plan", label: "Plano Alimentar" },
  { id: "grocery-list", label: "Lista de Compras" },
  { id: "patient-summary", label: "Resumo do Paciente" },
  { id: "meal-suggestion", label: "Sugestoes de Refeicoes" },
  { id: "supplement-guide", label: "Guia de Suplementos" },
  { id: "chat", label: "Chat Livre" },
]

function getPrompt(tool: string, context: string) {
  if (tool === "chat") {
    return context || "Ola"
  }

  const toolLabel = TOOLS.find((item) => item.id === tool)?.label ?? "conteudo"
  return `Gerar ${toolLabel}. Contexto: ${context}`
}

export function CopilotClient({ patients, loadError }: CopilotClientProps) {
  const [tool, setTool] = useState("diet-plan")
  const [patientId, setPatientId] = useState("none")
  const [context, setContext] = useState("")
  const [emptyResultMessage, setEmptyResultMessage] = useState("")
  const outputAnchor = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, setMessages, error, clearError } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/copilot",
      prepareSendMessagesRequest: ({ messages: nextMessages }) => ({
        body: {
          tool,
          patientId: patientId === "none" ? undefined : patientId,
          context,
          messages: nextMessages,
        },
      }),
    }),
  })

  const isLoading = status === "submitted" || status === "streaming"
  const assistantMessages = messages.filter((message) => message.role === "assistant")

  const extractAssistantText = (parts: Array<{ type: string; text?: string }>) =>
    parts
      .filter((part) => part.type === "text" || part.type === "reasoning")
      .map((part) => part.text ?? "")
      .join("")
      .trim()

  useEffect(() => {
    if (status !== "ready") return
    if (assistantMessages.length === 0) return

    const lastAssistant = assistantMessages[assistantMessages.length - 1]
    const text = extractAssistantText(lastAssistant.parts as Array<{ type: string; text?: string }>)
    if (!text) {
      setEmptyResultMessage("A resposta veio vazia. Tente adicionar mais contexto e gerar novamente.")
      return
    }

    setEmptyResultMessage("")
  }, [assistantMessages, status])

  const submit = async () => {
    if (context.trim().length === 0 || isLoading) {
      return
    }

    clearError()
    setEmptyResultMessage("")
    const prompt = getPrompt(tool, context)
    try {
      await sendMessage({ text: prompt })
    } catch {
      setEmptyResultMessage("Nao foi possivel enviar a solicitacao. Tente novamente em instantes.")
      return
    }
    setTimeout(() => outputAnchor.current?.scrollIntoView({ behavior: "smooth" }), 60)
  }

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col overflow-hidden xl:flex-row">
      <div className="w-full shrink-0 space-y-4 overflow-y-auto border-b border-border bg-card p-3 sm:p-4 xl:w-80 xl:border-b-0 xl:border-r">
        <div>
          <h1 className="text-sm font-semibold flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" /> AI Copilot
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Geracao com persistencia e historico de versoes</p>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium">Ferramenta</p>
          <Select value={tool} onValueChange={setTool}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TOOLS.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium">Paciente (opcional)</p>
          <Select value={patientId} onValueChange={setPatientId}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem paciente</SelectItem>
              {patients.map((patient) => (
                <SelectItem key={patient.id} value={patient.id}>
                  {patient.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium">Contexto</p>
          <Textarea
            value={context}
            onChange={(event) => setContext(event.target.value)}
            placeholder="Informe objetivo clinico, restricoes e observacoes relevantes"
            className="min-h-[120px]"
          />
        </div>

        <Button onClick={submit} className="w-full gap-2" disabled={isLoading || context.trim().length === 0}>
          {isLoading ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Sparkles className="h-4 w-4" />}
          {isLoading ? "Gerando..." : "Gerar"}
        </Button>

        {error && (
          <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            Nao foi possivel gerar o conteudo agora. Revise o contexto e tente novamente.
          </div>
        )}

        {loadError && (
          <div className="rounded-md border border-warning/20 bg-warning/10 px-3 py-2 text-xs text-foreground">
            {loadError}
          </div>
        )}

        {emptyResultMessage && (
          <div className="rounded-md border border-warning/20 bg-warning/10 px-3 py-2 text-xs text-foreground">
            {emptyResultMessage}
          </div>
        )}

        {messages.length > 0 && (
          <Button
            variant="ghost"
            className="w-full gap-2 text-muted-foreground"
            onClick={() => {
              setMessages([])
              clearError()
              setEmptyResultMessage("")
            }}
          >
            <RotateCcw className="h-4 w-4" /> Limpar historico
          </Button>
        )}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
        {assistantMessages.length === 0 && !isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="max-w-sm text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                <Bot className="h-7 w-7 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                Selecione uma ferramenta, adicione contexto e gere rascunhos que serao salvos automaticamente.
              </p>
            </div>
          </div>
        ) : assistantMessages.length === 0 && isLoading ? (
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 animate-pulse text-primary" />
                Gerando rascunho...
              </div>
            </CardContent>
          </Card>
        ) : (
          assistantMessages.map((message) => {
              const text = extractAssistantText(message.parts as Array<{ type: string; text?: string }>)

              return (
                <div key={message.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">AI Copilot</Badge>
                    <p className="text-xs text-muted-foreground">{new Date().toLocaleTimeString("pt-BR")}</p>
                  </div>
                  <Card>
                    <CardContent className="pt-4 pb-4">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">{text || "Gerando..."}</div>
                    </CardContent>
                  </Card>
                </div>
              )
            })
        )}
        <div ref={outputAnchor} />
      </div>

      {tool === "chat" && (
        <div className="border-t border-border p-4 md:hidden">
          <div className="flex items-center gap-2">
            <Textarea
              value={context}
              onChange={(event) => setContext(event.target.value)}
              placeholder="Mensagem"
              className="min-h-[48px] max-h-[120px]"
            />
            <Button size="icon" onClick={submit} disabled={isLoading || context.trim().length === 0}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
