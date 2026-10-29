import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import CartDrawer from '../components/CartDrawer'
import ScrollTop from '../components/ScrollTop'
import Toasts from '../components/Toasts'

// Общий каркас сайта: Header + содержимое страницы (Outlet) + Footer
export default function Layout() {
  const { pathname } = useLocation()
  const mainRef = useRef(null)
  const first = useRef(true)

  // При переходе между страницами: сразу наверх и фокус на содержимое (для клавиатуры и скринридеров).
  // Здесь прокрутка мгновенная: плавная нужна внутри страницы, а не при смене адреса.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    if (first.current) {
      first.current = false
      return
    }
    mainRef.current?.focus({ preventScroll: true })
  }, [pathname])

  return (
    <div className="app">
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); mainRef.current?.focus() }}>Перейти к содержимому</a>
      <Header />
      <main id="main" className="main" ref={mainRef} tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
      <ScrollTop />
      <CartDrawer />
      <Toasts />
    </div>
  )
}
