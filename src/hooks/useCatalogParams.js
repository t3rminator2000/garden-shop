// Параметры каталога и поиска живут в адресной строке: ссылкой можно поделиться,
// кнопка «Назад» возвращает к прошлым фильтрам.

const FILTER_KEYS = ['min', 'max', 'stock', 'brand', 'cat', 'rating']

export function parseParams(sp) {
  const num = (v) => (v !== null && v !== '' && Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : null)
  return {
    sub: sp.get('sub') || '',
    q: (sp.get('q') || '').slice(0, 80),
    letter: sp.get('letter') || '',
    minPrice: num(sp.get('min')),
    maxPrice: num(sp.get('max')),
    inStock: sp.get('stock') === '1',
    brands: sp.getAll('brand'),
    categories: sp.getAll('cat'),
    minRating: num(sp.get('rating')),
    sale: sp.get('sale') === '1',
    isNew: sp.get('new') === '1',
    isHit: sp.get('hit') === '1',
    sort: sp.get('sort') || 'popular',
    page: Math.max(1, Math.floor(Number(sp.get('page'))) || 1),
  }
}

// Меняет часть параметров. Значение null, '' или [] удаляет ключ. Страница сбрасывается, если не задана.
export function withParams(sp, changes) {
  const next = new URLSearchParams(sp)
  for (const [key, value] of Object.entries(changes)) {
    next.delete(key)
    if (Array.isArray(value)) value.forEach((v) => next.append(key, v))
    else if (value !== null && value !== undefined && value !== '' && value !== false) next.set(key, value === true ? '1' : String(value))
  }
  if (!('page' in changes)) next.delete('page')
  return next
}

export function clearFilters(sp) {
  const next = new URLSearchParams(sp)
  FILTER_KEYS.forEach((k) => next.delete(k))
  next.delete('page')
  return next
}

export const hasFilters = (p) =>
  p.minPrice !== null || p.maxPrice !== null || p.inStock || p.brands.length > 0 || p.categories.length > 0 || p.minRating !== null
