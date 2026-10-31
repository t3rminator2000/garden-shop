// Слой хранения данных магазина (методичка, п. 2.4.4).
//
// Сервера у сайта нет. Заказчик передал три файла с «сырыми» данными:
// public/data/clients.json, products.json, orders.json.
//
// Как это работает:
// 1. При первом открытии сайта файлы переливаются в localStorage.
// 2. Дальше сайт читает и пишет только localStorage, файлы больше не трогает.
// 3. Любые правки клиентов, товаров и заказов остаются после перезагрузки.
// 4. Сброс возвращает данные к исходному состоянию из файлов.
import { request, ApiError } from './client'
import { readStorage, writeStorage, removeStorage } from '../utils/storage'
import { LS } from '../constants'

const DATA_URL = `${import.meta.env.BASE_URL}data/`

export const CLIENTS = 'clients'
export const PRODUCTS = 'products'
export const ORDERS = 'orders'
const NAMES = [CLIENTS, PRODUCTS, ORDERS]

const KEY = { [CLIENTS]: LS.dataClients, [PRODUCTS]: LS.dataProducts, [ORDERS]: LS.dataOrders }
const FILE = { [CLIENTS]: 'clients.json', [PRODUCTS]: 'products.json', [ORDERS]: 'orders.json' }

// Запасная копия в памяти: в приватном режиме браузера localStorage недоступен,
// и без неё сайт падал бы на каждом чтении.
const memory = new Map()
let pending = null

function readRaw(name) {
  const stored = readStorage(KEY[name], null)
  if (Array.isArray(stored)) return stored
  const cached = memory.get(name)
  return Array.isArray(cached) ? cached : null
}

function writeRaw(name, rows) {
  const list = Array.isArray(rows) ? rows : []
  memory.set(name, list)
  writeStorage(KEY[name], list)
  return list
}

async function fetchFile(name) {
  const data = await request(`${DATA_URL}${FILE[name]}`)
  if (!Array.isArray(data)) throw new ApiError(`Файл ${FILE[name]} повреждён`, { kind: 'parse' })
  return data
}

// Заливаются только те наборы, которых в хранилище ещё нет.
// Поэтому правки пользователя файлами не затираются.
async function seedMissing() {
  const missing = NAMES.filter((name) => !readRaw(name))
  if (!missing.length) return
  const loaded = await Promise.all(missing.map(fetchFile))
  missing.forEach((name, i) => writeRaw(name, loaded[i]))
  // Ключи прежней схемы хранили правки поверх файлов. Теперь они не нужны.
  removeStorage(LS.legacyAdminProducts)
  removeStorage(LS.legacyOrderOverrides)
  removeStorage(LS.legacyOrders)
}

// Одна общая попытка заливки на все параллельные запросы страницы
export function ensureData() {
  if (!pending) {
    pending = seedMissing().catch((err) => {
      pending = null
      throw err
    })
  }
  return pending
}

export async function readCollection(name) {
  await ensureData()
  return readRaw(name) || []
}

export function writeCollection(name, rows) {
  return writeRaw(name, rows)
}

// Следующий свободный номер. Нужен и товарам, и заказам, и клиентам.
export const nextId = (rows) => Math.max(0, ...rows.map((r) => Number(r?.id)).filter(Number.isFinite)) + 1

/**
 * Сброс к исходному состоянию из файлов.
 * Возвращает число записей в каждом наборе.
 */
export async function resetData() {
  const loaded = await Promise.all(NAMES.map(fetchFile))
  NAMES.forEach((name, i) => writeRaw(name, loaded[i]))
  // Отзывы, вопросы и счётчик заказов - надстройка над файлами, их тоже возвращаем к началу
  removeStorage(LS.reviews)
  removeStorage(LS.questions)
  removeStorage(LS.orderCounter)
  pending = Promise.resolve()
  return { clients: loaded[0].length, products: loaded[1].length, orders: loaded[2].length }
}
