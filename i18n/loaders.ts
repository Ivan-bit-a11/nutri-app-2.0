import { namespaces, resolveLanguage, type Namespace, type SupportedLng } from "@/i18n/settings"

type LocaleModule = { default: Record<string, unknown> }
type LoaderMap = Record<SupportedLng, Record<Namespace, () => Promise<LocaleModule>>>

const localeLoaders: LoaderMap = {
  "pt-BR": {
    common: () => import("@/locales/pt-BR/common.json"),
    auth: () => import("@/locales/pt-BR/auth.json"),
    dashboard: () => import("@/locales/pt-BR/dashboard.json"),
    patients: () => import("@/locales/pt-BR/patients.json"),
    diet: () => import("@/locales/pt-BR/diet.json"),
    ai: () => import("@/locales/pt-BR/ai.json"),
  },
  es: {
    common: () => import("@/locales/es/common.json"),
    auth: () => import("@/locales/es/auth.json"),
    dashboard: () => import("@/locales/es/dashboard.json"),
    patients: () => import("@/locales/es/patients.json"),
    diet: () => import("@/locales/es/diet.json"),
    ai: () => import("@/locales/es/ai.json"),
  },
}

export function loadLocaleNamespace(language: string, namespace: string) {
  const lng = resolveLanguage(language)
  const ns = namespaces.includes(namespace as Namespace) ? (namespace as Namespace) : "common"
  return localeLoaders[lng][ns]()
}
