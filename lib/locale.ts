import { cookies, headers } from "next/headers"
import { localeCookieName, resolveLanguage, type SupportedLng } from "@/i18n/settings"

export async function getRequestLocale(): Promise<SupportedLng> {
  const cookieStore = await cookies()
  const headerStore = await headers()
  const cookieLocale = cookieStore.get(localeCookieName)?.value
  const headerLocale = headerStore.get("accept-language")
  const firstHeaderLocale = headerLocale?.split(",")[0]

  return resolveLanguage(cookieLocale ?? firstHeaderLocale)
}
