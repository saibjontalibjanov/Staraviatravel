// Also recover if the main module cannot download/initialize at all.
(() => {
  function recover() {
    const splash = document.getElementById('boot-splash')
    if (!splash) return
    document.documentElement.classList.remove('site-loading')
    splash.replaceChildren(document.createTextNode('Sahifa yuklanmadi. / Не удалось загрузить страницу. / Unable to load the page.'))
    const retry = document.createElement('a'); retry.href = window.location.href; retry.textContent = 'Qayta urinish / Повторить / Retry'; splash.append(retry)
  }
  const timer = setTimeout(recover,20000)
  window.addEventListener('staravia-ready',() => clearTimeout(timer),{ once: true })
})()
