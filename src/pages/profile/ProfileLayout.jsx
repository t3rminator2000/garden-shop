import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import Breadcrumbs from '../../components/Breadcrumbs'
import Icon from '../../components/Icon'
import { useAuth } from '../../context/AuthContext'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'

// Личный кабинет: вкладки «Мои заказы», «Избранное», «Просмотренные товары», «Данные и адреса», «Выйти»
export default function ProfileLayout() {
  useDocumentTitle('Личный кабинет')
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="container section section--tight">
      <Breadcrumbs items={[{ label: 'Главная', to: '/' }, { label: 'Личный кабинет' }]} />
      <div className="catalog-head">
        <h1 className="page-title">Личный кабинет</h1>
        <span className="catalog-head__count">{user?.name}</span>
      </div>
      <nav className="tabs" aria-label="Разделы личного кабинета">
        <NavLink to="/profile/orders" className="tabs__link">Мои заказы</NavLink>
        <NavLink to="/profile/favorites" className="tabs__link">Избранное</NavLink>
        <NavLink to="/profile/viewed" className="tabs__link">Просмотренные товары</NavLink>
        <NavLink to="/profile/data" className="tabs__link">Данные и адреса</NavLink>
        {isAdmin && <Link to="/admin/products" className="tabs__link tabs__link--admin">Админ-панель</Link>}
        <button
          type="button"
          className="tabs__link tabs__link--exit"
          onClick={() => {
            logout()
            navigate('/')
          }}
        >
          <Icon name="logout" size={16} /> Выйти
        </button>
      </nav>
      <Outlet />
    </div>
  )
}
