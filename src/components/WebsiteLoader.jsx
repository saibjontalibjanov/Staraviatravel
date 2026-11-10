import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { loadingManager } from '../shared/loadingManager'
import { lockApplication } from '../shared/loaderLock'
import GlobeAnimation from './loader/GlobeAnimation'
import '../shared/globe.css'

export default function WebsiteLoader({ children, visibilityDelay = 180 }) {
  const { t } = useLanguage()
  const pending = useSyncExternalStore(loadingManager.subscribe, loadingManager.getSnapshot, loadingManager.getSnapshot)
  const [phase, setPhase] = useState('hidden'), dialog = useRef(null), root = useRef(null)
  const blocked = pending.count > 0 || phase !== 'hidden'
  useLayoutEffect(() => {
    const token = loadingManager.start({ label: 'bootstrap', immediate: true, timeoutMs: 15000 })
    const frame = requestAnimationFrame(() => loadingManager.stop(token))
    document.documentElement.classList.remove('site-loading')
    window.dispatchEvent(new Event('staravia-ready'))
    return () => { cancelAnimationFrame(frame); loadingManager.stop(token) }
  }, [])
  useEffect(() => {
    // Typography is optional: do not hold the whole page for a font CDN.
    const sheet = document.getElementById('website-fonts')
    if (!sheet) return
    const enable = () => { sheet.media = 'all' }
    if (sheet.sheet) enable()
    sheet.addEventListener('load',enable); sheet.addEventListener('error',enable)
    const timer = setTimeout(enable,5000)
    return () => { clearTimeout(timer); sheet.removeEventListener('load',enable); sheet.removeEventListener('error',enable) }
  }, [])
  useEffect(() => {
    let timer
    if (pending.count) {
      if (pending.immediate || phase !== 'hidden') setPhase('visible')
      else timer = setTimeout(() => setPhase('visible'),visibilityDelay)
    } else if (phase === 'visible') setPhase('leaving')
    else if (phase === 'leaving') timer = setTimeout(() => setPhase('hidden'),220)
    return () => clearTimeout(timer)
  }, [pending.count, pending.immediate, phase, visibilityDelay])
  useLayoutEffect(() => {
    if (!blocked) return
    return lockApplication(document.getElementById('root'),dialog.current)
  }, [blocked])
  useLayoutEffect(() => {
    if (phase === 'hidden') return
    const element = dialog.current
    if (!element.open) element.showModal()
    return () => { if (element.open) element.close() }
  }, [phase === 'hidden'])
  // Close native top-layer dialogs before restoring the original keyboard focus.
  return <>
    {pending.timeout && <div className="global-loading-recovery" role="alert">{t('Loading took too long. Please try again.')}<button onClick={() => loadingManager.dismissTimeout()}>{t('Close')}</button></div>}
    <div id="site-content" ref={root} aria-busy={blocked}>{children}</div>
    {phase !== 'hidden' && createPortal(<dialog ref={dialog} className="global-loader-dialog" aria-label={t('Loading the website…')} onCancel={event => event.preventDefault()}><div className={`global-loader-overlay ${phase === 'leaving' ? 'is-leaving' : ''}`} role="status" aria-live="polite"><div className="global-loader-content"><GlobeAnimation /><strong>STARAVIA</strong><p>{t('Preparing your journey…')}</p><div className={`global-loader-progress ${pending.progress === null ? 'is-indeterminate' : ''}`} role="progressbar" aria-label={t('Loading the website…')} {...(pending.progress === null ? {} : { 'aria-valuenow': Math.round(pending.progress), 'aria-valuemin': 0, 'aria-valuemax': 100 })}><span style={pending.progress === null ? undefined : { transform: `scaleX(${pending.progress / 100})` }} /></div></div></div></dialog>, document.body)}
  </>
}
