import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"
import { I18nProvider } from "@/components/i18n-provider"
import { getRequestLocale } from "@/lib/locale"

const _inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const _plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
})

export const metadata: Metadata = {
  title: "NutriFlow — Plataforma de Nutrição Clínica",
  description:
    "Gestão de pacientes, avaliações físicas, planos alimentares e fluxo clínico para nutricionistas. Clientes solicitam consultas e enviam comprovativos de pagamento.",
  creator: "Ivan Mbalame",
  authors: [{ name: "Ivan Mbalame" }],
  other: {
    copyright: "© Ivan Mbalame",
  },
  manifest: "/manifest.json", // ← liga o manifesto PWA
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NutriFlow",
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: "#f5f6fa",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getRequestLocale()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${_inter.variable} ${_plusJakarta.variable} font-sans`}
        suppressHydrationWarning
      >
        <I18nProvider locale={locale}>
          {children}
          <Toaster richColors position="top-right" />
        </I18nProvider>
      </body>
    </html>
  )
}