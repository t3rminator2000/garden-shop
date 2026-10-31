// Клиенты магазина. Данные приходят из public/data/clients.json при первой
// загрузке сайта и дальше живут в localStorage (методичка, п. 2.4.4).
// Заказ ссылается на клиента по полю clientId.
import { ApiError } from './client'
import { CLIENTS, readCollection, writeCollection, nextId } from './store'
import { validateEmail, validateName, validatePhone } from '../utils/validators'

const EMPTY_ADDRESS = { region: '', index: '', city: '', street: '', house: '', flat: '' }

function sanitize(raw) {
  if (!raw || typeof raw !== 'object') return null
  const id = Number(raw.id)
  if (!Number.isFinite(id)) return null
  return {
    id,
    name: String(raw.name || '').trim(),
    email: String(raw.email || '').trim(),
    phone: String(raw.phone || '').trim(),
    ownerKey: raw.ownerKey ? String(raw.ownerKey) : null,
    address: { ...EMPTY_ADDRESS, ...(raw.address && typeof raw.address === 'object' ? raw.address : {}) },
  }
}

const sameEmail = (a, b) => Boolean(a) && Boolean(b) && String(a).toLowerCase() === String(b).toLowerCase()
// Телефон сравниваем по цифрам: «+7 (999) 000-00-02» и «89990000002» - один номер
const digits = (v) => String(v || '').replace(/\D/g, '').replace(/^8/, '7')
const samePhone = (a, b) => digits(a).length >= 10 && digits(a) === digits(b)

export async function listClients() {
  const rows = await readCollection(CLIENTS)
  return rows.map(sanitize).filter(Boolean).sort((a, b) => a.id - b.id)
}

export async function getClient(id) {
  const n = Number(id)
  if (!Number.isFinite(n)) return null
  return (await listClients()).find((c) => c.id === n) || null
}

// Клиент, привязанный к учётной записи покупателя
export async function findByOwnerKey(ownerKey) {
  if (!ownerKey) return null
  return (await listClients()).find((c) => c.ownerKey === ownerKey) || null
}

/**
 * Находит клиента при оформлении заказа, а если такого ещё нет - заводит нового.
 * Порядок поиска: учётная запись, затем e-mail, затем телефон.
 * Гость оставляет только телефон, и при повторном заказе новый клиент не плодится.
 */
export async function resolveClient({ ownerKey, contact, address }) {
  const list = await listClients()
  const found =
    (ownerKey && list.find((c) => c.ownerKey === ownerKey)) ||
    list.find((c) => sameEmail(c.email, contact?.email)) ||
    list.find((c) => samePhone(c.phone, contact?.phone))
  const data = {
    name: String(contact?.name || '').trim(),
    email: String(contact?.email || '').trim(),
    phone: String(contact?.phone || '').trim(),
    address: { ...EMPTY_ADDRESS, ...(address || {}) },
  }

  if (found) {
    const updated = { ...found, ...data, ownerKey: ownerKey || found.ownerKey }
    writeCollection(CLIENTS, list.map((c) => (c.id === found.id ? updated : c)))
    return updated
  }

  const client = { id: nextId(list), ...data, ownerKey: ownerKey || null }
  writeCollection(CLIENTS, [...list, client])
  return client
}

// ---------- Администратор: клиенты ----------

export async function saveClient(input) {
  const list = await listClients()
  const errors = {
    name: validateName(input.name),
    email: validateEmail(input.email),
    phone: validatePhone(input.phone, { required: false }),
  }
  if (Object.values(errors).some(Boolean)) {
    const err = new ApiError('Проверьте поля формы', { kind: 'validation' })
    err.fields = errors
    throw err
  }
  const id = input.id ? Number(input.id) : nextId(list)
  if (list.some((c) => c.id !== id && sameEmail(c.email, input.email))) {
    const err = new ApiError('Клиент с таким e-mail уже есть', { kind: 'validation' })
    err.fields = { email: 'Клиент с таким e-mail уже есть' }
    throw err
  }
  const current = list.find((c) => c.id === id)
  const record = sanitize({
    id,
    name: input.name,
    email: input.email,
    phone: input.phone,
    ownerKey: current?.ownerKey || null,
    address: { ...(current?.address || EMPTY_ADDRESS), ...(input.address || {}) },
  })
  writeCollection(CLIENTS, current ? list.map((c) => (c.id === id ? record : c)) : [...list, record])
  return record
}

export async function deleteClient(id) {
  const n = Number(id)
  const list = await listClients()
  if (!list.some((c) => c.id === n)) throw new ApiError('Клиент не найден', { kind: 'validation' })
  writeCollection(CLIENTS, list.filter((c) => c.id !== n))
}
