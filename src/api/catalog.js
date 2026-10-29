// Данные каталога. Товары запрашиваются через fetch из файла public/data/products.json,
// правки администратора, отзывы и вопросы покупателей хранятся в localStorage.
import { request, ApiError } from './client'
import { readStorage, writeStorage } from '../utils/storage'
import { LS, CATEGORIES, PER_PAGE, getCategory } from '../constants'
import { firstLetter, normalize } from '../utils/format'
import { validateImageUrl } from '../utils/validators'
import { csvToObjects, toCsv } from '../utils/csv'

const DATA_URL = `${import.meta.env.BASE_URL}data/`
let baseCache = null

function sanitizeProduct(raw) {
  if (!raw || typeof raw !== 'object') return null
  const id = Number(raw.id)
  const price = Number(raw.price)
  if (!Number.isFinite(id) || typeof raw.title !== 'string' || !Number.isFinite(price) || price < 0) return null
  if (!getCategory(raw.category)) return null
  return {
    id,
    sku: String(raw.sku || String(id).padStart(6, '0')),
    title: raw.title,
    category: raw.category,
    sub: String(raw.sub || ''),
    price,
    discount: Math.min(90, Math.max(0, Number(raw.discount) || 0)),
    stock: Math.max(0, Math.floor(Number(raw.stock) || 0)),
    brand: String(raw.brand || ''),
    published: raw.published !== false,
    isNew: Boolean(raw.isNew),
    isHit: Boolean(raw.isHit),
    createdAt: String(raw.createdAt || '2026-01-01'),
    description: String(raw.description || ''),
    specs: Array.isArray(raw.specs) ? raw.specs.filter((s) => Array.isArray(s) && s.length === 2) : [],
    images: Array.isArray(raw.images) ? raw.images.filter((s) => typeof s === 'string' && s) : [],
    reviews: Array.isArray(raw.reviews) ? raw.reviews : [],
    questions: Array.isArray(raw.questions) ? raw.questions : [],
  }
}

function loadBase() {
  if (!baseCache) {
    baseCache = request(`${DATA_URL}products.json`)
      .then((data) => {
        if (!Array.isArray(data)) throw new ApiError('Файл товаров повреждён', { kind: 'parse' })
        return data.map(sanitizeProduct).filter(Boolean)
      })
      .catch((err) => {
        baseCache = null
        throw err
      })
  }
  return baseCache
}

const readAdmin = () => {
  const a = readStorage(LS.adminProducts, null)
  return {
    items: a && typeof a.items === 'object' && a.items ? a.items : {},
    deleted: a && Array.isArray(a.deleted) ? a.deleted : [],
  }
}

function mergeAdmin(base) {
  const adm = readAdmin()
  const deleted = new Set(adm.deleted)
  const baseIds = new Set(base.map((p) => p.id))
  const list = base.filter((p) => !deleted.has(p.id)).map((p) => (adm.items[p.id] ? { ...p, ...adm.items[p.id] } : p))
  const extra = Object.values(adm.items)
    .map(sanitizeProduct)
    .filter((p) => p && !baseIds.has(p.id) && !deleted.has(p.id))
  return [...list, ...extra]
}

export const finalPriceOf = (p) => Math.round(p.price * (1 - p.discount / 100))

function decorate(p) {
  const own = readStorage(LS.reviews, {})[p.id] || []
  const ownQ = readStorage(LS.questions, {})[p.id] || []
  const reviews = [...own, ...p.reviews].sort((a, b) => String(b.date).localeCompare(String(a.date)))
  const questions = [...ownQ, ...p.questions]
  const reviewsCount = reviews.length
  const rating = reviewsCount ? reviews.reduce((s, r) => s + r.stars, 0) / reviewsCount : 0
  return {
    ...p,
    reviews,
    questions,
    reviewsCount,
    rating: Math.round(rating * 10) / 10,
    finalPrice: finalPriceOf(p),
    oldPrice: p.discount > 0 ? p.price : null,
    inStock: p.stock > 0,
    popularity: reviewsCount * 10 + rating,
  }
}

async function loadAll({ includeHidden = false } = {}) {
  const base = await loadBase()
  const all = mergeAdmin(base).map(decorate)
  return includeHidden ? all : all.filter((p) => p.published)
}

export async function getProduct(id, { includeHidden = false } = {}) {
  const n = Number(id)
  if (!Number.isFinite(n)) return null
  const all = await loadAll({ includeHidden })
  return all.find((p) => p.id === n) || null
}

export async function getProductsByIds(ids) {
  const set = new Set(ids.map(Number))
  const all = await loadAll({ includeHidden: true })
  return all.filter((p) => set.has(p.id))
}

export async function getProducts(filter) {
  const all = await loadAll()
  return filter ? all.filter(filter) : all
}

