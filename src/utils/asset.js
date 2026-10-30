// Адрес файла из папки public.
//
// На GitHub Pages сайт лежит в подпапке (/garden-shop/), поэтому путь «/images/000123.jpg»
// нельзя отдавать браузеру как есть: он уйдёт в корень домена и вернёт 404.
// Vite кладёт префикс в import.meta.env.BASE_URL, его и подставляем.
//
// Внешние ссылки (http, https, data, blob) отдаём без изменений: их задаёт
// администратор при импорте каталога.
const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i

export function assetUrl(path) {
  const value = String(path ?? '').trim()
  if (!value) return ''
  if (EXTERNAL.test(value)) return value
  const base = import.meta.env.BASE_URL || '/'
  return `${base.replace(/\/$/, '')}/${value.replace(/^\/+/, '')}`
}
