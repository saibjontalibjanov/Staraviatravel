import { Component } from 'react'
import { loadingManager } from '../shared/loadingManager'
export default class AppErrorBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { loadingManager.clear(); document.documentElement.classList.remove('site-loading') }
  render() {
    if (this.state.failed) return <main className="p-8 text-center" role="alert"><h1>StarAviaTravel</h1><p>Sahifani yuklab bo‘lmadi. / Не удалось загрузить страницу. / Unable to load this page.</p><a className="inline-block mt-5 underline" href="/">Qayta ochish / Открыть заново / Reload</a></main>
    return this.props.children
  }
}
