import { useCallback, useEffect, useState } from 'react'
import { useFetchClient } from '@strapi/strapi/admin'

export const collectionUrl = '/content-manager/collection-types/api::lead.lead'

export default function useLeads(query) {
  const { get } = useFetchClient()
  const [result, setResult] = useState({ results: [], pagination: {} })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatedAt, setUpdatedAt] = useState(null)

  const refresh = useCallback(async (signal) => {
    try {
      const response = await get(`${collectionUrl}?${query}`, { signal })
      if (signal?.aborted) return
      setResult(response.data)
      setError('')
      setUpdatedAt(new Date())
    } catch (cause) {
      if (signal?.aborted) return
      setError(cause.response?.status === 403 ? 'You need permission to read Leads in Content Manager. Contact your administrator.' : 'Could not load leads. Please retry.')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [get, query])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    refresh(controller.signal)
    const timer = setInterval(() => refresh(controller.signal), 15000)
    const onFocus = () => refresh(controller.signal)
    window.addEventListener('focus', onFocus)
    return () => { controller.abort(); clearInterval(timer); window.removeEventListener('focus', onFocus) }
  }, [refresh])

  return { ...result, loading, error, updatedAt, refresh: () => refresh() }
}
