"use client"

import { useEffect } from "react"
import type React from "react"
import { I18nextProvider } from "react-i18next"
import i18next, { initializeClientI18n } from "@/i18n/client"
import { localeCookieName, type SupportedLng } from "@/i18n/settings"

interface I18nProviderProps {
  locale: SupportedLng
  children: React.ReactNode
}

export function I18nProvider({ locale, children }: I18nProviderProps) {
  useEffect(() => {
    void initializeClientI18n(locale)
    document.cookie = `${localeCookieName}=${locale}; path=/; max-age=31536000`
    window.localStorage.setItem(localeCookieName, locale)
  }, [locale])

  return <I18nextProvider i18n={i18next}>{children}</I18nextProvider>
}
