import { createContext, useContext, useEffect, useState } from 'react'
import en from './locales/en'
import vi from './locales/vi'

const dictionaries = { vi, en }
export const SUPPORTED_LOCALES = ['vi', 'en']
export const DEFAULT_LOCALE = 'vi'

const LocaleContext = createContext(null)

function getStoredLocale() {
  if (typeof window === 'undefined') return DEFAULT_LOCALE
  const stored = localStorage.getItem('locale')
  if (SUPPORTED_LOCALES.includes(stored)) return stored
  return DEFAULT_LOCALE
}

function resolve(dict, key) {
  return key.split('.').reduce((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) return acc[part]
    return undefined
  }, dict)
}

function interpolate(template, vars) {
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(vars, name)
      ? String(vars[name])
      : match,
  )
}

/** Translate by key. Works outside React (e.g. ErrorBoundary). */
export function t(key, vars = {}, locale = getStoredLocale()) {
  const dict = dictionaries[locale] || dictionaries[DEFAULT_LOCALE]
  const fallback = dictionaries[DEFAULT_LOCALE]
  const value = resolve(dict, key) ?? resolve(fallback, key)
  if (typeof value !== 'string') return key
  return interpolate(value, vars)
}

function applyLocale(next) {
  localStorage.setItem('locale', next)
  document.documentElement.lang = next
}

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(getStoredLocale)

  useEffect(() => {
    applyLocale(locale)
  }, [locale])

  function setLocale(next) {
    if (!SUPPORTED_LOCALES.includes(next)) return
    applyLocale(next)
    setLocaleState(next)
  }

  function toggleLocale() {
    setLocaleState((prev) => {
      const next = prev === 'vi' ? 'en' : 'vi'
      applyLocale(next)
      return next
    })
  }

  const value = {
    locale,
    setLocale,
    toggleLocale,
    t: (key, vars) => t(key, vars, locale),
  }

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) {
    throw new Error('useLocale must be used within LocaleProvider')
  }
  return ctx
}
