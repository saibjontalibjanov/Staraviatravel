import { apiUrl } from './api'

export async function submitLead(application) {
  const response = await fetch(apiUrl('/api/leads'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: application }),
  })
  if (!response.ok) throw new Error(response.status === 429 ? 'Too many requests. Please try again later.' : 'Could not send your application. Please check your details and try again.')
  const payload = await response.json()
  if (!/^[1-9]\d{5}$/.test(payload.data?.clientId)) throw new Error('Could not send your application. Please check your details and try again.')
  return payload.data
}

export function callbackPhone(phone) {
  const value = phone.trim()
  return /^\d{9}$/.test(value.replace(/[ ()-]/g, '')) ? `+998${value.replace(/\D/g, '')}` : value
}
