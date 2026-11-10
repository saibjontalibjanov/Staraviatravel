// Restore exactly the styles/attributes present before this loading lifecycle.
export function lockApplication(root, dialog) {
  const focus = document.activeElement
  const elements = [...document.body.children].filter(element => element !== dialog && element instanceof HTMLElement)
  if (root && !elements.includes(root)) elements.push(root)
  const states = elements.map(element => [element, element.getAttribute('inert'), element.getAttribute('aria-busy')])
  const bodyOverflow = document.body.style.overflow, htmlOverflow = document.documentElement.style.overflow
  document.body.style.overflow = 'hidden'; document.documentElement.style.overflow = 'hidden'
  states.forEach(([element]) => { element.setAttribute('inert',''); element.setAttribute('aria-busy','true') })
  let released = false
  return () => {
    if (released) return
    released = true
    document.body.style.overflow = bodyOverflow; document.documentElement.style.overflow = htmlOverflow
    states.forEach(([element,inert,busy]) => {
      if (inert === null) element.removeAttribute('inert'); else element.setAttribute('inert',inert)
      if (busy === null) element.removeAttribute('aria-busy'); else element.setAttribute('aria-busy',busy)
    })
    if (focus instanceof HTMLElement && focus.isConnected && !focus.closest('[inert]') && !focus.matches(':disabled')) focus.focus({ preventScroll: true })
  }
}
