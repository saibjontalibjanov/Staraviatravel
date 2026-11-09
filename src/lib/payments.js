// No bank credentials or card data belong in this module.
export const paymentIdValid = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value || '')
export function paymentPresentation(payment) {
  if (!payment) return 'unverified'
  if (payment.status === 'succeeded') return payment.verifiedAt && payment.paidAt ? 'succeeded' : 'unverified'
  return ['failed', 'cancelled', 'expired', 'pending', 'creating', 'unknown'].includes(payment.status) ? payment.status : 'unverified'
}
export function hostedPaymentUrl(value) {
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.username || url.password || url.hash) throw new Error('Invalid hosted checkout URL')
  return url.href
}
export function paymentHeaders(token) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}
