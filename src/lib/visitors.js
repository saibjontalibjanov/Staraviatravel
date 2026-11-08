export const publicPages = ['/', '/about-us', '/business-class', '/search-results']
export const canTrack = (consent, doNotTrack, privacyControl) => consent === 'accepted' && doNotTrack !== '1' && !privacyControl
export function anonymousId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID()
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128
  const hex = [...bytes].map(value => value.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`
}
let sessionVisitor
export function visitorId(storage) {
  const valid = value => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value || '')
  try {
    const saved = storage.getItem('staravia_visitor_id')
    if (valid(saved)) return saved
    const id = anonymousId(); storage.setItem('staravia_visitor_id', id); return id
  } catch { sessionVisitor ||= anonymousId(); return sessionVisitor }
}
