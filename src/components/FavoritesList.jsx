import { Link } from 'react-router-dom'
import ProductGrid from './ProductGrid'
import { EmptyState, ErrorState } from './States'
import { catalogApi } from '../api'
import { useFavorites } from '../context/FavoritesContext'
import { useAsync } from '../hooks/useAsync'

// Список избранных товаров. Используется на странице /favorites и во вкладке кабинета.
export default function FavoritesList() {
  const { ids } = useFavorites()
  const key = ids.join(',')
  const { data, loading, error, reload } = useAsync(() => (ids.length ? catalogApi.getProductsByIds(ids) : Promise.resolve([])), [key])

  if (!ids.length) {
    return (
      <EmptyState icon="heart" title="В избранном пока пусто" text="Нажмите на сердечко у товара, чтобы сохранить его здесь">
        <Link to="/catalog" className="btn btn--primary">Перейти в каталог</Link>
      </EmptyState>
    )
  }
  if (error) return <ErrorState error={error} onRetry={reload} />
  const items = (data || []).filter((p) => p.published).sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))
  return <ProductGrid items={items} loading={loading} skeletons={Math.min(ids.length, 4)} columns={4} />
}
