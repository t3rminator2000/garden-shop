// Безопасная работа с localStorage: приватный режим и битый JSON не ломают сайт.

export function readStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function removeStorage(key) {
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* хранилище недоступно, ничего не делаем */
  }
}
