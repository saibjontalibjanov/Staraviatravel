import { useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { submitLead } from '../lib/leads'

export default function useLeadSubmission() {
  const { language } = useLanguage()
  const locked = useRef(false)
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  async function submit(application) {
    if (locked.current) return null
    locked.current = true
    setPending(true)
    setError('')
    try {
      const receipt = await submitLead({ ...application, language, pagePath: window.location.pathname })
      setResult(receipt)
      return receipt
    } catch (cause) {
      setError(cause.message === 'Too many requests. Please try again later.' ? cause.message : 'Could not send your application. Please check your details and try again.')
      return null
    } finally {
      locked.current = false
      setPending(false)
    }
  }

  function reset() {
    if (!locked.current) { setResult(null); setError('') }
  }

  return { submit, pending, result, error, reset }
}
