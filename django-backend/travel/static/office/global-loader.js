import { loadingManager } from '../shared/loadingManager.js'
import { lockApplication } from '../shared/loaderLock.js'
import { globeMarkup } from '../shared/globe.js'
export { loadingManager }
let dialog, release, showTimer, hideTimer, active = false
function hide() {
 clearTimeout(showTimer);clearTimeout(hideTimer)
 if(dialog){if(dialog.open)dialog.close();dialog.remove();dialog=null}
 release?.();release=null
}
function show() {
 if(!loadingManager.getSnapshot().count)return
 if(!dialog){
  dialog=document.createElement('dialog');dialog.className='global-loader-dialog';dialog.setAttribute('aria-label','Loading workspace')
  dialog.innerHTML=`<div class="global-loader-overlay" role="status" aria-live="polite"><div class="global-loader-content">${globeMarkup}<strong>STARAVIA</strong><p>Preparing your workspace…</p><div class="global-loader-progress is-indeterminate" role="progressbar" aria-label="Loading"><span></span></div></div></div>`
  dialog.addEventListener('cancel',event=>event.preventDefault());document.body.append(dialog);dialog.showModal()
 }
 dialog.firstElementChild.classList.remove('is-leaving')
}
loadingManager.subscribe(()=>{
 const snapshot=loadingManager.getSnapshot()
 if(snapshot.count){
  clearTimeout(hideTimer)
  if(!active){active=true;release ||= lockApplication(document.querySelector('.workspace')||document.querySelector('.login-layout'),dialog);showTimer=setTimeout(show,180)}
  if(dialog)show()
 }else{
  active=false;clearTimeout(showTimer)
  if(dialog){dialog.firstElementChild.classList.add('is-leaving');hideTimer=setTimeout(hide,220)}else hide()
 }
 if(snapshot.timeout && !document.getElementById('workspace-timeout')){
  const note=document.createElement('p');note.id='workspace-timeout';note.className='notice error';note.setAttribute('role','alert');note.textContent='The operation timed out. Check the record before submitting again; no automatic retry was made.';(document.querySelector('main')||document.body).prepend(note)
 }
})
// Native Django forms keep their original CSRF/session POST and navigation.
// JS-managed forms preventDefault and acquire their token in api() instead.
document.addEventListener('submit',event=>{
 queueMicrotask(()=>{
  if(event.defaultPrevented||event.target.matches('[data-no-blocking-loader]'))return
  loadingManager.start({label:'workspace-form',timeoutMs:45000})
 })
})
window.addEventListener('pagehide',()=>{loadingManager.clear();hide()})
window.addEventListener('pageshow',event=>{if(event.persisted){loadingManager.clear();hide()}})

// Ordinary server-rendered workspace navigation has no React Router lifecycle.
document.addEventListener('click',event=>{
 const anchor=event.target.closest?.('a[href]')
 if(!anchor||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||anchor.target||anchor.hasAttribute('download'))return
 const destination=new URL(anchor.href,location.href)
 if(destination.origin!==location.origin||!['/','/office/','/office/login/'].includes(destination.pathname)||(destination.pathname===location.pathname&&destination.search===location.search))return
 queueMicrotask(()=>{if(!event.defaultPrevented)loadingManager.start({label:'workspace-navigation',timeoutMs:45000})})
})
