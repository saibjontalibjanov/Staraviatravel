import messages from './messages.json' with { type: 'json' }

export const languages = [
  { code: 'uz', name: 'O‘zbekcha', shortName: 'UZB' },
  { code: 'ru', name: 'Русский', shortName: 'РУС' },
  { code: 'en', name: 'English', shortName: 'ENG' },
]
export const defaultLanguage = 'uz'
export const storageKey = 'staravia.language'
export const isLanguage = (code) => languages.some(language => language.code === code)
export const translate = (language, text) => messages[text]?.[language] ?? messages[text]?.en ?? text
export const localeFor = (language) => ({ uz: 'uz-UZ', ru: 'ru-RU', en: 'en-GB' })[language] || 'uz-UZ'
export function readLanguage(storage) {
  try {
    const saved = storage.getItem(storageKey)
    return isLanguage(saved) ? saved : defaultLanguage
  } catch {
    return defaultLanguage
  }
}
