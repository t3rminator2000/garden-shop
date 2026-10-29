const priceFmt = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })

export const formatPrice = (value) => `${priceFmt.format(Math.round(Number(value) || 0))} ₽`

export function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}.${mm}.${d.getFullYear()}`
}

export const formatRating = (value) => (Number(value) || 0).toFixed(1).replace('.', ',')

// plural(21, ['товар', 'товара', 'товаров']) -> 'товар'
export function plural(n, forms) {
  const a = Math.abs(n) % 100
  const b = a % 10
  if (a > 10 && a < 20) return forms[2]
  if (b > 1 && b < 5) return forms[1]
  if (b === 1) return forms[0]
  return forms[2]
}

export const countLabel = (n, forms) => `${n} ${plural(n, forms)}`
export const goodsLabel = (n) => countLabel(n, ['товар', 'товара', 'товаров'])
export const reviewsLabel = (n) => countLabel(n, ['отзыв', 'отзыва', 'отзывов'])

export const orderNumber = (id) => `№ ${String(id).padStart(6, '0')}`

// Первая «культурная» буква названия для алфавитного указателя
export function firstLetter(title) {
  const m = String(title || '').match(/[A-Za-zА-Яа-яЁё]/)
  return m ? m[0].toUpperCase().replace('Ё', 'Е') : ''
}

export function normalize(text) {
  return String(text || '').toLowerCase().replace(/ё/g, 'е').trim()
}

// Адрес заказа одной строкой
export const addressLine = (o) => {
  const a = o.address || {}
  if (o.delivery === 'office') return 'Самовывоз из офиса магазина'
  const parts = [a.index, a.city && `г. ${a.city}`, a.street, a.house && `д. ${a.house}`, a.flat && `кв. ${a.flat}`].filter(Boolean)
  return parts.join(', ')
}
