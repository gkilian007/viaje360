"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { detectLocale, createT, type Locale } from "./i18n"

interface I18nContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextValue>({
  locale: "es",
  setLocale: () => {},
  t: (k) => k,
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("es")

  useEffect(() => {
    // Check localStorage first, then browser
    const stored = localStorage.getItem("viaje360-locale") as Locale | null
    const detected = stored ?? detectLocale()
    setLocaleState(detected)
  }, [])

  function setLocale(l: Locale) {
    setLocaleState(l)
    localStorage.setItem("viaje360-locale", l)
  }

  const t = createT(locale)

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
