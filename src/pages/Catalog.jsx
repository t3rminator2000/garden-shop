import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import ActiveFilters from '../components/ActiveFilters'
import Breadcrumbs from '../components/Breadcrumbs'
import FiltersPanel from '../components/FiltersPanel'
import Icon from '../components/Icon'
import Pagination from '../components/Pagination'
import ProductGrid from '../components/ProductGrid'
import { SelectField } from '../components/Fields'
import { EmptyState, ErrorState } from '../components/States'
import NotFound from './NotFound'
import { catalogApi } from '../api'
import { CATEGORIES, SORT_OPTIONS, getCategory, getSub } from '../constants'
import { clearFilters, parseParams, withParams } from '../hooks/useCatalogParams'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { goodsLabel } from '../utils/format'

// Каталог: /catalog и /catalog/:category (фильтры, сортировка и страница хранятся в адресе)
export default function Catalog() {
  const { category } = useParams()
  const [sp, setSp] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const cat = category ? getCategory(category) : null
  const params = useMemo(() => parseParams(sp), [sp])
  const sub = cat ? getSub(cat.slug, params.sub) : null

  let title = 'Каталог'
  if (sub) title = sub.title
  else if (cat) title = cat.title
  else if (params.sale) title = 'Акции'
  else if (params.isNew) title = 'Новинки'
  else if (params.isHit) title = 'Хит продаж'
  useDocumentTitle(cat || !category ? title : 'Страница не найдена')

  const { data, loading, error, reload } = useAsync(
    () => (category && !cat ? Promise.resolve(null) : catalogApi.queryProducts({ ...params, category: cat?.slug, sub: sub?.slug })),
    [category, sp.toString()],
  )

  if (category && !cat) return <NotFound />

  const update = (changes) => setSp(withParams(sp, changes))
  const crumbs = [{ label: 'Главная', to: '/' }, { label: 'Каталог', to: cat ? '/catalog' : undefined }]
  if (cat) crumbs.push({ label: cat.title, to: sub ? `/catalog/${cat.slug}` : undefined })
  if (sub) crumbs.push({ label: sub.title })
  if (!cat && title !== 'Каталог') crumbs[1] = { label: 'Каталог', to: '/catalog' }, crumbs.push({ label: title })

  const items = data?.items || []
  const filtered = Boolean(params.letter || params.minPrice !== null || params.maxPrice !== null || params.inStock || params.brands.length || params.minRating)

  return (
    <div className="container section section--tight">
      <Breadcrumbs items={crumbs} />
      <div className="catalog-head">
        <h1 className="page-title">{title}</h1>
        {data && <span className="catalog-head__count">{goodsLabel(data.total)}</span>}
      </div>

      <button type="button" className="btn btn--outline catalog__toggle" aria-expanded={filtersOpen} aria-controls="catalog-aside" onClick={() => setFiltersOpen((o) => !o)}>
        <Icon name="filter" size={18} /> Фильтры и категории
      </button>

      <div className="catalog">
        <aside className={`catalog__aside${filtersOpen ? ' is-open' : ''}`} id="catalog-aside">
          <nav aria-label="Категории" className="side-block">
            <h2 className="side-block__title">Категории</h2>
            <ul className="tree">
              {CATEGORIES.map((c) => {
                const active = c.slug === cat?.slug
                return (
                  <li key={c.slug}>
                    <Link to={`/catalog/${c.slug}`} className={`tree__link${active && !sub ? ' is-active' : ''}`} aria-current={active && !sub ? 'page' : undefined}>{c.title}</Link>
                    {active && (
                      <ul className="tree__sub">
                        {c.subs.map((s) => (
                          <li key={s.slug}>
                            <Link to={`/catalog/${c.slug}?sub=${s.slug}`} className={`tree__link${sub?.slug === s.slug ? ' is-active' : ''}`} aria-current={sub?.slug === s.slug ? 'page' : undefined}>{s.title}</Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          </nav>

          {data?.facets?.letters?.length > 1 && (
            <section className="side-block" aria-labelledby="alpha-title">
              <h2 id="alpha-title" className="side-block__title">Культуры по алфавиту</h2>
              <div className="alpha">
                {data.facets.letters.map((l) => (
                  <button key={l} type="button" className={`alpha__btn${params.letter === l ? ' is-active' : ''}`} aria-pressed={params.letter === l} onClick={() => update({ letter: params.letter === l ? null : l })}>
                    {l}
                  </button>
                ))}
              </div>
            </section>
          )}

          <FiltersPanel
            facets={data?.facets}
            params={params}
            onApply={(f) => {
              update(f)
              setFiltersOpen(false)
            }}
            onReset={() => {
              const next = clearFilters(sp)
              next.delete('letter')
              setSp(next)
            }}
          />
        </aside>

        <div className="catalog__main">
          <div className="catalog__bar">
            <span className="catalog__shown" aria-live="polite">{data ? `Показано ${items.length} из ${data.total}` : ''}</span>
            <SelectField
              className="sort"
              label="Сортировка:"
              value={params.sort}
              onChange={(e) => update({ sort: e.target.value === 'popular' ? null : e.target.value })}
              options={SORT_OPTIONS}
            />
          </div>

          <ActiveFilters params={params} onRemove={update} onResetAll={() => setSp(clearFilters(sp))} categories={CATEGORIES} />

          {error ? (
            <ErrorState error={error} onRetry={reload} />
          ) : !loading && data && data.total === 0 ? (
            <EmptyState icon="search" title="Товары не найдены" text="Проверьте фильтры или откройте весь каталог">
              {filtered && <button type="button" className="btn btn--primary" onClick={() => { const n = clearFilters(sp); n.delete('letter'); setSp(n) }}>Сбросить фильтры</button>}
              <Link to="/catalog" className="btn btn--outline">Перейти в каталог</Link>
            </EmptyState>
          ) : (
            <>
              <ProductGrid items={items} loading={loading} />
              {data && <Pagination page={data.page} pages={data.pages} onChange={(p) => { update({ page: p === 1 ? null : p }); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
