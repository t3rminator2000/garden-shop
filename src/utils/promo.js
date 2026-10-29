// Промокоды: поиск кода и расчёт скидки.
// Скидка никогда не превышает стоимость товаров, итог не уходит в минус.
import { PROMOCODES } from '../constants'

export const normalizeCode = (raw) => String(raw || '').trim().toUpperCase().slice(0, 20)

export const findPromo = (raw) => {
  const code = normalizeCode(raw)
  return code ? PROMOCODES.find((p) => p.code === code) || null : null
}

// Проверяет код для текущей суммы товаров.
// Возвращает { ok, promo, error } - error показываем покупателю.
export function checkPromo(raw, goodsTotal) {
  const code = normalizeCode(raw)
  if (!code) return { ok: false, promo: null, error: 'Введите промокод' }
  const promo = findPromo(code)
  if (!promo) return { ok: false, promo: null, error: 'Такого промокода нет' }
  const goods = Number(goodsTotal) || 0
  if (promo.min > 0 && goods < promo.min) {
    return { ok: false, promo: null, error: `Код работает при сумме товаров от ${promo.min} ₽` }
  }
  return { ok: true, promo, error: '' }
}

// Считает скидку на товары и на доставку для применённого кода
export function promoDiscount(raw, goodsTotal, shipping = 0) {
  const empty = { promo: null, goodsDiscount: 0, deliveryDiscount: 0, total: 0 }
  const goods = Math.max(0, Number(goodsTotal) || 0)
  const ship = Math.max(0, Number(shipping) || 0)
  const { ok, promo } = checkPromo(raw, goods)
  if (!ok) return empty

  if (promo.type === 'percent') {
    const d = Math.min(goods, Math.round((goods * promo.value) / 100))
    return { promo, goodsDiscount: d, deliveryDiscount: 0, total: d }
  }
  if (promo.type === 'fixed') {
    const d = Math.min(goods, promo.value)
    return { promo, goodsDiscount: d, deliveryDiscount: 0, total: d }
  }
  if (promo.type === 'delivery') {
    return { promo, goodsDiscount: 0, deliveryDiscount: ship, total: ship }
  }
  return empty
}
