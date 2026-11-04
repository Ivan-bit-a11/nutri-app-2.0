import { createInstance, type i18n, type TFunction } from "i18next"
import resourcesToBackend from "i18next-resources-to-backend"
import { initReactI18next } from "react-i18next/initReactI18next"
import { getI18nOptions } from "@/i18n/get-options"
import { loadLocaleNamespace } from "@/i18n/loaders"
import { resolveLanguage, type Namespace, type SupportedLng } from "@/i18n/settings"

export async function getServerTranslator(
  language: string,
  namespace: Namespace | Namespace[],
): Promise<{ i18n: i18n; t: TFunction }> {
  const lng = resolveLanguage(language) as SupportedLng
  const instance = createInstance()

  await instance
    .use(initReactI18next)
    .use(resourcesToBackend(loadLocaleNamespace))
    .init(getI18nOptions(lng, namespace))

  return {
    i18n: instance,
    t: instance.t,
  }
}
