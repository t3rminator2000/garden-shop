import Icon from './Icon'
import { hasFilters } from '../hooks/useCatalogParams'

// Строка «Выбрано: Цена: 20-200 ₽ ✕  В наличии ✕  Сбросить все»
export default function ActiveFilters({ params, categories = [], onRemove, onResetAll }) {
  if (!hasFilters(params)) return null
  const chips = []
  if (params.minPrice !== null || params.maxPrice !== null) {
    const a = params.minPrice !== null ? params.minPrice : ''
    const b = params.maxPrice !== null ? params.maxPrice : ''
    chips.push({ id: 'price', text: `Цена: ${a !== '' && b !== '' ? `${a}-${b}` : a !== '' ? `от ${a}` : `до ${b}`} ₽`, remove: () => onRemove({ min: null, max: null }) })
  }
  if (params.inStock) chips.push({ id: 'stock', text: 'В наличии', remove: () => onRemove({ stock: null }) })
  if (params.minRating) chips.push({ id: 'rating', text: `Рейтинг ${params.minRating} и выше`, remove: () => onRemove({ rating: null }) })
  params.brands.forEach((b) => chips.push({ id: `b-${b}`, text: b, remove: () => onRemove({ brand: params.brands.filter((x) => x !== b) }) }))
  params.categories.forEach((c) => {
    const title = categories.find((x) => x.slug === c)?.title || c
    chips.push({ id: `c-${c}`, text: title, remove: () => onRemove({ cat: params.categories.filter((x) => x !== c) }) })
  })
  return (
    <div className="active-filters">
      <span className="active-filters__label">Выбрано:</span>
      {chips.map((c) => (
        <button key={c.id} type="button" className="chip chip--removable" onClick={c.remove} aria-label={`Убрать фильтр: ${c.text}`}>
          {c.text} <Icon name="close" size={14} />
        </button>
      ))}
      <button type="button" className="link-btn" onClick={onResetAll}>Сбросить все</button>
    </div>
  )
}
