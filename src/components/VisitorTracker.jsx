import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { apiFetch, apiUrl } from '../lib/api'
import { anonymousId, canTrack, publicPages, visitorId } from '../lib/visitors'
const consentValue = () => { try { return localStorage.getItem('cookieConsent') } catch { return null } }
export default function VisitorTracker() {
  const location = useLocation(), { language } = useLanguage()
  const [consent, setConsent] = useState(consentValue)
  const lastPage = useRef('')
  useEffect(() => {
    const refresh = event => setConsent(typeof event.detail === 'string' ? event.detail : consentValue())
    window.addEventListener('staravia:consent', refresh); window.addEventListener('storage', refresh)
    return () => { window.removeEventListener('staravia:consent', refresh); window.removeEventListener('storage', refresh) }
  }, [])
  useEffect(() => {
    if (!canTrack(consent, navigator.doNotTrack, navigator.globalPrivacyControl)) { lastPage.current = ''; return }
    if (!publicPages.includes(location.pathname)) return
    let storage; try { storage = window.localStorage } catch { storage = null }
    let id; try { id = visitorId(storage) } catch { return }
    const send = async type => { try { await apiFetch(apiUrl('/api/visits'), { method: 'POST', timeoutMs: 10000, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: { type, visitorId: id, eventId: anonymousId(), path: location.pathname, language } }) }) } catch {} }
    const key = location.key + ':' + location.pathname
    if (lastPage.current !== key) { lastPage.current = key; send('pageview') }
    const timer = setInterval(() => { if (!document.hidden) send('heartbeat') }, 60000)
    return () => clearInterval(timer)
  }, [consent, location.key, location.pathname, language])
  return null
}
