import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import Toasts from '../components/Toasts'
import { SHOP_NAME } from '../constants'
import { useAuth } from '../context/AuthContext'

// Каркас админ-панели: тёмная полоса сверху, меню «Товары / Заказы» слева
export default function AdminLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo({ top: 0, behavior: 'instant' }), [pathname])

  return (
    <div className="admin">
      <header className="admin__bar">
        <div className="admin__bar-inner">
          <Link to="/admin/products" className="admin__brand">{SHOP_NAME} · Админ-панель</Link>
          <div className="admin__user">
            <Link to="/" className="admin__site-link">На сайт</Link>
            <span>Администратор</span>
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                logout()
                navigate('/')
              }}
            >
              <Icon name="logout" size={16} /> Выйти
            </button>
          </div>
        </div>
      </header>
      <div className="admin__layout">
        <nav className="admin__menu" aria-label="Разделы админ-панели">
          <NavLink to="/admin/products">Товары</NavLink>
          <NavLink to="/admin/orders">Заказы</NavLink>
        </nav>
        <main className="admin__main" id="main">
          <Outlet />
        </main>
      </div>
      <Toasts />
    </div>
  )
}
