import { Link } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { useLanguage } from '../i18n/LanguageContext'

export default function NotFound() {
  const { t } = useLanguage()
  return <><TopBar /><main className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-6 text-center bg-paper"><p className="text-gold text-lg">404</p><h1 className="font-display text-4xl">{t('Page not found')}</h1><Link to="/" className="rounded-lg bg-gold px-6 py-3 text-ink">{t('Back to home')}</Link></main></>
}
