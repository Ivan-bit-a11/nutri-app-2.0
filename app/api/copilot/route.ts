import { NextResponse } from "next/server"

/**
 * AI Copilot desactivado.
 * O sistema funciona sem OPENAI_API_KEY.
 * Para reactivar no futuro, ver docs/IA-OPCIONAL.md
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "FEATURE_DISABLED",
        message:
          "O assistente de IA está desactivado nesta versão. Use os planos e templates manuais.",
      },
    },
    { status: 503 },
  )
}

export async function GET() {
  return NextResponse.json({
    enabled: false,
    message: "IA desactivada",
  })
}
