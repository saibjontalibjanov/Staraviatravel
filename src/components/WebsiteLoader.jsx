import { useEffect, useState, useSyncExternalStore } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { initialLoading } from '../lib/initialLoading'

function imageReady(image, signal) {
  if (image.complete) return Promise.resolve()
  return new Promise(resolve => {
    const done = () => { image.removeEventListener('load', done); image.removeEventListener('error', done); signal.removeEventListener('abort', done); resolve() }
    image.addEventListener('load', done, { once: true }); image.addEventListener('error', done, { once: true }); signal.addEventListener('abort', done, { once: true })
    if (signal.aborted) done()
  })
}
function fontsReady(signal) {
  const sheet = document.getElementById('website-fonts')
  return new Promise(resolve => {
    const done = () => { sheet?.removeEventListener('load', done); sheet?.removeEventListener('error', done); signal.removeEventListener('abort', done); if (sheet) sheet.media = 'all'; resolve() }
    if (!sheet || sheet.sheet || signal.aborted) done()
    else { sheet.addEventListener('load', done, { once: true }); sheet.addEventListener('error', done, { once: true }); signal.addEventListener('abort', done, { once: true }) }
  }).then(() => {
    if (!document.fonts || signal.aborted) return
    return Promise.allSettled([document.fonts.load('400 16px Poppins'), document.fonts.load('600 16px Poppins'), document.fonts.load('400 24px "Playfair Display"')]).then(() => document.fonts.ready)
  })
}

export default function WebsiteLoader({ children }) {
  const { t } = useLanguage()
  const [visible, setVisible] = useState(true)
  const pending = useSyncExternalStore(initialLoading.subscribe, initialLoading.count, initialLoading.count)
  useEffect(() => {
    const controller = new AbortController(), finishFonts = initialLoading.begin()
    document.documentElement.classList.add('site-loading')
    fontsReady(controller.signal).finally(finishFonts)
    if (document.readyState !== 'complete') {
      const finishDocument = initialLoading.begin()
      window.addEventListener('load', finishDocument, { once: true, signal: controller.signal })
      controller.signal.addEventListener('abort', finishDocument, { once: true })
    }
    const deadline = setTimeout(() => { initialLoading.finish(); setVisible(false) }, 15000)
    return () => { clearTimeout(deadline); controller.abort(); finishFonts(); document.documentElement.classList.remove('site-loading') }
  }, [])
  useEffect(() => {
    if (!visible || pending) return
    const controller = new AbortController()
    // Let initial API results commit to the DOM before checking the page imagery.
    const timer = setTimeout(async () => {
      const images = [...document.querySelectorAll('#site-content img')].filter(image => {
        const box = image.getBoundingClientRect()
        return image.loading !== 'lazy' || (box.bottom > 0 && box.top < innerHeight && box.right > 0 && box.left < innerWidth)
      })
      await Promise.all(images.map(image => imageReady(image, controller.signal)))
      if (!controller.signal.aborted && initialLoading.count() === 0) { initialLoading.finish(); setVisible(false) }
    }, 400)
    return () => { clearTimeout(timer); controller.abort() }
  }, [pending, visible])
  useEffect(() => { if (!visible) document.documentElement.classList.remove('site-loading') }, [visible])
  return <>
    <div id="site-content" inert={visible ? '' : undefined} aria-hidden={visible ? true : undefined}>{children}</div>
    {visible && <div className="site-loader" role="status" aria-live="polite" aria-label={t('Loading the website…')}><div className="site-loader-inner"><span className="site-loader-star" aria-hidden="true">✦</span><strong>STARAVIA</strong><span className="site-loader-ring" aria-hidden="true" /><p>{t('Preparing your journey…')}</p></div></div>}
  </>
}
