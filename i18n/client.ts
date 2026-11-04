"use client"

import i18next from "i18next"
import resourcesToBackend from "i18next-resources-to-backend"
import LanguageDetector from "i18next-browser-languagedetector"
import { initReactI18next } from "react-i18next"
import { getI18nOptions } from "@/i18n/get-options"
import { loadLocaleNamespace } from "@/i18n/loaders"
import { localeCookieName, namespaces, type SupportedLng } from "@/i18n/settings"

let initialized = false

export async function initializeClientI18n(language: SupportedLng) {
  if (!initialized) {
    await i18next
      .use(initReactI18next)
      .use(LanguageDetector)
      .use(resourcesToBackend(loadLocaleNamespace))
      .init({
        ...getI18nOptions(language, [...namespaces]),
        react: {
          useSuspense: false,
        },
        detection: {
          order: ["cookie", "localStorage", "navigator"],
          caches: ["cookie", "localStorage"],
          lookupCookie: localeCookieName,
          lookupLocalStorage: localeCookieName,
        },
      })
    initialized = true
  } else if (i18next.language !== language) {
    await i18next.changeLanguage(language)
  }

  return i18next
}

export default i18next
