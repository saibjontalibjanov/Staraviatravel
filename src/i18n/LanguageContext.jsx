import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { defaultLanguage, isLanguage, localeFor, readLanguage, storageKey, translate } from './language'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try { return readLanguage(window.localStorage) } catch { return defaultLanguage }
  })

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = 'ltr'
    document.title = translate(language, 'STARAVIA™ | Premium and Luxury classes')
    try { window.localStorage.setItem(storageKey, language) } catch { /* Storage can be unavailable in private browsing. */ }
  }, [language])

  useEffect(() => {
    const syncLanguage = (event) => {
      if (event.key === storageKey || event.key === null) {
        setLanguage(isLanguage(event.newValue) ? event.newValue : defaultLanguage)
      }
    }
    window.addEventListener('storage', syncLanguage)
    return () => window.removeEventListener('storage', syncLanguage)
  }, [])

  const value = useMemo(() => ({
    language,
    locale: localeFor(language),
    setLanguage: (code) => { if (isLanguage(code)) setLanguage(code) },
    t: (text) => translate(language, text),
  }), [language])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const value = useContext(LanguageContext)
  if (!value) throw new Error('useLanguage must be used within LanguageProvider')
  return value
}
