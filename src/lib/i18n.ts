import esMessages from "../../messages/es.json"
import enMessages from "../../messages/en.json"

export type Locale = "es" | "en"
export type Messages = typeof esMessages

const messages: Record<Locale, Messages> = { es: esMessages, en: enMessages }

export function detectLocale(): Locale {
  if (typeof window === "undefined") return "es"
  const lang = navigator.language?.split("-")[0]
  return lang === "en" ? "en" : "es"
}

export function getMessages(locale: Locale): Messages {
  return messages[locale] ?? messages.es
}

/**
 * Simple translation helper — dot-path access into messages.
 * Usage: t("landing.heroTitle") → "Planifica tu viaje perfecto con IA"
 */
export function createT(locale: Locale) {
  const msgs = getMessages(locale)

  return function t(key: string): string {
    const parts = key.split(".")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = msgs
    for (const part of parts) {
      value = value?.[part]
      if (value === undefined) return key
    }
    return typeof value === "string" ? value : key
  }
}
