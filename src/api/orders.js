// Заказы. Учебные заказы читаются из public/data/orders.json через fetch,
// новые заказы и смена статусов хранятся в localStorage.
// При оформлении заказа дополнительно отправляется POST /carts/add на DummyJSON (имитация).
import { request, ApiError, DUMMYJSON } from './client'
import { readStorage, writeStorage } from '../utils/storage'
import { LS, DELIVERY, PAYMENTS, ORDER_STATUS, deliveryCost } from '../constants'
import { promoDiscount } from '../utils/promo'
import { getProductsByIds } from './catalog'

const DATA_URL = `${import.meta.env.BASE_URL}data/`
let seedCache = null

function loadSeed() {
  if (!seedCache) {
    seedCache = request(`${DATA_URL}orders.json`)
      .then((d) => (Array.isArray(d) ? d : []))
      .catch((err) => {
        seedCache = null
        throw err
      })
  }
  return seedCache
}

const localOrders = () => {
  const l = readStorage(LS.orders, [])
  return Array.isArray(l) ? l : []
}
const overrides = () => readStorage(LS.orderOverrides, {})

export async function listOrders() {
  let seed = []
  try {
    seed = await loadSeed()
  } catch {
    /* без файла учебных заказов работаем только с локальными */
  }
  const ov = overrides()
  const all = [...localOrders(), ...seed.filter((s) => !localOrders().some((l) => l.id === s.id))]
  return all.map((o) => (ov[o.id] ? { ...o, status: ov[o.id] } : o)).sort((a, b) => b.id - a.id)
}

export async function listUserOrders(ownerKey) {
  if (!ownerKey) return []
  return (await listOrders()).filter((o) => o.ownerKey === ownerKey)
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

  const order = {
    id,
    createdAt: new Date().toISOString().slice(0, 10),
    status: 'new',
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
    ownerKey: ownerKey || null,
  }
  writeStorage(LS.orders, [order, ...localOrders()])

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
  const local = localOrders()
  if (local.some((o) => o.id === n)) {
    writeStorage(LS.orders, local.map((o) => (o.id === n ? { ...o, status } : o)))
  } else {
    writeStorage(LS.orderOverrides, { ...overrides(), [n]: status })
  }
  return getOrder(n)
}
