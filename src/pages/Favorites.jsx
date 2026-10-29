import { Link } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import FavoritesList from '../components/FavoritesList'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function Favorites() {
  useDocumentTitle('Избранное')
  return (
    <div className="container section section--tight">
      <Breadcrumbs items={[{ label: 'Главная', to: '/' }, { label: 'Избранное' }]} />
      <h1 className="page-title">Избранное</h1>
      <FavoritesList />
      <p className="muted-note">Избранное хранится в этом браузере. <Link to="/login">Войдите</Link>, чтобы пользоваться личным кабинетом.</p>
    </div>
  )
}
