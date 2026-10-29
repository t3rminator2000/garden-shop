// Авторизация. Два источника учётных записей:
// 1) локальные (localStorage): две учебные записи и все, кто зарегистрировался на сайте;
// 2) DummyJSON (https://dummyjson.com): POST /auth/login, GET /users/{id}.
// Роль «admin» приходит из поля role пользователя DummyJSON или из локальной записи.
import { request, ApiError, DUMMYJSON } from './client'
import { readStorage, writeStorage, removeStorage } from '../utils/storage'
import { LS } from '../constants'
import { hashPassword } from '../utils/hash'
import { validateEmail, validateName, validatePhone, validatePassword } from '../utils/validators'

const BAD_CREDENTIALS = 'Неверный e-mail или пароль'
const SESSION_DAYS = 7

// Учебные записи. Пароль хранится в виде хеша SHA-256 от «пароль:email».
const SEED_USERS = [
  { id: 'local:admin', username: 'admin', email: 'admin@garden.local', name: 'Администратор', phone: '', role: 'admin', hash: '750d203c72988351ce6481279e64119b3e5242eb638e158d7e26fe5615089b5a' },
  { id: 'local:demo', username: 'demo', email: 'demo@garden.local', name: 'Анна Петрова', phone: '+7 (999) 000-00-02', role: 'user', hash: '63a3618276ea6269bb46b4dee2005feda19cb5310b46d11ffec3c6f488ed424f' },
]

const registeredUsers = () => {
  const list = readStorage(LS.users, [])
  return Array.isArray(list) ? list : []
}
const localUsers = () => [...SEED_USERS, ...registeredUsers()]

function toSession(u, source) {
  return {
    key: u.id,
    source,
    name: u.name,
    email: u.email,
    phone: u.phone || '',
    role: u.role === 'admin' ? 'admin' : 'user',
    expiresAt: Date.now() + SESSION_DAYS * 86400000,
  }
}

export function getSession() {
  const s = readStorage(LS.session, null)
  if (!s || typeof s !== 'object' || !s.key || !s.expiresAt || s.expiresAt < Date.now()) {
    if (s) removeStorage(LS.session)
    return null
  }
  return { ...s, ...profileOverrides(s.key) }
}

function profileOverrides(key) {
  const p = readStorage(LS.profiles, {})[key]
  if (!p) return {}
  const out = {}
  if (p.name) out.name = p.name
  if (p.phone !== undefined) out.phone = p.phone
  return out
}

const saveSession = (s) => {
  writeStorage(LS.session, s)
  return getSession()
}

export function logout() {
  removeStorage(LS.session)
}

export async function login(identifier, password) {
  const id = String(identifier || '').trim()
  const pw = String(password || '')
  if (!id || !pw) throw new ApiError(BAD_CREDENTIALS, { kind: 'validation' })

  // 1. Локальные записи
  const local = localUsers().find((u) => u.email.toLowerCase() === id.toLowerCase() || u.username?.toLowerCase() === id.toLowerCase())
  if (local) {
    const hash = await hashPassword(pw, local.email)
    if (hash !== local.hash) throw new ApiError(BAD_CREDENTIALS, { kind: 'validation' })
    return saveSession(toSession(local, 'local'))
  }

  // 2. DummyJSON
  let username = id
  try {
    if (id.includes('@')) {
      const found = await request(`${DUMMYJSON}/users/filter?key=email&value=${encodeURIComponent(id)}&select=username`)
      username = found?.users?.[0]?.username
      if (!username) throw new ApiError(BAD_CREDENTIALS, { kind: 'validation' })
    }
    const auth = await request(`${DUMMYJSON}/auth/login`, { method: 'POST', body: { username, password: pw, expiresInMins: 60 } })
    if (!auth || !Number.isFinite(Number(auth.id))) throw new ApiError('Сервер вернул неожиданный ответ', { kind: 'parse' })

    let extra = {}
    try {
      extra = (await request(`${DUMMYJSON}/users/${auth.id}?select=role,phone,address`)) || {}
    } catch {
      /* роль и телефон не критичны, войдём как обычный покупатель */
    }
    const user = {
      id: `dj:${auth.id}`,
      email: String(auth.email || ''),
      name: [auth.firstName, auth.lastName].filter(Boolean).join(' ') || auth.username,
      phone: String(extra.phone || ''),
      role: extra.role === 'admin' ? 'admin' : 'user',
    }
    if (extra.address && typeof extra.address === 'object') {
      const profiles = readStorage(LS.profiles, {})
      if (!profiles[user.id]) {
        profiles[user.id] = { address: { region: '', index: String(extra.address.postalCode || ''), city: String(extra.address.city || ''), street: String(extra.address.address || ''), house: '', flat: '' } }
        writeStorage(LS.profiles, profiles)
      }
    }
    return saveSession(toSession(user, 'dummyjson'))
  } catch (err) {
    if (err instanceof ApiError && err.kind === 'http' && (err.status === 400 || err.status === 401 || err.status === 404)) {
      throw new ApiError(BAD_CREDENTIALS, { kind: 'validation' })
    }
    throw err
  }
}

export async function register({ name, email, phone, password, confirm }) {
  const errors = {
    name: validateName(name),
    email: validateEmail(email),
    phone: validatePhone(phone, { required: false }),
    password: validatePassword(password),
    confirm: password !== confirm ? 'Пароли не совпадают' : '',
  }
  if (Object.values(errors).some(Boolean)) {
    const err = new ApiError('Проверьте поля формы', { kind: 'validation' })
    err.fields = errors
    throw err
  }
  const mail = String(email).trim().toLowerCase()
  if (localUsers().some((u) => u.email.toLowerCase() === mail)) {
    const err = new ApiError('Этот e-mail уже зарегистрирован', { kind: 'validation' })
    err.fields = { email: 'Этот e-mail уже зарегистрирован' }
    throw err
  }
  const user = {
    id: `local:${Date.now().toString(36)}`,
    username: mail,
    email: mail,
    name: String(name).trim(),
    phone: String(phone || '').trim(),
    role: 'user',
    hash: await hashPassword(password, mail),
  }
  writeStorage(LS.users, [...registeredUsers(), user])
  // Запрос к API учебного сервера. DummyJSON только имитирует создание, результат нам не нужен.
  request(`${DUMMYJSON}/users/add`, { method: 'POST', body: { firstName: user.name, email: user.email }, timeout: 4000 }).catch(() => {})
  return saveSession(toSession(user, 'local'))
}

export async function requestPasswordReset(email) {
  const msg = validateEmail(email)
  if (msg) throw new ApiError(msg, { kind: 'validation' })
  // Письма нет: сервер учебный. Ответ одинаков для любого адреса.
  await new Promise((r) => setTimeout(r, 400))
}

// ---------- Профиль: имя, телефон и адрес по умолчанию ----------

export function getProfile(key) {
  const p = readStorage(LS.profiles, {})[key] || {}
  return {
    name: p.name || '',
    phone: p.phone || '',
    address: { region: '', index: '', city: '', street: '', house: '', flat: '', ...(p.address || {}) },
  }
}

export function saveProfile(key, data) {
  const profiles = readStorage(LS.profiles, {})
  profiles[key] = { ...(profiles[key] || {}), ...data }
  writeStorage(LS.profiles, profiles)
  return getSession()
}
