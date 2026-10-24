import { useLanguage } from '../i18n/LanguageContext'

export default function LeadFeedback({ result, error }) {
  const { t } = useLanguage()
  if (error) return <p role="alert" className="mt-3 text-sm text-red-700">{t(error)}</p>
  if (result) return <p role="status" className="mt-3 text-sm text-ink">{t('Client ID')}: <strong>{result.clientId}</strong></p>
  return null
}
