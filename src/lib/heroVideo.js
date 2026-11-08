export function heroVideoSource({ mobile = false, reducedMotion = false, saveData = false, effectiveType, downlink } = {}) {
  if (reducedMotion || saveData || ['slow-2g', '2g'].includes(effectiveType)) return null
  const slow = effectiveType === '3g' || (downlink > 0 && downlink < 3)
  return `/media/hero-${mobile ? 'mobile' : 'desktop'}-${slow ? 'v1' : 'v2'}.mp4`
}
