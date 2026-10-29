// Проверки полей форм. Каждая функция возвращает текст ошибки или пустую строку.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function validateEmail(value, { required = true } = {}) {
  const v = String(value || '').trim()
  if (!v) return required ? 'Введите e-mail' : ''
  return EMAIL_RE.test(v) ? '' : 'Введите корректный e-mail'
}

export function validateName(value, { label = 'имя' } = {}) {
  const v = String(value || '').trim()
  if (!v) return `Введите ${label}`
  if (v.length < 2) return `Слишком короткое ${label}`
  if (v.length > 80) return `Слишком длинное ${label}`
  return ''
}

export function phoneDigits(value) {
  let d = String(value || '').replace(/\D/g, '')
  if (d.startsWith('8')) d = '7' + d.slice(1)
  if (d.length > 0 && !d.startsWith('7')) d = '7' + d
  return d.slice(0, 11)
}

// Формат +7 (999) 999-99-99 по мере ввода
export function formatPhone(value) {
  const d = phoneDigits(value)
  if (!d) return ''
  const p = d.slice(1)
  let out = '+7'
  if (p.length > 0) out += ' (' + p.slice(0, 3)
  if (p.length >= 3) out += ')'
  if (p.length > 3) out += ' ' + p.slice(3, 6)
  if (p.length > 6) out += '-' + p.slice(6, 8)
  if (p.length > 8) out += '-' + p.slice(8, 10)
  return out
}

export function validatePhone(value, { required = true } = {}) {
  const d = phoneDigits(value)
  if (!d || d === '7') return required ? 'Введите телефон в формате +7 (999) 999-99-99' : ''
  return d.length === 11 ? '' : 'Введите телефон в формате +7 (999) 999-99-99'
}

// Сила пароля: weak | ok | strong
export function passwordStrength(value) {
  const v = String(value || '')
  const hasLetter = /[A-Za-zА-Яа-яЁё]/.test(v)
  const hasDigit = /\d/.test(v)
  if (v.length < 8 || !hasLetter || !hasDigit) return 'weak'
  const hasMixed = /[a-zа-яё]/.test(v) && /[A-ZА-ЯЁ]/.test(v)
  const hasSpecial = /[^A-Za-zА-Яа-яЁё\d]/.test(v)
  return v.length >= 12 || (hasMixed && hasSpecial) ? 'strong' : 'ok'
}

export function validatePassword(value) {
  const v = String(value || '')
  if (!v) return 'Введите пароль'
  if (passwordStrength(v) === 'weak') return 'Простой пароль. Не короче 8 символов, буквы и цифры'
  return ''
}

export function validateRequired(value, message) {
  return String(value || '').trim() ? '' : message
}

export function validateIndex(value) {
  const v = String(value || '').trim()
  if (!v) return ''
  return /^\d{6}$/.test(v) ? '' : 'Индекс состоит из 6 цифр'
}

export function validateNumber(value, { min = 0, max = 1e7, label = 'значение', integer = false, required = true } = {}) {
  const raw = String(value ?? '').trim().replace(',', '.')
  if (raw === '') return required ? `Введите ${label}` : ''
  const n = Number(raw)
  if (!Number.isFinite(n)) return `Некорректное ${label}`
  if (integer && !Number.isInteger(n)) return `${label[0].toUpperCase()}${label.slice(1)} должно быть целым числом`
  if (n < min) return `Не меньше ${min}`
  if (n > max) return `Не больше ${max}`
  return ''
}

// Адрес картинки: полный http(s) адрес или путь внутри сайта
export function validateImageUrl(value) {
  const v = String(value || '').trim()
  if (!v) return ''
  if (v.startsWith('/') && !v.startsWith('//')) return ''
  try {
    const u = new URL(v)
    return u.protocol === 'http:' || u.protocol === 'https:' ? '' : 'Нужна ссылка http или https'
  } catch {
    return 'Некорректная ссылка на изображение'
  }
}
