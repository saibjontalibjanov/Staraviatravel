import { useEffect, useRef, useState } from 'react'

export const heroPoster = '/media/hero-poster-v1.webp'

// A decorative video must never hold up navigation, text, or the booking form.
export default function BackgroundVideo({ className = '' }) {
  const video = useRef(null)
  const [source, setSource] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const connection = navigator.connection
    let idle, timer
    const cancel = () => {
      if (idle !== undefined) window.cancelIdleCallback?.(idle)
      clearTimeout(timer)
    }
    const update = () => {
      cancel()
      if (motion.matches || connection?.saveData || ['slow-2g', '2g'].includes(connection?.effectiveType)) {
        setSource(''); setReady(false)
        return
      }
      const start = () => {
        const mobile = window.matchMedia('(max-width: 767px)').matches || (connection?.downlink > 0 && connection.downlink < 1.5)
        setSource(mobile ? '/media/hero-mobile-v1.mp4' : '/media/hero-desktop-v1.mp4')
      }
      if ('requestIdleCallback' in window) idle = window.requestIdleCallback(start, { timeout: 1200 })
      else timer = window.setTimeout(start, 250)
    }
    update()
    motion.addEventListener('change', update)
    connection?.addEventListener('change', update)
    return () => { cancel(); motion.removeEventListener('change', update); connection?.removeEventListener('change', update) }
  }, [])

  useEffect(() => {
    const element = video.current
    if (!element || !source) return
    let visible = true
    const playback = () => {
      if (document.hidden || !visible) element.pause()
      else element.play()?.catch(() => { /* Poster/first frame remains if autoplay is blocked. */ })
    }
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; playback() }, { threshold: 0.01 }) : null
    observer?.observe(element)
    document.addEventListener('visibilitychange', playback)
    playback()
    return () => { observer?.disconnect(); document.removeEventListener('visibilitychange', playback); element.pause() }
  }, [source])

  return <div className={className} aria-hidden="true">
    <img src={heroPoster} width="1280" height="720" alt="" fetchpriority="high" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
    {source && <video ref={video} src={source} poster={heroPoster} autoPlay loop muted playsInline preload="metadata" disablePictureInPicture onLoadedData={() => setReady(true)} onError={() => setReady(false)} className="absolute inset-0 w-full h-full object-cover" style={{ opacity: ready ? 1 : 0 }} />}
  </div>
}
