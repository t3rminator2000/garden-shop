import { useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Icon from './Icon'
import ProductImage from './ProductImage'
import { catalogApi } from '../api'
import { POPULAR_QUERIES } from '../constants'
import { useDebounce } from '../hooks/useDebounce'
import { formatPrice } from '../utils/format'

// Поиск в шапке. Состояние 1 из макета: под строкой появляются подсказки,
// популярные запросы и два товара. Enter открывает страницу результатов.
export default function SearchBox() {
  const navigate = useNavigate()
  const location = useLocation()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState({ suggestions: [], products: [], total: 0 })
  const [error, setError] = useState(false)
  const wrapRef = useRef(null)
  const panelId = useId()
  const debounced = useDebounce(q.trim(), 200)

  // На странице поиска строка показывает текущий запрос
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    setQ(location.pathname === '/search' ? params.get('q') || '' : '')
    setOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    if (!debounced) {
      setResult({ suggestions: [], products: [], total: 0 })
      return undefined
    }
    let cancelled = false
    catalogApi
      .suggest(debounced)
      .then((r) => {
        if (!cancelled) {
          setResult(r)
          setError(false)
        }
      })
      .catch(() => !cancelled && setError(true))
    return () => {
      cancelled = true
    }
  }, [debounced])

  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => wrapRef.current && !wrapRef.current.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const go = (text) => {
    const value = text.trim()
    if (!value) return
    setOpen(false)
    navigate(`/search?q=${encodeURIComponent(value)}`)
  }

  return (
    <div className="search" ref={wrapRef}>
      <form
        role="search"
        className="search__form"
        onSubmit={(e) => {
          e.preventDefault()
          go(q)
        }}
      >
        <Icon name="search" size={18} className="search__icon" />
        <input
          className="search__input"
          type="search"
          name="q"
          value={q}
          placeholder="Поиск по магазину"
          aria-label="Поиск по магазину"
          aria-expanded={open}
          aria-controls={panelId}
          autoComplete="off"
          maxLength={80}
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
        />
        {q && (
          <button type="button" className="search__clear" onClick={() => { setQ(''); setOpen(true) }} aria-label="Очистить поиск">
            <Icon name="close" size={16} />
          </button>
        )}
      </form>

      {open && (
        <div className="search__panel" id={panelId}>
          {debounced && result.suggestions.length > 0 && (
            <section>
              <h2 className="search__title">Подсказки</h2>
              <ul className="search__list">
                {result.suggestions.map((s) => (
                  <li key={s}>
                    <button type="button" className="search__suggest" onClick={() => go(s)}>
                      <Icon name="search" size={14} />
                      <HighlightMatch text={s} query={debounced} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="search__title">Популярные запросы</h2>
            <div className="search__chips">
              {POPULAR_QUERIES.map((p) => (
                <button type="button" key={p} className="chip" onClick={() => go(p)}>{p}</button>
              ))}
            </div>
          </section>

          {debounced && result.products.length > 0 && (
            <section>
              <h2 className="search__title">Товары</h2>
              <ul className="search__products">
                {result.products.map((p) => (
                  <li key={p.id}>
                    <Link to={`/product/${p.id}`} className="search__product" onClick={() => setOpen(false)}>
                      <ProductImage product={p} label="Фото" className="search__thumb" iconSize={18} />
                      <span className="search__product-title">{p.title}</span>
                      <span className="search__product-price">{formatPrice(p.finalPrice)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {debounced && !result.products.length && !error && <p className="search__empty">По запросу «{debounced}» ничего не найдено</p>}
          {error && <p className="search__empty">Не удалось загрузить подсказки</p>}

          {debounced && result.total > 0 && (
            <button type="button" className="btn btn--outline btn--block" onClick={() => go(debounced)}>
              Показать все результаты ({result.total})
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Выделяет введённую часть слова в подсказке
function HighlightMatch({ text, query }) {
  const i = text.toLowerCase().indexOf(query.toLowerCase())
  if (i < 0) return <span>{text}</span>
  return (
    <span>
      {text.slice(0, i)}
      <strong>{text.slice(i, i + query.length)}</strong>
      {text.slice(i + query.length)}
    </span>
  )
}
