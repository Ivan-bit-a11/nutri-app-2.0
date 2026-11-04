import type { InitOptions } from "i18next"
import { defaultNS, fallbackLng, supportedLngs, type Namespace, type SupportedLng } from "@/i18n/settings"

export function getI18nOptions(language: SupportedLng, namespace: Namespace | Namespace[] = defaultNS): InitOptions {
  return {
    lng: language,
    fallbackLng,
    supportedLngs: [...supportedLngs],
    defaultNS,
    fallbackNS: defaultNS,
    ns: Array.isArray(namespace) ? namespace : [namespace],
    interpolation: {
      escapeValue: false,
    },
  }
}
