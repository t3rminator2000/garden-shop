import { useEffect, useState } from 'react'
import { Checkbox, TextField } from './Fields'

// Фильтры: цена, наличие, бренд, рейтинг (и категория на странице поиска).
// Значения применяются по кнопке «Применить», как в макете.
export default function FiltersPanel({ facets, params, onApply, onReset, showCategories = false }) {
  const fromParams = () => ({
    min: params.minPrice ?? '',
    max: params.maxPrice ?? '',
    stock: params.inStock,
    brands: params.brands,
    cats: params.categories,
    rating: params.minRating !== null && params.minRating >= 4,
  })
  const [draft, setDraft] = useState(fromParams)
  const [error, setError] = useState('')
  const key = JSON.stringify([params.minPrice, params.maxPrice, params.inStock, params.brands, params.categories, params.minRating])
  useEffect(() => {
    setDraft(fromParams())
    setError('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const toggleIn = (list, v) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])
  const digits = (v) => v.replace(/\D/g, '').slice(0, 7)

  const submit = (e) => {
    e.preventDefault()
    const min = draft.min === '' ? null : Number(draft.min)
    const max = draft.max === '' ? null : Number(draft.max)
    if (min !== null && max !== null && min > max) {
      setError('Минимальная цена больше максимальной')
      return
    }
    setError('')
    onApply({ min, max, stock: draft.stock, brand: draft.brands, cat: draft.cats, rating: draft.rating ? 4 : null })
  }

  return (
    <form className="filters" onSubmit={submit} aria-label="Фильтры">
      <h2 className="filters__title">Фильтры</h2>

      <fieldset className="filters__group">
        <legend>Цена, ₽</legend>
        <div className="filters__range">
          <TextField label="от" value={draft.min} inputMode="numeric" placeholder={facets?.prices?.min ? `от ${facets.prices.min}` : 'от'} onChange={(e) => setDraft({ ...draft, min: digits(e.target.value) })} />
          <TextField label="до" value={draft.max} inputMode="numeric" placeholder={facets?.prices?.max ? `до ${facets.prices.max}` : 'до'} onChange={(e) => setDraft({ ...draft, max: digits(e.target.value) })} />
        </div>
        {error && <p className="field__error" role="alert">{error}</p>}
      </fieldset>

      <Checkbox label="В наличии" checked={draft.stock} onChange={(e) => setDraft({ ...draft, stock: e.target.checked })} />

      {showCategories && facets?.categories?.length > 0 && (
        <fieldset className="filters__group">
          <legend>Категория</legend>
          {facets.categories.map((c) => (
            <Checkbox key={c.slug} label={`${c.title} (${c.count})`} checked={draft.cats.includes(c.slug)} onChange={() => setDraft({ ...draft, cats: toggleIn(draft.cats, c.slug) })} />
          ))}
        </fieldset>
      )}

      {facets?.brands?.length > 0 && (
        <fieldset className="filters__group">
          <legend>Бренд</legend>
          {facets.brands.map((b) => (
            <Checkbox key={b} label={b} checked={draft.brands.includes(b)} onChange={() => setDraft({ ...draft, brands: toggleIn(draft.brands, b) })} />
          ))}
        </fieldset>
      )}

      <fieldset className="filters__group">
        <legend>Рейтинг</legend>
        <Checkbox label="4 и выше" checked={draft.rating} onChange={(e) => setDraft({ ...draft, rating: e.target.checked })} />
      </fieldset>

      <div className="filters__actions">
        <button type="submit" className="btn btn--primary btn--block">Применить</button>
        <button type="button" className="btn btn--ghost btn--block" onClick={onReset}>Сбросить фильтры</button>
      </div>
    </form>
  )
}
