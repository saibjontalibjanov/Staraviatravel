import { useEffect, useRef, useState } from 'react'
import { heroVideoSource } from '../lib/heroVideo'

export const heroPoster = '/media/hero-poster-v1.webp'

// The full-page loader waits for playback readiness, with a bounded poster fallback.
export default function BackgroundVideo({ className = '' }) {
  const video = useRef(null)
  const chosenSource = useRef('')
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
        chosenSource.current = ''; setSource(''); setReady(false)
        return
      }
      const start = () => {
        chosenSource.current ||= heroVideoSource({ mobile: window.matchMedia('(max-width: 767px)').matches, effectiveType: connection?.effectiveType, downlink: connection?.downlink })
        setSource(chosenSource.current)
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
      else element.play()?.catch(() => {})
    }
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; playback() }, { threshold: 0.01 }) : null
    observer?.observe(element)
    document.addEventListener('visibilitychange', playback)
    playback()
    return () => { observer?.disconnect(); document.removeEventListener('visibilitychange', playback); element.pause() }
  }, [source])

  return <div className={className} aria-hidden="true">
    <img src={heroPoster} width="1280" height="720" alt="" fetchpriority="high" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
    {source && <video ref={video} src={source} poster={heroPoster} autoPlay loop muted playsInline preload="metadata" disablePictureInPicture onLoadedData={() => setReady(true)} onCanPlay={() => { setReady(true) }} onError={() => { setReady(false) }} className="absolute inset-0 w-full h-full object-cover" style={{ opacity: ready ? 1 : 0 }} />}
  </div>
}
