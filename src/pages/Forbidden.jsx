import { Link } from 'react-router-dom'
import { EmptyState } from '../components/States'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

// Экран для покупателя, который открыл адрес админ-панели
export default function Forbidden() {
  useDocumentTitle('Нет доступа')
  return (
    <div className="container section">
      <EmptyState
        icon="alert"
        title="Нет доступа"
        text="Этот раздел доступен только администратору магазина"
      >
        <Link to="/" className="btn btn--primary">На главную</Link>
        <Link to="/profile" className="btn btn--outline">В личный кабинет</Link>
      </EmptyState>
    </div>
  )
}
