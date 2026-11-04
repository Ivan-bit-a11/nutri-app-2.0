export const supportedLngs = ["pt-BR", "es"] as const
export type SupportedLng = (typeof supportedLngs)[number]

export const fallbackLng: SupportedLng = "pt-BR"
export const defaultNS = "common"
export const localeCookieName = "locale"

export const namespaces = ["common", "auth", "dashboard", "patients", "diet", "ai"] as const
export type Namespace = (typeof namespaces)[number]

export function resolveLanguage(value: string | null | undefined): SupportedLng {
  if (!value) return fallbackLng
  if (supportedLngs.includes(value as SupportedLng)) {
    return value as SupportedLng
  }

  const normalized = value.toLowerCase()
  if (normalized.startsWith("es")) return "es"
  if (normalized.startsWith("pt")) return "pt-BR"
  return fallbackLng
}
