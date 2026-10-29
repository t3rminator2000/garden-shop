import { Link } from 'react-router-dom'
import ProductGrid from '../../components/ProductGrid'
import { EmptyState, ErrorState } from '../../components/States'
import { catalogApi } from '../../api'
import { useAsync } from '../../hooks/useAsync'
import { getViewedIds } from '../../hooks/useViewed'

export default function ProfileViewed() {
  const ids = getViewedIds()
  const { data, loading, error, reload } = useAsync(() => (ids.length ? catalogApi.getProductsByIds(ids) : Promise.resolve([])), [ids.join(',')])
  const items = (data || []).filter((p) => p.published).sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))

  return (
    <section aria-labelledby="viewed-title">
      <h2 id="viewed-title" className="section__title section__title--sm">Просмотренные товары</h2>
      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !ids.length ? (
        <EmptyState icon="eye" title="Вы пока ничего не смотрели" text="Товары, которые вы открывали, появятся здесь">
          <Link to="/catalog" className="btn btn--primary">Перейти в каталог</Link>
        </EmptyState>
      ) : (
        <ProductGrid items={items} loading={loading} skeletons={Math.min(ids.length, 4)} columns={4} />
      )}
    </section>
  )
}
