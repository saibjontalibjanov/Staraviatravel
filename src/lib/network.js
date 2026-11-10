import { loadingManager } from '../shared/loadingManager.js'
// Explicit opt-in only; analytics, polling, prefetch and autocomplete stay local.
export async function fetchWithTimeout(url, options = {}) {
  const { timeoutMs = 20000, signal, blockingLoader = false, loadingLabel = 'request', ...requestOptions } = options
  const controller = new AbortController()
  const abort = () => controller.abort(signal.reason)
  if (signal?.aborted) abort()
  else signal?.addEventListener('abort', abort, { once: true })
  const timedOut = () => controller.abort(new DOMException('Request timed out', 'TimeoutError'))
  const token = blockingLoader ? loadingManager.start({ label: loadingLabel, timeoutMs: timeoutMs + 1000, onTimeout: timedOut, onCancel: () => controller.abort() }) : null
  const timer = setTimeout(timedOut, timeoutMs)
  try {
    const response = await fetch(url, { ...requestOptions, signal: controller.signal })
    // Consume once, bounded through the body download. Clone-based buffering kept
    // two copies of large bodies and could leave a stalled tee branch alive.
    const body = await response.arrayBuffer()
    return new Response([204,205,304].includes(response.status) ? null : body, { status: response.status, statusText: response.statusText, headers: response.headers })
  } catch (error) {
    if (controller.signal.aborted) throw controller.signal.reason || error
    throw error
  } finally { if (token) loadingManager.stop(token); clearTimeout(timer); signal?.removeEventListener('abort', abort) }
}
