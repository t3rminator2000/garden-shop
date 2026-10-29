import { useState } from 'react'
import { Link } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import Icon from '../components/Icon'
import ProductImage from '../components/ProductImage'
import Rating from '../components/Rating'
import { Checkbox } from '../components/Fields'
import { EmptyState, ErrorState, Spinner } from '../components/States'
import { catalogApi } from '../api'
import { CATEGORIES } from '../constants'
import { useCart } from '../context/CartContext'
import { useCompare } from '../context/CompareContext'
import { useUI } from '../context/UIContext'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { formatPrice, formatRating } from '../utils/format'

const categoryTitle = (slug) => CATEGORIES.find((c) => c.slug === slug)?.title || '-'

// Собирает строки таблицы: сначала общие поля, потом характеристики из specs
function buildRows(items) {
  const rows = [
    { label: 'Цена', values: items.map((p) => formatPrice(p.finalPrice)) },
    { label: 'Рейтинг', values: items.map((p) => `${formatRating(p.rating)} из 5`) },
    { label: 'Наличие', values: items.map((p) => (p.inStock ? `В наличии: ${p.stock} шт.` : 'Нет в наличии')) },
    { label: 'Категория', values: items.map((p) => categoryTitle(p.category)) },
    { label: 'Бренд', values: items.map((p) => p.brand || '-') },
  ]
  const specNames = []
  for (const p of items) {
    for (const [name] of p.specs || []) if (!specNames.includes(name)) specNames.push(name)
  }
  for (const name of specNames) {
    rows.push({ label: name, values: items.map((p) => (p.specs || []).find(([n]) => n === name)?.[1] || '-') })
  }
  return rows.map((r) => ({ ...r, same: new Set(r.values).size === 1 }))
}

// Сравнение товаров: таблица характеристик с подсветкой различий
export default function Compare() {
  useDocumentTitle('Сравнение товаров')
  const { ids, remove, clear, count, max } = useCompare()
  const { add } = useCart()
  const { showToast } = useUI()
  const [onlyDiff, setOnlyDiff] = useState(false)

  const key = ids.join(',')
  const state = useAsync(async () => {
    if (!ids.length) return []
    const list = await catalogApi.getProductsByIds(ids)
    return ids.map((id) => list.find((p) => p.id === id)).filter(Boolean)
  }, [key])

  const items = state.data || []
  const rows = buildRows(items)
  const shown = onlyDiff ? rows.filter((r) => !r.same) : rows
  const crumbs = [{ label: 'Главная', to: '/' }, { label: 'Сравнение' }]

  const handleAdd = (product) => {
    const res = add(product, 1)
    if (!res.ok) return showToast('Товара нет в наличии', 'error')
    showToast(`«${product.title}» добавлен в корзину`, 'success')
  }

  return (
    <div className="container section section--tight">
      <Breadcrumbs items={crumbs} />
      <div className="catalog-head">
        <h1 className="page-title">Сравнение товаров</h1>
        {count > 0 && <span className="catalog-head__count">{count} из {max}</span>}
      </div>

      {state.error ? (
        <ErrorState error={state.error} title="Не удалось загрузить товары" onRetry={state.reload} />
      ) : state.loading ? (
        <div style={{ textAlign: 'center' }}><Spinner /></div>
      ) : !items.length ? (
        <EmptyState icon="compare" title="Сравнивать пока нечего" text="Добавьте товары кнопкой сравнения в карточке или на странице товара">
          <Link to="/catalog" className="btn btn--primary">Перейти в каталог</Link>
        </EmptyState>
      ) : (
        <>
          <div className="compare__bar">
            <Checkbox label="Показать только различия" checked={onlyDiff} onChange={(e) => setOnlyDiff(e.target.checked)} />
            <button type="button" className="btn btn--ghost" onClick={clear}>Очистить список</button>
          </div>

          <div className="table-wrap compare">
            <table className="compare__table">
              <caption className="sr-only">Характеристики выбранных товаров</caption>
              <thead>
                <tr>
                  <th scope="col" className="compare__corner">Характеристика</th>
                  {items.map((p) => (
                    <th scope="col" key={p.id} className="compare__head">
                      <button type="button" className="icon-btn compare__del" onClick={() => remove(p.id)} aria-label={`Убрать «${p.title}» из сравнения`}>
                        <Icon name="close" size={16} />
                      </button>
                      <Link to={`/product/${p.id}`} className="compare__thumb" tabIndex={-1} aria-hidden="true">
                        <ProductImage product={p} label="Фото" iconSize={22} />
                      </Link>
                      <Link to={`/product/${p.id}`} className="compare__name">{p.title}</Link>
                      <Rating value={p.rating} count={p.reviewsCount} />
                      <button type="button" className="btn btn--primary btn--block" onClick={() => handleAdd(p)} disabled={!p.inStock}>
                        {p.inStock ? 'В корзину' : 'Нет в наличии'}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.label} className={r.same ? '' : 'is-diff'}>
                    <th scope="row">{r.label}</th>
                    {r.values.map((v, i) => (
                      <td key={items[i].id}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {onlyDiff && !shown.length && <p className="muted-note">У этих товаров все характеристики совпадают.</p>}
          <p className="muted-note">Строки с разными значениями отмечены цветом слева.</p>
        </>
      )}
    </div>
  )
}
