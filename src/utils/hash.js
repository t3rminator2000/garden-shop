// Хеш пароля для локальных учётных записей (имитация, сервера нет).
// SHA-256 берём из Web Crypto. Он работает на localhost и по https.
// В файле, открытом напрямую (file://), Web Crypto недоступен, тогда включается простой запасной хеш.

function fallbackHash(str) {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return 'f-' + (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16)
}

export async function hashPassword(password, email) {
  const input = `${password}:${String(email).trim().toLowerCase()}`
  const subtle = globalThis.crypto?.subtle
  if (!subtle) return fallbackHash(input)
  const bytes = new TextEncoder().encode(input)
  const digest = await subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
