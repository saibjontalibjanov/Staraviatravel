// Bound stalled requests while preserving the caller's unmount/cancel signal.
export async function fetchWithTimeout(url, options = {}) {
  const { timeoutMs = 20000, signal, ...requestOptions } = options
  const controller = new AbortController()
  const abort = () => controller.abort(signal.reason)
  if (signal?.aborted) abort()
  else signal?.addEventListener('abort', abort, { once: true })
  const timer = setTimeout(() => controller.abort(new DOMException('Request timed out', 'TimeoutError')), timeoutMs)
  try {
    const response = await fetch(url, { ...requestOptions, signal: controller.signal })
    // Keep the deadline active through body download, not just response headers.
    await response.clone().arrayBuffer()
    return response
  } catch (error) {
    if (controller.signal.aborted) throw controller.signal.reason || error
    throw error
  }
  finally { clearTimeout(timer); signal?.removeEventListener('abort', abort) }
}
