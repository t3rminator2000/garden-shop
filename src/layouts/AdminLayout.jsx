import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import Modal from '../components/Modal'
import Toasts from '../components/Toasts'
import { ApiError, storeApi } from '../api'
import { SHOP_NAME } from '../constants'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'

// Каркас админ-панели: тёмная полоса сверху, меню разделов слева
export default function AdminLayout() {
  const { logout } = useAuth()
  const { showToast } = useUI()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [askReset, setAskReset] = useState(false)
  const [resetting, setResetting] = useState(false)
  useEffect(() => window.scrollTo({ top: 0, behavior: 'instant' }), [pathname])

  // Возврат данных к исходному состоянию из файлов (методичка, п. 2.4.4).
  // Страница перезагружается, чтобы открытые списки показали новые данные.
  const resetData = async () => {
    setResetting(true)
    try {
      const counts = await storeApi.resetData()
      showToast(`Данные восстановлены: товаров ${counts.products}, заказов ${counts.orders}, клиентов ${counts.clients}`, 'success')
      setAskReset(false)
      setTimeout(() => window.location.reload(), 900)
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Не удалось восстановить данные', 'error')
      setResetting(false)
    }
  }

  return (
    <div className="admin">
      <header className="admin__bar">
        <div className="admin__bar-inner">
          <Link to="/admin/products" className="admin__brand">{SHOP_NAME} · Админ-панель</Link>
          <div className="admin__user">
            <button type="button" className="link-btn" onClick={() => setAskReset(true)}>
              <Icon name="refresh" size={16} /> Сбросить данные
            </button>
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
          <NavLink to="/admin/clients">Клиенты</NavLink>
        </nav>
        <main className="admin__main" id="main">
          <Outlet />
        </main>
      </div>

      <Modal open={askReset} onClose={() => (resetting ? null : setAskReset(false))} title="Вернуть исходные данные?" size="sm">
        <p>Товары, заказы и клиенты вернутся к состоянию из файлов в папке data. Все правки, новые заказы, отзывы и вопросы пропадут.</p>
        <p className="muted-note">Корзина, избранное и учётные записи покупателей не затрагиваются.</p>
        <div className="modal__actions">
          <button type="button" className="btn btn--outline" onClick={() => setAskReset(false)} disabled={resetting}>Отмена</button>
          <button type="button" className="btn btn--danger" onClick={resetData} disabled={resetting}>{resetting ? 'Восстанавливаем…' : 'Вернуть'}</button>
        </div>
      </Modal>
      <Toasts />
    </div>
  )
}
