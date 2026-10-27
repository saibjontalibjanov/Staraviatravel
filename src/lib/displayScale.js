// Screen dimensions stay stable when a user changes browser zoom.
export function compactLaptop(screen, finePointer) {
  return Boolean(finePointer && screen.width >= 1024 && screen.width <= 1536 && screen.height <= 1000)
}
export function installDisplayScale() {
  const pointer = window.matchMedia('(hover: hover) and (pointer: fine)')
  const update = () => document.documentElement.classList.toggle('compact-laptop', compactLaptop(window.screen, pointer.matches))
  update()
  window.addEventListener('resize', update)
  pointer.addEventListener('change', update)
  return () => { window.removeEventListener('resize', update); pointer.removeEventListener('change', update) }
}
