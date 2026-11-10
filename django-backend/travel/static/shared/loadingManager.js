// Shared by React and the Django-rendered CRM. No DOM, React or provider coupling.
export function createLoadingManager({ setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
  const operations = new Map(), listeners = new Set()
  let snapshot = Object.freeze({ count: 0, immediate: false, progress: null, timeout: false })
  function publish(changes = {}) {
    const values = [...operations.values()]
    snapshot = Object.freeze({ count: operations.size, immediate: values.some(value => value.immediate),
      progress: values.length && values.every(value => Number.isFinite(value.progress)) ? values.reduce((sum,value) => sum + value.progress,0)/values.length : null,
      timeout: snapshot.timeout, ...changes })
    listeners.forEach(listener => listener())
  }
  function stop(token) {
    const operation = operations.get(token)
    if (!operation) return
    clearTimer(operation.timer); operations.delete(token); publish()
  }
  return {
    getSnapshot: () => snapshot,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
    start({ label = 'operation', immediate = false, timeoutMs = 60000, onTimeout, onCancel } = {}) {
      const token = Symbol(label), operation = { immediate, onCancel, progress: null }
      operations.set(token, operation)
      operation.timer = setTimer(() => {
        if (!operations.has(token)) return
        try { onTimeout?.() } catch { /* owner errors must not retain a lock */ } finally { stop(token); publish({ timeout: true }) }
      }, Math.max(1, timeoutMs))
      publish(); return token
    },
    stop,
    progress(token,value) { const operation = operations.get(token); if (operation && Number.isFinite(value)) { operation.progress = Math.max(0,Math.min(100,value)); publish() } },
    clear() { for (const [token,value] of [...operations]) { try { value.onCancel?.() } catch { /* cancel remaining owners too */ } finally { stop(token) } } },
    dismissTimeout() { publish({ timeout: false }) },
  }
}
export const loadingManager = createLoadingManager()