const matchesQuery = (p, words) => {
  const hay = normalize(`${p.title} ${p.sku} ${p.brand} ${p.description}`)
  return words.every((w) => hay.includes(w))
}

// Простое отсечение окончаний: «томаты» и «томатов» находят «Томат»
const stem = (w) => (w.length >= 7 ? w.slice(0, -2) : w.length >= 5 ? w.slice(0, -1) : w)
const queryWords = (q) => normalize(q).split(/\s+/).filter(Boolean).map(stem)

const POPULAR = (a, b) => b.popularity - a.popularity
const SORTERS = {
  popular: POPULAR,
  'price-asc': (a, b) => a.finalPrice - b.finalPrice || POPULAR(a, b),
  'price-desc': (a, b) => b.finalPrice - a.finalPrice || POPULAR(a, b),
  new: (a, b) => String(b.createdAt).localeCompare(String(a.createdAt)) || POPULAR(a, b),
}

/**
 * Каталог и поиск. params: category, sub, q, letter, minPrice, maxPrice, inStock, brands[],
 * categories[], minRating, sale, isNew, isHit, sort, page, perPage
 */
export async function queryProducts(params = {}) {
  const all = await loadAll()
  const words = params.q ? queryWords(params.q) : []

  let scope = all
  if (params.category) scope = scope.filter((p) => p.category === params.category)
  if (params.sub) scope = scope.filter((p) => p.sub === params.sub)
  if (words.length) scope = scope.filter((p) => matchesQuery(p, words))
  if (params.sale) scope = scope.filter((p) => p.discount > 0)
  const letters = [...new Set(scope.map((p) => firstLetter(p.title)).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru'))
  if (params.letter) scope = scope.filter((p) => firstLetter(p.title) === params.letter)

  const facets = {
    letters,
    brands: [...new Set(scope.map((p) => p.brand).filter(Boolean))].sort(),
    categories: CATEGORIES.map((c) => ({ slug: c.slug, title: c.title, count: scope.filter((p) => p.category === c.slug).length })).filter((c) => c.count > 0),
    prices: scope.length ? { min: Math.min(...scope.map((p) => p.finalPrice)), max: Math.max(...scope.map((p) => p.finalPrice)) } : { min: 0, max: 0 },
  }

  let items = scope
  if (params.categories?.length) items = items.filter((p) => params.categories.includes(p.category))
  if (params.minPrice != null && params.minPrice !== '') items = items.filter((p) => p.finalPrice >= Number(params.minPrice))
  if (params.maxPrice != null && params.maxPrice !== '') items = items.filter((p) => p.finalPrice <= Number(params.maxPrice))
  if (params.inStock) items = items.filter((p) => p.inStock)
  if (params.brands?.length) items = items.filter((p) => params.brands.includes(p.brand))
  if (params.minRating) items = items.filter((p) => p.rating >= Number(params.minRating))
  if (params.isNew) items = items.filter((p) => p.isNew)
  if (params.isHit) items = items.filter((p) => p.isHit)

  items = [...items].sort(SORTERS[params.sort] || POPULAR)

  const perPage = params.perPage || PER_PAGE
  const total = items.length
  const pages = Math.max(1, Math.ceil(total / perPage))
  const page = Math.min(Math.max(1, Number(params.page) || 1), pages)
  return { items: items.slice((page - 1) * perPage, page * perPage), total, page, pages, facets, perPage }
}

// Подсказки для поисковой строки в шапке
export async function suggest(q) {
  const all = await loadAll()
  const words = queryWords(q)
  if (!words.length) return { suggestions: [], products: [], total: 0 }
  const found = all.filter((p) => matchesQuery(p, words)).sort(POPULAR)
  const first = words[0]
  const suggestions = []
  const seen = new Set()
  for (const p of found) {
    for (const w of normalize(p.title).split(/[^а-яa-z0-9]+/).filter(Boolean)) {
      if (w.startsWith(first) && !seen.has(w) && w.length > 2) {
        seen.add(w)
        suggestions.push(w)
      }
    }
    if (suggestions.length >= 3) break
  }
  const titles = found.slice(0, 2).map((p) => p.title)
  return { suggestions: [...suggestions, ...titles].slice(0, 4), products: found.slice(0, 2), total: found.length }
}

// ---------- Отзывы и вопросы ----------

function makeId(prefix) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export async function addReview(productId, { author, stars, text }) {
  const name = String(author || '').trim()
  const body = String(text || '').trim()
  const s = Math.round(Number(stars))
  if (name.length < 2) throw new ApiError('Введите имя', { kind: 'validation' })
  if (!(s >= 1 && s <= 5)) throw new ApiError('Выберите оценку', { kind: 'validation' })
  if (body.length < 5) throw new ApiError('Напишите отзыв не короче 5 символов', { kind: 'validation' })
  const store = readStorage(LS.reviews, {})
  const review = { id: makeId(`${productId}-r`), author: name.slice(0, 60), stars: s, text: body.slice(0, 1000), date: new Date().toISOString().slice(0, 10) }
  store[productId] = [review, ...(store[productId] || [])]
  writeStorage(LS.reviews, store)
  return review
}

export async function addQuestion(productId, { author, text }) {
  const name = String(author || '').trim()
  const body = String(text || '').trim()
  if (name.length < 2) throw new ApiError('Введите имя', { kind: 'validation' })
  if (body.length < 5) throw new ApiError('Напишите вопрос не короче 5 символов', { kind: 'validation' })
  const store = readStorage(LS.questions, {})
  const q = { id: makeId(`${productId}-q`), author: name.slice(0, 60), text: body.slice(0, 500), date: new Date().toISOString().slice(0, 10), answer: null }
  store[productId] = [q, ...(store[productId] || [])]
  writeStorage(LS.questions, store)
  return q
}

// ---------- Администратор: товары ----------

export const listAdminProducts = () => loadAll({ includeHidden: true })

export async function saveProduct(input) {
  const base = await loadBase()
  const all = mergeAdmin(base)
  const adm = readAdmin()

  const title = String(input.title || '').trim()
  if (title.length < 2) throw new ApiError('Введите название товара', { kind: 'validation' })
  if (!getCategory(input.category)) throw new ApiError('Выберите категорию', { kind: 'validation' })
  const price = Number(String(input.price).replace(',', '.'))
  if (!Number.isFinite(price) || price <= 0) throw new ApiError('Введите цену больше нуля', { kind: 'validation' })
  const discount = Number(input.discount || 0)
  if (!Number.isFinite(discount) || discount < 0 || discount > 90) throw new ApiError('Скидка от 0 до 90 процентов', { kind: 'validation' })
  const stock = Number(input.stock || 0)
  if (!Number.isInteger(stock) || stock < 0) throw new ApiError('Остаток должен быть целым числом', { kind: 'validation' })

  const isNew = !input.id
  const id = isNew ? Math.max(0, ...all.map((p) => p.id), ...adm.deleted) + 1 : Number(input.id)
  const sku = String(input.sku || '').trim() || String(id).padStart(6, '0')
  if (all.some((p) => p.sku === sku && p.id !== id)) throw new ApiError('Такой артикул уже есть', { kind: 'validation' })

  const category = getCategory(input.category)
  const current = all.find((p) => p.id === id)
  const record = {
    id, sku, title: title.slice(0, 120), category: input.category,
    sub: category.subs.some((s) => s.slug === input.sub) ? input.sub : (current && current.category === input.category ? current.sub : category.subs[0]?.slug || ''),
    price, discount, stock,
    brand: String(input.brand || current?.brand || '').trim().slice(0, 60),
    published: Boolean(input.published),
    isNew: current ? current.isNew : true,
    isHit: current ? current.isHit : false,
    createdAt: current ? current.createdAt : new Date().toISOString().slice(0, 10),
    description: String(input.description || '').trim().slice(0, 3000),
    specs: (input.specs || []).map((s) => [String(s[0] || '').trim(), String(s[1] || '').trim()]).filter((s) => s[0] && s[1]).slice(0, 20),
    images: input.image ? [String(input.image).trim()] : [],
  }
  adm.items[id] = record
  writeStorage(LS.adminProducts, adm)
  return decorate({ ...(current || {}), ...record, reviews: current?.reviews || [], questions: current?.questions || [] })
}

// Колонки файла для импорта и экспорта каталога
export const IMPORT_COLUMNS = ['id', 'sku', 'title', 'category', 'sub', 'price', 'discount', 'stock', 'brand', 'published', 'image', 'description']

// Выгрузка каталога в CSV или JSON. Возвращает готовый текст файла.
export async function exportProducts(format = 'csv') {
  const list = await loadAll({ includeHidden: true })
  const rows = list.map((p) => ({
    id: p.id, sku: p.sku, title: p.title, category: p.category, sub: p.sub,
    price: p.price, discount: p.discount, stock: p.stock, brand: p.brand,
    published: p.published ? 1 : 0, image: p.images[0] || '', description: p.description,
  }))
  if (format === 'json') return JSON.stringify(rows, null, 2)
  return toCsv(rows, IMPORT_COLUMNS)
}

const toNum = (v, fallback = 0) => {
  const n = Number(String(v ?? '').replace(',', '.').trim())
  return Number.isFinite(n) ? n : fallback
}

// Проверка одной строки файла. Возвращает готовую запись или текст ошибки.
function rowToRecord(raw, { all, usedSku, usedId, nextId }) {
  const title = String(raw.title ?? '').trim()
  if (title.length < 2) return { error: 'пустое название' }
  const category = String(raw.category ?? '').trim()
  if (!getCategory(category)) return { error: `неизвестная категория «${category}»` }
  const price = toNum(raw.price, NaN)
  if (!Number.isFinite(price) || price <= 0) return { error: 'цена должна быть больше нуля' }
  const discount = toNum(raw.discount, 0)
  if (discount < 0 || discount > 90) return { error: 'скидка от 0 до 90' }
  const stock = Math.floor(toNum(raw.stock, 0))
  if (stock < 0) return { error: 'остаток не может быть отрицательным' }

  const cat = getCategory(category)
  const rawId = Number(raw.id)
  const bySku = String(raw.sku ?? '').trim()
  const current = all.find((p) => (Number.isFinite(rawId) && p.id === rawId) || (bySku && p.sku === bySku))
  const id = current ? current.id : nextId
  if (!current && usedId.has(id)) return { error: 'повтор идентификатора в файле' }
  const sku = bySku || String(id).padStart(6, '0')
  if (usedSku.has(sku)) return { error: `артикул ${sku} встречается в файле дважды` }
  if (all.some((p) => p.sku === sku && p.id !== id)) return { error: `артикул ${sku} уже занят другим товаром` }

  const sub = String(raw.sub ?? '').trim()
  const publishedRaw = String(raw.published ?? '1').trim().toLowerCase()
  // Путь к фото: либо /images/файл.jpg внутри сайта, либо ссылка http или https
  const image = String(raw.image ?? '').trim()
  if (image && validateImageUrl(image)) return { error: `неверный путь к фото: ${image}` }
  return {
    record: {
      id,
      sku,
      title: title.slice(0, 120),
      category,
      sub: cat.subs.some((s) => s.slug === sub) ? sub : current?.sub || cat.subs[0]?.slug || '',
      price,
      discount,
      stock,
      brand: String(raw.brand ?? current?.brand ?? '').trim().slice(0, 60),
      published: !['0', 'нет', 'false', 'off'].includes(publishedRaw),
      isNew: current ? current.isNew : true,
      isHit: current ? current.isHit : false,
      createdAt: current ? current.createdAt : new Date().toISOString().slice(0, 10),
      description: String(raw.description ?? current?.description ?? '').trim().slice(0, 3000),
      specs: current?.specs || [],
      images: image ? [image] : current?.images || [],
    },
    isNew: !current,
  }
}

// Загрузка каталога из файла. Формат определяется по содержимому: JSON или CSV.
// Товар с известным id или артикулом обновляется, остальные добавляются.
export async function importProducts(text) {
  const src = String(text || '').trim()
  if (!src) throw new ApiError('Файл пустой', { kind: 'validation' })

  let rows
  if (src.startsWith('[') || src.startsWith('{')) {
    let parsed
    try {
      parsed = JSON.parse(src)
    } catch {
      throw new ApiError('Файл JSON повреждён', { kind: 'parse' })
    }
    rows = Array.isArray(parsed) ? parsed : [parsed]
  } else {
    rows = csvToObjects(src)
    if (!rows.length) throw new ApiError('В файле нет строк с товарами', { kind: 'validation' })
    if (!('title' in rows[0])) throw new ApiError('В первой строке файла нужны названия колонок, например title;category;price', { kind: 'validation' })
  }
  if (rows.length > 500) throw new ApiError('За один раз можно загрузить не больше 500 товаров', { kind: 'validation' })

  const base = await loadBase()
  const all = mergeAdmin(base)
  const adm = readAdmin()
  const usedSku = new Set()
  const usedId = new Set()
  let nextId = Math.max(0, ...all.map((p) => p.id), ...adm.deleted) + 1

  const errors = []
  const ready = []
  rows.forEach((raw, i) => {
    const res = rowToRecord(raw || {}, { all, usedSku, usedId, nextId })
    if (res.error) {
      errors.push({ line: i + 1, error: res.error })
      return
    }
    usedSku.add(res.record.sku)
    usedId.add(res.record.id)
    if (res.isNew) nextId += 1
    ready.push(res)
  })

  if (!ready.length) throw new ApiError(`Ни одной строки загрузить не удалось. Первая ошибка: строка ${errors[0]?.line} - ${errors[0]?.error}`, { kind: 'validation' })

  for (const { record } of ready) {
    adm.items[record.id] = record
    adm.deleted = adm.deleted.filter((d) => d !== record.id)
  }
  writeStorage(LS.adminProducts, adm)

  return {
    added: ready.filter((r) => r.isNew).length,
    updated: ready.filter((r) => !r.isNew).length,
    errors,
  }
}

export async function deleteProduct(id) {
  const adm = readAdmin()
  const n = Number(id)
  delete adm.items[n]
  if (!adm.deleted.includes(n)) adm.deleted.push(n)
  writeStorage(LS.adminProducts, adm)
}
