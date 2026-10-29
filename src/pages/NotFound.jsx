import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

// 404: маршрут «*» (состояние 6 макета)
export default function NotFound() {
  useDocumentTitle('Страница не найдена')
  return (
    <div className="container section">
      <div className="notfound">
        <p className="notfound__code" aria-hidden="true">404</p>
        <h1 className="notfound__title">Такой страницы нет</h1>
        <p className="notfound__text">Ссылка могла устареть. Вернитесь на главную или откройте каталог</p>
        <div className="state__actions">
          <Link to="/" className="btn btn--primary">На главную</Link>
          <Link to="/catalog" className="btn btn--outline">В каталог</Link>
        </div>
      </div>
    </div>
  )
}
