import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Закрытый маршрут: гость уходит на страницу авторизации и после входа
// возвращается назад. to задаёт, какая форма открывается первой: /login для
// кабинета и админки, /register для оформления заказа, куда идут новые покупатели.
// role="admin" дополнительно проверяет роль: покупателя уводим на экран «Нет доступа».
export default function ProtectedRoute({ role, to = '/login' }) {
  const { isAuth, isAdmin } = useAuth()
  const location = useLocation()
  if (!isAuth) return <Navigate to={to} replace state={{ from: `${location.pathname}${location.search}` }} />
  if (role === 'admin' && !isAdmin) return <Navigate to="/forbidden" replace />
  return <Outlet />
}
