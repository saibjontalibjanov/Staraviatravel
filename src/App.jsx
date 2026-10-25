import Checkout from './pages/Checkout'
import RouteScroll from './components/RouteScroll'
import NotFound from './pages/NotFound'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import SearchResults from './pages/SearchResults'
import BusinessClass from './pages/BusinessClass'
import AboutUs from './pages/AboutUs'

function App() {
  return (
    <>
    <RouteScroll />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/search-results" element={<SearchResults />} />
      <Route path="/business-class" element={<BusinessClass />} />
      <Route path='/about-us' element={<AboutUs />} />
      <Route path="/checkout/:token" element={<Checkout />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </>
  )
}

export default App
