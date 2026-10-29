import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ActiveFilters from '../components/ActiveFilters'
import Breadcrumbs from '../components/Breadcrumbs'
import FiltersPanel from '../components/FiltersPanel'
import Icon from '../components/Icon'
import Pagination from '../components/Pagination'
import ProductGrid from '../components/ProductGrid'
import { SelectField } from '../components/Fields'
import { EmptyState, ErrorState } from '../components/States'
import { catalogApi } from '../api'
import { SORT_OPTIONS } from '../constants'
import { clearFilters, parseParams, withParams } from '../hooks/useCatalogParams'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { goodsLabel } from '../utils/format'

// Страница результатов поиска (состояние 2 макета «Поиск и фильтрация»)
export default function SearchPage() {
  const [sp, setSp] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const params = useMemo(() => parseParams(sp), [sp])
  useDocumentTitle(params.q ? `Поиск: ${params.q}` : 'Поиск')

  const { data, loading, error, reload } = useAsync(
    () => (params.q ? catalogApi.queryProducts(params) : Promise.resolve({ items: [], total: 0, page: 1, pages: 1, facets: { brands: [], categories: [], prices: { min: 0, max: 0 } } })),
    [sp.toString()],
  )
  const update = (changes) => setSp(withParams(sp, changes))
  const items = data?.items || []

  return (
    <div className="container section section--tight">
      <Breadcrumbs items={[{ label: 'Главная', to: '/' }, { label: 'Поиск' }]} />
      <div className="catalog-head">
        <h1 className="page-title">{params.q ? `Результаты по запросу «${params.q}»` : 'Поиск'}</h1>
        {data && params.q && <span className="catalog-head__count">{goodsLabel(data.total)}</span>}
      </div>

      {!params.q ? (
        <EmptyState icon="search" title="Введите запрос" text="Название товара, артикул или бренд">
          <Link to="/catalog" className="btn btn--primary">Перейти в каталог</Link>
        </EmptyState>
      ) : (
        <>
          <button type="button" className="btn btn--outline catalog__toggle" aria-expanded={filtersOpen} aria-controls="search-aside" onClick={() => setFiltersOpen((o) => !o)}>
            <Icon name="filter" size={18} /> Фильтры
          </button>
          <div className="catalog">
            <aside className={`catalog__aside${filtersOpen ? ' is-open' : ''}`} id="search-aside">
              <FiltersPanel
                facets={data?.facets}
                params={params}
                showCategories
                onApply={(f) => {
                  update(f)
                  setFiltersOpen(false)
                }}
                onReset={() => setSp(clearFilters(sp))}
              />
            </aside>
            <div className="catalog__main">
              <div className="catalog__bar">
                <ActiveFilters params={params} categories={data?.facets?.categories || []} onRemove={update} onResetAll={() => setSp(clearFilters(sp))} />
                <SelectField
                  className="sort"
                  label="Сортировка:"
                  value={params.sort}
                  onChange={(e) => update({ sort: e.target.value === 'popular' ? null : e.target.value })}
                  options={SORT_OPTIONS}
                />
              </div>
              {error ? (
                <ErrorState error={error} onRetry={reload} />
              ) : !loading && data && data.total === 0 ? (
                <EmptyState icon="search" title={`По запросу «${params.q}» ничего не найдено`} text="Проверьте написание или попробуйте изменить фильтры">
                  <button type="button" className="btn btn--primary" onClick={() => setSp(clearFilters(sp))}>Сбросить фильтры</button>
                  <Link to="/catalog" className="btn btn--outline">Перейти в каталог</Link>
                </EmptyState>
              ) : (
                <>
                  <ProductGrid items={items} loading={loading} skeletons={6} />
                  {data && <Pagination page={data.page} pages={data.pages} onChange={(p) => { update({ page: p === 1 ? null : p }); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
