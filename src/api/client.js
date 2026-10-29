// Единая точка для всех сетевых запросов: тайм-аут, проверка статуса и JSON, понятные ошибки.

export const DUMMYJSON = 'https://dummyjson.com'

export class ApiError extends Error {
  constructor(message, { status = 0, kind = 'unknown' } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.kind = kind // network | timeout | http | parse | validation
  }
}

export async function request(url, { method = 'GET', body, headers = {}, timeout = 8000, signal } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort('timeout'), timeout)
  if (signal) signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true })

  let res
  try {
    res = await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
  } catch (err) {
    if (controller.signal.aborted && controller.signal.reason === 'timeout') {
      throw new ApiError('Сервер не отвечает. Проверьте интернет и попробуйте ещё раз', { kind: 'timeout' })
    }
    if (err?.name === 'AbortError') throw err
    throw new ApiError('Не удалось связаться с сервером. Проверьте интернет и попробуйте ещё раз', { kind: 'network' })
  } finally {
    clearTimeout(timer)
  }

  let data = null
  const text = await res.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      throw new ApiError('Сервер вернул неожиданный ответ', { status: res.status, kind: 'parse' })
    }
  }
  if (!res.ok) {
    const message = (data && typeof data.message === 'string' && data.message) || `Ошибка сервера (${res.status})`
    throw new ApiError(message, { status: res.status, kind: 'http' })
  }
  return data
}
