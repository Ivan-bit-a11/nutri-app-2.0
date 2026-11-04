"use client"

import { useState } from "react"
import { Languages } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { localeCookieName, supportedLngs, type SupportedLng } from "@/i18n/settings"

const labels: Record<SupportedLng, string> = {
  "pt-BR": "Português (BR)",
  es: "Español",
}

export function LanguageSwitcher() {
  const { i18n } = useTranslation(undefined, { useSuspense: false })
  const [pending, setPending] = useState(false)
  const currentLanguage = (supportedLngs.includes(i18n.resolvedLanguage as SupportedLng)
    ? (i18n.resolvedLanguage as SupportedLng)
    : "pt-BR") as SupportedLng

  const setLanguage = async (language: SupportedLng) => {
    setPending(true)
    await i18n.changeLanguage(language)
    document.cookie = `${localeCookieName}=${language}; path=/; max-age=31536000`
    window.localStorage.setItem(localeCookieName, language)
    setPending(false)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" disabled={pending}>
          <Languages className="h-4 w-4" />
          <span className="sr-only">Idioma</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Idioma</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {supportedLngs.map((language) => (
          <DropdownMenuItem key={language} onClick={() => setLanguage(language)} className={currentLanguage === language ? "font-semibold" : ""}>
            {labels[language]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
