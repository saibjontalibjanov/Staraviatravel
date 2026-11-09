import Checkout from './pages/Checkout'
import PaymentResult from './pages/PaymentResult'
import WebsiteLoader from './components/WebsiteLoader'
import VisitorTracker from './components/VisitorTracker'
import CookieBanner from './components/CookieBanner'
import RouteScroll from './components/RouteScroll'
import NotFound from './pages/NotFound'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import SearchResults from './pages/SearchResults'
import BusinessClass from './pages/BusinessClass'
import AboutUs from './pages/AboutUs'

function App() {
  return (
    <WebsiteLoader>
    <RouteScroll />
    <VisitorTracker />
    <CookieBanner />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/search-results" element={<SearchResults />} />
      <Route path="/business-class" element={<BusinessClass />} />
      <Route path='/about-us' element={<AboutUs />} />
      {['success','failed','pending','cancelled'].map(state => <Route key={state} path={`/payment/${state}`} element={<PaymentResult />} />)}
      <Route path="/checkout/:token" element={<Checkout />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </WebsiteLoader>
  )
}

export default App
