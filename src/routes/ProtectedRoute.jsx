import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Закрытый маршрут: гость уходит на /login и после входа возвращается назад.
// role="admin" дополнительно проверяет роль: покупателя уводим на экран «Нет доступа».
export default function ProtectedRoute({ role }) {
  const { isAuth, isAdmin } = useAuth()
  const location = useLocation()
  if (!isAuth) return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
  if (role === 'admin' && !isAdmin) return <Navigate to="/forbidden" replace />
  return <Outlet />
}
