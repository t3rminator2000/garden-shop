// Заказы. Лежат в localStorage: туда их заливает слой store из файла
// public/data/orders.json при первом открытии сайта. Новые заказы и смена
// статусов пишутся в тот же набор. Заказ ссылается на клиента полем clientId.
// При оформлении дополнительно уходит POST /carts/add на DummyJSON (имитация).
import { request, ApiError, DUMMYJSON } from './client'
import { readStorage, writeStorage } from '../utils/storage'
import { ORDERS, readCollection, writeCollection } from './store'
import { LS, DELIVERY, PAYMENTS, ORDER_STATUS, deliveryCost } from '../constants'
import { promoDiscount } from '../utils/promo'
import { getProductsByIds } from './catalog'
import { findByOwnerKey, resolveClient } from './clients'

function sanitizeOrder(raw) {
  if (!raw || typeof raw !== 'object') return null
  const id = Number(raw.id)
  if (!Number.isFinite(id) || !Array.isArray(raw.items)) return null
  const clientId = Number(raw.clientId)
  return {
    ...raw,
    id,
    clientId: Number.isFinite(clientId) ? clientId : null,
    status: ORDER_STATUS[raw.status] ? raw.status : 'new',
  }
}

export async function listOrders() {
  const rows = await readCollection(ORDERS)
  return rows.map(sanitizeOrder).filter(Boolean).sort((a, b) => b.id - a.id)
}

// Заказы покупателя. Ищем через клиента, привязанного к его учётной записи.
export async function listUserOrders(ownerKey) {
  if (!ownerKey) return []
  const client = await findByOwnerKey(ownerKey)
  if (!client) return []
  return (await listOrders()).filter((o) => o.clientId === client.id)
}

export async function getOrder(id) {
  const n = Number(id)
  if (!Number.isFinite(n)) return null
  return (await listOrders()).find((o) => o.id === n) || null
}

export async function createOrder({ lines, contact, delivery, region, address, payment, comment, promo, ownerKey }) {
  if (!Array.isArray(lines) || !lines.length) throw new ApiError('Корзина пуста', { kind: 'validation' })
  if (!DELIVERY.some((d) => d.id === delivery)) throw new ApiError('Выберите способ доставки', { kind: 'validation' })
  if (!PAYMENTS.some((p) => p.id === payment)) throw new ApiError('Выберите способ оплаты', { kind: 'validation' })

  const products = await getProductsByIds(lines.map((l) => l.productId))
  const items = lines.map((l) => {
    const p = products.find((x) => x.id === l.productId)
    if (!p || !p.published) throw new ApiError('Один из товаров больше не продаётся. Обновите корзину', { kind: 'validation' })
    if (!p.inStock || l.qty > p.stock) throw new ApiError(`Товара «${p.title}» нет в нужном количестве`, { kind: 'validation' })
    return { productId: p.id, title: p.title, price: p.finalPrice, qty: l.qty }
  })
  const goods = items.reduce((s, i) => s + i.price * i.qty, 0)
  const cost = deliveryCost(delivery, region)
  // Промокод пересчитываем здесь заново: доверять сумме, пришедшей со страницы, нельзя
  const d = promoDiscount(promo, goods, cost)
  const discount = d.total

  const existing = await listOrders()
  const counter = readStorage(LS.orderCounter, 0)
  const id = Math.max(counter, ...existing.map((o) => o.id), 0) + 1
  writeStorage(LS.orderCounter, id)

  // Клиент заводится при первом заказе, при повторном - находится по учётной записи или e-mail
  const client = await resolveClient({ ownerKey, contact, address: { region, ...address } })

  const order = {
    id,
    createdAt: new Date().toISOString().slice(0, 10),
    status: 'new',
    clientId: client.id,
    contact,
    delivery,
    deliveryCost: cost,
    payment,
    address: { region, ...address },
    items,
    goods,
    promo: d.promo?.code || '',
    discount,
    total: Math.max(0, goods + cost - discount),
    comment: String(comment || '').trim().slice(0, 500),
  }
  writeCollection(ORDERS, [order, ...existing])

  // Имитация отправки заказа на сервер DummyJSON. Ошибка не мешает оформлению.
  const userId = ownerKey?.startsWith('dj:') ? Number(ownerKey.slice(3)) : 1
  request(`${DUMMYJSON}/carts/add`, {
    method: 'POST',
    body: { userId, products: items.map((i) => ({ id: i.productId, quantity: i.qty })) },
    timeout: 4000,
  }).catch(() => {})

  return order
}

export async function updateOrderStatus(id, status) {
  if (!ORDER_STATUS[status]) throw new ApiError('Неизвестный статус', { kind: 'validation' })
  const n = Number(id)
  const all = await listOrders()
  if (!all.some((o) => o.id === n)) throw new ApiError('Заказ не найден', { kind: 'validation' })
  writeCollection(ORDERS, all.map((o) => (o.id === n ? { ...o, status } : o)))
  return getOrder(n)
}
