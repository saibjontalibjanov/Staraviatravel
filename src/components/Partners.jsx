import { useEffect, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { apiFetch, apiUrl, mediaUrl } from '../lib/api'
import './Partners.css'
export default function Partners() {
  const { t } = useLanguage(), [partners, setPartners] = useState([]), [paused, setPaused] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    apiFetch(apiUrl('/api/partners'), { signal: controller.signal }).then(response => { if (!response.ok) throw new Error(); return response.json() }).then(result => setPartners(Array.isArray(result.data) ? result.data : [])).catch(() => {})
    return () => controller.abort()
  }, [])
  if (!partners.length) return null
  const repeats = Math.max(1, Math.ceil(8 / partners.length))
  return <section className="partners-section" aria-label={t('Our partners')}>
    <div className="partners-heading"><h2>{t('Our partners')}</h2><button type="button" onClick={() => setPaused(value => !value)} aria-pressed={paused}>{t(paused ? 'Resume partner logos' : 'Pause partner logos')} <span aria-hidden="true">{paused ? '▶' : 'Ⅱ'}</span></button></div>
    <div className="partners-window"><div className={`partners-track${paused ? ' is-paused' : ''}`} style={{ animationDuration: `${Math.max(38, partners.length * 4.75)}s` }}>
      {[0, 1].map(group => <div className="partners-group" key={group} aria-hidden={group === 1 ? true : undefined}>
        {Array.from({ length: repeats }, (_, copy) => partners.map(partner => {
          const repeated = group > 0 || copy > 0
          const image = <img src={mediaUrl(partner.logo)} alt={repeated ? '' : partner.name} width="160" height="72" loading="lazy" decoding="async" />
          return partner.website ? <a key={`${copy}-${partner.id}`} className="partner-logo" data-duplicate={repeated ? true : undefined} href={partner.website} target="_blank" rel="noopener noreferrer" tabIndex={repeated ? -1 : 0} aria-hidden={repeated ? true : undefined}>{image}</a> : <div key={`${copy}-${partner.id}`} className="partner-logo" data-duplicate={repeated ? true : undefined} aria-hidden={repeated ? true : undefined}>{image}</div>
        }))}
      </div>)}
    </div></div>
  </section>
}
