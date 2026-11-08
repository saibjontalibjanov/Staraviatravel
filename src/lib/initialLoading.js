// Only the initial page load is gated; background requests never re-block the site.
export function createInitialLoadingState() {
  let active = true
  const tasks = new Set(), listeners = new Set()
  const notify = () => listeners.forEach(listener => listener())
  return {
    begin() {
      if (!active) return () => {}
      const task = Symbol(); tasks.add(task); notify()
      return () => { if (tasks.delete(task)) notify() }
    },
    count: () => tasks.size,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
    finish() { active = false; tasks.clear(); notify() },
  }
}
export const initialLoading = createInitialLoadingState()
