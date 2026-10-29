import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { catalogApi } from '../api'
import { LS } from '../constants'
import { readStorage, writeStorage } from '../utils/storage'
import { checkPromo, normalizeCode, promoDiscount } from '../utils/promo'

const CartContext = createContext(null)
const MAX_QTY = 99

function sanitize(raw) {
  if (!Array.isArray(raw)) return []
  const seen = new Set()
  const out = []
  for (const i of raw) {
    const productId = Number(i?.productId)
    const qty = Math.floor(Number(i?.qty))
    if (!Number.isFinite(productId) || !(qty > 0) || seen.has(productId)) continue
    seen.add(productId)
    out.push({ productId, qty: Math.min(qty, MAX_QTY) })
  }
  return out
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => sanitize(readStorage(LS.cart, [])))
  const [promo, setPromo] = useState(() => normalizeCode(readStorage(LS.promo, '')))
  const [products, setProducts] = useState({})
  const [loading, setLoading] = useState(items.length > 0)
  const [error, setError] = useState(null)

  // Сохраняем корзину и синхронизируем вкладки
  useEffect(() => {
    writeStorage(LS.cart, items)
  }, [items])
  useEffect(() => {
    writeStorage(LS.promo, promo)
  }, [promo])
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === LS.cart) setItems(sanitize(readStorage(LS.cart, [])))
      if (e.key === LS.promo) setPromo(normalizeCode(readStorage(LS.promo, '')))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Подгружаем данные товаров, которые лежат в корзине
  const idsKey = items.map((i) => i.productId).sort().join(',')
  useEffect(() => {
    const ids = idsKey ? idsKey.split(',').map(Number) : []
    const missing = ids.filter((id) => !products[id])
    if (!missing.length) {
      setLoading(false)
      return undefined
    }
    let cancelled = false
    setLoading(true)
    catalogApi
      .getProductsByIds(missing)
      .then((list) => {
        if (cancelled) return
        setProducts((prev) => ({ ...prev, ...Object.fromEntries(list.map((p) => [p.id, p])) }))
        setError(null)
      })
      .catch((e) => !cancelled && setError(e))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey])

  const lines = useMemo(
    () =>
      items
        .map((i) => {
          const product = products[i.productId]
          if (!product || !product.published) return null
          const qty = Math.max(1, Math.min(i.qty, product.stock || 1, MAX_QTY))
          return { productId: i.productId, qty, product, sum: product.finalPrice * qty }
        })
        .filter(Boolean),
    [items, products],
  )

  const add = useCallback(
    (product, qty = 1) => {
      if (!product || !product.inStock) return { ok: false, reason: 'out' }
      const limit = Math.min(product.stock, MAX_QTY)
      const have = items.find((i) => i.productId === product.id)?.qty || 0
      const wanted = have + Math.max(1, Math.floor(qty))
      const next = Math.min(wanted, limit)
      setProducts((p) => ({ ...p, [product.id]: product }))
      setItems((prev) =>
        prev.some((i) => i.productId === product.id)
          ? prev.map((i) => (i.productId === product.id ? { ...i, qty: next } : i))
          : [...prev, { productId: product.id, qty: next }],
      )
      return { ok: true, capped: wanted > limit }
    },
    [items],
  )

  const setQty = useCallback((productId, qty) => {
    const n = Math.floor(Number(qty))
    if (!Number.isFinite(n)) return
    setItems((prev) =>
      n <= 0
        ? prev.filter((i) => i.productId !== productId)
        : prev.map((i) => (i.productId === productId ? { ...i, qty: Math.min(n, MAX_QTY) } : i)),
    )
  }, [])

  const remove = useCallback((productId) => setItems((prev) => prev.filter((i) => i.productId !== productId)), [])
  const clear = useCallback(() => {
    setItems([])
    setPromo('')
  }, [])

  const goodsTotal = useMemo(() => lines.reduce((s, l) => s + l.sum, 0), [lines])

  // Промокод проверяем на текущей сумме товаров: если она упала, код перестаёт работать
  const promoState = useMemo(() => (promo ? checkPromo(promo, goodsTotal) : { ok: false, promo: null, error: '' }), [promo, goodsTotal])

  const applyPromo = useCallback(
    (raw) => {
      const res = checkPromo(raw, goodsTotal)
      if (res.ok) setPromo(res.promo.code)
      return res
    },
    [goodsTotal],
  )
  const clearPromo = useCallback(() => setPromo(''), [])

  const value = useMemo(
    () => ({
      items,
      lines,
      loading,
      error,
      positions: items.length,
      totalQty: lines.reduce((s, l) => s + l.qty, 0),
      goodsTotal,
      promo,
      promoOk: promoState.ok,
      promoError: promoState.error,
      promoTitle: promoState.promo?.title || '',
      // Скидка на товары, без учёта доставки: её считает страница оформления
      promoDiscount: promoState.ok ? promoDiscount(promo, goodsTotal).goodsDiscount : 0,
      applyPromo,
      clearPromo,
      add,
      setQty,
      remove,
      clear,
      has: (id) => items.some((i) => i.productId === id),
    }),
    [items, lines, loading, error, goodsTotal, promo, promoState, applyPromo, clearPromo, add, setQty, remove, clear],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart нужно вызывать внутри CartProvider')
  return ctx
}
